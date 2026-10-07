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
