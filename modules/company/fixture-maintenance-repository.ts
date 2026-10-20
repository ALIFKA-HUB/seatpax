import {createHash} from 'node:crypto';
import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import {createCompanyRepository} from './repository';

export const FIXTURE_IDS=[
 '1d9e8f7a-f6b7-42d3-a7b5-e38ecfb02bee','5aa60dfe-aadf-423e-a863-11fe69e12422',
 '6f20f864-d10d-46cf-8183-e5b9b5dc51a1','762a3201-19df-4b3d-a5c6-88983b52e1d9',
 '7e275bb1-739a-4e8e-80e2-17905e5344b1','a0315534-d5b2-4e43-b3a0-5b2237f115a4',
 'a123531d-143d-4e15-a4a5-9f0c5cf4775d','c469c45d-da34-42fd-89bc-19a6bf1dbfd8',
] as const;
// Only literal identifiers maintained here may be interpolated as SQL identifiers.
const tenantTables=['memberships','stops','routes','route_stops','service_classes','segment_fares','seat_templates','seat_template_cells','vehicles','trips','trip_stops','trip_segments','trip_seats','trip_seat_inventory','trip_crew_assignments','trip_audit_events','seat_holds','seat_hold_audit_events','bookings','booking_passengers','payments','seat_assignments','confirmed_occupancy','tickets','boarding_events','snack_claims','payment_resolutions'] as const;
export function canonical(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
 return JSON.stringify(value);
}
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');

export function createFixtureMaintenanceRepository(client:Sql) {
 const company=createCompanyRepository(client);
 return {company,
  async lockProtected(tx:DomainTx) {
   // Prevent event insertion between the final fingerprint and commit. This short
   // maintenance lock also covers providers that insert before locking a company.
   await tx`lock table ${tx.unsafe([...tenantTables,'users','payment_events','booking_audit_events'].map(t=>'public.'+t).join(','))} in share mode`;
  },
  async inspect(tx:Sql|DomainTx) {
   const companies=await tx`select to_jsonb(c) as row from public.companies c where id in ${tx([...FIXTURE_IDS])} order by id`;
   const protectedRows:Record<string,unknown>={companies:companies.map(c=>{const {status:_status,status_revision:_revision,updated_at:_updated,...rest}=c.row;void _status;void _revision;void _updated;return rest;})};
   const counts:Record<string,Record<string,number>>={};
   protectedRows.users=(await tx`select to_jsonb(u) as row from public.users u where exists(select 1 from public.memberships m where m.user_id=u.id and m.company_id in ${tx([...FIXTURE_IDS])}) order by u.id`).map(r=>r.row);
   for(const table of tenantTables) {
    const rows=await tx`select to_jsonb(r) as row from ${tx.unsafe('public.'+table)} r where company_id in ${tx([...FIXTURE_IDS])} order by to_jsonb(r)::text`;
    protectedRows[table]=rows.map(r=>r.row);
    if(['bookings','payments','tickets'].includes(table))counts[table]=Object.fromEntries(FIXTURE_IDS.map(id=>[id,rows.filter(r=>r.row.company_id===id).length]));
   }
   protectedRows.payment_events=(await tx`select to_jsonb(e) as row from public.payment_events e join public.payments p on p.id=e.payment_id where p.company_id in ${tx([...FIXTURE_IDS])} order by e.id`).map(r=>r.row);
   protectedRows.booking_audit_events=(await tx`select to_jsonb(e) as row from public.booking_audit_events e join public.bookings b on b.id=e.booking_id where b.company_id in ${tx([...FIXTURE_IDS])} order by e.id`).map(r=>r.row);
   const holds=await tx`select count(*)::int as active,count(*) filter(where payment_initiated_at is not null)::int as payment from public.seat_holds where company_id in ${tx([...FIXTURE_IDS])} and status='ACTIVE' and effective_expires_at>clock_timestamp()`;
   return {companyRows:companies.map(c=>c.row),protectedDigest:digest(protectedRows),counts,activeHoldCount:holds[0].active as number,livePaymentHoldCount:holds[0].payment as number};
  },
  async events(tx:DomainTx) {return tx`select company_id,actor_user_id,from_status,to_status,status_revision from public.company_status_events where company_id in ${tx([...FIXTURE_IDS])} order by company_id,status_revision`;},
 };
}
