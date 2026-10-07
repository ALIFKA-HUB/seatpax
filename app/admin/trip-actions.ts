'use server';
import {z} from 'zod';import {revalidatePath} from 'next/cache';import {getVerifiedUser} from '@/modules/auth/identity';import {getDatabase} from '@/lib/db';import {DomainError} from '@/modules/access/transaction';import {createTripRepository} from '@/modules/trip/repository';import {createDraftService} from '@/modules/trip/draft-service';import {createPublicationService} from '@/modules/trip/publication-service';import {createCrewService} from '@/modules/trip/crew-service';import type {Context} from '@/modules/access/transaction';
export type TripActionResult<T>={ok:true;data:T}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string};
const id=z.uuid(),revision=z.number().int().positive();
async function command<T,C>(companyId:string,raw:unknown,schema:z.ZodType<C>,work:(ctx:Context,repo:ReturnType<typeof createTripRepository>,cmd:C)=>Promise<T>):Promise<TripActionResult<T>>{
 try{id.parse(companyId);const cmd=schema.parse(raw),user=await getVerifiedUser();if(!user)return {ok:false,code:'forbidden',message:'Masuk kembali untuk melanjutkan.'};
 const data=await work({actorId:user.id,companyId},createTripRepository(getDatabase().$client),cmd);revalidatePath('/admin/companies/'+companyId,'layout');revalidatePath('/crew','layout');return {ok:true,data};
 }catch(error){if(error instanceof z.ZodError)return {ok:false,code:'validation',message:'Periksa isian permintaan.'};if(error instanceof DomainError)return {ok:false,code:error.code,message:error.message};return {ok:false,code:'unavailable',message:'Permintaan belum berhasil. Coba lagi.'};}
}
export async function saveTripAction(companyId:string,raw:unknown){return command(companyId,raw,z.object({input:z.unknown(),id:id.optional(),revision:revision.optional()}),(ctx,repo,c)=>createDraftService(repo).save(ctx,c.input,c.id,c.revision));}
export async function publishTripAction(companyId:string,raw:unknown){return command(companyId,raw,z.object({id,revision}),(ctx,repo,c)=>createPublicationService(repo).publish(ctx,c.id,c.revision));}
export async function setTripCrewAction(companyId:string,raw:unknown){return command(companyId,raw,z.object({id,userId:id,status:z.enum(['ACTIVE','REVOKED'])}),(ctx,repo,c)=>createCrewService(repo).setAssignment(ctx,c.id,c.userId,c.status));}
