import {DomainError} from '@/modules/access/transaction';
import type {CompanyRepository} from './repository';
import {withSuperAdminTransaction} from './transaction';
import {parseCompanyStatusInput} from './validation';
export function createCompanyService(repo:CompanyRepository){
 return {
  list:(userId:string)=>withSuperAdminTransaction(repo,userId,tx=>repo.list(tx)),
  async changeStatus(userId:string,raw:unknown){const input=parseCompanyStatusInput(raw);return withSuperAdminTransaction(repo,userId,async tx=>{
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
