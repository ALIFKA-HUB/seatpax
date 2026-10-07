import type {Sql} from 'postgres';
import {withAdminTransaction,type Context,type DomainTx,DomainError} from '@/modules/access/transaction';
export type MasterRow={id:string;name:string;status:'ACTIVE'|'INACTIVE';city?:string;address?:string|null;code?:string};
export type RouteRow={id:string;name:string;code:string|null;status:'ACTIVE'|'INACTIVE';revision:number};
export type OrderedStop={id:string;stopId:string;name:string;sequence:number;arrivalOffsetMin:number|null;departureOffsetMin:number|null;status:'ACTIVE'|'INACTIVE'};
export function createRouteRepository(client:Sql){return {
  run<T>(ctx:Context,fn:(tx:DomainTx)=>Promise<T>){return withAdminTransaction(client,ctx,fn);},
  async listStops(tx:DomainTx,companyId:string):Promise<MasterRow[]>{return await tx<MasterRow[]>`select id,name,city,address,status from public.stops where company_id=${companyId} order by name`;},
  async listClasses(tx:DomainTx,companyId:string):Promise<MasterRow[]>{return await tx<MasterRow[]>`select id,name,code,status from public.service_classes where company_id=${companyId} order by name`;},
  async listRoutes(tx:DomainTx,companyId:string):Promise<RouteRow[]>{return await tx<RouteRow[]>`select id,name,code,status,revision from public.routes where company_id=${companyId} order by name`;},
  async route(tx:DomainTx,ctx:Context,id:string,lock=false):Promise<RouteRow>{
    const rows=await tx<RouteRow[]>`select id,name,code,status,revision from public.routes where id=${id} and company_id=${ctx.companyId} ${lock?tx`for update`:tx``}`;
    if(rows.length!==1)throw new DomainError('forbidden','Rute tidak tersedia.');return rows[0];
  },
  async orderedStops(tx:DomainTx,ctx:Context,routeId:string):Promise<OrderedStop[]>{return await tx<OrderedStop[]>`select rs.id,rs.stop_id as "stopId",s.name,rs.sequence,rs.arrival_offset_min as "arrivalOffsetMin",rs.departure_offset_min as "departureOffsetMin",s.status from public.route_stops rs join public.stops s on s.id=rs.stop_id and s.company_id=rs.company_id where rs.route_id=${routeId} and rs.company_id=${ctx.companyId} order by rs.sequence`;},
  async lockStops(tx:DomainTx,ctx:Context,ids:string[]){const sorted=[...new Set(ids)].sort();if(!sorted.length)return [];const rows=await tx<{id:string;status:string}[]>`select id,status from public.stops where company_id=${ctx.companyId} and id in ${tx(sorted)} order by id for share`;if(rows.length!==sorted.length)throw new DomainError('forbidden','Stop tidak tersedia pada PO ini.');return rows;},
};}
export type RouteRepository=ReturnType<typeof createRouteRepository>;
