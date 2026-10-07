import {DomainError,type Context,type DomainTx} from '@/modules/access/transaction';
import type {TripRepository} from './repository';
export async function lockSources(repo:TripRepository,tx:DomainTx,ctx:Context,routeId:string,vehicleId:string,classId:string){
 const before=await repo.sources(tx,ctx,routeId,vehicleId,classId);
 const stopIds=[...new Set(before.stops.map(s=>s.stopId))].sort();
 if(stopIds.length)await tx`select id from public.stops where company_id=${ctx.companyId} and id in ${tx(stopIds)} order by id for share`;
 await tx`select id from public.seat_templates where id=${before.template.id} and company_id=${ctx.companyId} for share`;
 await tx`select id from public.service_classes where id=${classId} and company_id=${ctx.companyId} for share`;
 await tx`select id from public.vehicles where id=${vehicleId} and company_id=${ctx.companyId} for share`;
 await tx`select id from public.routes where id=${routeId} and company_id=${ctx.companyId} for share`;
 const after=await repo.sources(tx,ctx,routeId,vehicleId,classId);
 if(before.route.revision!==after.route.revision||before.vehicle.revision!==after.vehicle.revision||before.template.id!==after.template.id||before.stops.map(s=>s.sourceId).join(',')!==after.stops.map(s=>s.sourceId).join(','))throw new DomainError('conflict','Sumber perjalanan berubah. Muat ulang.');
 return after;
}
