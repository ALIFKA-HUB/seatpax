import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import {withSuperAdminTransaction} from '@/modules/company/transaction';
import {directoryQuerySchema,parseCreateStaffInput,parseUpdateStaffInput} from './validation';
import type {StaffDirectoryQuery} from './types';
import type {StaffDirectoryRepository} from './repository';

export function createStaffDirectoryService(
 repo:StaffDirectoryRepository,
 ensureAuthUser?:(email:string,name:string)=>Promise<string>
){return {
 async read(userId:string,companyId:string,query:StaffDirectoryQuery){
  if(!z.uuid().safeParse(companyId).success)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  const parsed=directoryQuerySchema.safeParse(query);
  if(!parsed.success)throw new DomainError('validation','Filter petugas tidak valid.');
  return withSuperAdminTransaction(repo,userId,tx=>repo.read(tx,companyId,parsed.data));
 },
 async createStaff(actorId:string,companyId:string,raw:unknown):Promise<{userId:string}>{
  if(!z.uuid().safeParse(companyId).success)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  const input=parseCreateStaffInput(raw);
  return withSuperAdminTransaction(repo,actorId,async tx=>{
   let targetUserId=await repo.findAuthUserByEmail(tx,input.email);
   if(!targetUserId){
    if(!ensureAuthUser)throw new DomainError('unavailable','Layanan autentikasi belum tersedia.');
    targetUserId=await ensureAuthUser(input.email,input.name);
    if(!targetUserId||!z.uuid().safeParse(targetUserId).success)throw new DomainError('unavailable','Gagal mendaftarkan akun petugas.');
   }
   await repo.upsertStaff(tx,{
    companyId,
    userId:targetUserId,
    name:input.name,
    email:input.email,
    role:input.role,
    status:'ACTIVE',
   });
   return {userId:targetUserId};
  });
 },
 async updateStaff(actorId:string,companyId:string,raw:unknown):Promise<{userId:string}>{
  if(!z.uuid().safeParse(companyId).success)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  const input=parseUpdateStaffInput(raw);
  return withSuperAdminTransaction(repo,actorId,async tx=>{
   await repo.upsertStaff(tx,{
    companyId,
    userId:input.userId,
    role:input.role,
    status:input.status,
   });
   return {userId:input.userId};
  });
 },
};}
