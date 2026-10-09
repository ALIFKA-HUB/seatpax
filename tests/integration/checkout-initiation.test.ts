import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createBookingQueryService} from '@/modules/booking/query-service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
it('initiates OTHER once, preserves profile, grants grace once and isolates booker',async()=>inventoryFixture(c,async f=>{
 const holds=createHoldService(f.repo),h=await holds.create(f.a.actorId,f.inputHold()),repo=createBookingRepository(c),service=createCheckoutService(repo),actor={userId:f.a.actorId,verifiedEmail:'booker@example.test'},input={holdId:h.record.id,requestKey:randomUUID(),mode:'OTHER' as const,name:'Friend',phone:'081234567890'};
 const results=await Promise.all([service.initiate(actor,input),service.initiate(actor,{...input,requestKey:randomUUID()})]);expect(results[0].id).toBe(results[1].id);expect(results[0].amount).toBe('20000');expect(Date.parse(results[0].effectiveExpiresAt)-Date.parse(h.record.baseExpiresAt)).toBe(60000);
 expect((await service.initiate(actor,input)).orderId).toBe(results[0].orderId);await expect(service.initiate(actor,{...input,name:'Changed'})).rejects.toMatchObject({code:'conflict'});
 expect((await c`select name,phone from public.users where id=${actor.userId}`)[0]).toMatchObject({name:'Trip fixture user',phone:null});expect((await c`select account_id from public.booking_passengers where booking_id=${results[0].id}`)[0].account_id).toBeNull();
 await expect(createBookingQueryService(repo).readMine(f.b.actorId,results[0].id)).rejects.toMatchObject({code:'forbidden'});await expect(holds.release(actor.userId,h.record.id)).rejects.toMatchObject({code:'conflict'});
}));
it('rechecks payment cutoff after waiting on inventory and leaves grace unchanged on rejection',async()=>inventoryFixture(c,async f=>{
 const h=await createHoldService(f.repo).create(f.a.actorId,f.inputHold()),repo=createBookingRepository(c);await c`update public.trips set sales_close_at=clock_timestamp()+interval '2 seconds' where id=${h.record.tripId}`;
 let ready!:()=>void,resume!:()=>void;const locked=new Promise<void>(r=>ready=r),unlock=new Promise<void>(r=>resume=r);
 const blocker=c.begin(async tx=>{await f.repo.anchors(tx,h.record.tripId,h.record.seatId,h.record);ready();await unlock;});await locked;
 const pending=createCheckoutService(repo).initiate({userId:f.a.actorId,verifiedEmail:'a@example.test'},{holdId:h.record.id,requestKey:randomUUID(),mode:'SELF',name:'Owner',phone:'+6281234567890'}).then(v=>({v}),error=>({error}));
 await new Promise(r=>setTimeout(r,2300));resume();await blocker;expect(await pending).toMatchObject({error:{code:'conflict'}});expect((await c`select payment_initiated_at from public.seat_holds where id=${h.record.id}`)[0].payment_initiated_at).toBeNull();
}));
it('blocks fresh initiation during suspension and rejects zero-total payment without giving grace',async()=>inventoryFixture(c,async f=>{
 const h=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(0,1)),service=createCheckoutService(createBookingRepository(c)),actor={userId:f.a.actorId,verifiedEmail:'a@example.test'},input={holdId:h.record.id,requestKey:randomUUID(),mode:'SELF' as const,name:'Owner',phone:'+6281234567890'};
 await expect(service.initiate(actor,input)).rejects.toMatchObject({code:'validation'});await c`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;await expect(service.initiate(actor,input)).rejects.toMatchObject({code:'conflict'});expect((await c`select payment_initiated_at from public.seat_holds where id=${h.record.id}`)[0].payment_initiated_at).toBeNull();
}));
it('SELF saves reviewed profile and rejects foreign or expired hold initiation',async()=>inventoryFixture(c,async f=>{
 const h=await createHoldService(f.repo).create(f.a.actorId,f.inputHold()),service=createCheckoutService(createBookingRepository(c)),input={holdId:h.record.id,requestKey:randomUUID(),mode:'SELF' as const,name:'Owner',phone:'+6281234567890'};
 await expect(service.initiate({userId:f.b.actorId,verifiedEmail:'other@example.test'},input)).rejects.toMatchObject({code:'forbidden'});
 const v=await service.initiate({userId:f.a.actorId,verifiedEmail:'owner@example.test'},input);expect((await c`select name,phone from public.users where id=${f.a.actorId}`)[0]).toMatchObject({name:'Owner',phone:'+6281234567890'});expect((await c`select account_id from public.booking_passengers where booking_id=${v.id}`)[0].account_id).toBe(f.a.actorId);
 const other=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(0,3,1));await c`update public.seat_holds set created_at=now()-interval '11 minutes',base_expires_at=now()-interval '1 minute',effective_expires_at=now()-interval '1 minute' where id=${other.record.id}`;
 await expect(service.initiate({userId:f.a.actorId,verifiedEmail:'owner@example.test'},{...input,requestKey:randomUUID(),holdId:other.record.id})).rejects.toMatchObject({code:'conflict'});
}));

