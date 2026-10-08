import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {parsePaymentEnv} from '@/lib/env/payment';
import {deadlineReached} from '@/modules/inventory/deadline';
import {inventoryTransaction} from '@/modules/inventory/transaction';
import {paymentOutcome} from './midtrans-provider';
import type {ProviderObservation} from './types';
import type {PaymentRepository} from './repository';
import type {BookingView} from '@/modules/booking/types';
import {createTicketRepository} from '@/modules/ticket/repository';
import type {TicketKeys} from '@/modules/ticket/crypto';
type Config={keys:TicketKeys;keyVersion:string;merchantId:string};
type Locked={bookingId:string;paymentId:string;holdId:string;companyId:string;tripId:string;bookerId:string;passengerId:string;seatId:string;from:number;to:number;orderId:string;amount:string;holdStatus:string;expiresAt:string;paymentStatus:string;providerTransactionId:string|null;bookingStatus:string};
async function lockBooking(tx:DomainTx,repo:PaymentRepository,id:string):Promise<Locked>{
 const initial=await repo.booking.identity(tx,id);if(!initial)throw new DomainError('unavailable','Pembayaran tidak tersedia.');
 const inv=repo.booking.inventory;await inv.guards(tx,initial.tripId);
 const h0=await inv.own(tx,initial.bookerId,initial.holdId);if(!h0)throw new DomainError('unavailable','Hold tidak tersedia.');
 await inv.anchors(tx,initial.tripId,h0.seatId,h0);
 const hold=await inv.own(tx,initial.bookerId,initial.holdId,true);
 const booking=await repo.booking.identity(tx,id,true);
 const rows=await tx<Locked[]>`select b.id as "bookingId",p.id as "paymentId",b.seat_hold_id as "holdId",b.company_id as "companyId",b.trip_id as "tripId",b.booker_user_id as "bookerId",bp.id as "passengerId",h.trip_seat_id as "seatId",h.from_sequence as "from",h.to_sequence as "to",p.provider_order_id as "orderId",p.amount::text as amount,h.status as "holdStatus",h.effective_expires_at::text as "expiresAt",p.status as "paymentStatus",p.provider_transaction_id as "providerTransactionId",b.status as "bookingStatus" from public.bookings b join public.payments p on p.booking_id=b.id join public.booking_passengers bp on bp.booking_id=b.id join public.seat_holds h on h.id=b.seat_hold_id where b.id=${id} for update of b,p`;
 if(!booking||!hold||rows.length!==1)throw new DomainError('unavailable','Pembayaran tidak tersedia.');return rows[0];
}
async function finalize(tx:DomainTx,repo:PaymentRepository,c:Locked,now:string,keys:TicketKeys,keyVersion:string,manual=false):Promise<BookingView>{
 const blockers=await tx`select 1 from public.seat_assignments a where a.trip_id=${c.tripId} and a.trip_seat_id=${c.seatId} and a.booking_passenger_id<>${c.passengerId} and a.from_sequence<${c.to} and a.to_sequence>${c.from} limit 1`;
 const heldByOther=manual?await tx`select 1 from public.seat_holds h where h.trip_id=${c.tripId} and h.trip_seat_id=${c.seatId} and h.id<>${c.holdId} and h.status='ACTIVE' and h.effective_expires_at>${now}::timestamptz and h.from_sequence<${c.to} and h.to_sequence>${c.from} limit 1`:[];
 const eligible=(manual||c.holdStatus==='ACTIVE'&&!deadlineReached(now,c.expiresAt))&&blockers.length===0&&heldByOther.length===0;
 if(!eligible){if(c.bookingStatus==='PENDING_PAYMENT'||c.bookingStatus==='EXPIRED')await tx`update public.bookings set status='PAYMENT_CONFLICT',confirmed_at=null where id=${c.bookingId}`;await repo.booking.audit(tx,c.bookingId,'PAYMENT_CONFLICT',null);return (await repo.booking.view(tx,c.bookerId,c.bookingId))!;}
 if(c.bookingStatus==='CONFIRMED')return (await repo.booking.view(tx,c.bookerId,c.bookingId))!;
 if((c.bookingStatus==='PAYMENT_CONFLICT'&&!manual)||c.bookingStatus==='REFUNDED')return (await repo.booking.view(tx,c.bookerId,c.bookingId))!;
 const assignmentRows=await tx<{id:string}[]>`insert into public.seat_assignments(booking_passenger_id,company_id,trip_id,trip_seat_id,from_sequence,to_sequence,assigned_at) values(${c.passengerId},${c.companyId},${c.tripId},${c.seatId},${c.from},${c.to},${now}::timestamptz) on conflict(booking_passenger_id) do nothing returning id`;
 let assignmentId=assignmentRows[0]?.id;if(!assignmentId){const old=await tx<{id:string}[]>`select id from public.seat_assignments where booking_passenger_id=${c.passengerId}`;assignmentId=old[0]?.id;}
 if(!assignmentId)throw new DomainError('unavailable','Kursi belum dapat dikonfirmasi.');
 const anchors=await tx<{id:string}[]>`select id from public.trip_seat_inventory where trip_id=${c.tripId} and trip_seat_id=${c.seatId} and trip_segment_id in (select id from public.trip_segments where sequence>=${c.from} and sequence<${c.to}) order by trip_id,trip_seat_id,trip_segment_id for update`;
 if(anchors.length!==c.to-c.from)throw new DomainError('unavailable','Inventori kursi tidak lengkap.');
 for(const a of anchors)await tx`insert into public.confirmed_occupancy(inventory_id,assignment_id,trip_id,company_id) values(${a.id},${assignmentId},${c.tripId},${c.companyId})`;
 await tx`update public.seat_holds set status='CONVERTED' where id=${c.holdId} and status='ACTIVE'`;
 await tx`update public.bookings set status='CONFIRMED',confirmed_at=${now}::timestamptz where id=${c.bookingId}`;
 await repo.booking.audit(tx,c.bookingId,'CONFIRMED',null);
 const ticket=await createTicketRepository().issue(tx,{passengerId:c.passengerId,assignmentId,companyId:c.companyId,tripId:c.tripId,keys,keyVersion});
 return {...(await repo.booking.view(tx,c.bookerId,c.bookingId))!,ticketId:ticket.id};
}
export async function confirmConflictInTransaction(tx:DomainTx,repo:PaymentRepository,bookingId:string,actorId:string,keys:TicketKeys,keyVersion:string):Promise<BookingView>{
 const c=await lockBooking(tx,repo,bookingId),now=await repo.booking.inventory.now(tx);
 if(c.paymentStatus!=='PAID'||c.bookingStatus!=='PAYMENT_CONFLICT')throw new DomainError('conflict','Pembayaran tidak menunggu konfirmasi.');
 const eligible=await tx`select 1 from public.companies c join public.trips t on t.company_id=c.id where c.id=${c.companyId} and t.id=${c.tripId} and c.status='ACTIVE' and t.status='OPEN_FOR_SALE' and clock_timestamp()<coalesce((select least(s.departure_at,coalesce(t.sales_close_at,s.departure_at)) from public.trip_stops s where s.trip_id=t.id and s.sequence=${c.from}),t.departure_at) limit 1`;
 if(!eligible.length)throw new DomainError('conflict','Perjalanan sudah tidak memenuhi syarat konfirmasi.');
 const result=await finalize(tx,repo,c,now,keys,keyVersion,true);if(result.status!=='CONFIRMED')throw new DomainError('conflict','Kursi sudah tidak tersedia.');await repo.booking.audit(tx,bookingId,'MANUAL_CONFIRMED',actorId);return result;
}
export function createConfirmationService(repo:PaymentRepository,config:Config=parsePaymentEnv(process.env)){return {async apply(observation:ProviderObservation):Promise<BookingView>{
 const base=await repo.client<{id:string}[]>`select b.id from public.payments p join public.bookings b on b.id=p.booking_id where p.provider_order_id=${observation.orderId}`;if(!base.length)throw new DomainError('unavailable','Pembayaran tidak tersedia.');
 return inventoryTransaction(repo.client,async tx=>{
  const c=await lockBooking(tx,repo,base[0].id),now=await repo.booking.inventory.now(tx);
  if(c.orderId!==observation.orderId||c.amount!==observation.amount||observation.currency!=='IDR'||observation.merchantId!==config.merchantId)throw new DomainError('conflict','Data pembayaran tidak cocok.');
  const outcome=paymentOutcome(observation);
  if(c.paymentStatus==='PAID'){if(c.providerTransactionId!==observation.transactionId)throw new DomainError('conflict','ID transaksi pembayaran tidak cocok.');return (await repo.booking.view(tx,c.bookerId,c.bookingId))!;}
  if(outcome==='PAID'){
   await tx`update public.payments set status='PAID',paid_at=${now}::timestamptz,provider_transaction_id=${observation.transactionId},provider_status=${observation.status} where id=${c.paymentId} and status<>'PAID'`;
   return finalize(tx,repo,c,now,config.keys,config.keyVersion);
  }
  if(outcome==='FAILED'||outcome==='EXPIRED')await tx`update public.payments set status=${outcome},provider_status=${observation.status} where id=${c.paymentId} and status<>'PAID'`;
  else if(outcome==='REVIEW')await repo.booking.audit(tx,c.bookingId,'PAYMENT_REQUIRES_REVIEW',null);
  return (await repo.booking.view(tx,c.bookerId,c.bookingId))!;
 });
 }};}
