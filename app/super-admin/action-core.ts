import {DomainError} from '@/modules/access/transaction';
import {parseCompanyStatusInput} from '@/modules/company/validation';
import type {CompanySummary} from '@/modules/company/types';
export type CompanyActionResult={ok:true;result:{company:CompanySummary;changed:boolean}}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string};
const messages={validation:'Periksa keputusan status PO.',forbidden:'Akses Super Admin ditolak.',conflict:'Status PO berubah. Muat ulang lalu pilih kembali.',unavailable:'Status PO belum dapat diproses. Coba lagi.'};
export function createCompanyActions(deps:{getUserId:()=>Promise<string|null>;changeStatus:(actor:string,raw:unknown)=>Promise<{company:CompanySummary;changed:boolean}>}){return {
 async change(raw:unknown):Promise<CompanyActionResult>{try{const actor=await deps.getUserId();if(!actor)throw new DomainError('forbidden',messages.forbidden);const input=parseCompanyStatusInput(raw);return {ok:true,result:await deps.changeStatus(actor,input)};}catch(error){const code=error instanceof DomainError?error.code:'unavailable';return {ok:false,code,message:messages[code]};}},
};}
