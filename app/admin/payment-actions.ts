'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {getDatabase} from '@/lib/db';
import {AccessError,requireAccess} from '@/modules/access/server';
import {DomainError} from '@/modules/access/transaction';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createConflictService} from '@/modules/payment/conflict-service';

export type PaymentActionResult<T>={ok:true;data:T}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string};
const id=z.uuid();
const command=z.object({action:z.enum(['CONFIRM','MOCK_REFUND']),requestKey:id,reason:z.string().trim().min(1).max(500)});

export async function resolvePaymentConflictAction(companyId:string,bookingId:string,raw:unknown):Promise<PaymentActionResult<unknown>>{
 try{
  const company=id.parse(companyId),booking=id.parse(bookingId),input=command.parse(raw);
  const actor=await requireAccess('tenant.admin',company);
  const data=await createConflictService(createPaymentRepository(getDatabase().$client)).resolve({userId:actor.userId,companyId:company},booking,input);
  revalidatePath(`/admin/companies/${company}/payment-conflicts`,'page');
  revalidatePath(`/admin/companies/${company}/payment-conflicts/${booking}`,'page');
  return {ok:true,data};
 }catch(error){
  if(error instanceof z.ZodError)return {ok:false,code:'validation',message:'Periksa alasan dan pilihan penyelesaian.'};
  if(error instanceof AccessError)return {ok:false,code:error.reason==='unavailable'?'unavailable':'forbidden',message:error.reason==='unavailable'?'Akses belum dapat diperiksa. Coba lagi.':'Akses ditolak.'};
  if(error instanceof DomainError)return {ok:false,code:error.code,message:error.message};
  return {ok:false,code:'unavailable',message:'Penyelesaian belum berhasil. Coba lagi.'};
 }
}
