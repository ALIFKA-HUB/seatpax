import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import {DomainError} from '@/modules/access/transaction';
import {createCompanyRepository} from '@/modules/company/repository';
import type {StaffRole,StaffStatus,StaffDirectoryQuery,StaffDirectorySnapshot} from './types';

export function createStaffDirectoryRepository(client:Sql){return {
 client,
 authorize:createCompanyRepository(client).authorize,
 async read(tx:DomainTx,companyId:string,query:StaffDirectoryQuery):Promise<StaffDirectorySnapshot>{
  const [snapshot]=await tx<Omit<StaffDirectorySnapshot,'query'|'pageSize'>[]>`
   with company as (select id,name,status from public.companies where id=${companyId}),
   staff as (
    select u.id,coalesce(nullif(trim(u.name),''),nullif(trim(u.email),''),'Petugas tanpa nama') as display_name,
     nullif(trim(u.email),'') as email,bool_or(m.status='ACTIVE') as active,
     jsonb_agg(jsonb_build_object('role',m.role,'status',m.status) order by m.role::text) as roles
    from public.users u join public.memberships m on m.user_id=u.id
    where m.company_id=${companyId} and m.role::text in ('ADMIN_PO','HELPDESK','CREW') group by u.id
   ), filtered as (
    select * from staff where (${query.status}='all' or active=(${query.status}='active'))
     and (${query.q}='' or strpos(lower(display_name),lower(${query.q}))>0 or strpos(lower(coalesce(email,'')),lower(${query.q}))>0)
   ), totals as (
    select count(*)::int as total,count(*) filter(where active)::int as active,count(*) filter(where not active)::int as disabled from staff
   ), filtered_count as (select count(*)::int as total from filtered),
   meta as (
    select total,greatest(1,ceil(total::numeric/25))::int as pages,
     least(${query.page}::numeric,greatest(1,ceil(total::numeric/25)))::int as page from filtered_count
   ), paged as (
    select * from filtered order by lower(display_name),id limit 25 offset (select (page-1)*25 from meta)
   )
   select jsonb_build_object('id',company.id,'name',company.name,'status',company.status) as company,
    jsonb_build_object('total',totals.total,'active',totals.active,'disabled',totals.disabled) as counts,
    meta.page as page,meta.pages as "totalPages",meta.total as "filteredTotal",
    coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'email',p.email,
     'status',case when p.active then 'ACTIVE' else 'DISABLED' end,'roles',p.roles) order by lower(p.display_name),p.id) from paged p),'[]'::jsonb) as rows
   from company cross join totals cross join meta`;
  if(!snapshot)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  return {...snapshot,query,pageSize:25};
 },
 async findAuthUserByEmail(tx:DomainTx,email:string):Promise<string|null>{
  const [row]=await tx<{id:string}[]>`select id from auth.users where lower(email)=lower(${email}) limit 1`;
  return row?.id??null;
 },
 async upsertStaff(tx:DomainTx,input:{companyId:string;userId:string;name?:string;email?:string;role:StaffRole;status:StaffStatus}):Promise<void>{
  const [company]=await tx<{id:string}[]>`select id from public.companies where id=${input.companyId} for share`;
  if(!company)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  if(input.name!==undefined||input.email!==undefined){
   await tx`insert into public.users (id,name,email,updated_at) values (${input.userId},${input.name??null},${input.email??null},clock_timestamp()) on conflict (id) do update set name=coalesce(excluded.name,public.users.name),email=coalesce(excluded.email,public.users.email),updated_at=clock_timestamp()`;
  }else{
   const [user]=await tx<{id:string}[]>`select id from public.users where id=${input.userId} for update`;
   if(!user)throw new DomainError('validation','Petugas tidak ditemukan.');
  }
  await tx`insert into public.memberships (user_id,company_id,role,status,updated_at) values (${input.userId},${input.companyId},${input.role},${input.status},clock_timestamp()) on conflict (user_id,company_id,role) where company_id is not null do update set status=${input.status},updated_at=clock_timestamp()`;
  await tx`update public.memberships set status='DISABLED',updated_at=clock_timestamp() where user_id=${input.userId} and company_id=${input.companyId} and role::text in ('ADMIN_PO','HELPDESK','CREW') and role::text<>${input.role}`;
 },
};}
export type StaffDirectoryRepository=ReturnType<typeof createStaffDirectoryRepository>;
