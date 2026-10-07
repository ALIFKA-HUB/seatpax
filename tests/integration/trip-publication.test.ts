import {beforeAll,afterAll,it,expect} from 'vitest';import type {Sql} from 'postgres';import {randomUUID} from 'node:crypto';
import {tripClient,tripFixture} from './helpers/trip-fixture';import {createTripRepository} from '@/modules/trip/repository';import {createDraftService} from '@/modules/trip/draft-service';import {createPublicationService} from '@/modules/trip/publication-service';
import {createFleetRepository} from '@/modules/fleet/repository';import {createTemplateService} from '@/modules/fleet/template-service';import {createVehicleService} from '@/modules/fleet/vehicle-service';
let client:Sql;beforeAll(()=>{client=tripClient();});afterAll(async()=>{await client.end({timeout:5});});
it('publishes once under concurrent retries and source edits never change the copied data',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo),pub=createPublicationService(repo);const override=randomUUID();await client`insert into public.service_classes(id,company_id,name,code) values(${override},${f.a.companyId},'Override','override')`;await client`insert into public.segment_fares(company_id,route_id,from_route_stop_id,to_route_stop_id,service_class_id,price) select company_id,route_id,from_route_stop_id,to_route_stop_id,${override},price*2 from public.segment_fares where route_id=${f.routeId}`;const d=await draft.save(f.a,{...f.input,serviceClassId:override});
 const results=await Promise.all([pub.publish(f.a,d.tripId,1),pub.publish(f.a,d.tripId,1)]);expect(results[0]).toEqual(results[1]);
 const detail=await draft.detail(f.a,d.tripId);expect(detail.trip.status).toBe('OPEN_FOR_SALE');expect(detail.stops).toHaveLength(4);expect(detail.segments).toHaveLength(3);expect(detail.seats).toHaveLength(2);expect(detail.inventoryCount).toBe(6);expect(detail.segments[0].price).toBe('0');expect(detail.segments[1].price).toBe('20000');expect(detail.trip.identity?.className).toBe('Override');
 await client.begin(async tx=>{await tx`update public.stops set name='Changed' where company_id=${f.a.companyId}`;await tx`delete from public.segment_fares where route_id=${f.routeId}`;await tx`delete from public.route_stops where route_id=${f.routeId}`;await tx`delete from public.seat_template_cells where seat_template_id=${f.templateId}`;await tx`update public.seat_templates set status='ARCHIVED' where id=${f.templateId}`;await tx`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;});
 expect(await pub.publish(f.a,d.tripId,1)).toEqual(results[0]);expect(await draft.detail(f.a,d.tripId)).toEqual(detail);
 const audit=await client`select count(*)::int as n from public.trip_audit_events where trip_id=${d.tripId}`;expect(audit[0].n).toBe(1);
 await expect(draft.save(f.a,f.input,d.tripId,2)).rejects.toMatchObject({code:'conflict'});
}));
it('rolls back publication errors and rejects wrong-trip seat/segment references',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo);const d=await draft.save(f.a,f.input);
 const broken={...repo,persistProjection:async(...args:Parameters<typeof repo.persistProjection>)=>{await repo.persistProjection(...args);throw new Error('Injected failure');}};
 await expect(createPublicationService(broken).publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'unavailable'});
 expect((await draft.detail(f.a,d.tripId)).inventoryCount).toBe(0);expect((await draft.detail(f.a,d.tripId)).trip.status).toBe('DRAFT');
 await createPublicationService(repo).publish(f.a,d.tripId,1);const detail=await draft.detail(f.a,d.tripId);
 const other=await draft.save(f.a,{...f.input,name:'Other'});
 await expect(client`insert into public.trip_seat_inventory(company_id,trip_id,trip_seat_id,trip_segment_id) values(${f.a.companyId},${other.tripId},${detail.seats[0].id!},${detail.segments[0].id!})`).rejects.toMatchObject({code:'23503'});
 await expect(client`insert into public.trip_segments(id,company_id,trip_id,from_trip_stop_id,to_trip_stop_id,sequence,price) values(${randomUUID()},${f.a.companyId},${other.tripId},${detail.stops[0].id!},${detail.stops[1].id!},1,0)`).rejects.toMatchObject({code:'23503'});
}));
it('blocks incomplete fares/schedules, inactive sources, suspension and stale revision',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo),pub=createPublicationService(repo);const d=await draft.save(f.a,f.input);
 const past=await draft.save(f.a,{...f.input,departureWib:'2000-01-01T08:00'});await expect(pub.publish(f.a,past.tripId,1)).rejects.toMatchObject({code:'validation'});
 await expect(pub.publish(f.b,d.tripId,1)).rejects.toMatchObject({code:'forbidden'});await expect(pub.publish(f.a,d.tripId,99)).rejects.toMatchObject({code:'conflict'});
 await client`update public.route_stops set departure_offset_min=null where route_id=${f.routeId} and sequence=2`;await expect(pub.publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'validation'});
 await client`update public.route_stops set departure_offset_min=60 where route_id=${f.routeId} and sequence=2`;
 await client`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;await expect(pub.publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'forbidden'});await client`update public.companies set status='ACTIVE' where id=${f.a.companyId}`;
 await client`update public.vehicles set status='MAINTENANCE' where id=${f.vehicleId}`;await expect(pub.publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'validation'});await client`update public.vehicles set status='ACTIVE' where id=${f.vehicleId}`;
 await client`delete from public.segment_fares where route_id=${f.routeId}`;await expect(pub.publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'validation'});expect((await draft.detail(f.a,d.tripId)).inventoryCount).toBe(0);
}));
it('detects a route revision race after reading candidate dependencies',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo);const d=await draft.save(f.a,f.input);let signal!:()=>void,release!:()=>void;const read=new Promise<void>(r=>{signal=r;}),resume=new Promise<void>(r=>{release=r;});let reads=0;
 const controlled={...repo,sources:async(...args:Parameters<typeof repo.sources>)=>{const source=await repo.sources(...args);if(++reads===1){signal();await resume;}return source;}};
 const pending=createPublicationService(controlled).publish(f.a,d.tripId,1);await read;await client`update public.routes set revision=revision+1,name='Changed concurrently' where id=${f.routeId}`;release();await expect(pending).rejects.toMatchObject({code:'conflict'});expect((await draft.detail(f.a,d.tripId)).trip.status).toBe('DRAFT');
}));
it('uses a coherent new template and rejects vehicle reassignment during candidate reads',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo),fleet=createFleetRepository(client),templates=createTemplateService(fleet),vehicles=createVehicleService(fleet);
 const d=await draft.save(f.a,f.input);let once=false;
 const controlled={...repo,sources:async(...args:Parameters<typeof repo.sources>)=>{const s=await repo.sources(...args);if(!once){once=true;await templates.save(f.a,{...s.layout,name:'Updated',cells:s.layout.cells.map((c,i)=>({...c,seatCode:i?'B2':'B1'}))},f.templateId,1);}return s;}};
 await createPublicationService(controlled).publish(f.a,d.tripId,1);expect((await draft.detail(f.a,d.tripId)).seats.map(s=>s.seatCode)).toEqual(['B1','B2']);
 const next=await draft.save(f.a,f.input),replacement=await templates.save(f.a,{name:'Replacement',rows:1,cols:1,cells:[{rowIndex:0,colIndex:0,type:'SEAT',label:null,seatCode:'NEW'}]});once=false;
 const reassigned={...repo,sources:async(...args:Parameters<typeof repo.sources>)=>{const s=await repo.sources(...args);if(!once){once=true;await vehicles.save(f.a,{name:'Bus',plateNumber:'TRIP 1',fleetNumber:null,seatTemplateId:replacement.templateId,defaultServiceClassId:f.classId,status:'ACTIVE'},f.vehicleId,1);}return s;}};
 await expect(createPublicationService(reassigned).publish(f.a,next.tripId,1)).rejects.toMatchObject({code:'conflict'});expect((await draft.detail(f.a,next.tripId)).inventoryCount).toBe(0);
}),60000);
it('serializes suspension and membership disable behind an in-flight publication guard',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo);const d=await draft.save(f.a,f.input);
 let signal!:()=>void,release!:()=>void;const ready=new Promise<void>(r=>{signal=r;}),resume=new Promise<void>(r=>{release=r;});let first=true;
 const controlled={...repo,sources:async(...args:Parameters<typeof repo.sources>)=>{const s=await repo.sources(...args);if(first){first=false;signal();await resume;}return s;}};
 const publishing=createPublicationService(controlled).publish(f.a,d.tripId,1);await ready;
 let pidReady!:(pid:number)=>void;const pidValue=new Promise<number>(r=>{pidReady=r;});
 const disabling=client.begin(async tx=>{const pid=await tx`select pg_backend_pid() as pid`;pidReady(pid[0].pid);await tx`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;await tx`update public.memberships set status='DISABLED' where user_id=${f.a.actorId} and company_id=${f.a.companyId}`;});
 const pid=await pidValue;let blocked=false;for(let i=0;i<30;i++){const row=await client`select cardinality(pg_blocking_pids(${pid}))>0 as blocked`;if(row[0].blocked){blocked=true;break;}}
 release();expect((await publishing).status).toBe('OPEN_FOR_SALE');await disabling;expect(blocked).toBe(true);await expect(createPublicationService(repo).publish(f.a,d.tripId,1)).rejects.toMatchObject({code:'forbidden'});
}),60000);
