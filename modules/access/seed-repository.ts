import type { Sql, TransactionSql } from 'postgres';
import { DEMO_COMPANIES,seedMemberships,type SeedRepository,type SeedTransaction } from './seed';
export function createSeedTransaction(tx:TransactionSql):SeedTransaction {
  return {
          async inspect(mapping) {
            const ids=Object.values(mapping);
            const accounts=await tx`select id from auth.users where id in ${tx(ids)}`;
            if(accounts.length!==5) throw new Error('Missing Auth identity');
            for(const company of DEMO_COMPANIES){
              const rows=await tx`select id,slug,name from public.companies where id=${company.id} or slug=${company.slug} for update`;
              if(rows.some(r=>r.id!==company.id||r.slug!==company.slug||r.name!==company.name))throw new Error('Company mapping conflict');
            }
            for(const member of seedMemberships(mapping)){
              const rows=await tx`select id,user_id,company_id,role from public.memberships where id=${member.id} or (user_id=${member.userId} and company_id is not distinct from ${member.companyId}::uuid and role=${member.role}) for update`;
              if(rows.some(r=>r.id!==member.id||r.user_id!==member.userId||r.company_id!==member.companyId||r.role!==member.role))throw new Error('Membership mapping conflict');
            }
          },
          async write(mapping) {
            for(const userId of Object.values(mapping))await tx`insert into public.users(id) values(${userId}) on conflict(id) do nothing`;
            for(const company of DEMO_COMPANIES)await tx`insert into public.companies(id,name,slug) values(${company.id},${company.name},${company.slug}) on conflict(id) do nothing`;
            for(const m of seedMemberships(mapping))await tx`insert into public.memberships(id,user_id,company_id,role) values(${m.id},${m.userId},${m.companyId},${m.role}) on conflict(id) do nothing`;
          },
  };
}
export function createSeedRepository(client:Sql):SeedRepository {
  return {async transaction(fn){
    return await client.begin(async tx=>{
      await tx`select pg_advisory_xact_lock(734217001)`;
      return await fn(createSeedTransaction(tx));
    }) as Awaited<ReturnType<typeof fn>>;
  }};
}
