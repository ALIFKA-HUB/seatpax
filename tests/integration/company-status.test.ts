import {it,expect,beforeAll,afterAll} from 'vitest';
import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryClient} from './helpers/inventory-fixture';
import {companyFixture} from './helpers/company-fixture';
import {createCompanyRepository} from '@/modules/company/repository';
import {createCompanyService} from '@/modules/company/service';
let c:Sql;beforeAll(()=>{c=inventoryClient();});afterAll(()=>c.end({timeout:5}));
function gate(){let enter!:()=>void,release!:()=>void;return {locked:new Promise<void>(r=>{enter=r;}),wait:new Promise<void>(r=>{release=r;}),enter:()=>enter(),release:()=>release()};}
it('serializes status control and membership disable in both orders',async()=>companyFixture(c,async f=>{
 const input={companyId:f.a.companyId,target:'SUSPENDED',expectedStatusRevision:0};
 const g=gate(),repo=createCompanyRepository(c),auth=repo.authorize;repo.authorize=async(...args)=>{const result=await auth(...args);g.enter();await g.wait;return result;};
 const changing=createCompanyService(repo).changeStatus(f.superUserId,input);await g.locked;
 let disabled=false;const disabling=c`update public.memberships set status='DISABLED' where id=${f.superMembershipId}`.then(()=>{disabled=true;});
 try{await c`select 1`;expect(disabled).toBe(false);}finally{g.release();}await changing;await disabling;
 await expect(createCompanyService(createCompanyRepository(c)).changeStatus(f.superUserId,{...input,expectedStatusRevision:1})).rejects.toMatchObject({code:'forbidden'});
 await c`update public.memberships set status='ACTIVE' where id=${f.superMembershipId}`;
 const reverse=gate();const writer=c.begin(async tx=>{await tx`update public.memberships set status='DISABLED' where id=${f.superMembershipId}`;reverse.enter();await reverse.wait;});await reverse.locked;
 let finished=false;const queued=createCompanyService(createCompanyRepository(c)).changeStatus(f.superUserId,{...input,target:'ACTIVE',expectedStatusRevision:1}).then(value=>{finished=true;return {value};},error=>{finished=true;return {error};});
 try{await c`select 1`;expect(finished).toBe(false);}finally{reverse.release();}await writer;expect(await queued).toMatchObject({error:{code:'forbidden'}});
 expect(await c`select id from public.company_status_events where company_id=${f.a.companyId}`).toHaveLength(1);
}),180000);
it('authorizes fresh global access and returns only ordered company summaries',async()=>companyFixture(c,async f=>{
 const service=createCompanyService(createCompanyRepository(c));
 const rows=await service.list(f.superUserId);
 expect(rows.find(r=>r.id===f.a.companyId)).toMatchObject({status:'ACTIVE',statusRevision:0});
 for(const r of rows)expect(Object.keys(r).sort()).toEqual(['id','name','slug','status','statusRevision','updatedAt']);
 const sorted=await c`select id from public.companies order by name,id`;expect(rows.map(r=>r.id)).toEqual(sorted.map(r=>r.id));
 const input={companyId:f.a.companyId,target:'SUSPENDED',expectedStatusRevision:0};
 for(const id of [f.a.actorId,f.crewId,randomUUID(),'bad']){
  await expect(service.list(id)).rejects.toMatchObject({code:'forbidden'});
  await expect(service.changeStatus(id,input)).rejects.toMatchObject({code:'forbidden'});
 }
 await c`update public.memberships set status='DISABLED' where id=${f.superMembershipId}`;
 await expect(service.list(f.superUserId)).rejects.toMatchObject({code:'forbidden'});
 await expect(service.changeStatus(f.superUserId,{...input,target:'ACTIVE'})).rejects.toMatchObject({code:'forbidden'});
}),180000);
it('increments and audits atomically, preserves no-op, rejects stale ABA and concurrent writes',async()=>companyFixture(c,async f=>{
 const service=createCompanyService(createCompanyRepository(c)),companyId=f.a.companyId;
 const original=(await service.list(f.superUserId)).find(r=>r.id===companyId)!;
 expect(await service.changeStatus(f.superUserId,{companyId,target:'ACTIVE',expectedStatusRevision:0})).toEqual({company:original,changed:false});
 expect(await c`select id from public.company_status_events where company_id=${companyId}`).toHaveLength(0);
 const result=await Promise.allSettled([0,1].map(()=>service.changeStatus(f.superUserId,{companyId,target:'SUSPENDED',expectedStatusRevision:0,actorId:f.a.actorId,changedAt:'2000-01-01'})));
 expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(result.filter(r=>r.status==='rejected')).toHaveLength(1);
 const [event]=await c`select actor_user_id,from_status,to_status,status_revision,changed_at from public.company_status_events where company_id=${companyId}`;
 expect(event).toMatchObject({actor_user_id:f.superUserId,from_status:'ACTIVE',to_status:'SUSPENDED',status_revision:1});expect(new Date(event.changed_at).getTime()).toBeGreaterThan(Date.now()-60000);
 await service.changeStatus(f.superUserId,{companyId,target:'ACTIVE',expectedStatusRevision:1});
 await expect(service.changeStatus(f.superUserId,{companyId,target:'ACTIVE',expectedStatusRevision:0})).rejects.toMatchObject({code:'conflict'});
 const repo=createCompanyRepository(c),audit=repo.audit;repo.audit=async(...args)=>{await audit(...args);throw Error('secret database error');};
 await expect(createCompanyService(repo).changeStatus(f.superUserId,{companyId,target:'SUSPENDED',expectedStatusRevision:2})).rejects.toMatchObject({code:'unavailable'});
 expect((await service.list(f.superUserId)).find(r=>r.id===companyId)).toMatchObject({status:'ACTIVE',statusRevision:2});expect(await c`select id from public.company_status_events where company_id=${companyId}`).toHaveLength(2);
 await expect(service.changeStatus(f.superUserId,{companyId:randomUUID(),target:'ACTIVE',expectedStatusRevision:0})).rejects.toMatchObject({code:'unavailable'});
 await c`update public.companies set status_revision=2147483647 where id=${companyId}`;
 expect((await service.changeStatus(f.superUserId,{companyId,target:'ACTIVE',expectedStatusRevision:2147483647})).changed).toBe(false);
 await expect(service.changeStatus(f.superUserId,{companyId,target:'SUSPENDED',expectedStatusRevision:2147483647})).rejects.toMatchObject({code:'conflict'});
}),180000);
it('enforces audit identity, references and browser denial',async()=>companyFixture(c,async f=>{
 const values={company:f.a.companyId,actor:f.superUserId};
 const insert=(company=values.company,actor=values.actor,from='ACTIVE',to='SUSPENDED',revision=1)=>c`insert into public.company_status_events(company_id,actor_user_id,from_status,to_status,status_revision) values(${company},${actor},${from},${to},${revision})`;
 await insert();await expect(insert()).rejects.toMatchObject({code:'23505'});
 await expect(insert(randomUUID())).rejects.toMatchObject({code:'23503'});
 await expect(insert(values.company,randomUUID(),'SUSPENDED','ACTIVE',2)).rejects.toMatchObject({code:'23503'});
 await expect(insert(values.company,values.actor,'ACTIVE','ACTIVE',2)).rejects.toMatchObject({code:'23514'});
 await expect(insert(values.company,values.actor,'ACTIVE','SUSPENDED',0)).rejects.toMatchObject({code:'23514'});
 const [security]=await c`select relrowsecurity as rls,has_table_privilege('anon','public.company_status_events','SELECT') as anon_read,has_table_privilege('authenticated','public.company_status_events','INSERT') as browser_write from pg_class where oid='public.company_status_events'::regclass`;
 expect(security).toEqual({rls:true,anon_read:false,browser_write:false});
}),180000);
