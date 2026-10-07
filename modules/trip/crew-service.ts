import {DomainError,type Context} from '@/modules/access/transaction';import {resourceId} from '@/modules/fleet/template-service';
import type {TripRepository} from './repository';import type {TripRecord} from './types';
export type CrewAssignment={userId:string;name:string|null;email:string|null;status:'ACTIVE'|'REVOKED';membershipStatus:string};
export function createCrewService(repo:TripRepository){return {
 listAssignments(ctx:Context,id:string){resourceId(id);return repo.runAdmin(ctx,async tx=>{await repo.trip(tx,ctx,id);return await tx<CrewAssignment[]>`select a.user_id as "userId",u.name,u.email,a.status,m.status as "membershipStatus" from public.trip_crew_assignments a join public.users u on u.id=a.user_id join public.memberships m on m.id=a.membership_id where a.trip_id=${id} and a.company_id=${ctx.companyId} order by a.assigned_at`;});},
 crewChoices(ctx:Context){return repo.runAdmin(ctx,async tx=>await tx<{userId:string;name:string|null;email:string|null}[]>`select m.user_id as "userId",u.name,u.email from public.memberships m join public.users u on u.id=m.user_id where m.company_id=${ctx.companyId} and m.role='CREW' and m.status='ACTIVE' order by u.name,u.email`);},
 async setAssignment(ctx:Context,id:string,userId:string,status:'ACTIVE'|'REVOKED'){
  resourceId(ctx.actorId);resourceId(ctx.companyId);resourceId(id);resourceId(userId);if(status!=='ACTIVE'&&status!=='REVOKED')throw new DomainError('validation','Status penugasan tidak valid.');
  try{return await repo.client.begin(async tx=>{
   const candidates=await tx<{id:string}[]>`select id from public.memberships where company_id=${ctx.companyId} and ((user_id=${ctx.actorId} and role='ADMIN_PO') or (user_id=${userId} and role='CREW'))`;
   if(candidates.length!==2)throw new DomainError('forbidden','Admin atau crew tidak tersedia pada PO ini.');
   const memberships=await tx<{id:string;userId:string;role:string;status:string}[]>`select id,user_id as "userId",role,status from public.memberships where company_id=${ctx.companyId} and id in ${tx(candidates.map(c=>c.id).sort())} order by id for share`;
   const actor=memberships.find(m=>m.userId===ctx.actorId&&m.role==='ADMIN_PO'),target=memberships.find(m=>m.userId===userId&&m.role==='CREW');
   if(!actor||actor.status!=='ACTIVE'||!target||status==='ACTIVE'&&target.status!=='ACTIVE')throw new DomainError('forbidden','Keanggotaan admin atau crew tidak aktif.');
   await repo.trip(tx,ctx,id,true);
   const rows=await tx<{status:string}[]>`select status from public.trip_crew_assignments where trip_id=${id} and company_id=${ctx.companyId} and user_id=${userId} for update`;
   if(rows[0]?.status===status)return {tripId:id,userId,status};
   if(!rows.length&&status==='REVOKED')throw new DomainError('validation','Crew belum ditugaskan.');
   if(rows.length)await tx`update public.trip_crew_assignments set status=${status},assigned_by=case when ${status}='ACTIVE' then ${ctx.actorId}::uuid else assigned_by end,assigned_at=case when ${status}='ACTIVE' then clock_timestamp() else assigned_at end,revoked_at=case when ${status}='REVOKED' then clock_timestamp() else null end where trip_id=${id} and company_id=${ctx.companyId} and user_id=${userId}`;
   else await tx`insert into public.trip_crew_assignments(company_id,trip_id,user_id,membership_id,assigned_by) values(${ctx.companyId},${id},${userId},${target.id},${ctx.actorId})`;
   await tx`insert into public.trip_audit_events(company_id,trip_id,actor_id,action,target_user_id,metadata) values(${ctx.companyId},${id},${ctx.actorId},${status==='ACTIVE'?'CREW_ASSIGNED':'CREW_REVOKED'},${userId},${tx.typed(JSON.stringify({membershipId:target.id,previousStatus:rows[0]?.status??null}),25)}::jsonb)`;
   return {tripId:id,userId,status};
  });}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Penugasan belum dapat diperbarui. Coba lagi.');}
 },
 async listMine(actorId:string):Promise<TripRecord[]>{resourceId(actorId);return await repo.client<TripRecord[]>`select t.id,t.company_id as "companyId",t.name,t.route_id as "routeId",t.vehicle_id as "vehicleId",t.service_class_id as "serviceClassId",t.departure_at::text as "departureAt",t.sales_close_at::text as "salesCloseAt",t.revision,t.status,t.published_at::text as "publishedAt",t.identity_snapshot as identity from public.trips t join public.trip_crew_assignments a on a.trip_id=t.id and a.company_id=t.company_id join public.memberships m on m.id=a.membership_id and m.user_id=a.user_id and m.company_id=a.company_id where m.user_id=${actorId} and m.role='CREW' and m.status='ACTIVE' and a.status='ACTIVE' and t.status='OPEN_FOR_SALE' order by t.departure_at`;},
 async detailMine(actorId:string,id:string){resourceId(actorId);resourceId(id);try{return await repo.client.begin(async tx=>{
  const membership=await tx<{id:string;companyId:string}[]>`select m.id,m.company_id as "companyId" from public.memberships m join public.trips t on t.company_id=m.company_id where t.id=${id} and t.status='OPEN_FOR_SALE' and m.user_id=${actorId} and m.role='CREW' and m.status='ACTIVE' for share of m`;
  if(membership.length!==1)throw new DomainError('forbidden','Perjalanan tidak tersedia untuk crew ini.');
  const assignments=await tx`select id from public.trip_crew_assignments where trip_id=${id} and company_id=${membership[0].companyId} and user_id=${actorId} and membership_id=${membership[0].id} and status='ACTIVE' for share`;
  if(assignments.length!==1)throw new DomainError('forbidden','Crew tidak ditugaskan pada perjalanan ini.');
  return repo.detail(tx,{actorId,companyId:membership[0].companyId},id);
 });}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Perjalanan belum dapat dibuka.');}}
 };}
