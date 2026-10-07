import {beforeAll,afterAll,it,expect} from 'vitest';
import postgres,{type Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {config} from 'dotenv';
import {parseMigrationEnvironment} from '@/lib/env/migration';
import {createRouteRepository} from '@/modules/route/repository';
import {createRouteService} from '@/modules/route/service';
import {createPricingService} from '@/modules/pricing/service';
import {withAdminTransaction,type Context} from '@/modules/access/transaction';
config({path:'.env.local',quiet:true});
let client:Sql;
beforeAll(async()=>{client=postgres(parseMigrationEnvironment(process.env).url,{ssl:{rejectUnauthorized:true},prepare:false,max:5,connect_timeout:5});await client`select 1`;});
afterAll(async()=>{if(client)await client.end({timeout:5});});
async function fixture(run:(f:{a:Context;b:Context;route:ReturnType<typeof createRouteService>;pricing:ReturnType<typeof createPricingService>})=>Promise<void>){
  const a={actorId:randomUUID(),companyId:randomUUID()},b={actorId:randomUUID(),companyId:randomUUID()};
  try{
    await client.begin(async tx=>{for(const c of [a,b]){await tx`insert into auth.users(id) values(${c.actorId})`;await tx`insert into public.users(id) values(${c.actorId})`;await tx`insert into public.companies(id,name,slug) values(${c.companyId},'Fixture',${'fixture-'+c.companyId})`;await tx`insert into public.memberships(user_id,company_id,role) values(${c.actorId},${c.companyId},'ADMIN_PO')`;}});
    const repo=createRouteRepository(client);await run({a,b,route:createRouteService(repo),pricing:createPricingService(repo)});
  }finally{await client.begin(async tx=>{const ids=[a.companyId,b.companyId];await tx`delete from public.segment_fares where company_id in ${tx(ids)}`;await tx`delete from public.route_stops where company_id in ${tx(ids)}`;await tx`delete from public.routes where company_id in ${tx(ids)}`;await tx`delete from public.stops where company_id in ${tx(ids)}`;await tx`delete from public.service_classes where company_id in ${tx(ids)}`;await tx`delete from public.memberships where company_id in ${tx(ids)}`;await tx`delete from public.users where id in ${tx([a.actorId,b.actorId])}`;await tx`delete from auth.users where id in ${tx([a.actorId,b.actorId])}`;await tx`delete from public.companies where id in ${tx(ids)}`;});}
}
const stopInput=(name:string)=>({name,city:'City',address:null,status:'ACTIVE'});
it('creates four-stop route and exact bigint quote, rejects cross tenant and stale edits',async()=>fixture(async({a,b,route,pricing})=>{
  const ids=[];for(const name of ['A','B','C','D'])ids.push(await route.saveStop(a,stopInput(name)));
  const classId=await route.saveClass(a,{name:'Executive',code:'executive',status:'ACTIVE'});
  const input={name:'A to D',code:null,stops:ids.map((stopId,i)=>({stopId,arrivalOffsetMin:i*60,departureOffsetMin:i*60}))};
  const created=await route.saveRoute(a,input);
  await expect(route.detail(b,created.routeId)).rejects.toMatchObject({code:'forbidden'});
  await expect(route.saveRoute(b,input,created.routeId,1)).rejects.toMatchObject({code:'forbidden'});
  const saved=await pricing.save(a,{routeId:created.routeId,serviceClassId:classId,expectedRevision:1,prices:['9007199254740993','0','2']});
  const detail=await route.detail(a,created.routeId);
  expect((await pricing.preview(a,{routeId:created.routeId,serviceClassId:classId,fromRouteStopId:detail.stops[0].id,toRouteStopId:detail.stops[3].id})).total).toBe('9007199254740995');
  for(const [from,to] of [[0,0],[3,0]]) await expect(pricing.preview(a,{routeId:created.routeId,serviceClassId:classId,fromRouteStopId:detail.stops[from].id,toRouteStopId:detail.stops[to].id})).rejects.toMatchObject({code:'validation'});
  await expect(pricing.preview(b,{routeId:created.routeId,serviceClassId:classId,fromRouteStopId:detail.stops[0].id,toRouteStopId:detail.stops[3].id})).rejects.toMatchObject({code:'forbidden'});
  await expect(route.saveRoute(a,{...input,stops:[...input.stops].reverse().map((s,i)=>({...s,arrivalOffsetMin:i*60,departureOffsetMin:i*60}))},created.routeId,saved.revision)).rejects.toMatchObject({code:'conflict'});
  await expect(route.saveRoute(a,{...input,name:'stale'},created.routeId,1)).rejects.toMatchObject({code:'conflict'});
  const deleted=await pricing.save(a,{routeId:created.routeId,serviceClassId:classId,expectedRevision:saved.revision,prices:[]},true);
  await expect(pricing.preview(a,{routeId:created.routeId,serviceClassId:classId,fromRouteStopId:detail.stops[0].id,toRouteStopId:detail.stops[3].id})).rejects.toMatchObject({code:'validation'});
  const reordered={...input,stops:[...input.stops].reverse().map((s,i)=>({...s,arrivalOffsetMin:i*60,departureOffsetMin:i*60}))};
  expect((await route.saveRoute(a,reordered,created.routeId,deleted.revision)).revision).toBe(deleted.revision+1);
}));
it('inactive endpoints/classes block quote and invalid fare writes rollback',async()=>fixture(async({a,route,pricing})=>{
  const sid=await route.saveStop(a,stopInput('A')),tid=await route.saveStop(a,stopInput('B'));
  const classId=await route.saveClass(a,{name:'Executive',code:'executive',status:'ACTIVE'});
  const created=await route.saveRoute(a,{name:'Route',code:null,stops:[sid,tid].map(stopId=>({stopId,arrivalOffsetMin:null,departureOffsetMin:null}))});
  await expect(pricing.save(a,{routeId:created.routeId,serviceClassId:classId,expectedRevision:1,prices:['1.5']})).rejects.toMatchObject({code:'validation'});
  expect((await route.detail(a,created.routeId)).route.revision).toBe(1);
  await pricing.save(a,{routeId:created.routeId,serviceClassId:classId,expectedRevision:1,prices:['0']});
  const detail=await route.detail(a,created.routeId);const input={routeId:created.routeId,serviceClassId:classId,fromRouteStopId:detail.stops[0].id,toRouteStopId:detail.stops[1].id};
  expect((await pricing.preview(a,input)).total).toBe('0');
  await route.saveStop(a,{...stopInput('A'),status:'INACTIVE'},sid);
  await expect(pricing.preview(a,input)).rejects.toMatchObject({code:'validation'});
  await route.saveStop(a,stopInput('A'),sid);
  await route.saveClass(a,{name:'Executive',code:'executive',status:'INACTIVE'},classId);
  await expect(pricing.preview(a,input)).rejects.toMatchObject({code:'validation'});
}));
it('same revision concurrent writers have exactly one winner',async()=>fixture(async({a,route})=>{
  const ids=[await route.saveStop(a,stopInput('A')),await route.saveStop(a,stopInput('B'))];
  const input={name:'Route',code:null,stops:ids.map(stopId=>({stopId,arrivalOffsetMin:null,departureOffsetMin:null}))};
  const created=await route.saveRoute(a,input);
  const outcomes=await Promise.allSettled([route.saveRoute(a,{...input,name:'one'},created.routeId,1),route.saveRoute(a,{...input,name:'two'},created.routeId,1)]);
  expect(outcomes.filter(o=>o.status==='fulfilled')).toHaveLength(1);
  expect(outcomes.filter(o=>o.status==='rejected')).toHaveLength(1);
  expect((await route.detail(a,created.routeId)).route.revision).toBe(2);
}));
it('membership share guard serializes revoke and subsequent operation denies',async()=>fixture(async({a,route})=>{
  let release!:()=>void,started!:()=>void;
  const ready=new Promise<void>(r=>{started=r;}),barrier=new Promise<void>(r=>{release=r;});
  const guarded=withAdminTransaction(client,a,async()=>{started();await barrier;});
  await ready;let revoked=false;
  const revoke=client`update public.memberships set status='DISABLED' where user_id=${a.actorId}`.then(()=>{revoked=true;});
  try{await new Promise(r=>setTimeout(r,100));expect(revoked).toBe(false);}finally{release();}
  await guarded;await revoke;
  await expect(route.saveStop(a,stopInput('denied'))).rejects.toMatchObject({code:'forbidden'});
}));
it('cross tenant composite FK and browser privileges reject direct access',async()=>fixture(async({a,b,route})=>{
  const sid=await route.saveStop(a,stopInput('A'));const rid=randomUUID();
  await client`insert into public.routes(id,company_id,name) values(${rid},${b.companyId},'B')`;
  await expect(client`insert into public.route_stops(company_id,route_id,stop_id,sequence) values(${b.companyId},${rid},${sid},1)`).rejects.toMatchObject({code:'23503'});
  for(const role of ['anon','authenticated'])for(const table of ['stops','routes','route_stops','service_classes','segment_fares']){
    for(const privilege of ['SELECT','INSERT','UPDATE','DELETE']) expect((await client`select has_table_privilege(${role},${'public.'+table},${privilege}) as allowed`)[0].allowed).toBe(false);
    await expect(client.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${role}`);await tx.unsafe(`SELECT * FROM public.${table}`);})).rejects.toMatchObject({code:'42501'});
  }
}));
