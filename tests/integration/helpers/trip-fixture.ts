import postgres, {type Sql} from 'postgres';
import { randomUUID } from 'node:crypto';
import {config} from 'dotenv';
import {parseMigrationEnvironment} from '@/lib/env/migration';
import {toWibInput} from '@/modules/trip/time';
config({path:'.env.local',quiet:true});
export const tripClient=()=>postgres(parseMigrationEnvironment(process.env).url,{ssl:{rejectUnauthorized:true},prepare:false,max:8,connect_timeout:5});
export async function tripFixture(client:Sql,run:(f:Awaited<ReturnType<typeof seed>>)=>Promise<void>){const f=await seed(client);try{await run(f);}finally{await client.begin(async tx=>{
 const companies=[f.a.companyId,f.b.companyId];
 for(const table of ['trip_audit_events','trip_crew_assignments','trip_seat_inventory','trip_segments','trip_seats','trip_stops','trips','vehicles','seat_template_cells','seat_templates','segment_fares','route_stops','routes','service_classes','stops','memberships'])await tx`delete from public.${tx(table)} where company_id in ${tx(companies)}`;
 await tx`delete from public.users where id in ${tx(f.users)}`;await tx`delete from auth.users where id in ${tx(f.users)}`;await tx`delete from public.companies where id in ${tx(companies)}`;
});}}
async function seed(client:Sql){
 const a={actorId:randomUUID(),companyId:randomUUID()},b={actorId:randomUUID(),companyId:randomUUID()},crewId=randomUUID();const users=[a.actorId,b.actorId,crewId];
 const routeId=randomUUID(),vehicleId=randomUUID(),templateId=randomUUID(),classId=randomUUID(),crewMembershipId=randomUUID();
 await client.begin(async tx=>{
  for(const id of users){await tx`insert into auth.users(id) values(${id})`;await tx`insert into public.users(id,name) values(${id},'Trip fixture user')`;}
  for(const ctx of [a,b]){await tx`insert into public.companies(id,name,slug) values(${ctx.companyId},'Trip fixture',${'trip-'+ctx.companyId})`;await tx`insert into public.memberships(user_id,company_id,role) values(${ctx.actorId},${ctx.companyId},'ADMIN_PO')`;}
  await tx`insert into public.memberships(id,user_id,company_id,role) values(${crewMembershipId},${crewId},${a.companyId},'CREW')`;
  await tx`insert into public.service_classes(id,company_id,name,code) values(${classId},${a.companyId},'VIP','vip')`;
  await tx`insert into public.routes(id,company_id,name) values(${routeId},${a.companyId},'Four stops')`;
  const endpoints=[];for(let i=0;i<4;i++){const stopId=randomUUID(),rs=randomUUID();endpoints.push(rs);await tx`insert into public.stops(id,company_id,name,city) values(${stopId},${a.companyId},${'Stop '+i},'City')`;await tx`insert into public.route_stops(id,company_id,route_id,stop_id,sequence,arrival_offset_min,departure_offset_min) values(${rs},${a.companyId},${routeId},${stopId},${i+1},${i*60},${i*60})`;}
  for(let i=0;i<3;i++)await tx`insert into public.segment_fares(company_id,route_id,from_route_stop_id,to_route_stop_id,service_class_id,price) values(${a.companyId},${routeId},${endpoints[i]},${endpoints[i+1]},${classId},${i?10000:0})`;
  await tx`insert into public.seat_templates(id,company_id,name,rows,cols) values(${templateId},${a.companyId},'Two seats',1,2)`;
  for(let i=0;i<2;i++)await tx`insert into public.seat_template_cells(company_id,seat_template_id,row_index,col_index,type,seat_code) values(${a.companyId},${templateId},0,${i},'SEAT',${'0'+(i+1)})`;
  await tx`insert into public.vehicles(id,company_id,name,plate_number,seat_template_id,default_service_class_id) values(${vehicleId},${a.companyId},'Bus','TRIP 1',${templateId},${classId})`;
 });
 return {a,b,crewId,crewMembershipId,users,routeId,vehicleId,templateId,classId,input:{name:'Tomorrow trip',routeId,vehicleId,serviceClassId:classId,departureWib:toWibInput(new Date(Date.now()+86400000).toISOString()),salesCloseWib:null}};
}
