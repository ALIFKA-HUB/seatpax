import {it,expect,vi} from 'vitest';
import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import {parseDirectoryQuery,resolveDirectoryCompany,parseCreateStaffInput,parseUpdateStaffInput} from '@/modules/staff-directory/validation';
import {createStaffDirectoryService} from '@/modules/staff-directory/service';
import {createStaffDirectoryRepository,type StaffDirectoryRepository} from '@/modules/staff-directory/repository';
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
function repository(allowed=true,existingAuthUserId:string|null=null){
 const tx=vi.fn(async()=>[]);
 const read=vi.fn(async()=>({counts:{total:1,active:1,disabled:0}}));
 const authorize=vi.fn(async()=>allowed);
 const findAuthUserByEmail=vi.fn(async()=>existingAuthUserId);
 const upsertStaff=vi.fn(async()=>undefined);
 return {
  repo:{client:{begin:async(fn:(t:typeof tx)=>unknown)=>fn(tx)},authorize,read,findAuthUserByEmail,upsertStaff} as unknown as StaffDirectoryRepository,
  read,
  authorize,
  findAuthUserByEmail,
  upsertStaff,
  tx,
 };
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

it('validates and normalizes create staff input strictly',()=>{
 expect(parseCreateStaffInput({name:'  Budi Santoso  ',email:'  BUDI@EXAMPLE.COM  ',role:'ADMIN_PO'})).toEqual({
  name:'Budi Santoso',
  email:'budi@example.com',
  role:'ADMIN_PO',
 });
 expect(parseCreateStaffInput({name:'A',email:'crew@seatpax.id',role:'CREW'})).toEqual({
  name:'A',
  email:'crew@seatpax.id',
  role:'CREW',
 });
 expect(parseCreateStaffInput({name:'x'.repeat(80),email:'helpdesk@seatpax.id',role:'HELPDESK'}).name).toHaveLength(80);

 for(const bad of [
  {},
  {name:'',email:'budi@example.com',role:'ADMIN_PO'},
  {name:'   ',email:'budi@example.com',role:'ADMIN_PO'},
  {name:'x'.repeat(81),email:'budi@example.com',role:'ADMIN_PO'},
  {name:'Budi',email:'invalid-email',role:'ADMIN_PO'},
  {name:'Budi',email:'budi@example.com',role:'SUPER_ADMIN'},
  {name:'Budi',email:'budi@example.com',role:'UNKNOWN'},
  null,
  undefined,
  'string',
 ]){
  expect(()=>parseCreateStaffInput(bad)).toThrowError(expect.objectContaining({code:'validation'}));
 }
});

it('validates update staff input strictly',()=>{
 expect(parseUpdateStaffInput({userId,role:'HELPDESK',status:'ACTIVE'})).toEqual({
  userId,
  role:'HELPDESK',
  status:'ACTIVE',
 });
 expect(parseUpdateStaffInput({userId,role:'CREW',status:'DISABLED'})).toEqual({
  userId,
  role:'CREW',
  status:'DISABLED',
 });

 for(const bad of [
  {},
  {userId:'not-a-uuid',role:'CREW',status:'ACTIVE'},
  {userId,role:'SUPER_ADMIN',status:'ACTIVE'},
  {userId,role:'CREW',status:'INVALID'},
  {userId,role:'CREW'},
  null,
  undefined,
  123,
 ]){
  expect(()=>parseUpdateStaffInput(bad)).toThrowError(expect.objectContaining({code:'validation'}));
 }
});

it('authorizes as Super Admin first when creating staff, reuses existing auth user, or provisions via ensureAuthUser',async()=>{
 const existingUserId='00000000-0000-4000-8000-000000000099';
 const newUserId='00000000-0000-4000-8000-000000000088';

 const {repo:repoA,authorize:authA,findAuthUserByEmail:findA,upsertStaff:upsertA}=repository(true,existingUserId);
 const ensureAuthUserA=vi.fn();
 const serviceA=createStaffDirectoryService(repoA,ensureAuthUserA);

 const resA=await serviceA.createStaff(userId,companyId,{
  name:'  Budi Santoso  ',
  email:'  BUDI@EXAMPLE.COM  ',
  role:'ADMIN_PO',
 });
 expect(resA).toEqual({userId:existingUserId});
 expect(authA).toHaveBeenCalledWith(expect.anything(),userId);
 expect(findA).toHaveBeenCalledWith(expect.anything(),'budi@example.com');
 expect(authA.mock.invocationCallOrder[0]).toBeLessThan(findA.mock.invocationCallOrder[0]);
 expect(ensureAuthUserA).not.toHaveBeenCalled();
 expect(upsertA).toHaveBeenCalledWith(expect.anything(),{
  companyId,
  userId:existingUserId,
  name:'Budi Santoso',
  email:'budi@example.com',
  role:'ADMIN_PO',
  status:'ACTIVE',
 });

 const {repo:repoB,authorize:authB,findAuthUserByEmail:findB,upsertStaff:upsertB}=repository(true,null);
 const ensureAuthUserB=vi.fn(async()=>newUserId);
 const serviceB=createStaffDirectoryService(repoB,ensureAuthUserB);

 const resB=await serviceB.createStaff(userId,companyId,{
  name:'Dewi Lestari',
  email:'dewi@example.com',
  role:'CREW',
 });
 expect(resB).toEqual({userId:newUserId});
 expect(authB).toHaveBeenCalledWith(expect.anything(),userId);
 expect(findB).toHaveBeenCalledWith(expect.anything(),'dewi@example.com');
 expect(ensureAuthUserB).toHaveBeenCalledWith('dewi@example.com','Dewi Lestari');
 expect(upsertB).toHaveBeenCalledWith(expect.anything(),{
  companyId,
  userId:newUserId,
  name:'Dewi Lestari',
  email:'dewi@example.com',
  role:'CREW',
  status:'ACTIVE',
 });

 const {repo:repoC,upsertStaff:upsertC}=repository(false,null);
 const serviceC=createStaffDirectoryService(repoC);
 await expect(serviceC.createStaff(userId,companyId,{name:'Dewi',email:'dewi@example.com',role:'CREW'})).rejects.toMatchObject({code:'forbidden'});
 await expect(serviceC.createStaff('bad',companyId,{name:'Dewi',email:'dewi@example.com',role:'CREW'})).rejects.toMatchObject({code:'forbidden'});
 expect(upsertC).not.toHaveBeenCalled();

 await expect(serviceB.createStaff(userId,'bad-company',{name:'Dewi',email:'dewi@example.com',role:'CREW'})).rejects.toMatchObject({code:'unavailable'});

 const {repo:repoE}=repository(true,null);
 const serviceE=createStaffDirectoryService(repoE);
 await expect(serviceE.createStaff(userId,companyId,{name:'Dewi',email:'dewi@example.com',role:'CREW'})).rejects.toMatchObject({code:'unavailable'});
});

it('authorizes as Super Admin first when updating staff and calls repo.upsertStaff with validated payload',async()=>{
 const {repo,authorize,upsertStaff}=repository(true);
 const service=createStaffDirectoryService(repo);

 const targetStaffId='b361cb67-452f-4ef4-96b0-80a75d58cff5';
 const res=await service.updateStaff(userId,companyId,{
  userId:targetStaffId,
  role:'HELPDESK',
  status:'DISABLED',
 });
 expect(res).toEqual({userId:targetStaffId});
 expect(authorize).toHaveBeenCalledWith(expect.anything(),userId);
 expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(upsertStaff.mock.invocationCallOrder[0]);
 expect(upsertStaff).toHaveBeenCalledWith(expect.anything(),{
  companyId,
  userId:targetStaffId,
  role:'HELPDESK',
  status:'DISABLED',
 });

 const {repo:unauthRepo,upsertStaff:unauthUpsert}=repository(false);
 const unauthService=createStaffDirectoryService(unauthRepo);
 await expect(unauthService.updateStaff(userId,companyId,{userId:targetStaffId,role:'CREW',status:'ACTIVE'})).rejects.toMatchObject({code:'forbidden'});
 await expect(unauthService.updateStaff('bad',companyId,{userId:targetStaffId,role:'CREW',status:'ACTIVE'})).rejects.toMatchObject({code:'forbidden'});
 expect(unauthUpsert).not.toHaveBeenCalled();

 await expect(service.updateStaff(userId,'bad-company',{userId:targetStaffId,role:'CREW',status:'ACTIVE'})).rejects.toMatchObject({code:'unavailable'});
});

it('implements repository findAuthUserByEmail and upsertStaff with transactional queries',async()=>{
 const fakeClient={} as unknown as Sql;
 const repo=createStaffDirectoryRepository(fakeClient);

 const txFind=vi.fn(async()=>[{id:'user-1'}]) as unknown as DomainTx;
 expect(await repo.findAuthUserByEmail(txFind,'User@Example.com')).toBe('user-1');
 const txFindNull=vi.fn(async()=>[]) as unknown as DomainTx;
 expect(await repo.findAuthUserByEmail(txFindNull,'nobody@example.com')).toBeNull();

 const txMissingCompany=vi.fn(async()=>[]) as unknown as DomainTx;
 await expect(repo.upsertStaff(txMissingCompany,{
  companyId,
  userId,
  role:'ADMIN_PO',
  status:'ACTIVE',
 })).rejects.toMatchObject({code:'unavailable'});

 const txMissingUser=vi.fn(async(strings:TemplateStringsArray)=>{
  const query=strings.join('');
  if(query.includes('from public.companies'))return [{id:companyId}];
  if(query.includes('from public.users'))return [];
  return [];
 }) as unknown as DomainTx;
 await expect(repo.upsertStaff(txMissingUser,{
  companyId,
  userId,
  role:'CREW',
  status:'DISABLED',
 })).rejects.toMatchObject({code:'validation'});

 const executedQueries:string[]=[];
 const txSuccess=vi.fn(async(strings:TemplateStringsArray)=>{
  const query=strings.join('');
  executedQueries.push(query);
  if(query.includes('from public.companies'))return [{id:companyId}];
  return [];
 }) as unknown as DomainTx;
 await repo.upsertStaff(txSuccess,{
  companyId,
  userId,
  name:'Budi Santoso',
  email:'budi@example.com',
  role:'ADMIN_PO',
  status:'ACTIVE',
 });
 expect(executedQueries.some(q=>q.includes('insert into public.users'))).toBe(true);
 expect(executedQueries.some(q=>q.includes('insert into public.memberships'))).toBe(true);
 expect(executedQueries.some(q=>q.includes('update public.memberships'))).toBe(true);
});
