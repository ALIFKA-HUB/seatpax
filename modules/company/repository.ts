import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import type {CompanyStatus,CompanySummary} from './types';
export function createCompanyRepository(client:Sql){return {
 client,
 async authorize(tx:DomainTx,userId:string){return (await tx`select id from public.memberships where user_id=${userId} and company_id is null and role='SUPER_ADMIN' and status='ACTIVE' for share`).length===1;},
 async list(tx:DomainTx){return await tx<CompanySummary[]>`select id,name,slug,status,status_revision as "statusRevision",updated_at::text as "updatedAt" from public.companies order by name,id`;},
 async company(tx:DomainTx,id:string){return (await tx<CompanySummary[]>`select id,name,slug,status,status_revision as "statusRevision",updated_at::text as "updatedAt" from public.companies where id=${id} for update`)[0]??null;},
 async update(tx:DomainTx,id:string,target:CompanyStatus,nextRevision:number){return (await tx<CompanySummary[]>`update public.companies set status=${target},status_revision=${nextRevision},updated_at=clock_timestamp() where id=${id} returning id,name,slug,status,status_revision as "statusRevision",updated_at::text as "updatedAt"`)[0];},
 async audit(tx:DomainTx,input:{companyId:string;actorId:string;fromStatus:CompanyStatus;toStatus:CompanyStatus;statusRevision:number}){await tx`insert into public.company_status_events(company_id,actor_user_id,from_status,to_status,status_revision) values(${input.companyId},${input.actorId},${input.fromStatus},${input.toStatus},${input.statusRevision})`;},
};}
export type CompanyRepository=ReturnType<typeof createCompanyRepository>;
