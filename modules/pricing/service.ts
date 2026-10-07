import {z} from 'zod';
import {DomainError,type Context} from '@/modules/access/transaction';
import type {RouteRepository} from '@/modules/route/repository';
import {parsePrice,sumPrices} from './validation';
export function createPricingService(repo:RouteRepository){
  async function locked(tx:Parameters<RouteRepository['route']>[0],ctx:Context,routeId:string,classId:string){
    const before=await repo.route(tx,ctx,routeId);const stops=await repo.orderedStops(tx,ctx,routeId);
    const stopRows=await repo.lockStops(tx,ctx,stops.map(s=>s.stopId));
    const classes=await tx`select id,status from public.service_classes where id=${classId} and company_id=${ctx.companyId} for share`;
    if(classes.length!==1)throw new DomainError('forbidden','Kelas tidak tersedia.');
    const route=await repo.route(tx,ctx,routeId,true);
    if(route.revision!==before.revision)throw new DomainError('conflict','Rute sudah berubah. Muat ulang.');
    return {route,stops:stops.map(s=>({...s,status:stopRows.find(r=>r.id===s.stopId)?.status as 'ACTIVE'|'INACTIVE'})),eligible:route.status==='ACTIVE'&&classes[0].status==='ACTIVE'};
  }
  return {
    async list(ctx:Context,routeId:string,classId:string){z.uuid().parse(routeId);z.uuid().parse(classId);return repo.run(ctx,async tx=>{await repo.route(tx,ctx,routeId);return await tx<{fromId:string;toId:string;price:string}[]>`select from_route_stop_id as "fromId",to_route_stop_id as "toId",price::text as price from public.segment_fares where route_id=${routeId} and company_id=${ctx.companyId} and service_class_id=${classId}`;});},
    async save(ctx:Context,input:{routeId:string;serviceClassId:string;expectedRevision:number;prices:string[]},remove=false){
      z.uuid().parse(input.routeId);z.uuid().parse(input.serviceClassId);z.number().int().positive().parse(input.expectedRevision);
      const values=remove?[]:z.array(z.string()).min(1).max(49).parse(input.prices).map(parsePrice);
      return repo.run(ctx,async tx=>{const {route,stops,eligible}=await locked(tx,ctx,input.routeId,input.serviceClassId);
        if(route.revision!==input.expectedRevision)throw new DomainError('conflict','Tarif/rute sudah berubah. Muat ulang.');
        if(!remove&&(!eligible||stops.some(s=>s.status!=='ACTIVE')||values.length!==stops.length-1))throw new DomainError('validation','Lengkapi tarif untuk semua segmen rute aktif.');
        await tx`delete from public.segment_fares where route_id=${route.id} and service_class_id=${input.serviceClassId}`;
        for(const [i,price] of values.entries())await tx`insert into public.segment_fares(company_id,route_id,from_route_stop_id,to_route_stop_id,service_class_id,price) values(${ctx.companyId},${route.id},${stops[i].id},${stops[i+1].id},${input.serviceClassId},${price.toString()})`;
        await tx`update public.routes set revision=revision+1,updated_at=now() where id=${route.id}`;
        return {routeId:route.id,revision:route.revision+1};
      });
    },
    async preview(ctx:Context,input:{routeId:string;serviceClassId:string;fromRouteStopId:string;toRouteStopId:string}){
      for(const value of Object.values(input))z.uuid().parse(value);
      return repo.run(ctx,async tx=>{const {stops,eligible}=await locked(tx,ctx,input.routeId,input.serviceClassId);
        const from=stops.findIndex(s=>s.id===input.fromRouteStopId),to=stops.findIndex(s=>s.id===input.toRouteStopId);
        if(!eligible||from<0||to<=from||stops[from].status!=='ACTIVE'||stops[to].status!=='ACTIVE')throw new DomainError('validation','Pilih kelas dan asal/tujuan aktif dalam urutan rute.');
        const fares=await tx<{fromId:string;toId:string;price:string}[]>`select from_route_stop_id as "fromId",to_route_stop_id as "toId",price::text as price from public.segment_fares where route_id=${input.routeId} and service_class_id=${input.serviceClassId} and company_id=${ctx.companyId}`;
        const segments=[];for(let i=from;i<to;i++){const fare=fares.find(f=>f.fromId===stops[i].id&&f.toId===stops[i+1].id);if(!fare)throw new DomainError('validation','Tarif segmen belum lengkap.');segments.push(fare);}
        return {currency:'IDR' as const,total:sumPrices(segments.map(s=>s.price)),segments};
      });
    },
  };
}
