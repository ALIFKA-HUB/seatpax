import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import {withSuperAdminTransaction} from '@/modules/company/transaction';
import {directoryQuerySchema} from './validation';
import type {StaffDirectoryQuery} from './types';
import type {StaffDirectoryRepository} from './repository';

export function createStaffDirectoryService(repo:StaffDirectoryRepository){return {
 async read(userId:string,companyId:string,query:StaffDirectoryQuery){
  if(!z.uuid().safeParse(companyId).success)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
  const parsed=directoryQuerySchema.safeParse(query);
  if(!parsed.success)throw new DomainError('validation','Filter petugas tidak valid.');
  return withSuperAdminTransaction(repo,userId,tx=>repo.read(tx,companyId,parsed.data));
 },
};}
