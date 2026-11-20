import {beforeAll,afterAll,it,expect} from 'vitest';
import type {Sql} from 'postgres';
import {tripClient,tripFixture} from './helpers/trip-fixture';
import {createTripRepository} from '@/modules/trip/repository';
import {createDraftService} from '@/modules/trip/draft-service';
let client:Sql;beforeAll(()=>{client=tripClient();});afterAll(async()=>{await client.end({timeout:5});});
it('persists drafts, denies foreign access and permits exactly one stale concurrent update',async()=>tripFixture(client,async f=>{
 const service=createDraftService(createTripRepository(client));const d=await service.save(f.a,f.input);
 expect((await service.detail(f.a,d.tripId)).trip).toMatchObject({status:'DRAFT',revision:1});
 await expect(service.detail(f.b,d.tripId)).rejects.toMatchObject({code:'forbidden'});
 await expect(service.save(f.b,f.input)).rejects.toMatchObject({code:'forbidden'});
 const results=await Promise.allSettled([service.save(f.a,{...f.input,name:'One'},d.tripId,1),service.save(f.a,{...f.input,name:'Two'},d.tripId,1)]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 await client`update public.routes set status='INACTIVE' where id=${f.routeId}`;
 const next=await service.save(f.a,{...f.input,name:'Still draft'},d.tripId,2);expect(next.revision).toBe(3);
 await expect(service.save(f.a,f.input)).rejects.toMatchObject({code:'validation'});
}));
it('allows incomplete schedules/fares as drafts and browser roles cannot use trip tables',async()=>tripFixture(client,async f=>{
 await client`delete from public.segment_fares where route_id=${f.routeId}`;await client`update public.route_stops set departure_offset_min=null where route_id=${f.routeId} and sequence=2`;
 const service=createDraftService(createTripRepository(client));expect((await service.save(f.a,f.input)).status).toBe('DRAFT');
 for(const table of ['trips','trip_stops','trip_segments','trip_seats','trip_seat_inventory','trip_crew_assignments','trip_audit_events']){for(const role of ['anon','authenticated']){const rows=await client`select has_table_privilege(${role},${'public.'+table},'SELECT') or has_table_privilege(${role},${'public.'+table},'INSERT') or has_table_privilege(${role},${'public.'+table},'UPDATE') or has_table_privilege(${role},${'public.'+table},'DELETE') as allowed`;expect(rows[0].allowed).toBe(false);}const rows=await client`select relrowsecurity from pg_class where oid=${'public.'+table}::regclass`;expect(rows[0].relrowsecurity).toBe(true);}
 await expect(client`insert into public.trips(company_id,name,route_id,vehicle_id,service_class_id,departure_at) values(${f.b.companyId},'Foreign',${f.routeId},${f.vehicleId},${f.classId},now())`).rejects.toMatchObject({code:'23503'});
}));
it('persists recurring trip drafts atomically by weekday, blocks foreign tenants and inactive sources',async()=>tripFixture(client,async f=>{
 const service=createDraftService(createTripRepository(client));
 const recurringInput={name:'Jadwal Rutin',routeId:f.routeId,vehicleId:f.vehicleId,serviceClassId:f.classId,startDate:'2026-11-23',endDate:'2026-11-29',departureTime:'07:30',weekdays:[1,3,5],salesCloseBeforeMin:30};
 const res=await service.saveRecurring(f.a,recurringInput);
 expect(res.status).toBe('DRAFT');expect(res.count).toBe(3);expect(res.tripIds).toHaveLength(3);
 const list=await service.list(f.a);
 expect(list.map(t=>new Date(t.departureAt).toISOString()).sort()).toEqual(['2026-11-23T00:30:00.000Z','2026-11-25T00:30:00.000Z','2026-11-27T00:30:00.000Z']);
 const first=await service.detail(f.a,res.tripIds[0]);
 expect(first.trip.salesCloseAt).toBeTruthy();
 expect(new Date(first.trip.salesCloseAt!).toISOString()).toBe('2026-11-23T00:00:00.000Z');
 await expect(service.saveRecurring(f.b,recurringInput)).rejects.toMatchObject({code:'forbidden'});
 await client`update public.routes set status='INACTIVE' where id=${f.routeId}`;
 await expect(service.saveRecurring(f.a,recurringInput)).rejects.toMatchObject({code:'validation'});
 expect(await service.list(f.a)).toHaveLength(3);
}));
