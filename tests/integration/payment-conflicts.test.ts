import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createConflictService} from '@/modules/payment/conflict-service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
async function paidConflict(f:Parameters<Parameters<typeof inventoryFixture>[1]>[0]){
 const hold=await createHoldService(f.repo).create(f.a.actorId,f.inputHold());
 const booking=await createCheckoutService(createBookingRepository(c)).initiate({userId:f.a.actorId,verifiedEmail:'a@example.test'},{holdId:hold.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Friend',phone:'+6281234567890'});
 await c`update public.bookings set status='PAYMENT_CONFLICT' where id=${booking.id}`;
 await c`update public.payments set status='PAID',paid_at=clock_timestamp(),provider_transaction_id=${'txn-'+booking.id},provider_status='settlement' where booking_id=${booking.id}`;
 return booking;
}
it('denies foreign tenant and Super Admin tenant fallback, including revoked membership',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c));
 expect(await service.list({userId:f.a.actorId,companyId:f.a.companyId})).toHaveLength(1);
 expect(await service.list({userId:f.b.actorId,companyId:f.b.companyId})).toHaveLength(0);
 await expect(service.resolve({userId:f.b.actorId,companyId:f.b.companyId},booking.id,{action:'MOCK_REFUND',requestKey:randomUUID(),reason:'review'})).rejects.toMatchObject({code:'forbidden'});
 await c`update public.memberships set company_id=null,role='SUPER_ADMIN' where user_id=${f.crewId}`;
 try{await expect(service.resolve({userId:f.crewId,companyId:f.a.companyId},booking.id,{action:'MOCK_REFUND',requestKey:randomUUID(),reason:'review'})).rejects.toMatchObject({code:'forbidden'});}
 finally{await c`update public.memberships set company_id=${f.a.companyId},role='CREW',status='ACTIVE' where id=${f.crewMembershipId}`;}
 await c`update public.memberships set company_id=${f.a.companyId},role='ADMIN_PO',status='DISABLED' where user_id=${f.a.actorId} and company_id=${f.a.companyId}`;
 await expect(service.list({userId:f.a.actorId,companyId:f.a.companyId})).rejects.toMatchObject({code:'forbidden'});
 await expect(service.resolve({userId:f.a.actorId,companyId:f.a.companyId},booking.id,{action:'MOCK_REFUND',requestKey:randomUUID(),reason:'review'})).rejects.toMatchObject({code:'forbidden'});
}));
it('records an idempotent mock refund while suspended and preserves PAID plus exact amount',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c)),requestKey=randomUUID();
 await c`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;
 const actor={userId:f.a.actorId,companyId:f.a.companyId},input={action:'MOCK_REFUND' as const,requestKey,reason:'Paid after the hold expired'};
 const first=await service.resolve(actor,booking.id,input),retry=await service.resolve(actor,booking.id,input);
 expect(first.status).toBe('REFUNDED');expect(retry).toMatchObject({status:'REFUNDED',id:booking.id});
 expect(await c`select status from public.payments where booking_id=${booking.id}`).toEqual([{status:'PAID'}]);
 expect(await c`select action,amount::text,reason from public.payment_resolutions where booking_id=${booking.id}`).toEqual([{action:'MOCK_REFUND',amount:'20000',reason:input.reason}]);
 expect(await c`select action from public.booking_audit_events where booking_id=${booking.id} and action='MOCK_REFUND_RECORDED'`).toEqual([{action:'MOCK_REFUND_RECORDED'}]);
 expect(await c`select id from public.seat_assignments where booking_passenger_id=(select id from public.booking_passengers where booking_id=${booking.id})`).toHaveLength(0);
 expect(await c`select id from public.tickets where booking_passenger_id=(select id from public.booking_passengers where booking_id=${booking.id})`).toHaveLength(0);
}));
it('rejects confirmation after the origin cutoff without a partial resolution',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c));
 const hold=(await c<{from:number}[]>`select from_sequence as "from" from public.seat_holds where id=(select seat_hold_id from public.bookings where id=${booking.id})`)[0];
 await c`update public.trip_stops set arrival_at=clock_timestamp()-interval '2 minutes',departure_at=clock_timestamp()-interval '1 minute' where trip_id=${f.detail.trip.id} and sequence=${hold.from}`;
 await expect(service.resolve({userId:f.a.actorId,companyId:f.a.companyId},booking.id,{action:'CONFIRM',requestKey:randomUUID(),reason:'Manual review'})).rejects.toMatchObject({code:'conflict'});
 expect(await c`select status from public.bookings where id=${booking.id}`).toEqual([{status:'PAYMENT_CONFLICT'}]);
 expect(await c`select id from public.payment_resolutions where booking_id=${booking.id}`).toHaveLength(0);
 expect(await c`select status from public.payments where booking_id=${booking.id}`).toEqual([{status:'PAID'}]);
}));
it('manually confirms an eligible paid conflict once and records the exact amount',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c),()=>({keys:{v1:Buffer.alloc(32,7)},keyVersion:'v1'})),actor={userId:f.a.actorId,companyId:f.a.companyId};
 const input={action:'CONFIRM' as const,requestKey:randomUUID(),reason:'Seat and cutoff rechecked'};
 const result=await service.resolve(actor,booking.id,input),retry=await service.resolve(actor,booking.id,input);
 expect(result.status).toBe('CONFIRMED');expect(result.ticketId).toBeTruthy();expect(retry.ticketId).toBe(result.ticketId);
 expect(await c`select status from public.payments where booking_id=${booking.id}`).toEqual([{status:'PAID'}]);
 expect(await c`select action,amount::text from public.payment_resolutions where booking_id=${booking.id}`).toEqual([{action:'CONFIRM',amount:'20000'}]);
 expect(await c`select count(*)::int as count from public.tickets where booking_passenger_id=(select id from public.booking_passengers where booking_id=${booking.id})`).toEqual([{count:1}]);
 expect(await c`select count(*)::int as count from public.seat_assignments where booking_passenger_id=(select id from public.booking_passengers where booking_id=${booking.id})`).toEqual([{count:1}]);
}));
it('shows provider review items only inside their active tenant and without passenger fields',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c)),payment=(await c<{id:string}[]>`select id from public.payments where booking_id=${booking.id}`)[0],eventKey=randomUUID();
 await c`insert into public.payment_events(payment_id,event_key,fields,status,last_error) values(${payment.id},${eventKey},'{}'::jsonb,'REVIEW','PAYMENT_REQUIRES_REVIEW')`;
 const own=await service.listReview({userId:f.a.actorId,companyId:f.a.companyId});
 expect(own).toHaveLength(1);expect(own[0]).toMatchObject({bookingId:booking.id,orderId:booking.orderId,reason:'PAYMENT_REQUIRES_REVIEW'});expect(own[0]).not.toHaveProperty('passengerPhone');
 expect(await service.listReview({userId:f.b.actorId,companyId:f.b.companyId})).toHaveLength(0);
}));
it('serializes opposite terminal choices so only the mock refund commits when suspended',async()=>inventoryFixture(c,async f=>{
 const booking=await paidConflict(f),service=createConflictService(createPaymentRepository(c));await c`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;
 const actor={userId:f.a.actorId,companyId:f.a.companyId};
 const [refund,confirm]=await Promise.allSettled([
  service.resolve(actor,booking.id,{action:'MOCK_REFUND',requestKey:randomUUID(),reason:'Record mock refund'}),
  service.resolve(actor,booking.id,{action:'CONFIRM',requestKey:randomUUID(),reason:'Attempt manual confirm'}),
 ]);
 expect(refund.status).toBe('fulfilled');expect(confirm.status).toBe('rejected');
 expect(await c`select status from public.bookings where id=${booking.id}`).toEqual([{status:'REFUNDED'}]);
 expect(await c`select action from public.payment_resolutions where booking_id=${booking.id}`).toEqual([{action:'MOCK_REFUND'}]);
 expect(await c`select status from public.payments where booking_id=${booking.id}`).toEqual([{status:'PAID'}]);
}));
