import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {boardingFixture} from './boarding-fixture';
type Fixture=Parameters<Parameters<typeof boardingFixture>[1]>[0];
export async function companyFixture(c:Sql,run:(f:Fixture&{superUserId:string;superMembershipId:string})=>Promise<void>){
 await boardingFixture(c,async f=>{
  const superUserId=randomUUID(),superMembershipId=randomUUID();f.users.push(superUserId);
  await c`insert into auth.users(id) values(${superUserId})`;
  await c`insert into public.users(id,name) values(${superUserId},'Company control fixture')`;
  await c`insert into public.memberships(id,user_id,role) values(${superMembershipId},${superUserId},'SUPER_ADMIN')`;
  try{await run({...f,superUserId,superMembershipId});}finally{
   try{await c`delete from public.company_status_events where company_id in ${c([f.a.companyId,f.b.companyId])}`;}finally{await c`delete from public.memberships where id=${superMembershipId}`;}
  }
 });
}
