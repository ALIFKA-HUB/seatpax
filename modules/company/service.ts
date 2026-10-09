import {z} from 'zod';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import type {CompanyRepository} from './repository';
import {parseCompanyStatusInput} from './validation';
export function createCompanyService(repo:CompanyRepository){
 async function authorized<T>(userId:string,work:(tx:DomainTx)=>Promise<T>):Promise<T>{
  if(!z.uuid().safeParse(userId).success)throw new DomainError('forbidden','Akses Super Admin ditolak.');
  try{return await repo.client.begin(async tx=>{
   await tx`set local lock_timeout='5s'`;await tx`set local statement_timeout='15s'`;
   if(!await repo.authorize(tx,userId))throw new DomainError('forbidden','Akses Super Admin ditolak.');
   return work(tx);
  }) as Awaited<T>;}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Status PO belum dapat diproses. Coba lagi.');}
 }
 return {
  list:(userId:string)=>authorized(userId,tx=>repo.list(tx)),
  async changeStatus(userId:string,raw:unknown){const input=parseCompanyStatusInput(raw);return authorized(userId,async tx=>{
   const company=await repo.company(tx,input.companyId);if(!company)throw new DomainError('unavailable','PO tidak tersedia.');
   if(company.statusRevision!==input.expectedStatusRevision)throw new DomainError('conflict','Status PO sudah berubah. Muat ulang lalu pilih kembali.');
   if(company.status===input.target)return {company,changed:false};
   if(company.statusRevision===2147483647)throw new DomainError('conflict','Status PO belum dapat diubah. Hubungi pengelola.');
   const updated=await repo.update(tx,company.id,input.target,company.statusRevision+1);
   await repo.audit(tx,{companyId:company.id,actorId:userId,fromStatus:company.status,toStatus:input.target,statusRevision:updated.statusRevision});
   return {company:updated,changed:true};
  });},
 };
}
