import type {CompanySummary} from '@/modules/company/types';
import type {CompanyActionResult} from './action-core';
export function applyCompanyResult(rows:CompanySummary[],company:CompanySummary){return rows.map(row=>row.id===company.id&&company.statusRevision>=row.statusRevision?company:row);}
export function reconcileCompanyRows(companies:CompanySummary[],results:CompanySummary[]){return companies.map(company=>{const existing=results.find(r=>r.id===company.id);return existing&&existing.statusRevision>company.statusRevision?existing:company;});}
export function createCompanyController(change:(raw:unknown)=>Promise<CompanyActionResult>,refresh:()=>void){
 let confirming:CompanySummary|null=null,pending=false,message='',companyId:string|null=null;
 return {
  state:()=>({confirming,pending,message,companyId}),
  request:(company:CompanySummary)=>{if(!pending){confirming=company;companyId=company.id;message='';}},
  cancel:()=>{if(!pending){confirming=null;message='';}},
  async confirm(){if(pending||!confirming)return null;const submitted=confirming;pending=true;message='';
   try{const result=await change({companyId:submitted.id,target:submitted.status==='ACTIVE'?'SUSPENDED':'ACTIVE',expectedStatusRevision:submitted.statusRevision});
    if(result.ok){if(result.result.company.id!==submitted.id){message='Respons PO tidak sesuai. Muat ulang.';return null;}confirming=null;message=result.result.changed?'Status PO tersimpan.':'Status PO sudah sesuai.';return result.result;}
    message=result.message;if(result.code==='conflict'){confirming=null;refresh();}return null;
   }catch{message='Koneksi bermasalah. Coba lagi atau muat ulang.';return null;}finally{pending=false;}
  },
 };
}
