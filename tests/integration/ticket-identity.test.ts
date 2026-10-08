import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import type {BookingView} from '@/modules/booking/types';
import {randomUUID} from 'node:crypto';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
it('rejects a ticket linked to another passenger assignment within the same trip',async()=>inventoryFixture(c,async f=>{
 const service=createCheckoutService(createBookingRepository(c));const booked:BookingView[]=[];
 for(const [from,to] of [[0,2],[2,3]]){const hold=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(from,to));booked.push(await service.initiate({userId:f.a.actorId,verifiedEmail:'a@example.test'},{holdId:hold.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Friend',phone:'+628123456789'}));}
 const passengers=await c`select id,booking_id from public.booking_passengers where booking_id in ${c(booked.map(b=>b.id))}`;const a=passengers.find(p=>p.booking_id===booked[0].id)!,b=passengers.find(p=>p.booking_id===booked[1].id)!;
 const [assignment]=await c`insert into public.seat_assignments(booking_passenger_id,company_id,trip_id,trip_seat_id,from_sequence,to_sequence) values(${a.id},${f.a.companyId},${f.detail.trip.id},${f.detail.seats[0].id!},1,3) returning id`;
 await expect(c`insert into public.tickets(booking_passenger_id,assignment_id,trip_id,company_id,token_hash,ciphertext,nonce,auth_tag,key_version) values(${b.id},${assignment.id},${f.detail.trip.id},${f.a.companyId},${'c'.repeat(64)},'cipher','nonce','tag','v1')`).rejects.toMatchObject({code:'23503'});
}));


