'use server';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ensureVerifiedProfile} from '@/modules/access/server';
import {getDatabase} from '@/lib/db';
import {parsePaymentEnv} from '@/lib/env/payment';
import {createBookingRepository} from '@/modules/booking/repository';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createBookingQueryService} from '@/modules/booking/query-service';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createInventoryRepository} from '@/modules/inventory/repository';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createMidtransProvider} from '@/modules/payment/midtrans-provider';
import {createPaymentCreationService} from '@/modules/payment/creation-service';
import type {CheckoutInput,InitiationActor} from '@/modules/booking/types';
import {createCheckoutActions} from './action-core';
function services(){const client=getDatabase().$client,bookings=createBookingRepository(client),inventory=createInventoryRepository(client);let config;try{config=parsePaymentEnv(process.env);}catch{config=null;}return {getActor:async()=>{const user=await getVerifiedUser();if(!user?.email)return null;await ensureVerifiedProfile();return {userId:user.id,verifiedEmail:user.email};},readHold:async(userId:string,id:string)=>{const view=await createHoldService(inventory).readMine(userId,id);return {record:{id:view.record.id,ownerId:view.record.ownerId},fare:view.fare};},initiate:(actor:InitiationActor,input:CheckoutInput)=>createCheckoutService(bookings).initiate(actor,input),prepare:async(userId:string,id:string)=>{if(!config)return {state:'UNAVAILABLE' as const};return createPaymentCreationService(createPaymentRepository(client),createMidtransProvider(config)).prepareMine(userId,id);},readBooking:async(userId:string,id:string)=>createBookingQueryService(bookings).readMine(userId,id),paymentEnabled:Boolean(config)};}
export async function startCheckoutAction(raw:unknown){return createCheckoutActions(services()).start(raw);}
export async function refreshBookingAction(id:unknown){return createCheckoutActions(services()).refresh(id);}
export async function prepareBookingPaymentAction(id:unknown){return createCheckoutActions(services()).prepareExisting(id);}
