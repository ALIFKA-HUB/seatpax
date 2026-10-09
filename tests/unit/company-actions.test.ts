import {it,expect} from 'vitest';
import {createCompanyActions} from '@/app/super-admin/action-core';
import {DomainError} from '@/modules/access/transaction';
const user='00000000-0000-4000-8000-000000000002',id='00000000-0000-4000-8000-000000000001';
const company={id,name:'PO A',slug:'po-a',status:'SUSPENDED' as const,statusRevision:1,updatedAt:'2026-10-09'};
const input={companyId:id,target:'SUSPENDED',expectedStatusRevision:0};
it('derives actor from verified session and strips browser fields',async()=>{
 const action=createCompanyActions({getUserId:async()=>user,changeStatus:async(actor,raw)=>{expect(actor).toBe(user);expect(raw).toEqual(input);return {company,changed:true};}});
 expect(await action.change({...input,actorId:'forged',changedAt:'forged'})).toEqual({ok:true,result:{company,changed:true}});
});
it('rejects missing sessions and malformed input before mutation',async()=>{
 let count=0;const mutate=async()=>{count++;return {company,changed:true};};
 expect(await createCompanyActions({getUserId:async()=>null,changeStatus:mutate}).change(input)).toMatchObject({ok:false,code:'forbidden'});
 expect(await createCompanyActions({getUserId:async()=>user,changeStatus:mutate}).change({...input,target:'bad'})).toMatchObject({ok:false,code:'validation'});expect(count).toBe(0);
});
it.each(['forbidden','conflict','unavailable'] as const)('exposes safe %s guidance without database details',async code=>{
 const action=createCompanyActions({getUserId:async()=>user,changeStatus:async()=>{throw new DomainError(code,'SECRET SQL');}});
 const result=await action.change(input);expect(result).toMatchObject({ok:false,code});expect(JSON.stringify(result)).not.toContain('SECRET');
});
it('hides unexpected errors',async()=>{const result=await createCompanyActions({getUserId:async()=>{throw Error('SECRET KEY');},changeStatus:async()=>({company,changed:true})}).change(input);expect(result).toMatchObject({ok:false,code:'unavailable'});expect(JSON.stringify(result)).not.toContain('SECRET');});
