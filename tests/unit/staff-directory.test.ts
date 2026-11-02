import {it,expect,vi} from 'vitest';
import {parseDirectoryQuery,resolveDirectoryCompany} from '@/modules/staff-directory/validation';
import {createStaffDirectoryService} from '@/modules/staff-directory/service';
import type {StaffDirectoryRepository} from '@/modules/staff-directory/repository';
const userId='b361cb67-452f-4ef4-96b0-80a75d58cff5',companyId='00000000-0000-4000-8000-000000000001';

it('normalizes only supported directory filters and bounds search text',()=>{
 expect(parseDirectoryQuery({})).toEqual({q:'',status:'all',page:1});
 expect(parseDirectoryQuery({q:'  A_%  ',status:'disabled',page:'2'})).toEqual({q:'A_%',status:'disabled',page:2});
 expect(parseDirectoryQuery({q:'x'.repeat(100),status:['active'],page:'2.5'})).toEqual({q:'x'.repeat(80),status:'all',page:1});
 for(const page of ['0','-2','NaN','1e9','9007199254740992',[],null])expect(parseDirectoryQuery({page}).page).toBe(1);
});
it('uses only a validated explicit company or the approved development fallback',()=>{
 expect(resolveDirectoryCompany({NODE_ENV:'development'})).toBe(companyId);
 expect(resolveDirectoryCompany({NODE_ENV:'production',SEATPAX_COMPANY_ID:companyId})).toBe(companyId);
 for(const env of [{NODE_ENV:'production'},{NODE_ENV:'test'},{NODE_ENV:'development',SEATPAX_COMPANY_ID:''},{NODE_ENV:'development',SEATPAX_COMPANY_ID:'bad'}])expect(()=>resolveDirectoryCompany(env)).toThrow();
});
function repository(allowed=true){
 const tx=vi.fn(async()=>[]);
 const read=vi.fn(async()=>({counts:{total:1,active:1,disabled:0}}));
 const authorize=vi.fn(async()=>allowed);
 return {repo:{client:{begin:async(fn:(t:typeof tx)=>unknown)=>fn(tx)},authorize,read} as unknown as StaffDirectoryRepository,read,authorize};
}
it('authorizes before reading and passes the server-controlled company and query',async()=>{
 const {repo,read,authorize}=repository();const query=parseDirectoryQuery({q:'A'});
 const result=await createStaffDirectoryService(repo).read(userId,companyId,query);
 expect(result.counts.total).toBe(1);expect(authorize).toHaveBeenCalledWith(expect.anything(),userId);
 expect(read).toHaveBeenCalledWith(expect.anything(),companyId,query);
 expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(read.mock.invocationCallOrder[0]);
});
it('rejects unauthorized, malformed and revoked access without reading profiles',async()=>{
 const {repo,read}=repository(false);
 await expect(createStaffDirectoryService(repo).read(userId,companyId,parseDirectoryQuery({}))).rejects.toMatchObject({code:'forbidden'});
 await expect(createStaffDirectoryService(repo).read('bad',companyId,parseDirectoryQuery({}))).rejects.toMatchObject({code:'forbidden'});
 expect(read).not.toHaveBeenCalled();
});
it('fails closed on invalid company or query and never turns database failure into zeros',async()=>{
 const {repo,read}=repository();const service=createStaffDirectoryService(repo),query=parseDirectoryQuery({});
 await expect(service.read(userId,'bad',query)).rejects.toMatchObject({code:'unavailable'});
 await expect(service.read(userId,companyId,{...query,page:0})).rejects.toMatchObject({code:'validation'});
 expect(read).not.toHaveBeenCalled();
 read.mockRejectedValueOnce(Error('private SQL failure'));
 await expect(service.read(userId,companyId,query)).rejects.toMatchObject({code:'unavailable'});
});
