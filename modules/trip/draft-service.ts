import {DomainError,type Context} from '@/modules/access/transaction';
import {resourceId,expectedCounter} from '@/modules/fleet/template-service';
import {parseTripDraft} from './validation';import {parseWibInstant} from './time';import {lockSources} from './transaction';
import type {TripRepository} from './repository';import type {TripCommandResult} from './types';
export function createDraftService(repo:TripRepository){return {
 list(ctx:Context){return repo.runAdmin(ctx,tx=>repo.list(tx,ctx));},
 detail(ctx:Context,id:string){resourceId(id);return repo.runAdmin(ctx,tx=>repo.detail(tx,ctx,id));},
 choices(ctx:Context){return repo.runAdmin(ctx,async tx=>({routes:await tx<{id:string;name:string;status:string}[]>`select id,name,status from public.routes where company_id=${ctx.companyId} order by name`,vehicles:await tx<{id:string;name:string;defaultServiceClassId:string;status:string}[]>`select id,name,default_service_class_id as "defaultServiceClassId",status from public.vehicles where company_id=${ctx.companyId} order by name`,classes:await tx<{id:string;name:string;status:string}[]>`select id,name,status from public.service_classes where company_id=${ctx.companyId} order by name`}));},
 save(ctx:Context,raw:unknown,id?:string,expectedRevision?:number):Promise<TripCommandResult>{if(id)resourceId(id);let input;try{input=parseTripDraft(raw);}catch{throw new DomainError('validation','Periksa nama, sumber perjalanan, dan tanggal/jam WIB.');}
 return repo.runAdmin(ctx,async tx=>{
  const source=await lockSources(repo,tx,ctx,input.routeId,input.vehicleId,input.serviceClassId);
  const current=id?await repo.trip(tx,ctx,id,true):null;
  if(current){expectedCounter(expectedRevision,current.revision);if(current.status!=='DRAFT')throw new DomainError('conflict','Perjalanan yang sudah dibuka tidak dapat diedit.');}
  if((!current||current.routeId!==input.routeId)&&source.route.status!=='ACTIVE'||(!current||current.vehicleId!==input.vehicleId)&&source.vehicle.status!=='ACTIVE'||(!current||current.serviceClassId!==input.serviceClassId)&&source.serviceClass.status!=='ACTIVE')throw new DomainError('validation','Pilih sumber perjalanan aktif.');
  const departure=parseWibInstant(input.departureWib),cutoff=input.salesCloseWib?parseWibInstant(input.salesCloseWib):null;
  const rows=current?await tx<{id:string;revision:number}[]>`update public.trips set name=${input.name},route_id=${input.routeId},vehicle_id=${input.vehicleId},service_class_id=${input.serviceClassId},departure_at=${departure},sales_close_at=${cutoff},revision=revision+1,updated_at=now() where id=${id!} and company_id=${ctx.companyId} returning id,revision`:await tx<{id:string;revision:number}[]>`insert into public.trips(company_id,name,route_id,vehicle_id,service_class_id,departure_at,sales_close_at) values(${ctx.companyId},${input.name},${input.routeId},${input.vehicleId},${input.serviceClassId},${departure},${cutoff}) returning id,revision`;
  return {tripId:rows[0].id,revision:rows[0].revision,status:'DRAFT'};
 });},
 };}
