import {beforeAll,afterAll,it,expect} from 'vitest';
import {config} from 'dotenv';
import postgres,{type Sql,type TransactionSql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {parseMigrationEnvironment} from '@/lib/env/migration';
import {createStaffDirectoryRepository} from '@/modules/staff-directory/repository';
import {createStaffDirectoryService} from '@/modules/staff-directory/service';
import {parseDirectoryQuery} from '@/modules/staff-directory/validation';
import type {StaffRole,StaffStatus} from '@/modules/staff-directory/types';
config({path:'.env.local',quiet:true});
let client:Sql;
beforeAll(async()=>{client=postgres(parseMigrationEnvironment(process.env).url,{ssl:{rejectUnauthorized:true},prepare:false,max:1,connect_timeout:5});await client`select 1`;});
afterAll(async()=>{if(client)await client.end({timeout:5});});
const rollback=new Error('staff directory fixture rollback');
async function profile(tx:TransactionSql,name:string|null=null,email:string|null=null){
 const id=randomUUID();await tx`insert into auth.users(id) values(${id})`;
 await tx`insert into public.users(id,name,email) values(${id},${name},${email})`;return id;
}
async function role(tx:TransactionSql,userId:string,companyId:string|null,value:StaffRole|'SUPER_ADMIN',status:StaffStatus='ACTIVE'){
 await tx`insert into public.memberships(user_id,company_id,role,status) values(${userId},${companyId},${value},${status})`;
}
async function fixture(run:(tx:TransactionSql,ids:{company:string;other:string;superUser:string;revoked:string;customer:string})=>Promise<void>){
 try{await client.begin(async tx=>{
  const ids={company:randomUUID(),other:randomUUID(),superUser:await profile(tx),revoked:await profile(tx),customer:await profile(tx)};
  await tx`insert into public.companies(id,name,slug) values(${ids.company},'Directory fixture',${'directory-'+ids.company}),(${ids.other},'Other fixture',${'directory-'+ids.other})`;
  await role(tx,ids.superUser,null,'SUPER_ADMIN');await role(tx,ids.revoked,null,'SUPER_ADMIN','DISABLED');
  await run(tx,ids);throw rollback;
 });}catch(error){if(error!==rollback)throw error;}
}
function serviceIn(tx:TransactionSql){
 const repo=createStaffDirectoryRepository(client);
 return createStaffDirectoryService({...repo,client:{begin:async(fn:(t:TransactionSql)=>unknown)=>tx.savepoint(fn)} as unknown as Sql});
}
it('counts scoped people once, exposes legacy role statuses and excludes customer/global-only/other-company records',async()=>fixture(async(tx,id)=>{
 const mixed=await profile(tx,'  Mixed Person  ','mixed@example.test');
 await role(tx,mixed,id.company,'CREW');await role(tx,mixed,id.company,'HELPDESK','DISABLED');
 const disabled=await profile(tx,'Disabled Person','disabled@example.test');
 await role(tx,disabled,id.company,'CREW','DISABLED');await role(tx,disabled,id.company,'ADMIN_PO','DISABLED');
 const unnamed=await profile(tx,'   ','fallback@example.test');await role(tx,unnamed,id.company,'CREW');
 const foreign=await profile(tx,'Other company','foreign@example.test');await role(tx,foreign,id.other,'CREW');
 const service=serviceIn(tx),result=await service.read(id.superUser,id.company,parseDirectoryQuery({}));
 expect(result.counts).toEqual({total:3,active:2,disabled:1});expect(result.rows).toHaveLength(3);
 expect(result.rows.map(r=>r.id)).not.toContain(foreign);expect(result.rows.map(r=>r.id)).not.toContain(id.customer);expect(result.rows.map(r=>r.id)).not.toContain(id.superUser);
 expect(result.rows.find(r=>r.id===mixed)).toMatchObject({name:'Mixed Person',status:'ACTIVE',roles:[{role:'CREW',status:'ACTIVE'},{role:'HELPDESK',status:'DISABLED'}]});
 expect(result.rows.find(r=>r.id===unnamed)?.name).toBe('fallback@example.test');
 const filtered=await service.read(id.superUser,id.company,parseDirectoryQuery({status:'disabled'}));
 expect(filtered.counts).toEqual(result.counts);expect(filtered.filteredTotal).toBe(1);expect(filtered.rows[0].id).toBe(disabled);
 await tx`update public.companies set status='SUSPENDED' where id=${id.company}`;
 expect((await service.read(id.superUser,id.company,parseDirectoryQuery({}))).counts).toEqual(result.counts);
}));
it('rejects every non-super or revoked actor and observes revocation on the next request',async()=>fixture(async(tx,id)=>{
 const service=serviceIn(tx);
 for(const actor of [id.customer,id.revoked])await expect(service.read(actor,id.company,parseDirectoryQuery({}))).rejects.toMatchObject({code:'forbidden'});
 for(const value of ['ADMIN_PO','HELPDESK','CREW'] as const){const actor=await profile(tx);await role(tx,actor,id.company,value);await expect(service.read(actor,id.company,parseDirectoryQuery({}))).rejects.toMatchObject({code:'forbidden'});}
 await service.read(id.superUser,id.company,parseDirectoryQuery({}));
 await tx`update public.memberships set status='DISABLED' where user_id=${id.superUser}`;
 await expect(service.read(id.superUser,id.company,parseDirectoryQuery({}))).rejects.toMatchObject({code:'forbidden'});
}));
it('returns bounded stable pages, clamps huge requests and keeps summary counts unfiltered',async()=>fixture(async(tx,id)=>{
 const people=Array.from({length:27},(_,i)=>({id:randomUUID(),email:`person-${i}@example.test`}));
 await tx`insert into auth.users ${tx(people.map(p=>({id:p.id})),'id')}`;
 await tx`insert into public.users ${tx(people.map(p=>({id:p.id,name:'Same name',email:p.email})),'id','name','email')}`;
 await tx`insert into public.memberships ${tx(people.map(p=>({user_id:p.id,company_id:id.company,role:'CREW',status:'ACTIVE'})),'user_id','company_id','role','status')}`;
 const service=serviceIn(tx),first=await service.read(id.superUser,id.company,parseDirectoryQuery({}));
 const second=await service.read(id.superUser,id.company,parseDirectoryQuery({page:Number.MAX_SAFE_INTEGER}));
 expect(first.rows).toHaveLength(25);expect(second.rows).toHaveLength(2);expect(second.page).toBe(2);expect(second.totalPages).toBe(2);
 expect([...first.rows,...second.rows].map(r=>r.id)).toEqual(people.map(p=>p.id).sort());
 const found=await service.read(id.superUser,id.company,parseDirectoryQuery({q:'person-26@',page:9}));
 expect(found.filteredTotal).toBe(1);expect(found.page).toBe(1);expect(found.counts.total).toBe(27);
}));
it('treats search wildcards literally and returns truthful empty/missing-company/profile states',async()=>fixture(async(tx,id)=>{
 const wildcard=await profile(tx,'A%_literal','literal@example.test');await role(tx,wildcard,id.company,'CREW');
 const missing=await profile(tx);await role(tx,missing,id.company,'HELPDESK');
 const service=serviceIn(tx);
 for(const q of ['%','_','%_'])expect((await service.read(id.superUser,id.company,parseDirectoryQuery({q}))).rows.map(r=>r.id)).toEqual([wildcard]);
 const absent=await service.read(id.superUser,id.company,parseDirectoryQuery({q:"' or true --",page:9}));
 expect(absent.rows).toEqual([]);expect(absent.filteredTotal).toBe(0);expect(absent.page).toBe(1);expect(absent.counts.total).toBe(2);
 const full=await service.read(id.superUser,id.company,parseDirectoryQuery({}));
 expect(full.rows.find(r=>r.id===missing)).toMatchObject({name:'Petugas tanpa nama',email:null});
 const empty=await service.read(id.superUser,id.other,parseDirectoryQuery({}));expect(empty.counts).toEqual({total:0,active:0,disabled:0});expect(empty.rows).toEqual([]);
 await expect(service.read(id.superUser,randomUUID(),parseDirectoryQuery({}))).rejects.toMatchObject({code:'unavailable'});
}));
it('retains revoked browser table grants and enabled RLS',async()=>{
 for(const name of ['users','memberships','companies']){
  const [table]=await client`select relrowsecurity from pg_class where oid=${'public.'+name}::regclass`;expect(table.relrowsecurity).toBe(true);
  for(const browserRole of ['anon','authenticated']){const [privilege]=await client`select has_table_privilege(${browserRole},${'public.'+name},'SELECT') as allowed`;expect(privilege.allowed).toBe(false);}
 }
});
