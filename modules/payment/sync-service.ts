import {z} from 'zod';
import type {Sql} from 'postgres';
import type {PaymentEnv} from '@/lib/env/payment';
import {DomainError} from '@/modules/access/transaction';
import {createBookingRepository} from '@/modules/booking/repository';
import {createBookingQueryService} from '@/modules/booking/query-service';
import type {BookingView} from '@/modules/booking/types';
import {createConfirmationService} from './confirmation-service';
import {createMidtransProvider,paymentOutcome} from './midtrans-provider';
import {createPaymentRepository,type PaymentRepository} from './repository';
import type {PaymentProvider} from './types';

type Confirmation=Pick<ReturnType<typeof createConfirmationService>,'apply'>;

/** Synchronizes a single pending booking against the authenticated payment provider status endpoint. */
export function createPaymentSyncService(
 repo:PaymentRepository,
 provider:Pick<PaymentProvider,'status'>,
 confirmation:Confirmation,
){
 return {
  async syncMine(owner:string,bookingId:string):Promise<BookingView|null>{
   if(!z.uuid().safeParse(owner).success||!z.uuid().safeParse(bookingId).success){
    throw new DomainError('forbidden','Booking tidak tersedia.');
   }
   const current=await repo.booking.view(repo.client,owner,bookingId);
   if(!current)return null;
   if(current.paymentStatus!=='PENDING'||current.creationState==='NOT_STARTED')return current;
   try{
    const observation=await provider.status(current.orderId);
    if(!observation||paymentOutcome(observation)==='PENDING')return current;
    return await confirmation.apply(observation);
   }catch{
    return (await repo.booking.view(repo.client,owner,bookingId).catch(()=>null))??current;
   }
  },
 };
}

/** Reads a booking owned by `owner` and reconciles pending payments when Sandbox credentials are configured. */
export async function readOrSyncMyBooking(client:Sql,owner:string,bookingId:string,config:PaymentEnv|null):Promise<BookingView>{
 if(!config)return createBookingQueryService(createBookingRepository(client)).readMine(owner,bookingId);
 const repo=createPaymentRepository(client);
 const view=await createPaymentSyncService(repo,createMidtransProvider(config),createConfirmationService(repo,config)).syncMine(owner,bookingId);
 if(!view)throw new DomainError('forbidden','Booking tidak tersedia.');
 return view;
}
