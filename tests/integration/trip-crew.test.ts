import {beforeAll,afterAll,it,expect} from 'vitest';import type {Sql} from 'postgres';
import {tripClient,tripFixture} from './helpers/trip-fixture';import {createTripRepository} from '@/modules/trip/repository';import {createDraftService} from '@/modules/trip/draft-service';import {createPublicationService} from '@/modules/trip/publication-service';import {createCrewService} from '@/modules/trip/crew-service';
let client:Sql;beforeAll(()=>{client=tripClient();});afterAll(async()=>{await client.end({timeout:5});});
it('assigns and revokes exactly once, denies unassigned/foreign/draft access and preserves audits',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo),crew=createCrewService(repo);const d=await draft.save(f.a,f.input);
 await expect(crew.detailMine(f.crewId,d.tripId)).rejects.toMatchObject({code:'forbidden'});
 await crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE');await expect(crew.detailMine(f.crewId,d.tripId)).rejects.toMatchObject({code:'forbidden'});
 await createPublicationService(repo).publish(f.a,d.tripId,1);expect((await crew.detailMine(f.crewId,d.tripId)).inventoryCount).toBe(6);expect(await crew.listMine(f.crewId)).toHaveLength(1);
 await expect(crew.setAssignment(f.b,d.tripId,f.crewId,'REVOKED')).rejects.toMatchObject({code:'forbidden'});await expect(crew.setAssignment(f.a,d.tripId,f.b.actorId,'ACTIVE')).rejects.toMatchObject({code:'forbidden'});
 await crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE');await crew.setAssignment(f.a,d.tripId,f.crewId,'REVOKED');await crew.setAssignment(f.a,d.tripId,f.crewId,'REVOKED');await expect(crew.detailMine(f.crewId,d.tripId)).rejects.toMatchObject({code:'forbidden'});expect(await crew.listMine(f.crewId)).toHaveLength(0);
 await crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE');await client`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;expect((await crew.detailMine(f.crewId,d.tripId)).trip.id).toBe(d.tripId);
 await client`update public.memberships set status='DISABLED' where id=${f.crewMembershipId}`;await expect(crew.detailMine(f.crewId,d.tripId)).rejects.toMatchObject({code:'forbidden'});await expect(crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE')).rejects.toMatchObject({code:'forbidden'});await crew.setAssignment(f.a,d.tripId,f.crewId,'REVOKED');
 const rows=await client`select action from public.trip_audit_events where trip_id=${d.tripId}`;expect(rows.filter(r=>r.action==='CREW_ASSIGNED')).toHaveLength(2);expect(rows.filter(r=>r.action==='CREW_REVOKED')).toHaveLength(2);
}),60000);
it('supports multiple crew and concurrent retry/disable with consistent membership lock order',async()=>tripFixture(client,async f=>{
 const repo=createTripRepository(client),draft=createDraftService(repo),crew=createCrewService(repo);const d=await draft.save(f.a,f.input);await createPublicationService(repo).publish(f.a,d.tripId,1);
 await client`insert into public.memberships(user_id,company_id,role) values(${f.a.actorId},${f.a.companyId},'CREW'),(${f.crewId},${f.a.companyId},'ADMIN_PO')`;
 await Promise.all([crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE'),crew.setAssignment({actorId:f.crewId,companyId:f.a.companyId},d.tripId,f.a.actorId,'ACTIVE'),crew.setAssignment(f.a,d.tripId,f.crewId,'ACTIVE')]);
 expect(await crew.listAssignments(f.a,d.tripId)).toHaveLength(2);
 await Promise.all([crew.setAssignment(f.a,d.tripId,f.crewId,'REVOKED'),client`update public.memberships set status='DISABLED' where id=${f.crewMembershipId}`]);
 await expect(crew.detailMine(f.crewId,d.tripId)).rejects.toMatchObject({code:'forbidden'});
 const rows=await client`select count(*)::int as n from public.trip_audit_events where trip_id=${d.tripId} and action='CREW_ASSIGNED'`;expect(rows[0].n).toBe(2);
}),60000);
