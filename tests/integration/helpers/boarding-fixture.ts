import type {Sql} from 'postgres';
import {randomUUID} from 'node:crypto';
import {inventoryFixture} from './inventory-fixture';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createCheckoutService} from '@/modules/booking/checkout-service';
import {createBookingRepository} from '@/modules/booking/repository';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createConfirmationService} from '@/modules/payment/confirmation-service';
import {createCrewService} from '@/modules/trip/crew-service';
import {createTripRepository} from '@/modules/trip/repository';
import {createTicketRepository} from '@/modules/ticket/repository';
type Fixture=Parameters<Parameters<typeof inventoryFixture>[1]>[0];
const keys={v1:Buffer.alloc(32,7)};
export async function boardingFixture(c:Sql,run:(f:Fixture&{confirmed:(from?:number,to?:number,seat?:number)=>Promise<{ticketId:string;token:string}>;pending:()=>Promise<string>})=>Promise<void>){
 await inventoryFixture(c,async f=>{
  await createCrewService(createTripRepository(c)).setAssignment(f.a,f.detail.trip.id,f.crewId,'ACTIVE');
  async function booking(from=0,to=3,seat=0){const h=await createHoldService(f.repo).create(f.a.actorId,f.inputHold(from,to,seat));return createCheckoutService(createBookingRepository(c)).initiate({userId:f.a.actorId,verifiedEmail:'fixture@example.test'},{holdId:h.record.id,requestKey:randomUUID(),mode:'OTHER',name:'Passenger fixture',phone:'+6281234567890'});}
  await run({...f,pending:async()=> (await booking(0,3,1)).id,confirmed:async(from=0,to=3,seat=0)=>{
   const b=await booking(from,to,seat),view=await createConfirmationService(createPaymentRepository(c),{keys,keyVersion:'v1',merchantId:'GTEST'}).apply({orderId:b.orderId,transactionId:'txn-'+b.orderId,merchantId:'GTEST',amount:b.amount,currency:'IDR',status:'settlement',fraudStatus:'accept',paymentType:'bank_transfer',verifiedAt:new Date().toISOString()});
   if(!view.ticketId)throw new Error('Fixture confirmation failed');
   const token=await createTicketRepository().readToken(c,view.ticketId,keys);if(!token)throw new Error('Fixture token unavailable');return {ticketId:view.ticketId,token};
  }});
 });
}
