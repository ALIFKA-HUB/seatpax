import {z} from 'zod';
import type {Sql} from 'postgres';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {parsePaymentEnv} from '@/lib/env/payment';
import {inventoryTransaction,inventoryRead} from '@/modules/inventory/transaction';
import type {PaymentRepository} from './repository';
import type {BookingView} from '@/modules/booking/types';
import type {TicketKeys} from '@/modules/ticket/crypto';
import {confirmConflictInTransaction} from './confirmation-service';
const idSchema=z.uuid();
export type ConflictActor={userId:string;companyId:string};
export type ResolutionInput={action:'CONFIRM'|'MOCK_REFUND';requestKey:string;reason:string};
export type ConflictRow={id:string;status:string;paymentStatus:string;amount:string;passengerName:string;passengerPhone:string;fromName:string;toName:string;seatCode:string;departureAt:string;createdAt:string;bookerId:string;companyStatus:string};
export type PaymentReviewRow={bookingId:string;orderId:string;reason:string;receivedAt:string};
function actorOk(actor:ConflictActor){if(!idSchema.safeParse(actor.userId).success||!idSchema.safeParse(actor.companyId).success)throw new DomainError('forbidden','Akses PO ditolak.');}
async function member(tx:Sql|DomainTx,actor:ConflictActor){const rows=await tx`select id from public.memberships where user_id=${actor.userId} and company_id=${actor.companyId} and role='ADMIN_PO' and status='ACTIVE' for share`;if(rows.length!==1)throw new DomainError('forbidden','Akses PO ditolak.');}
async function lock(tx:DomainTx,repo:PaymentRepository,actor:ConflictActor,bookingId:string){
 const initial=await repo.booking.identity(tx,bookingId);if(!initial||initial.companyId!==actor.companyId)throw new DomainError('forbidden','Booking tidak tersedia.');
 const inv=repo.booking.inventory;await inv.guards(tx,initial.tripId);
 const holdBefore=await inv.own(tx,initial.bookerId,initial.holdId);if(!holdBefore)throw new DomainError('conflict','Hold tidak tersedia.');
 await inv.anchors(tx,initial.tripId,holdBefore.seatId,holdBefore);
 const hold=await inv.own(tx,initial.bookerId,initial.holdId,true),booking=await repo.booking.identity(tx,bookingId,true);
 const rows=await tx<{paymentId:string;status:string;paymentStatus:string;amount:string;paymentAmount:string;bookerId:string}[]>`select b.id,b.status,p.status as "paymentStatus",p.id as "paymentId",b.amount::text as amount,p.amount::text as "paymentAmount",b.booker_user_id as "bookerId" from public.bookings b join public.payments p on p.booking_id=b.id where b.id=${bookingId} and b.company_id=${actor.companyId} for update of b,p`;
 if(!booking||!hold||rows.length!==1)throw new DomainError('conflict','Booking tidak tersedia.');
 if(rows[0].amount!==rows[0].paymentAmount)throw new DomainError('conflict','Jumlah booking dan pembayaran tidak cocok.');
 const company=await tx<{status:string}[]>`select status from public.companies where id=${actor.companyId}`;
 await member(tx,actor);
 return {...rows[0],hold,companyStatus:company[0]?.status??'UNKNOWN',now:await inv.now(tx)};
}
async function row(tx:Sql|DomainTx,companyId:string,bookingId:string):Promise<ConflictRow|null>{const rows=await tx<ConflictRow[]>`select b.id,b.status,p.status as "paymentStatus",b.amount::text as amount,bp.name as "passengerName",bp.phone as "passengerPhone",s1.name as "fromName",s2.name as "toName",ts.seat_code as "seatCode",t.departure_at::text as "departureAt",b.created_at::text as "createdAt",b.booker_user_id as "bookerId",c.status as "companyStatus" from public.bookings b join public.payments p on p.booking_id=b.id join public.booking_passengers bp on bp.booking_id=b.id join public.seat_holds h on h.id=b.seat_hold_id join public.trip_stops s1 on s1.trip_id=b.trip_id and s1.sequence=h.from_sequence join public.trip_stops s2 on s2.trip_id=b.trip_id and s2.sequence=h.to_sequence join public.trip_seats ts on ts.id=h.trip_seat_id join public.trips t on t.id=b.trip_id join public.companies c on c.id=b.company_id where b.id=${bookingId} and b.company_id=${companyId}`;return rows[0]??null;}
export function createConflictService(repo:PaymentRepository,loadTicketConfig:()=>{keys:TicketKeys;keyVersion:string}=()=>parsePaymentEnv(process.env)){return {
 async list(actor:ConflictActor){actorOk(actor);return inventoryRead(()=>repo.client.begin(async tx=>{await member(tx,actor);const rows=await tx<{id:string}[]>`select id from public.bookings where company_id=${actor.companyId} and status='PAYMENT_CONFLICT' order by created_at`;const result=[];for(const item of rows){const data=await row(tx,actor.companyId,item.id);if(data?.status==='PAYMENT_CONFLICT')result.push(data);}return result;}));},
 async listReview(actor:ConflictActor):Promise<PaymentReviewRow[]>{actorOk(actor);return inventoryRead(()=>repo.client.begin(async tx=>{await member(tx,actor);return tx<PaymentReviewRow[]>`select b.id as "bookingId",p.provider_order_id as "orderId",coalesce(e.last_error,'PAYMENT_REQUIRES_REVIEW') as reason,e.received_at::text as "receivedAt" from public.payment_events e join public.payments p on p.id=e.payment_id join public.bookings b on b.id=p.booking_id where b.company_id=${actor.companyId} and e.status='REVIEW' order by e.received_at desc limit 100`;}));},
 async read(actor:ConflictActor,bookingId:string){actorOk(actor);if(!idSchema.safeParse(bookingId).success)throw new DomainError('forbidden','Booking tidak tersedia.');return inventoryRead(()=>repo.client.begin(async tx=>{await member(tx,actor);const data=await row(tx,actor.companyId,bookingId);if(!data)throw new DomainError('forbidden','Booking tidak tersedia.');return data;}));},
 async resolve(actor:ConflictActor,bookingId:string,input:ResolutionInput):Promise<BookingView>{
  actorOk(actor);if(!idSchema.safeParse(bookingId).success||!idSchema.safeParse(input.requestKey).success||!['CONFIRM','MOCK_REFUND'].includes(input.action)||input.reason.trim().length<1||input.reason.trim().length>500)throw new DomainError('validation','Alasan atau pilihan penyelesaian tidak valid.');
  return inventoryTransaction(repo.client,async tx=>{
   const locked=await lock(tx,repo,actor,bookingId);
   const prior=await tx<{requestKey:string;action:string;actorId:string;reason:string}[]>`select request_key as "requestKey",action,actor_id as "actorId",reason from public.payment_resolutions where booking_id=${bookingId}`;
   if(prior.length){const p=prior[0];if(p.requestKey===input.requestKey&&p.action===input.action&&p.actorId===actor.userId&&p.reason===input.reason.trim())return (await repo.booking.view(tx,locked.bookerId,bookingId))!;throw new DomainError('conflict','Booking sudah memiliki penyelesaian terminal.');}
   if(locked.status!=='PAYMENT_CONFLICT'||locked.paymentStatus!=='PAID')throw new DomainError('conflict','Pembayaran tidak menunggu penyelesaian.');
   if(input.action==='CONFIRM'){
    const eligible=locked.companyStatus==='ACTIVE'?await tx`select 1 from public.trips t where t.id=${locked.hold.tripId} and t.company_id=${actor.companyId} and t.status='OPEN_FOR_SALE' and clock_timestamp()<coalesce((select least(s.departure_at,coalesce(t.sales_close_at,s.departure_at)) from public.trip_stops s where s.trip_id=t.id and s.sequence=${locked.hold.from}),t.departure_at) limit 1`:[];
    if(!eligible.length)throw new DomainError('conflict','Perjalanan sudah tidak memenuhi syarat konfirmasi.');
    const config=loadTicketConfig();
    const result=await confirmConflictInTransaction(tx,repo,bookingId,actor.userId,config.keys,config.keyVersion);
    if(result.status!=='CONFIRMED')throw new DomainError('conflict','Kursi sudah tidak dapat dikonfirmasi.');
    await tx`insert into public.payment_resolutions(booking_id,company_id,trip_id,actor_id,request_key,action,amount,reason) values(${bookingId},${actor.companyId},${locked.hold.tripId},${actor.userId},${input.requestKey},'CONFIRM',${locked.amount},${input.reason.trim()})`;
    return result;
   }
   await tx`insert into public.payment_resolutions(booking_id,company_id,trip_id,actor_id,request_key,action,amount,reason) values(${bookingId},${actor.companyId},${locked.hold.tripId},${actor.userId},${input.requestKey},'MOCK_REFUND',${locked.amount},${input.reason.trim()})`;
   await tx`update public.bookings set status='REFUNDED',confirmed_at=null where id=${bookingId} and status='PAYMENT_CONFLICT'`;
   await repo.booking.audit(tx,bookingId,'MOCK_REFUND_RECORDED',actor.userId);
   return (await repo.booking.view(tx,locked.bookerId,bookingId))!;
  });
 }
};}
