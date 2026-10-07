import type {Sql} from 'postgres';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import type {TripDetail} from '@/modules/trip/types';
import type {HoldRecord,Range} from './types';

export type Snapshot=TripDetail & {companyStatus:string;companyName:string;serverNow:string;anchors:{seatId:string;sequence:number}[];holds:{seatId:string;from:number;to:number}[]};
const holdColumns='id,company_id as "companyId",trip_id as "tripId",trip_seat_id as "seatId",from_trip_stop_id as "fromStopId",to_trip_stop_id as "toStopId",from_sequence as "from",to_sequence as "to",held_by_user_id as "ownerId",request_key as "requestKey",status,created_at::text as "createdAt",base_expires_at::text as "baseExpiresAt",effective_expires_at::text as "effectiveExpiresAt",payment_initiated_at::text as "paymentInitiatedAt",released_at::text as "releasedAt",expired_at::text as "expiredAt"';
export function createInventoryRepository(client:Sql){return {
 client,
 async snapshot(tx:Sql|DomainTx,id:string):Promise<Snapshot>{
  const rows=await tx<Snapshot[]>`with clock as materialized(select clock_timestamp() as now)
   select json_build_object('id',t.id,'companyId',t.company_id,'name',t.name,'routeId',t.route_id,'vehicleId',t.vehicle_id,'serviceClassId',t.service_class_id,'departureAt',t.departure_at,'salesCloseAt',t.sales_close_at,'revision',t.revision,'status',t.status,'publishedAt',t.published_at,'identity',t.identity_snapshot) as trip,
   coalesce((select json_agg(json_build_object('id',s.id,'sourceId',s.source_id,'stopId',s.stop_id,'name',s.name,'city',s.city,'address',s.address,'sequence',s.sequence,'arrivalAt',s.arrival_at,'departureAt',s.departure_at) order by s.sequence) from public.trip_stops s where s.trip_id=t.id),'[]') as stops,
   coalesce((select json_agg(json_build_object('id',s.id,'sequence',s.sequence,'fromSequence',s.sequence,'toSequence',s.sequence+1,'price',s.price::text,'currency',s.currency) order by s.sequence) from public.trip_segments s where s.trip_id=t.id),'[]') as segments,
   coalesce((select json_agg(json_build_object('id',s.id,'seatCode',s.seat_code,'rowIndex',s.row_index,'colIndex',s.col_index,'label',s.label) order by s.row_index,s.col_index) from public.trip_seats s where s.trip_id=t.id),'[]') as seats,
   t.layout_snapshot as layout,(select count(*)::int from public.trip_seat_inventory i where i.trip_id=t.id) as "inventoryCount",c.status as "companyStatus",c.name as "companyName",clock.now::text as "serverNow",
   coalesce((select json_agg(json_build_object('seatId',i.trip_seat_id,'sequence',s.sequence)) from public.trip_seat_inventory i join public.trip_segments s on s.id=i.trip_segment_id where i.trip_id=t.id),'[]') as anchors,
   coalesce((select json_agg(json_build_object('seatId',h.trip_seat_id,'from',h.from_sequence,'to',h.to_sequence)) from public.seat_holds h where h.trip_id=t.id and h.status='ACTIVE' and h.effective_expires_at>clock.now),'[]') as holds
   from public.trips t join public.companies c on c.id=t.company_id cross join clock where t.id=${id} and t.status='OPEN_FOR_SALE'`;
  if(rows.length!==1)throw new DomainError('unavailable','Perjalanan tidak tersedia.');return rows[0];
 },
 async locations(){return await client<{id:string;name:string;city:string}[]>`select distinct on(s.stop_id) s.stop_id as id,s.name,s.city from public.trip_stops s join public.trips t on t.id=s.trip_id where t.status='OPEN_FOR_SALE' order by s.stop_id,t.departure_at desc,t.id`;},
 async candidates(from:string,to:string,start:string,end:string){return await client<{tripId:string;fromStopId:string;toStopId:string}[]>`select t.id as "tripId",a.id as "fromStopId",b.id as "toStopId" from public.trips t join public.companies c on c.id=t.company_id join public.trip_stops a on a.trip_id=t.id join public.trip_stops b on b.trip_id=t.id where t.status='OPEN_FOR_SALE' and c.status='ACTIVE' and a.stop_id=${from} and b.stop_id=${to} and a.sequence<b.sequence and a.departure_at>=${start}::timestamptz and a.departure_at<${end}::timestamptz and clock_timestamp()<least(a.departure_at,coalesce(t.sales_close_at,a.departure_at)) order by a.departure_at,t.id`;},
 async own(tx:Sql|DomainTx,owner:string,id:string,lock=false):Promise<HoldRecord|null>{const rows=await tx<HoldRecord[]>`select ${tx.unsafe(holdColumns)} from public.seat_holds where held_by_user_id=${owner} and id=${id} ${lock?tx`for update`:tx``}`;return rows[0]??null;},
 async byKey(tx:Sql|DomainTx,owner:string,key:string):Promise<HoldRecord|null>{const rows=await tx<HoldRecord[]>`select ${tx.unsafe(holdColumns)} from public.seat_holds where held_by_user_id=${owner} and request_key=${key}`;return rows[0]??null;},
 async guards(tx:DomainTx,tripId:string){
  const identity=await tx`select company_id from public.trips where id=${tripId}`;if(identity.length!==1)throw new DomainError('unavailable','Perjalanan tidak tersedia.');
  await tx`select id from public.companies where id=${identity[0].company_id} for share`;
  await tx`select id from public.trips where id=${tripId} for share`;
 },
 async anchors(tx:DomainTx,tripId:string,seatId:string,range:Range){const rows=await tx`select i.id from public.trip_seat_inventory i join public.trip_segments s on s.id=i.trip_segment_id where i.trip_id=${tripId} and i.trip_seat_id=${seatId} and s.sequence>=${range.from} and s.sequence<${range.to} order by i.trip_id,i.trip_seat_id,s.sequence for update of i`;if(rows.length!==range.to-range.from)throw new DomainError('unavailable','Inventori kursi tidak lengkap.');},
 async now(tx:Sql|DomainTx){const rows=await tx<{now:string}[]>`select clock_timestamp()::text as now`;return rows[0].now;},
 async audit(tx:DomainTx,h:HoldRecord,action:'HOLD_CREATED'|'HOLD_RELEASED'|'HOLD_EXPIRED',actor:string|null,now:string){await tx`insert into public.seat_hold_audit_events(company_id,trip_id,hold_id,actor_id,action,metadata,created_at) values(${h.companyId},${h.tripId},${h.id},${actor},${action},${tx.typed(JSON.stringify({seatId:h.seatId,from:h.from,to:h.to}),25)}::jsonb,${now}::timestamptz)`;},
 };}
export type InventoryRepository=ReturnType<typeof createInventoryRepository>;
