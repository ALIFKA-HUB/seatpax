import type {Sql} from 'postgres';
import {createHash,randomUUID} from 'node:crypto';
import type {DomainTx} from '@/modules/access/transaction';
import type {PaymentRepository} from './repository';
import type {AuthenticatedReceipt,PaymentProvider,ProviderObservation} from './types';
import {paymentOutcome} from './midtrans-provider';
import type {createConfirmationService} from './confirmation-service';
export class UnknownPaymentOrderError extends Error{readonly code='unknown_order';constructor(){super('Unknown payment order.');}}
type Confirmation=ReturnType<typeof createConfirmationService>;
type EventRow={id:string;paymentId:string;orderId:string;fields:Record<string,string|null>;observation:ProviderObservation|null;status:string;attempts:number;leaseId:string|null;leaseUntil:string|null};
const delay=(n:number)=>Math.min(300,5*2**Math.max(0,n-1));
export function createPaymentEventService(repo:PaymentRepository,provider:Pick<PaymentProvider,'status'>,confirmation:Confirmation){
 const client=repo.client;
 async function receive(receipt:AuthenticatedReceipt){return client.begin(async tx=>{
  const payment=await tx<{id:string}[]>`select id from public.payments where provider_order_id=${receipt.orderId}`;if(!payment.length)throw new UnknownPaymentOrderError();
  const rows=await tx<{id:string}[]>`insert into public.payment_events(payment_id,event_key,fields) values(${payment[0].id},${receipt.eventKey},${tx.typed(JSON.stringify(receipt.fields),25)}::jsonb) on conflict(event_key) do nothing returning id`;
  if(rows.length)return {receiptId:rows[0].id,duplicate:false};
  const old=await tx<{id:string}[]>`select id from public.payment_events where event_key=${receipt.eventKey}`;if(!old.length)throw new Error('Receipt persistence failed.');return {receiptId:old[0].id,duplicate:true};
 });}
 async function read(tx:Sql|DomainTx,id:string){const rows=await tx<EventRow[]>`select e.id,e.payment_id as "paymentId",p.provider_order_id as "orderId",e.fields,e.verified_observation as observation,e.status,e.attempts,e.lease_id as "leaseId",e.lease_until::text as "leaseUntil" from public.payment_events e join public.payments p on p.id=e.payment_id where e.id=${id}`;return rows[0]??null;}
 async function process(receiptId:string):Promise<'PROCESSED'|'IGNORED'|'RETRY'>{
  const leaseId=randomUUID();let event:EventRow|null=null;
  try{event=await client.begin(async tx=>{const row=await read(tx,receiptId);if(!row||row.status==='PROCESSED'||row.status==='IGNORED'||row.status==='REVIEW')return null;
   const now=await tx<{now:string}[]>`select clock_timestamp()::text as now`;if(row.leaseId&&row.leaseUntil&&Date.parse(row.leaseUntil)>Date.parse(now[0].now))return null;
   const claimed=await tx`update public.payment_events set lease_id=${leaseId},lease_until=${now[0].now}::timestamptz+interval '30 seconds' where id=${receiptId} and status='RECEIVED' and (lease_until is null or lease_until<=${now[0].now}::timestamptz) returning id`;return claimed.length?row:null;});}catch{return 'RETRY';}
  if(!event){const current=await read(client,receiptId).catch(()=>null);return current?.status==='PROCESSED'?'PROCESSED':current?.status==='IGNORED'?'IGNORED':'RETRY';}
  try{
   // Every run refreshes financial truth with the authenticated provider endpoint.
   const observation=await provider.status(event.orderId);
   if(observation){await client`update public.payment_events set verified_observation=${client.typed(JSON.stringify(observation),25)}::jsonb,verified_at=${observation.verifiedAt}::timestamptz where id=${receiptId} and lease_id=${leaseId}`;}
   if(!observation){await client`update public.payment_events set status='IGNORED',processed_at=clock_timestamp(),lease_id=null,lease_until=null,last_error=null where id=${receiptId} and lease_id=${leaseId}`;return 'IGNORED';}
   const fenced=await client`update public.payment_events set lease_until=clock_timestamp()+interval '30 seconds' where id=${receiptId} and lease_id=${leaseId} and status='RECEIVED' and lease_until>clock_timestamp() returning id`;
   if(!fenced.length)return 'RETRY';
   await confirmation.apply(observation);
   if(paymentOutcome(observation)==='REVIEW'){await client`update public.payment_events set status='REVIEW',last_error='PROVIDER_REQUIRES_REVIEW',lease_id=null,lease_until=null where id=${receiptId} and lease_id=${leaseId}`;return 'PROCESSED';}
   await client`update public.payment_events set status='PROCESSED',processed_at=clock_timestamp(),lease_id=null,lease_until=null,last_error=null where id=${receiptId} and lease_id=${leaseId}`;return 'PROCESSED';
  }catch{
   try{await client.begin(async tx=>{const row=await read(tx,receiptId);if(!row)return;const attempts=row.attempts+1;if(attempts>=8){const finalized=await tx`update public.payment_events set attempts=8,status='REVIEW',last_error='RECONCILIATION_REQUIRED',lease_id=null,lease_until=null where id=${receiptId} and lease_id=${leaseId} returning id`;if(finalized.length)await tx`insert into public.booking_audit_events(booking_id,action,metadata) select b.id,'PAYMENT_RECONCILIATION_REQUIRED',jsonb_build_object('eventId',${receiptId}::text) from public.bookings b join public.payments p on p.booking_id=b.id join public.payment_events e on e.payment_id=p.id where e.id=${receiptId} on conflict(booking_id,action) do nothing`;}else await tx`update public.payment_events set attempts=${attempts},next_attempt_at=clock_timestamp()+${delay(attempts)}*interval '1 second',last_error='RETRYABLE_PROCESSING',lease_id=null,lease_until=null where id=${receiptId} and lease_id=${leaseId}`;});}catch{/* Leave the finite lease to expire for recovery. */}
   return 'RETRY';
  }
 }
 async function reconcilePayments(limit:number){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Limit must be between 1 and 100.');
  const queued=await client<{id:string}[]>`select id from public.payment_events where status='RECEIVED' and next_attempt_at<=clock_timestamp() and (lease_until is null or lease_until<=clock_timestamp()) order by next_attempt_at,received_at,id limit ${limit}`;
  const selected=[...queued];const remaining=limit-selected.length;
  if(remaining>0){const bucket=Math.floor(Date.now()/300000);const pending=await client<{paymentId:string;orderId:string}[]>`select p.id as "paymentId",p.provider_order_id as "orderId" from public.payments p join public.bookings b on b.id=p.booking_id where p.status<>'PAID' and b.status<>'REFUNDED' and p.created_at<clock_timestamp()-interval '30 seconds' and not exists(select 1 from public.payment_events e where e.payment_id=p.id and (e.status='REVIEW' or e.received_at>clock_timestamp()-interval '5 minutes')) order by p.created_at,p.id limit ${remaining}`;
   for(const p of pending){const key=createHash('sha256').update(JSON.stringify(['midtrans-reconcile-v1',p.orderId,bucket])).digest('hex');const inserted=await client<{id:string}[]>`insert into public.payment_events(payment_id,event_key,fields) values(${p.paymentId},${key},'{}'::jsonb) on conflict(event_key) do nothing returning id`;const found=inserted[0]??(await client<{id:string}[]>`select id from public.payment_events where event_key=${key}`)[0];if(found&&!(await client`select 1 from public.payment_events where id=${found.id} and status in ('PROCESSED','IGNORED','REVIEW')`).length)selected.push(found);}
  }
  let processed=0,retry=0;for(const row of selected){const result=await process(row.id);if(result==='PROCESSED'||result==='IGNORED')processed++;else retry++;}return {processed,retry};
 }
 return {receive,process,reconcilePayments};
}
