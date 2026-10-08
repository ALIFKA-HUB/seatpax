import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import type {BookingView} from '@/modules/booking/types';
import {createHash,randomUUID} from 'node:crypto';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {createCleanupService} from '@/modules/inventory/cleanup-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createPaymentEventService} from '@/modules/payment/event-service';
import {createPaymentNotificationService} from '@/modules/payment/notification-service';
import {createConfirmationService} from '@/modules/payment/confirmation-service';
import {createMidtransProvider} from '@/modules/payment/midtrans-provider';
import type {ProviderObservation} from '@/modules/payment/types';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
const env={serverKey:'SB-Mid-server-test',clientKey:'SB-Mid-client-test',merchantId:'GTEST',keys:{v1:Buffer.alloc(32,7)},keyVersion:'v1' as const};
function signed(orderId:string,status='settlement'){const body={order_id:orderId,transaction_id:'txn-test',transaction_status:status,status_code:'200',gross_amount:'20000.00',merchant_id:env.merchantId,currency:'IDR',fraud_status:'accept',payment_type:'bank_transfer'};return {...body,signature_key:createHash('sha512').update(body.order_id+body.status_code+body.gross_amount+env.serverKey).digest('hex')};}
function paid(orderId:string):ProviderObservation{return {orderId,transactionId:'txn-'+orderId,merchantId:env.merchantId,amount:'20000',currency:'IDR',status:'settlement',fraudStatus:'accept',paymentType:'bank_transfer',verifiedAt:new Date().toISOString()};}
async function makeBooking(f:Parameters<Parameters<typeof inventoryFixture>[1]>[0],seat=0){const hold=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(0,3,seat));return createCheckoutService(createBookingRepository(c)).initiate({userId:f.a.actorId,verifiedEmail:'a@example.test'},{holdId:hold.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Friend',phone:'+6281234567890'});}
it('reconciles unsigned notification status before granting one assignment and stable ticket',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),repo=createPaymentRepository(c);let current:ProviderObservation={...paid(b.orderId),status:'pending'};
 const provider=createMidtransProvider(env);const events=createPaymentEventService(repo,{status:async()=>current},createConfirmationService(repo,env));const notify=createPaymentNotificationService(provider,events);
 const receipt=await notify.receive(signed(b.orderId,'settlement'));
 const duplicate=await notify.receive(signed(b.orderId,'settlement'));expect(duplicate).toEqual({receiptId:receipt.receiptId,duplicate:true});
 expect(await events.process(receipt.receiptId)).toBe('PROCESSED');expect((await repo.booking.view(c,f.a.actorId,b.id))?.status).toBe('PENDING_PAYMENT');
 await c`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;await c`update public.trips set sales_close_at=clock_timestamp()-interval '1 second' where id=${f.detail.trip.id}`;
 current=paid(b.orderId);const later=await notify.receive({...signed(b.orderId,'settlement'),transaction_id:'txn-later'});
 expect(later.receiptId).not.toBe(receipt.receiptId);expect(await events.process(later.receiptId)).toBe('PROCESSED');
 const view=await repo.booking.view(c,f.a.actorId,b.id);expect(view?.status).toBe('CONFIRMED');expect(view?.paymentStatus).toBe('PAID');expect(view?.ticketId).toBeTruthy();
 expect(await c`select id from public.seat_assignments where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id})`).toHaveLength(1);
 expect(await c`select inventory_id from public.confirmed_occupancy where assignment_id in (select id from public.seat_assignments where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id}))`).toHaveLength(3);
 const avail=await createAvailabilityService(f.repo).detail((await repo.booking.identity(c,b.id))!.tripId,f.inputHold().fromStopId,f.inputHold().toStopId);expect(avail.seats[0].status).toBe('BOOKED');
 expect(await events.process(later.receiptId)).toBe('PROCESSED');expect(await c`select id from public.tickets where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id})`).toHaveLength(1);
 current={...paid(b.orderId),status:'deny'};const older=await notify.receive(signed(b.orderId,'deny'));expect(await events.process(older.receiptId)).toBe('PROCESSED');expect((await repo.booking.view(c,f.a.actorId,b.id))?.paymentStatus).toBe('PAID');
 await expect(createConfirmationService(repo,env).apply({...paid(b.orderId),transactionId:'different-transaction'})).rejects.toMatchObject({code:'conflict'});
}));
it('confirms adjacent intervals on the same seat without duplicate occupancy',async()=>inventoryFixture(c,async f=>{
 const repo=createPaymentRepository(c),bookings:BookingView[]=[];
 for(const [from,to] of [[0,2],[2,3]]){const hold=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(from,to));bookings.push(await createCheckoutService(createBookingRepository(c)).initiate({userId:f.a.actorId,verifiedEmail:'a@example.test'},{holdId:hold.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Friend',phone:'+6281234567890'}));}
 const results=await Promise.all(bookings.map(b=>createConfirmationService(repo,env).apply({...paid(b.orderId),amount:b.amount})));expect(results.every(b=>b.status==='CONFIRMED')).toBe(true);
 expect(await c`select inventory_id from public.confirmed_occupancy where trip_id=${f.detail.trip.id}`).toHaveLength(3);expect(await c`select id from public.tickets where trip_id=${f.detail.trip.id}`).toHaveLength(2);
}));
it('retains failed event processing for retry and reconciles pending orders without callbacks',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),withoutCallback=await makeBooking(f,1),repo=createPaymentRepository(c),provider=createMidtransProvider(env),receipt=await createPaymentNotificationService(provider,createPaymentEventService(repo,{status:async()=>{throw Error('temporary outage');}},createConfirmationService(repo,env))).receive(signed(b.orderId));
 const failed=createPaymentEventService(repo,{status:async()=>{throw Error('temporary outage');}},createConfirmationService(repo,env));expect(await failed.process(receipt.receiptId)).toBe('RETRY');
 expect((await c`select status,attempts,last_error,next_attempt_at>clock_timestamp()+interval '4 seconds' as backed_off from public.payment_events where id=${receipt.receiptId}`)[0]).toMatchObject({status:'RECEIVED',attempts:1,last_error:'RETRYABLE_PROCESSING',backed_off:true});
 const reconciler=createPaymentEventService(repo,{status:async orderId=>paid(orderId)},createConfirmationService(repo,env));
 await c`update public.payments set created_at=now()-interval '1 minute' where booking_id=${withoutCallback.id}`;
 expect(await reconciler.reconcilePayments(1)).toEqual({processed:1,retry:0});expect((await repo.booking.view(c,f.a.actorId,withoutCallback.id))?.status).toBe('CONFIRMED');
}));
it('caps automatic processing at eight failed attempts and excludes manual-review events from polling',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),repo=createPaymentRepository(c),events=createPaymentEventService(repo,{status:async()=>{throw Error('provider unavailable');}},createConfirmationService(repo,env));
 const receipt=await events.receive({orderId:b.orderId,eventKey:'retry-cap-'+b.id,fields:{order_id:b.orderId}});await c`update public.payment_events set attempts=7,next_attempt_at=clock_timestamp()-interval '1 second' where id=${receipt.receiptId}`;
 expect(await events.process(receipt.receiptId)).toBe('RETRY');expect((await c`select status,attempts,last_error from public.payment_events where id=${receipt.receiptId}`)[0]).toMatchObject({status:'REVIEW',attempts:8,last_error:'RECONCILIATION_REQUIRED'});
 expect(await events.reconcilePayments(1)).toEqual({processed:0,retry:0});expect(await c`select id from public.booking_audit_events where booking_id=${b.id} and action='PAYMENT_RECONCILIATION_REQUIRED'`).toHaveLength(1);
}));
it('records late verified payment as conflict without issuing ticket or occupancy',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),repo=createPaymentRepository(c),hold=await c`select seat_hold_id from public.bookings where id=${b.id}`;
 await c`update public.seat_holds set created_at=now()-interval '12 minutes',base_expires_at=now()-interval '2 minutes',effective_expires_at=now()-interval '1 minute' where id=${hold[0].seat_hold_id}`;
 expect((await createCleanupService(f.repo).expireBatch()).expired).toBe(1);expect((await repo.booking.view(c,f.a.actorId,b.id))?.status).toBe('EXPIRED');
 const view=await createConfirmationService(repo,env).apply(paid(b.orderId));expect(view.status).toBe('PAYMENT_CONFLICT');expect(view.paymentStatus).toBe('PAID');
 expect(await c`select id from public.seat_assignments where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id})`).toHaveLength(0);
 expect(await c`select id from public.tickets where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id})`).toHaveLength(0);
}));
it('keeps challenge outcomes visible for manual review without changing payment or inventory',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),repo=createPaymentRepository(c),receipt=await createPaymentEventService(repo,{status:async orderId=>({...paid(orderId),status:'challenge',fraudStatus:'challenge'})},createConfirmationService(repo,env)).receive({orderId:b.orderId,eventKey:'challenge-'+b.id,fields:{order_id:b.orderId}});
 const events=createPaymentEventService(repo,{status:async orderId=>({...paid(orderId),status:'challenge',fraudStatus:'challenge'})},createConfirmationService(repo,env));expect(await events.process(receipt.receiptId)).toBe('PROCESSED');
 expect((await c`select status,last_error,processed_at from public.payment_events where id=${receipt.receiptId}`)[0]).toMatchObject({status:'REVIEW',last_error:'PROVIDER_REQUIRES_REVIEW',processed_at:null});
 expect((await c`select status from public.payments where booking_id=${b.id}`)[0].status).toBe('PENDING');expect((await repo.booking.view(c,f.a.actorId,b.id))?.ticketId).toBeNull();
}));
it('rolls back paid status and inventory if ticket encryption fails',async()=>inventoryFixture(c,async f=>{
 const b=await makeBooking(f),repo=createPaymentRepository(c);
 await expect(createConfirmationService(repo,{keys:{},keyVersion:'missing',merchantId:env.merchantId}).apply(paid(b.orderId))).rejects.toThrow();
 expect((await repo.booking.view(c,f.a.actorId,b.id))?.status).toBe('PENDING_PAYMENT');expect((await c`select status from public.payments where booking_id=${b.id}`)[0].status).toBe('PENDING');
 expect(await c`select id from public.seat_assignments where booking_passenger_id in (select id from public.booking_passengers where booking_id=${b.id})`).toHaveLength(0);
}));

