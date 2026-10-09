import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryClient} from './helpers/inventory-fixture';
import {boardingFixture} from './helpers/boarding-fixture';
import {createBoardingRepository} from '@/modules/boarding/repository';
import {createBoardingService} from '@/modules/boarding/service';
import {createCrewService} from '@/modules/trip/crew-service';
import {createTripRepository} from '@/modules/trip/repository';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
it('boards once, preserves actor/source on retry and enforces stop, role and identity',async()=>boardingFixture(c,async f=>{
 const service=createBoardingService(createBoardingRepository(c)),trip=f.detail.trip.id,crew={userId:f.crewId,role:'CREW' as const},ticket=await f.confirmed(),input={ticketId:ticket.ticketId,stopId:f.detail.stops[0].id!,source:'MANIFEST' as const};
 await expect(service.board(crew,trip,{...input,stopId:f.detail.stops[1].id!})).rejects.toMatchObject({code:'validation'});expect(await c`select id from public.boarding_events where trip_id=${trip}`).toHaveLength(0);
 await expect(service.board({userId:f.a.actorId,role:'ADMIN_PO'},trip,input)).rejects.toMatchObject({code:'forbidden'});
 const rollbackRepo=createBoardingRepository(c),insert=rollbackRepo.insert;rollbackRepo.insert=async(...args)=>{await insert(...args);throw new Error('Fixture rollback');};
 await expect(createBoardingService(rollbackRepo).board(crew,trip,input)).rejects.toMatchObject({code:'unavailable'});expect(await c`select id from public.boarding_events where trip_id=${trip}`).toHaveLength(0);
 const second=randomUUID();f.users.push(second);await c`insert into auth.users(id) values(${second})`;await c`insert into public.users(id,name) values(${second},'Second crew fixture')`;await c`insert into public.memberships(company_id,user_id,role) values(${f.a.companyId},${second},'CREW')`;
 await createCrewService(createTripRepository(c)).setAssignment(f.a,trip,second,'ACTIVE');await c`update public.companies set status='SUSPENDED' where id=${f.a.companyId}`;
 const results=await Promise.all([service.board(crew,trip,input),service.board({userId:second,role:'CREW'},trip,{...input,source:'QR'})]);expect(results[0].boarding).toEqual(results[1].boarding);expect(results.map(r=>r.alreadyBoarded).sort()).toEqual([false,true]);
 expect((await service.board(crew,trip,{...input,source:'QR'})).boarding).toEqual(results[0].boarding);expect((await service.manifest(crew,trip)).boardedCount).toBe(1);
 await c`update public.memberships set status='DISABLED' where id=${f.crewMembershipId}`;await expect(service.board(crew,trip,input)).rejects.toMatchObject({code:'forbidden'});
 expect(await c`select id from public.boarding_events where trip_id=${trip}`).toHaveLength(1);
 await expect(c`insert into public.boarding_events(company_id,trip_id,ticket_id,boarding_stop_id,actor_user_id,source) values(${f.a.companyId},${trip},${ticket.ticketId},${input.stopId},${second},'QR')`).rejects.toMatchObject({code:'23505'});
 await expect(c`insert into public.boarding_events(company_id,trip_id,ticket_id,boarding_stop_id,actor_user_id,source) values(${f.b.companyId},${trip},${randomUUID()},${input.stopId},${second},'QR')`).rejects.toMatchObject({code:'23503'});
}),180000);
it('serializes board-before-revoke and rejects revoke-before-board',async()=>boardingFixture(c,async f=>{
 const repo=createBoardingRepository(c),crew={userId:f.crewId,role:'CREW' as const},trip=f.detail.trip.id,ticket=await f.confirmed(),input={ticketId:ticket.ticketId,stopId:f.detail.stops[0].id!,source:'MANIFEST' as const};
 let entered!:()=>void,release!:()=>void;const locked=new Promise<void>(resolve=>{entered=resolve;}),gate=new Promise<void>(resolve=>{release=resolve;});const authorize=repo.authorize;
 repo.authorize=async(...args)=>{const result=await authorize(...args);entered();await gate;return result;};
 const boarding=createBoardingService(repo).board(crew,trip,input);await locked;
 const writer=createCrewService(createTripRepository(c));let revoked=false;const revoking=writer.setAssignment(f.a,trip,f.crewId,'REVOKED').then(()=>{revoked=true;});
 try{await c`select 1`;expect(revoked).toBe(false);}finally{release();}
 expect((await boarding).alreadyBoarded).toBe(false);await revoking;
 await expect(createBoardingService(createBoardingRepository(c)).board(crew,trip,input)).rejects.toMatchObject({code:'forbidden'});
 const other=await f.confirmed(0,3,1);await expect(createBoardingService(createBoardingRepository(c)).board(crew,trip,{...input,ticketId:other.ticketId})).rejects.toMatchObject({code:'forbidden'});expect(await c`select id from public.boarding_events where ticket_id=${other.ticketId}`).toHaveLength(0);
 expect(await c`select id from public.boarding_events where trip_id=${trip}`).toHaveLength(1);
}),180000);
