import {randomUUID} from 'node:crypto';
import {observationKey} from './observation-key';
import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import {inventoryTransaction} from '@/modules/inventory/transaction';
import {deadlineReached} from '@/modules/inventory/deadline';
import type {PaymentRepository} from './repository';
import type {PaymentProvider,ProviderOrder} from './types';
type Result={state:'READY';token:string}|{state:'PENDING'|'EXPIRED'|'UNAVAILABLE'};
type Claim={paymentId:string;lease:string;recover:boolean;order:ProviderOrder};
export function createPaymentCreationService(repo:PaymentRepository,provider:PaymentProvider){return {async prepareMine(owner:string,id:string):Promise<Result>{
 if(!z.uuid().safeParse(owner).success||!z.uuid().safeParse(id).success)throw new DomainError('forbidden','Booking tidak tersedia.');
 const b=await repo.booking.identity(repo.client,id);if(!b||b.bookerId!==owner)throw new DomainError('forbidden','Booking tidak tersedia.');
 const claim=await inventoryTransaction(repo.client,async (tx):Promise<Result|Claim>=>{
  const inv=repo.booking.inventory;await inv.guards(tx,b.tripId);const initial=await inv.own(tx,owner,b.holdId);if(!initial)throw new DomainError('forbidden','Booking tidak tersedia.');await inv.anchors(tx,b.tripId,initial.seatId,initial);const hold=await inv.own(tx,owner,b.holdId,true);await repo.booking.identity(tx,id,true);
  const rows=await tx`select * from public.payments where booking_id=${id} for update`;const p=rows[0],view=await repo.booking.view(tx,owner,id),now=await inv.now(tx);
  if(!hold||!view||hold.status!=='ACTIVE'||!hold.paymentInitiatedAt||deadlineReached(now,hold.effectiveExpiresAt)||view.status!=='PENDING_PAYMENT'||p.status!=='PENDING')return {state:'EXPIRED'};
  if(p.creation_state==='READY')return {state:'READY',token:p.snap_token};
  if(p.creation_state==='CREATING'&&p.creation_lease_until&&!deadlineReached(now,String(p.creation_lease_until)))return {state:'PENDING'};
  const lease=randomUUID();await tx`update public.payments set creation_state='CREATING',creation_lease=${lease},creation_lease_until=${now}::timestamptz+interval '30 seconds' where id=${p.id}`;
  return {paymentId:p.id,lease,recover:p.creation_state!=='NOT_STARTED',order:{orderId:view.orderId,amount:view.amount,name:view.passenger.name,phone:view.passenger.phone,email:view.email,initiatedAt:hold.paymentInitiatedAt,effectiveExpiresAt:hold.effectiveExpiresAt}};
 });
 if('state' in claim)return claim;
 try{
  if(claim.recover){const observation=await provider.status(claim.order.orderId);if(observation){const key=observationKey(observation);await repo.client.begin(async tx=>{await tx`insert into public.payment_events(payment_id,event_key,fields,verified_observation,verified_at) values(${claim.paymentId},${key},'{}'::jsonb,${tx.typed(JSON.stringify(observation),25)}::jsonb,${observation.verifiedAt}::timestamptz) on conflict(event_key) do nothing`;await tx`update public.payments set creation_state='UNKNOWN',creation_lease=null,creation_lease_until=null where id=${claim.paymentId} and creation_lease=${claim.lease}`;});return {state:'PENDING'};}}
  const current=await repo.booking.view(repo.client,owner,id);if(!current||current.status!=='PENDING_PAYMENT'||Date.parse(current.effectiveExpiresAt)-Date.parse(current.serverNow)<=20000){await repo.client`update public.payments set creation_state='UNKNOWN',creation_lease=null,creation_lease_until=null where id=${claim.paymentId} and creation_lease=${claim.lease}`;return {state:'EXPIRED'};}
  const snap=await provider.create(claim.order);const saved=await repo.client`update public.payments set creation_state='READY',snap_token=${snap.token},snap_redirect_url=${snap.redirectUrl},creation_lease=null,creation_lease_until=null,last_error=null where id=${claim.paymentId} and creation_lease=${claim.lease} returning id`;const latest=await repo.booking.view(repo.client,owner,id);if(!latest||latest.status!=='PENDING_PAYMENT')return {state:'EXPIRED'};return saved.length?{state:'READY',token:snap.token}:{state:'PENDING'};
 }catch{await repo.client`update public.payments set creation_state='UNKNOWN',creation_lease=null,creation_lease_until=null,last_error='PROVIDER_UNAVAILABLE' where id=${claim.paymentId} and creation_lease=${claim.lease}`;return {state:'UNAVAILABLE'};}
 }};}


