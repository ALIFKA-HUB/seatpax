import {it,expect} from 'vitest';
import {createHelpdeskStaff,normalizeHelpdeskPage} from '@/modules/helpdesk/staff';
import type {HelpdeskContext} from '@/modules/helpdesk/types';
import type {Sql,TransactionSql} from 'postgres';

const ctx:HelpdeskContext={actorId:'11111111-1111-4111-8111-111111111111',companyId:'22222222-2222-4222-8222-222222222222'};
function staffWith(results:unknown[][]){
 const queries:string[]=[];
 const tx=async(strings:TemplateStringsArray,...values:unknown[])=>{void values;queries.push(strings.join('?'));return results.shift()??[];};
 const db={begin:async(run:(tx:TransactionSql)=>Promise<unknown>)=>run(tx as unknown as TransactionSql)};
 return {staff:createHelpdeskStaff(db as unknown as Sql,'x'.repeat(32)),queries};
}

it('normalizes malformed and excessive list pages to finite integer bounds',()=>{
 expect(normalizeHelpdeskPage(undefined)).toBe(1);
 expect(normalizeHelpdeskPage('nope')).toBe(1);
 expect(normalizeHelpdeskPage(-4)).toBe(1);
 expect(normalizeHelpdeskPage(2.9)).toBe(2);
 expect(normalizeHelpdeskPage(10001)).toBe(10000);
 expect(normalizeHelpdeskPage(Infinity)).toBe(1);
 expect(normalizeHelpdeskPage(Symbol('invalid'))).toBe(1);
});

it('reports retry queued only when an eligible company job was updated',async()=>{
 const {staff,queries}=staffWith([[{role:'HELPDESK'}],[{id:'job'}]]);
 await expect(staff.retryMail(ctx,'33333333-3333-4333-8333-333333333333')).resolves.toBe(true);
 expect(queries.at(-1)).toContain('returning j.id');
 const noOp=staffWith([[{role:'HELPDESK'}],[]]);
 await expect(noOp.staff.retryMail(ctx,'44444444-4444-4444-8444-444444444444')).resolves.toBe(false);
});

it('returns authorized bounded dashboard projections and fixed status counts',async()=>{
 const rows=[[{role:'HELPDESK'}],[{status:'MENUNGGU',count:3},{status:'DIPROSES',count:1}],[{id:'q'}],[{id:'r'}],[{id:'e'}]];
 const {staff,queries}=staffWith(rows);
 const result=await staff.dashboard(ctx);
 expect(result.counts).toEqual({MENUNGGU:3,DIPROSES:1,PERLU_DILENGKAPI:0,SELESAI:0});
 expect(result.queue).toEqual([{id:'q'}]);
 expect(result.recent).toEqual([{id:'r'}]);
 expect(result.events).toEqual([{id:'e'}]);
 expect(queries[0]).toContain('memberships');
 expect(queries[1]).toContain('group by status');
 expect(queries[2]).toContain("priority='HIGH'");
 expect(queries[2]).toContain("priority is null");
 expect(queries[2]).toContain('limit 6');
 expect(queries.slice(2).every(q=>q.includes('company_id'))).toBe(true);
});

it('denies dashboard reads before issuing company data queries',async()=>{
 const {staff,queries}=staffWith([[]]);
 await expect(staff.dashboard(ctx)).rejects.toThrow('Akses petugas ditolak.');
 expect(queries).toHaveLength(1);
});
