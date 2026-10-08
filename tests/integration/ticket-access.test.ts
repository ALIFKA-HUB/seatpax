import {afterAll,beforeAll,expect,it} from 'vitest';
import {randomBytes,randomUUID} from 'node:crypto';
import type {Sql} from 'postgres';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createTicketRepository} from '@/modules/ticket/repository';
import {createTicketService} from '@/modules/ticket/service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));

it('reopens one stable QR to the booker and denies matching traveler data and unassigned crew',async()=>inventoryFixture(c,async f=>{
 const holds=createHoldService(f.repo),hold=await holds.create(f.a.actorId,f.inputHold()),bookings=createBookingRepository(c),booking=await createCheckoutService(bookings).initiate({userId:f.a.actorId,verifiedEmail:'booker@example.test'},{holdId:hold.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Friend',phone:'+6281234567890'});
 const passenger=(await c<{id:string}[]>`select id from public.booking_passengers where booking_id=${booking.id}`)[0],assignmentId=randomUUID();
 await c.begin(async tx=>{await tx`insert into public.seat_assignments(id,booking_passenger_id,company_id,trip_id,trip_seat_id,from_sequence,to_sequence) values(${assignmentId},${passenger.id},${f.a.companyId},${hold.record.tripId},${hold.record.seatId},${hold.record.from},${hold.record.to})`;await tx`update public.bookings set status='CONFIRMED',confirmed_at=clock_timestamp() where id=${booking.id}`;await tx`update public.payments set status='PAID',paid_at=clock_timestamp(),provider_transaction_id=${randomUUID()},provider_status='settlement' where booking_id=${booking.id}`;});
 const key=randomBytes(32),keys={v1:key},repo=createTicketRepository();const issued=await c.begin(tx=>repo.issue(tx,{passengerId:passenger.id,assignmentId,companyId:f.a.companyId,tripId:hold.record.tripId,keys,keyVersion:'v1'}));
 const service=createTicketService({...repo,client:c},keys),first=await service.readMine(f.a.actorId,issued.id),second=await service.readMine(f.a.actorId,issued.id);
 expect(first.qrToken).toBe(issued.token);expect(second.qrToken).toBe(issued.token);expect(first.passenger).toEqual({name:'Friend',phone:'+6281234567890'});
 await expect(service.readMine(f.b.actorId,issued.id)).rejects.toMatchObject({code:'forbidden'});
 await expect(service.resolveOperational({userId:f.crewId,companyId:f.a.companyId,tripId:hold.record.tripId,role:'CREW'},issued.token)).rejects.toMatchObject({code:'forbidden'});
 const operational=await service.resolveOperational({userId:f.a.actorId,companyId:f.a.companyId,tripId:hold.record.tripId,role:'ADMIN_PO'},issued.token);expect(operational.id).toBe(issued.id);expect('qrToken' in operational).toBe(false);
 await c`insert into public.trip_crew_assignments(company_id,trip_id,user_id,membership_id,assigned_by) values(${f.a.companyId},${hold.record.tripId},${f.crewId},${f.crewMembershipId},${f.a.actorId})`;
 expect((await service.resolveOperational({userId:f.crewId,companyId:f.a.companyId,tripId:hold.record.tripId,role:'CREW'},issued.token)).id).toBe(issued.id);
 await c`update public.memberships set status='DISABLED' where id=${f.crewMembershipId}`;
 await expect(service.resolveOperational({userId:f.crewId,companyId:f.a.companyId,tripId:hold.record.tripId,role:'CREW'},issued.token)).rejects.toMatchObject({code:'forbidden'});
}));
