import type {Sql} from 'postgres';
import {withAdminTransaction,DomainError,type Context,type DomainTx} from '@/modules/access/transaction';
import type {TripRecord,TripDetail,PublicationSource} from './types';
export function createTripRepository(client:Sql){return {
 client,
 runAdmin<T>(ctx:Context,work:(tx:DomainTx)=>Promise<T>){return withAdminTransaction(client,ctx,work);},
 async trip(tx:DomainTx,ctx:Context,id:string,lock=false):Promise<TripRecord>{
  const rows=await tx<TripRecord[]>`select id,company_id as "companyId",name,route_id as "routeId",vehicle_id as "vehicleId",service_class_id as "serviceClassId",departure_at::text as "departureAt",sales_close_at::text as "salesCloseAt",revision,status,published_at::text as "publishedAt",identity_snapshot as identity from public.trips where id=${id} and company_id=${ctx.companyId} ${lock?tx`for update`:tx``}`;
  if(rows.length!==1)throw new DomainError('forbidden','Perjalanan tidak tersedia.');return rows[0];
 },
 async list(tx:DomainTx,ctx:Context):Promise<TripRecord[]>{return await tx<TripRecord[]>`select id,company_id as "companyId",name,route_id as "routeId",vehicle_id as "vehicleId",service_class_id as "serviceClassId",departure_at::text as "departureAt",sales_close_at::text as "salesCloseAt",revision,status,published_at::text as "publishedAt",identity_snapshot as identity from public.trips where company_id=${ctx.companyId} order by departure_at desc`;},
 async detail(tx:DomainTx,ctx:Context,id:string):Promise<TripDetail>{
  const rows=await tx<TripDetail[]>`select json_build_object('id',t.id,'companyId',t.company_id,'name',t.name,'routeId',t.route_id,'vehicleId',t.vehicle_id,'serviceClassId',t.service_class_id,'departureAt',t.departure_at,'salesCloseAt',t.sales_close_at,'revision',t.revision,'status',t.status,'publishedAt',t.published_at,'identity',t.identity_snapshot) as trip,
   coalesce((select json_agg(json_build_object('id',s.id,'sourceId',s.source_id,'stopId',s.stop_id,'name',s.name,'city',s.city,'address',s.address,'sequence',s.sequence,'arrivalAt',s.arrival_at,'departureAt',s.departure_at) order by s.sequence) from public.trip_stops s where s.trip_id=t.id and s.company_id=t.company_id),'[]') as stops,
   coalesce((select json_agg(json_build_object('id',s.id,'sequence',s.sequence,'fromSequence',s.sequence,'toSequence',s.sequence+1,'price',s.price::text,'currency',s.currency) order by s.sequence) from public.trip_segments s where s.trip_id=t.id and s.company_id=t.company_id),'[]') as segments,
   coalesce((select json_agg(json_build_object('id',s.id,'seatCode',s.seat_code,'rowIndex',s.row_index,'colIndex',s.col_index,'label',s.label) order by s.row_index,s.col_index) from public.trip_seats s where s.trip_id=t.id and s.company_id=t.company_id),'[]') as seats,
   t.layout_snapshot as layout,(select count(*)::int from public.trip_seat_inventory i where i.trip_id=t.id and i.company_id=t.company_id) as "inventoryCount"
   from public.trips t where t.id=${id} and t.company_id=${ctx.companyId}`;
  if(rows.length!==1)throw new DomainError('forbidden','Perjalanan tidak tersedia.');return rows[0];
 },
 async sources(tx:DomainTx,ctx:Context,routeId:string,vehicleId:string,classId:string):Promise<PublicationSource>{
  const routes=await tx<PublicationSource['route'][]>`select id,name,code,revision,status from public.routes where id=${routeId} and company_id=${ctx.companyId}`;
  const vehicles=await tx<(PublicationSource['vehicle']&{seatTemplateId:string})[]>`select id,name,plate_number as "plateNumber",revision,status,seat_template_id as "seatTemplateId" from public.vehicles where id=${vehicleId} and company_id=${ctx.companyId}`;
  const classes=await tx<PublicationSource['serviceClass'][]>`select id,name,code,status from public.service_classes where id=${classId} and company_id=${ctx.companyId}`;
  if(routes.length!==1||vehicles.length!==1||classes.length!==1)throw new DomainError('forbidden','Sumber perjalanan tidak tersedia pada PO ini.');
  const templates=await tx<(PublicationSource['template']&{rows:number;cols:number})[]>`select id,version,status,rows,cols from public.seat_templates where id=${vehicles[0].seatTemplateId} and company_id=${ctx.companyId}`;
  if(templates.length!==1)throw new DomainError('forbidden','Layout tidak tersedia.');
  const stops=await tx<PublicationSource['stops']>`select rs.id as "sourceId",s.id as "stopId",s.name,s.city,s.address,rs.sequence,rs.arrival_offset_min as "arrivalOffsetMin",rs.departure_offset_min as "departureOffsetMin",s.status from public.route_stops rs join public.stops s on s.id=rs.stop_id and s.company_id=rs.company_id where rs.route_id=${routeId} and rs.company_id=${ctx.companyId} order by rs.sequence`;
  const fares=await tx<PublicationSource['fares']>`select from_route_stop_id as "fromSourceId",to_route_stop_id as "toSourceId",price::text as price,currency from public.segment_fares where route_id=${routeId} and service_class_id=${classId} and company_id=${ctx.companyId}`;
  const cells=await tx<PublicationSource['layout']['cells']>`select row_index as "rowIndex",col_index as "colIndex",type,label,seat_code as "seatCode" from public.seat_template_cells where seat_template_id=${templates[0].id} and company_id=${ctx.companyId} order by row_index,col_index`;
  return {route:routes[0],vehicle:vehicles[0],serviceClass:classes[0],template:templates[0],stops,fares,layout:{rows:templates[0].rows,cols:templates[0].cols,cells}};
 },
 };}
export type TripRepository=ReturnType<typeof createTripRepository>;
