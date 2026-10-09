import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import {createInventoryRepository} from '@/modules/inventory/repository';
import type {BookingView} from './types';
export type BookingIdentity={id:string;bookerId:string;holdId:string;tripId:string;companyId:string;payloadHash:string};
export function createBookingRepository(client:Sql){return {
 client,inventory:createInventoryRepository(client),
 async identity(tx:Sql|DomainTx,id:string,lock=false){const rows=await tx<BookingIdentity[]>`select id,booker_user_id as "bookerId",seat_hold_id as "holdId",trip_id as "tripId",company_id as "companyId",payload_hash as "payloadHash" from public.bookings where id=${id} ${lock?tx`for update`:tx``}`;return rows[0]??null;},
 async existing(tx:Sql|DomainTx,owner:string,key:string,holdId:string){const rows=await tx<BookingIdentity[]>`select id,booker_user_id as "bookerId",seat_hold_id as "holdId",trip_id as "tripId",company_id as "companyId",payload_hash as "payloadHash" from public.bookings where booker_user_id=${owner} and (request_key=${key} or seat_hold_id=${holdId}) order by (request_key=${key}) desc limit 1`;return rows[0]??null;},
 async view(tx:Sql|DomainTx,owner:string,id:string):Promise<BookingView|null>{const rows=await tx<BookingView[]>`with clock as materialized(select clock_timestamp() as now) select b.id,b.booker_user_id as "bookerId",case when b.status='PENDING_PAYMENT' and h.effective_expires_at<=clock.now then 'EXPIRED' else b.status end as status,b.mode,json_build_object('name',bp.name,'phone',bp.phone) as passenger,b.contact_email as email,b.amount::text as amount,p.provider_order_id as "orderId",h.effective_expires_at::text as "effectiveExpiresAt",clock.now::text as "serverNow",t.id as "ticketId",p.status as "paymentStatus",p.creation_state as "creationState",b.snapshot from public.bookings b join public.booking_passengers bp on bp.booking_id=b.id join public.payments p on p.booking_id=b.id join public.seat_holds h on h.id=b.seat_hold_id left join public.tickets t on t.booking_passenger_id=bp.id cross join clock where b.id=${id} and b.booker_user_id=${owner}`;return rows[0]??null;},
 async list(owner:string){return client<{id:string}[]>`select id from public.bookings where booker_user_id=${owner} order by created_at desc limit 100`;},
 async audit(tx:DomainTx,id:string,action:string,actorId:string|null){await tx`insert into public.booking_audit_events(booking_id,action,actor_id) values(${id},${action},${actorId}) on conflict(booking_id,action) do nothing`;},
 };}
export type BookingRepository=ReturnType<typeof createBookingRepository>;
