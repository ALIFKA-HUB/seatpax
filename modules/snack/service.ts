import {DomainError} from '@/modules/access/transaction';
import {resourceId} from '@/modules/fleet/template-service';
import type {BoardingActor} from '@/modules/boarding/types';
import type {BoardingRepository} from '@/modules/boarding/repository';
import type {SnackRepository} from './repository';
import {parseSnackInput} from './validation';
export function createSnackService(repo:SnackRepository,boardingRepo:BoardingRepository){return {
 async claim(actor:BoardingActor,tripId:string,raw:unknown){
  resourceId(actor.userId);resourceId(tripId);const input=parseSnackInput(raw);if(actor.role!=='CREW')throw new DomainError('forbidden','Snack hanya dicatat crew yang ditugaskan.');
  try{return await repo.client.begin(async tx=>{
   await tx`set local lock_timeout='5s'`;await tx`set local statement_timeout='15s'`;
   const {companyId}=await boardingRepo.authorize(tx,actor,tripId);await boardingRepo.lockPassenger(tx,tripId,companyId,input.ticketId);
   const passenger=await boardingRepo.passengers(tx,tripId,companyId,input.ticketId);if(passenger.length!==1)throw new DomainError('unavailable','Tiket tidak tersedia pada perjalanan ini.');
   if(!await repo.boarding(tx,tripId,companyId,input.ticketId))throw new DomainError('validation','Catat boarding dahulu sebelum menyerahkan snack.');
   const existing=await repo.existing(tx,tripId,companyId,input.ticketId);if(existing)return {claim:existing,alreadyClaimed:true};
   const claim=await repo.insert(tx,{companyId,tripId,ticketId:input.ticketId,actorId:actor.userId});return {claim,alreadyClaimed:false};
  });}catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Snack belum dapat dicatat. Coba lagi.');}
 },
};}
