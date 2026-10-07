import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {type Context,DomainError} from '@/modules/access/transaction';
import {parseRoute,parseStop,parseClass} from './validation';
import type {RouteRepository} from './repository';
const id=(v:unknown)=>z.uuid().parse(v);
const revision=(v:unknown)=>z.number().int().positive().parse(v);
export function createRouteService(repo:RouteRepository){return {
  async list(ctx:Context){return repo.run(ctx,async tx=>({routes:await repo.listRoutes(tx,ctx.companyId),stops:await repo.listStops(tx,ctx.companyId),classes:await repo.listClasses(tx,ctx.companyId)}));},
  async detail(ctx:Context,routeId:string){id(routeId);return repo.run(ctx,async tx=>({route:await repo.route(tx,ctx,routeId),stops:await repo.orderedStops(tx,ctx,routeId),choices:await repo.listStops(tx,ctx.companyId),classes:await repo.listClasses(tx,ctx.companyId)}));},
  async saveStop(ctx:Context,input:unknown,stopId?:string){const v=parseStop(input);if(stopId)id(stopId);return repo.run(ctx,async tx=>{
    if(stopId){const rows=await tx`update public.stops set name=${v.name},city=${v.city},address=${v.address},status=${v.status},updated_at=now() where id=${stopId} and company_id=${ctx.companyId} returning id`;if(!rows.length)throw new DomainError('forbidden','Stop tidak tersedia.');return rows[0].id as string;}
    const rows=await tx`insert into public.stops(company_id,name,city,address,status) values(${ctx.companyId},${v.name},${v.city},${v.address},${v.status}) returning id`;return rows[0].id as string;
  });},
  async saveClass(ctx:Context,input:unknown,classId?:string){const v=parseClass(input);if(classId)id(classId);return repo.run(ctx,async tx=>{
    const duplicate=await tx`select id from public.service_classes where company_id=${ctx.companyId} and code=${v.code} and (${classId??null}::uuid is null or id<>${classId??null}::uuid)`;if(duplicate.length)throw new DomainError('validation','Kode kelas sudah dipakai.');
    if(classId){const rows=await tx`update public.service_classes set name=${v.name},code=${v.code},status=${v.status},updated_at=now() where id=${classId} and company_id=${ctx.companyId} returning id`;if(!rows.length)throw new DomainError('forbidden','Kelas tidak tersedia.');return rows[0].id as string;}
    const rows=await tx`insert into public.service_classes(company_id,name,code,status) values(${ctx.companyId},${v.name},${v.code},${v.status}) returning id`;return rows[0].id as string;
  });},
  async saveRoute(ctx:Context,input:unknown,routeId?:string,expectedRevision?:number){const v=parseRoute(input);if(routeId){id(routeId);revision(expectedRevision);}return repo.run(ctx,async tx=>{
    const old=routeId?await repo.orderedStops(tx,ctx,routeId):[];
    const locked=await repo.lockStops(tx,ctx,[...v.stops.map(s=>s.stopId),...old.map(s=>s.stopId)]);
    if(locked.some(s=>s.status!=='ACTIVE'&&v.stops.some(n=>n.stopId===s.id)&&!old.some(o=>o.stopId===s.id)))throw new DomainError('validation','Pilih stop yang aktif.');
    const rid=routeId??randomUUID();const current=routeId?await repo.route(tx,ctx,routeId,true):null;
    if(current&&current.revision!==expectedRevision)throw new DomainError('conflict','Rute sudah berubah. Muat data terbaru sebelum menyimpan.');
    const structure=old.map(s=>s.stopId).join(',')!==v.stops.map(s=>s.stopId).join(',');
    if(structure&&routeId){const fares=await tx`select id from public.segment_fares where route_id=${rid} limit 1`;if(fares.length)throw new DomainError('conflict','Hapus tarif semua kelas sebelum mengubah urutan stop.');}
    if(current)await tx`update public.routes set name=${v.name},code=${v.code},revision=revision+1,updated_at=now() where id=${rid}`;
    else await tx`insert into public.routes(id,company_id,name,code) values(${rid},${ctx.companyId},${v.name},${v.code})`;
    if(structure){await tx`delete from public.route_stops where route_id=${rid}`;for(const [i,s] of v.stops.entries())await tx`insert into public.route_stops(company_id,route_id,stop_id,sequence,arrival_offset_min,departure_offset_min) values(${ctx.companyId},${rid},${s.stopId},${i+1},${s.arrivalOffsetMin},${s.departureOffsetMin})`;}
    else for(const [i,s] of v.stops.entries())await tx`update public.route_stops set arrival_offset_min=${s.arrivalOffsetMin},departure_offset_min=${s.departureOffsetMin} where route_id=${rid} and sequence=${i+1}`;
    return {routeId:rid,revision:current?current.revision+1:1};
  });},
  async setRouteStatus(ctx:Context,routeId:string,expectedRevision:number,status:'ACTIVE'|'INACTIVE'){id(routeId);revision(expectedRevision);z.enum(['ACTIVE','INACTIVE']).parse(status);return repo.run(ctx,async tx=>{const route=await repo.route(tx,ctx,routeId,true);if(route.revision!==expectedRevision)throw new DomainError('conflict','Rute sudah berubah. Muat ulang.');await tx`update public.routes set status=${status},revision=revision+1,updated_at=now() where id=${routeId}`;return {routeId,revision:route.revision+1};});},
};}
