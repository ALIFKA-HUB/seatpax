'use server';
import {z} from 'zod';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ensureVerifiedProfile} from '@/modules/access/server';
import {getDatabase} from '@/lib/db';
import {createInventoryRepository} from '@/modules/inventory/repository';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {holdInputSchema} from '@/modules/inventory/validation';
import {DomainError} from '@/modules/access/transaction';
import type {HoldView,AvailabilityView} from '@/modules/inventory/types';
export type Result<T>={ok:true;data:T}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string};
function failure(error:unknown){if(error instanceof z.ZodError)return {ok:false as const,code:'validation' as const,message:'Pilihan tidak valid.'};if(error instanceof DomainError)return {ok:false as const,code:error.code,message:error.message};return {ok:false as const,code:'unavailable' as const,message:'Hasil permintaan belum dapat dipastikan. Coba lagi dengan pilihan yang sama.'};}
export async function createHoldAction(raw:unknown):Promise<Result<HoldView>>{try{const input=holdInputSchema.parse(raw),user=await getVerifiedUser();if(!user)throw new DomainError('forbidden','Masuk untuk menahan kursi.');await ensureVerifiedProfile();return {ok:true,data:await createHoldService(createInventoryRepository(getDatabase().$client)).create(user.id,input)};}catch(e){return failure(e);}}
export async function releaseHoldAction(raw:unknown):Promise<Result<HoldView>>{try{const id=z.uuid().parse(raw),user=await getVerifiedUser();if(!user)throw new DomainError('forbidden','Masuk kembali.');return {ok:true,data:await createHoldService(createInventoryRepository(getDatabase().$client)).release(user.id,id)};}catch(e){return failure(e);}}
export async function readHoldAction(raw:unknown):Promise<Result<HoldView>>{try{const id=z.uuid().parse(raw),user=await getVerifiedUser();if(!user)throw new DomainError('forbidden','Masuk kembali.');return {ok:true,data:await createHoldService(createInventoryRepository(getDatabase().$client)).readMine(user.id,id)};}catch(e){return failure(e);}}
export async function refreshAvailabilityAction(tripId:string,from:string,to:string):Promise<Result<AvailabilityView>>{try{return {ok:true,data:await createAvailabilityService(createInventoryRepository(getDatabase().$client)).detail(tripId,from,to)};}catch(e){return failure(e);}}
