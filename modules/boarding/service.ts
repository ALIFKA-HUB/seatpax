import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {resourceId} from '@/modules/fleet/template-service';
import {createTicketRepository} from '@/modules/ticket/repository';
import type {BoardingRepository} from './repository';
import type {BoardingActor,ManifestView} from './types';
import {parseBoardingInput,parseTicketToken} from './validation';
export function createBoardingService(repo:BoardingRepository){
 async function run<T>(actor:BoardingActor,tripId:string,work:(tx:DomainTx,companyId:string,name:string,departureAt:string)=>Promise<T>):Promise<T>{
  resourceId(actor.userId);resourceId(tripId);if(actor.role!=='CREW'&&actor.role!=='ADMIN_PO')throw new DomainError('forbidden','Akses ditolak.');
  try{return await repo.client.begin(async tx=>{
   await tx`set local lock_timeout='5s'`;await tx`set local statement_timeout='15s'`;
   const identity=await repo.authorize(tx,actor,tripId);return work(tx,identity.companyId,identity.name,identity.departureAt);
  }) as Awaited<T>;}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Data penumpang belum dapat dibuka. Coba lagi.');}
 }
 async function profile(tx:DomainTx,tripId:string,companyId:string,ticketId:string){const result=await repo.passengers(tx,tripId,companyId,ticketId);if(result.length!==1)throw new DomainError('unavailable','Tiket tidak tersedia pada perjalanan ini.');return result[0];}
 return {
  manifest(actor:BoardingActor,tripId:string):Promise<ManifestView>{return run(actor,tripId,async(tx,companyId,tripName,departureAt)=>{
   const passengers=await repo.passengers(tx,tripId,companyId),stops=await repo.stops(tx,tripId,companyId),capacity=await repo.capacity(tx,tripId,companyId);
   return {tripId,companyId,tripName,departureAt,capacity,passengerCount:passengers.length,boardedCount:passengers.filter(p=>p.boarding!==null).length,stops,passengers};
  });},
  profile(actor:BoardingActor,tripId:string,ticketId:string){resourceId(ticketId);return run(actor,tripId,(tx,companyId)=>profile(tx,tripId,companyId,ticketId));},
  resolve(actor:BoardingActor,tripId:string,raw:string){const token=parseTicketToken(raw);return run(actor,tripId,async(tx,companyId)=>{const ticket=await createTicketRepository().resolveHash(tx,token);if(!ticket)throw new DomainError('unavailable','Tiket tidak tersedia pada perjalanan ini.');return profile(tx,tripId,companyId,ticket.id);});},
  async board(actor:BoardingActor,tripId:string,raw:unknown){
   if(actor.role!=='CREW')throw new DomainError('forbidden','Boarding hanya untuk crew yang ditugaskan.');const input=parseBoardingInput(raw);
   return run(actor,tripId,async(tx,companyId)=>{
    await repo.lockPassenger(tx,tripId,companyId,input.ticketId);
    const passenger=await profile(tx,tripId,companyId,input.ticketId);
    if(passenger.fromStopId!==input.stopId)throw new DomainError('validation','Pilih stop asal penumpang untuk boarding.');
    if(passenger.boarding)return {boarding:passenger.boarding,alreadyBoarded:true};
    const boarding=await repo.insert(tx,{companyId,tripId,ticketId:input.ticketId,stopId:input.stopId,actorId:actor.userId,source:input.source});
    return {boarding,alreadyBoarded:false};
   });
  },
 };
}
