import {DomainError,type Context} from '@/modules/access/transaction';
import {resourceId,expectedCounter} from '@/modules/fleet/template-service';
import type {TripRepository} from './repository';import type {TripCommandResult,TripRecord,TripDraftInput} from './types';
import {lockSources} from './transaction';import {projectSnapshot} from './snapshot';import {toWibInput} from './time';
const result=(trip:TripRecord):TripCommandResult=>({tripId:trip.id,revision:trip.revision,status:trip.status});
const input=(trip:TripRecord):TripDraftInput=>({name:trip.name,routeId:trip.routeId,vehicleId:trip.vehicleId,serviceClassId:trip.serviceClassId,departureWib:toWibInput(trip.departureAt),salesCloseWib:trip.salesCloseAt?toWibInput(trip.salesCloseAt):null});
export function createPublicationService(repo:TripRepository){return {
 publish(ctx:Context,id:string,expectedRevision:number):Promise<TripCommandResult>{resourceId(id);return repo.runAdmin(ctx,async tx=>{
  const candidate=await repo.trip(tx,ctx,id);if(candidate.status==='OPEN_FOR_SALE')return result(candidate);
  const companies=await tx<{status:string}[]>`select status from public.companies where id=${ctx.companyId} for share`;
  let source;try{source=await lockSources(repo,tx,ctx,candidate.routeId,candidate.vehicleId,candidate.serviceClassId);}catch(error){const latest=await repo.trip(tx,ctx,id,true);if(latest.status==='OPEN_FOR_SALE')return result(latest);throw error;}
  const trip=await repo.trip(tx,ctx,id,true);if(trip.status==='OPEN_FOR_SALE')return result(trip);
  expectedCounter(expectedRevision,trip.revision);if(candidate.revision!==trip.revision)throw new DomainError('conflict','Perjalanan berubah. Muat ulang.');
  if(companies.length!==1||companies[0].status!=='ACTIVE')throw new DomainError('forbidden','PO yang disuspend tidak dapat membuka penjualan.');
  const clock=await tx<{now:string}[]>`select clock_timestamp()::text as now`;
  const projection=projectSnapshot(source,input(trip),clock[0].now);
  await repo.persistProjection(tx,ctx,id,projection);
  // Text OID 25 avoids JSON serializer differences between raw postgres and Drizzle clients.
  await tx`update public.trips set status='OPEN_FOR_SALE',published_at=clock_timestamp(),layout_snapshot=${tx.typed(JSON.stringify(projection.layout),25)}::jsonb,identity_snapshot=${tx.typed(JSON.stringify(projection.identity),25)}::jsonb,revision=revision+1,updated_at=now() where id=${id} and company_id=${ctx.companyId}`;
  await tx`insert into public.trip_audit_events(company_id,trip_id,actor_id,action,metadata) values(${ctx.companyId},${id},${ctx.actorId},'PUBLICATION',${tx.typed(JSON.stringify({revision:trip.revision+1,source:projection.identity}),25)}::jsonb)`;
  return {tripId:id,revision:trip.revision+1,status:'OPEN_FOR_SALE'};
 });},
 preview(ctx:Context,id:string){resourceId(id);return repo.runAdmin(ctx,async tx=>{
  const candidate=await repo.trip(tx,ctx,id);if(candidate.status==='OPEN_FOR_SALE')return {projection:null,blockers:[] as string[]};
  const source=await lockSources(repo,tx,ctx,candidate.routeId,candidate.vehicleId,candidate.serviceClassId);const trip=await repo.trip(tx,ctx,id,true);
  if(trip.status!=='DRAFT')return {projection:null,blockers:[] as string[]};if(candidate.revision!==trip.revision)throw new DomainError('conflict','Draft berubah. Muat ulang.');
  const clock=await tx<{now:string}[]>`select clock_timestamp()::text as now`;const company=await tx`select status from public.companies where id=${ctx.companyId}`;
  try{const projection=projectSnapshot(source,input(trip),clock[0].now);return {projection,blockers:company[0]?.status==='ACTIVE'?[]:['PO disuspend; publikasi belum diizinkan.']};}catch(error){return {projection:null,blockers:[error instanceof DomainError?error.message:'Layout atau jadwal belum lengkap.']};}
 });},
 };}
