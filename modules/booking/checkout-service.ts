import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {availability} from '@/modules/inventory/availability-service';
import {deadlineReached} from '@/modules/inventory/deadline';
import {databaseCode,inventoryRead,inventoryTransaction} from '@/modules/inventory/transaction';
import {parseCheckout} from './validation';
import type {BookingRepository} from './repository';
import type {InitiationActor,CheckoutInput,BookingView} from './types';
export function createCheckoutService(repo:BookingRepository){
 async function existing(actor:InitiationActor,input:CheckoutInput,hash:string,tx:DomainTx|typeof repo.client):Promise<BookingView|null>{const old=await repo.existing(tx,actor.userId,input.requestKey,input.holdId);if(!old)return null;if(old.payloadHash!==hash||old.holdId!==input.holdId)throw new DomainError('conflict','Booking sudah dimulai dengan data berbeda.');return repo.view(tx,actor.userId,old.id);}
 return {async initiate(actor:InitiationActor,raw:CheckoutInput):Promise<BookingView>{
  if(!z.uuid().safeParse(actor.userId).success||!z.email().safeParse(actor.verifiedEmail).success)throw new DomainError('forbidden','Masuk dengan email terverifikasi.');const input=parseCheckout(raw),hash=createHash('sha256').update(JSON.stringify([input.holdId,input.mode,input.name,input.phone])).digest('hex');
  const previous=await inventoryRead(()=>existing(actor,input,hash,repo.client));if(previous)return previous;
  const initial=await inventoryRead(()=>repo.inventory.own(repo.client,actor.userId,input.holdId));if(!initial)throw new DomainError('forbidden','Hold tidak tersedia.');
  try{return await inventoryTransaction(repo.client,async tx=>{
   await repo.inventory.guards(tx,initial.tripId);await repo.inventory.anchors(tx,initial.tripId,initial.seatId,initial);const hold=await repo.inventory.own(tx,actor.userId,input.holdId,true);if(!hold)throw new DomainError('forbidden','Hold tidak tersedia.');const retry=await existing(actor,input,hash,tx);if(retry)return retry;
   const snapshot=await repo.inventory.snapshot(tx,hold.tripId),v=availability(snapshot,hold.fromStopId,hold.toStopId);
   if(hold.status!=='ACTIVE'||hold.paymentInitiatedAt||deadlineReached(v.serverNow,hold.baseExpiresAt)||!v.saleOpen)throw new DomainError('conflict','Hold atau penjualan sudah berakhir.');
   const busy=await tx`select 1 from public.seat_holds where trip_id=${hold.tripId} and trip_seat_id=${hold.seatId} and id<>${hold.id} and status='ACTIVE' and effective_expires_at>${v.serverNow}::timestamptz and from_sequence<${hold.to} and to_sequence>${hold.from} union all select 1 from public.seat_assignments where trip_id=${hold.tripId} and trip_seat_id=${hold.seatId} and from_sequence<${hold.to} and to_sequence>${hold.from} limit 1`;
   if(busy.length)throw new DomainError('conflict','Kursi sudah dipesan.');if(BigInt(v.fare)<=BigInt(0))throw new DomainError('validation','Total tarif belum dapat dibayar. Hubungi PO.');
   const id=randomUUID(),paymentId=randomUUID(),origin=snapshot.stops.find(s=>s.id===hold.fromStopId)!,destination=snapshot.stops.find(s=>s.id===hold.toStopId)!,seat=snapshot.seats.find(s=>s.id===hold.seatId)!;
   const bookingSnapshot={tripName:snapshot.trip.name,vehicleName:snapshot.trip.identity!.vehicleName,plateNumber:snapshot.trip.identity!.plateNumber,seatCode:seat.seatCode,fromName:origin.name,toName:destination.name,departureAt:origin.departureAt};
   await tx`update public.seat_holds set payment_initiated_at=${v.serverNow}::timestamptz,effective_expires_at=base_expires_at+interval '60 seconds' where id=${hold.id}`;
   await tx`insert into public.bookings(id,company_id,trip_id,seat_hold_id,booker_user_id,request_key,payload_hash,mode,contact_email,amount,snapshot,created_at) values(${id},${hold.companyId},${hold.tripId},${hold.id},${actor.userId},${input.requestKey},${hash},${input.mode},${actor.verifiedEmail},${v.fare},${tx.typed(JSON.stringify(bookingSnapshot),25)}::jsonb,${v.serverNow}::timestamptz)`;
   await tx`insert into public.booking_passengers(booking_id,company_id,trip_id,booker_user_id,mode,account_id,name,phone) values(${id},${hold.companyId},${hold.tripId},${actor.userId},${input.mode},${input.mode==='SELF'?actor.userId:null},${input.name},${input.phone})`;
   await tx`insert into public.payments(id,booking_id,company_id,trip_id,provider_order_id,amount,created_at) values(${paymentId},${id},${hold.companyId},${hold.tripId},${'seatpax-'+paymentId},${v.fare},${v.serverNow}::timestamptz)`;
   if(input.mode==='SELF')await tx`update public.users set name=${input.name},phone=${input.phone},updated_at=${v.serverNow}::timestamptz where id=${actor.userId}`;
   await repo.audit(tx,id,'INITIATED',actor.userId);return (await repo.view(tx,actor.userId,id))!;
  });}catch(error){if(databaseCode(error)==='23505'){const retry=await inventoryRead(()=>existing(actor,input,hash,repo.client));if(retry)return retry;throw new DomainError('conflict','Booking sudah dimulai.');}throw error;}
 }};
}

