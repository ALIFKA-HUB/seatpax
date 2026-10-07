import { beforeAll, afterAll, it, expect } from 'vitest';
import { config } from 'dotenv';
import postgres, { type Sql, type TransactionSql } from 'postgres';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import {sql,eq} from 'drizzle-orm';
import {users,companies,memberships} from '@/lib/db/schema';
import { parseMigrationEnvironment } from '@/lib/env/migration';
import { createAccessRepository } from '@/modules/access/repository';
import { authorize } from '@/modules/access/service';
import {seedDevelopment,DEMO_COMPANIES,seedMemberships} from '@/modules/access/seed';
import {createSeedTransaction} from '@/modules/access/seed-repository';
import {DEV_PROJECT_REF} from '@/lib/env/migration';
config({path:'.env.local',quiet:true});
let client:Sql;
beforeAll(async()=>{
  const target=parseMigrationEnvironment(process.env);
  client=postgres(target.url,{ssl:{rejectUnauthorized:true},prepare:false,max:3,connect_timeout:5});
  try{await client`select 1`;}catch{throw new Error('Development integration connection unavailable');}
});
afterAll(async()=>{if(client)await client.end({timeout:5});});
const rollback=new Error('fixture rollback');
async function fixture(run:(tx:TransactionSql,ids:{a:string;b:string;user:string;superUser:string})=>Promise<void>){
  try{await client.begin(async tx=>{
    const ids={a:randomUUID(),b:randomUUID(),user:randomUUID(),superUser:randomUUID()};
    await tx`insert into auth.users(id) values(${ids.user}),(${ids.superUser})`;
    await tx`insert into public.users(id) values(${ids.user}),(${ids.superUser})`;
    await tx`insert into public.companies(id,name,slug) values(${ids.a},'Fixture A',${'fixture-'+ids.a}),(${ids.b},'Fixture B',${'fixture-'+ids.b})`;
    await run(tx,ids);throw rollback;
  });}catch(error){if(error!==rollback)throw error;}
}
async function rejected(tx:TransactionSql,statement:(sub:TransactionSql)=>Promise<unknown>,code:string){
  await expect(tx.savepoint(statement)).rejects.toMatchObject({code});
}
it('enforces role-company, FK and partial unique constraints',async()=>fixture(async(tx,id)=>{
  await rejected(tx,s=>s`insert into public.memberships(user_id,role) values(${id.user},'ADMIN_PO')`,'23514');
  await rejected(tx,s=>s`insert into public.memberships(user_id,company_id,role) values(${id.user},${id.a},'SUPER_ADMIN')`,'23514');
  await rejected(tx,s=>s`insert into public.users(id) values(${randomUUID()})`,'23503');
  await tx`insert into public.memberships(user_id,company_id,role) values(${id.user},${id.a},'ADMIN_PO')`;
  await rejected(tx,s=>s`insert into public.memberships(user_id,company_id,role) values(${id.user},${id.a},'ADMIN_PO')`,'23505');
  await tx`insert into public.memberships(user_id,role) values(${id.superUser},'SUPER_ADMIN')`;
  await rejected(tx,s=>s`insert into public.memberships(user_id,role) values(${id.superUser},'SUPER_ADMIN')`,'23505');
}));
it('denies browser roles for every application table and mutation',async()=>fixture(async(tx,id)=>{
  const rows=await tx`select relname,relrowsecurity from pg_class where oid in ('public.users'::regclass,'public.companies'::regclass,'public.memberships'::regclass)`;
  expect(rows).toHaveLength(3);expect(rows.every(r=>r.relrowsecurity)).toBe(true);
  for(const role of ['anon','authenticated'])for(const table of ['users','companies','memberships'])for(const verb of ['SELECT','INSERT','UPDATE','DELETE']){
    await rejected(tx,async s=>{
      await s.unsafe(`SET LOCAL ROLE ${role}`);
      await s`select set_config('request.jwt.claim.sub',${id.user},true)`;
      const statement=verb==='SELECT'?`SELECT * FROM public.${table}`:verb==='DELETE'?`DELETE FROM public.${table}`:verb==='UPDATE'?`UPDATE public.${table} SET id=id`:`INSERT INTO public.${table}(id) VALUES('${randomUUID()}')`;
      await s.unsafe(statement);
    },'42501');
  }
}));
it('reads actual memberships for two-company isolation and revocation',async()=>{
  try{await drizzle(client).transaction(async db=>{
    const id={a:randomUUID(),b:randomUUID(),user:randomUUID(),superUser:randomUUID()};
    await db.execute(sql`insert into auth.users(id) values(${id.user}),(${id.superUser})`);
    await db.insert(users).values([{id:id.user},{id:id.superUser}]);
    await db.insert(companies).values([{id:id.a,name:'A',slug:'fixture-'+id.a},{id:id.b,name:'B',slug:'fixture-'+id.b}]);
    const repo=createAccessRepository(db);const actor={id:id.user,email:null};
    await db.insert(memberships).values({userId:id.user,companyId:id.a,role:'ADMIN_PO'});
    expect(authorize(actor,await repo.listMemberships(id.user),'tenant.admin',id.a).ok).toBe(true);
    expect(authorize(actor,await repo.listMemberships(id.user),'tenant.admin',id.b).ok).toBe(false);
    await db.update(memberships).set({status:'DISABLED'}).where(eq(memberships.userId,id.user));
    expect(authorize(actor,await repo.listMemberships(id.user),'tenant.admin',id.a).ok).toBe(false);
    await db.insert(memberships).values({userId:id.superUser,role:'SUPER_ADMIN'});
    expect(authorize({id:id.superUser,email:null},await repo.listMemberships(id.superUser),'tenant.admin',id.b).ok).toBe(false);
    throw rollback;
  });}catch(error){if(error!==rollback)throw error;}
});
it('concurrent profile bootstrap creates one profile and no role',async()=>{
  const userId=randomUUID();
  try{
    await client`insert into auth.users(id) values(${userId})`;
    const repo=createAccessRepository(drizzle(client));
    await Promise.all([repo.ensureProfile({id:userId,email:null}),repo.ensureProfile({id:userId,email:null})]);
    const rows=await client`select id from public.users where id=${userId}`;
    expect(rows).toHaveLength(1);expect(await repo.listMemberships(userId)).toEqual([]);
  }finally{
    await client`delete from public.users where id=${userId}`;
    await client`delete from auth.users where id=${userId}`;
  }
});
it('seed is idempotent, preserves disabled status and rejects reassignment atomically',async()=>{
  try{await client.begin(async tx=>{
    await tx`select pg_advisory_xact_lock(734217001)`;
    const catalog={companies:DEMO_COMPANIES.map(c=>({...c,id:randomUUID(),slug:'fixture-'+randomUUID()})),membershipIds:[1,2,3,4,5].map(()=>randomUUID())};

    const mapping={adminA:randomUUID(),crewA:randomUUID(),adminB:randomUUID(),crewB:randomUUID(),superAdmin:randomUUID()};
    for(const id of Object.values(mapping))await tx`insert into auth.users(id) values(${id})`;
    const repository={transaction:async<T>(fn:Parameters<import('@/modules/access/seed').SeedRepository['transaction']>[0])=>await tx.savepoint(async sub=>await fn(createSeedTransaction(sub,catalog))) as T};
    const seed=(apply:boolean)=>seedDevelopment({projectRef:DEV_PROJECT_REF,mapping,apply},repository);
    await seed(false);expect(await tx`select id from public.companies where id=${catalog.companies[0].id}`).toHaveLength(0);
    await seed(true);await seed(true);
    expect(await tx`select id from public.memberships where id in ${tx(seedMemberships(mapping,catalog).map(m=>m.id))}`).toHaveLength(5);
    await tx`update public.companies set status='SUSPENDED' where id=${catalog.companies[0].id}`;
    await tx`update public.memberships set status='DISABLED' where id=${seedMemberships(mapping,catalog)[0].id}`;
    await seed(true);
    expect((await tx`select status from public.companies where id=${catalog.companies[0].id}`)[0].status).toBe('SUSPENDED');
    expect((await tx`select status from public.memberships where id=${seedMemberships(mapping,catalog)[0].id}`)[0].status).toBe('DISABLED');
    const replacement=randomUUID();await tx`insert into auth.users(id) values(${replacement})`;
    await expect(seedDevelopment({projectRef:DEV_PROJECT_REF,mapping:{...mapping,adminA:replacement},apply:true},repository)).rejects.toThrow('Seed failed');
    expect((await tx`select user_id from public.memberships where id=${seedMemberships(mapping,catalog)[0].id}`)[0].user_id).toBe(mapping.adminA);
    await expect(seedDevelopment({projectRef:DEV_PROJECT_REF,mapping:{...mapping,adminA:randomUUID()},apply:true},repository)).rejects.toThrow('Seed failed');
    throw rollback;
  });}catch(error){if(error!==rollback)throw error;}
});
