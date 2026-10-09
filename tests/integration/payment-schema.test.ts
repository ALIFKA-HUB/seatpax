import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryClient,inventoryFixture} from './helpers/inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
it('protects checkout tables and binds booker, passenger mode and hold identity',async()=>inventoryFixture(c,async f=>{
 const h=await createHoldService(f.repo).create(f.a.actorId,f.inputHold());
 await c.begin(async tx=>{
  const id=randomUUID();
  await tx`insert into public.bookings(id,company_id,trip_id,seat_hold_id,booker_user_id,request_key,payload_hash,mode,contact_email,amount,snapshot) values(${id},${f.a.companyId},${h.record.tripId},${h.record.id},${f.a.actorId},${randomUUID()},'test','OTHER','booker@example.test',20000,'{}')`;
  await expect(tx.savepoint(async s=>{await s`insert into public.booking_passengers(booking_id,company_id,trip_id,booker_user_id,mode,account_id,name,phone) values(${id},${f.a.companyId},${h.record.tripId},${f.a.actorId},'OTHER',${f.a.actorId},'Friend','+628123456789')`;})).rejects.toMatchObject({code:'23514'});
  const [passenger]=await tx`insert into public.booking_passengers(booking_id,company_id,trip_id,booker_user_id,mode,name,phone) values(${id},${f.a.companyId},${h.record.tripId},${f.a.actorId},'OTHER','Friend','+628123456789') returning id`;
  await expect(tx.savepoint(async s=>{await s`insert into public.bookings(company_id,trip_id,seat_hold_id,booker_user_id,request_key,payload_hash,mode,contact_email,amount,snapshot) values(${f.a.companyId},${h.record.tripId},${h.record.id},${f.a.actorId},${randomUUID()},'test','OTHER','booker@example.test',20000,'{}')`;})).rejects.toMatchObject({code:'23505'});
  await expect(tx.savepoint(async s=>{await s`update public.bookings set company_id=${f.b.companyId} where id=${id}`;})).rejects.toMatchObject({code:'23503'});
  await expect(tx.savepoint(async s=>{await s`update public.bookings set amount=-1 where id=${id}`;})).rejects.toMatchObject({code:'23514'});
  await expect(tx.savepoint(async s=>{await s`update public.bookings set status='CONFIRMED' where id=${id}`;})).rejects.toMatchObject({code:'23514'});
  const [payment]=await tx`insert into public.payments(booking_id,company_id,trip_id,provider_order_id,amount) values(${id},${f.a.companyId},${h.record.tripId},${randomUUID()},20000) returning id`;
  await expect(tx.savepoint(async s=>{await s`update public.payments set status='PAID' where id=${payment.id}`;})).rejects.toMatchObject({code:'23514'});
  await expect(tx.savepoint(async s=>{await s`insert into public.payments(booking_id,company_id,trip_id,provider_order_id,amount) values(${id},${f.a.companyId},${h.record.tripId},${randomUUID()},20000)`;})).rejects.toMatchObject({code:'23505'});
  const [assignment]=await tx`insert into public.seat_assignments(booking_passenger_id,company_id,trip_id,trip_seat_id,from_sequence,to_sequence) values(${passenger.id},${f.a.companyId},${h.record.tripId},${h.record.seatId},1,4) returning id`;
  const [anchor]=await tx`select id from public.trip_seat_inventory where trip_id=${h.record.tripId} limit 1`;
  await tx`insert into public.confirmed_occupancy(inventory_id,assignment_id,trip_id,company_id) values(${anchor.id},${assignment.id},${h.record.tripId},${f.a.companyId})`;
  await expect(tx.savepoint(async s=>{await s`insert into public.confirmed_occupancy(inventory_id,assignment_id,trip_id,company_id) values(${anchor.id},${assignment.id},${h.record.tripId},${f.a.companyId})`;})).rejects.toMatchObject({code:'23505'});
  await tx`insert into public.tickets(booking_passenger_id,assignment_id,trip_id,company_id,token_hash,ciphertext,nonce,auth_tag,key_version) values(${passenger.id},${assignment.id},${h.record.tripId},${f.a.companyId},${'a'.repeat(64)},'cipher','nonce','tag','v1')`;
  await expect(tx.savepoint(async s=>{await s`insert into public.tickets(booking_passenger_id,assignment_id,trip_id,company_id,token_hash,ciphertext,nonce,auth_tag,key_version) values(${passenger.id},${assignment.id},${h.record.tripId},${f.a.companyId},${'b'.repeat(64)},'cipher','nonce','tag','v1')`;})).rejects.toMatchObject({code:'23505'});
 });
 const [priv]=await c`select has_table_privilege('authenticated','public.bookings','SELECT') as access,relrowsecurity from pg_class where oid='public.bookings'::regclass`;expect(priv.access).toBe(false);expect(priv.relrowsecurity).toBe(true);
}));
