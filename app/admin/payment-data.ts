import 'server-only';
import {notFound,redirect} from 'next/navigation';
import {z} from 'zod';
import {getDatabase} from '@/lib/db';
import {requireAccess,AccessError} from '@/modules/access/server';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createConflictService} from '@/modules/payment/conflict-service';
import type {ConflictActor,ConflictRow} from '@/modules/payment/conflict-service';
export function paymentConflictData(companyId:string,bookingId:string):Promise<{actor:ConflictActor;detail:ConflictRow}>;
export function paymentConflictData(companyId:string):Promise<{actor:ConflictActor;conflicts:ConflictRow[];reviews:Awaited<ReturnType<ReturnType<typeof createConflictService>['listReview']>>}>;
export async function paymentConflictData(companyId:string,bookingId?:string):Promise<{actor:ConflictActor;detail:ConflictRow}|{actor:ConflictActor;conflicts:ConflictRow[];reviews:Awaited<ReturnType<ReturnType<typeof createConflictService>['listReview']>>}>{
 if(!z.uuid().safeParse(companyId).success||bookingId&&!z.uuid().safeParse(bookingId).success)notFound();
 try{const authorized=await requireAccess('tenant.admin',companyId),actor={userId:authorized.userId,companyId},service=createConflictService(createPaymentRepository(getDatabase().$client));
  if(bookingId){const detail=await service.read(actor,bookingId);return {actor,detail};}
  const [conflicts,reviews]=await Promise.all([service.list(actor),service.listReview(actor)]);return {actor,conflicts,reviews};
 }catch(error){if(error instanceof AccessError&&error.reason==='unauthenticated')redirect('/login');notFound();}
}
