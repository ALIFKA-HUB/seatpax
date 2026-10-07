import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {holdInputSchema} from './validation';
import {resolveInterval,sameHoldPayload} from './interval';
import {availability} from './availability-service';
import {quoteInterval} from './fare';
import {databaseCode,inventoryTransaction} from './transaction';
import type {InventoryRepository} from './repository';
import type {HoldInput,HoldRecord,HoldView} from './types';
import {transition} from './lifecycle';
export function effectiveStatus(h:HoldRecord,now:string){return h.status==='ACTIVE'&&Date.parse(now)>=Date.parse(h.effectiveExpiresAt)?'EXPIRED' as const:h.status;}
function actor(id:string){if(!z.uuid().safeParse(id).success)throw new DomainError('forbidden','Masuk untuk melanjutkan.');}
export function createHoldService(repo:InventoryRepository){
 async function view(tx:DomainTx|InventoryRepository['client'],h:HoldRecord):Promise<HoldView>{const s=await repo.snapshot(tx,h.tripId),{trip,stops,segments,seats,layout,inventoryCount}=s;return {record:h,effectiveStatus:effectiveStatus(h,s.serverNow),serverNow:s.serverNow,detail:{trip,stops,segments,seats,layout,inventoryCount},fare:quoteInterval(s.segments,h)};}
 async function retry(owner:string,input:HoldInput){const h=await repo.byKey(repo.client,owner,input.requestKey);if(!h)return null;if(!sameHoldPayload(h,input))throw new DomainError('conflict','Kunci permintaan sudah dipakai untuk pilihan lain.');return view(repo.client,h);}
 return {
 async create(owner:string,input:HoldInput):Promise<HoldView>{
  actor(owner);if(!holdInputSchema.safeParse(input).success)throw new DomainError('validation','Pilihan kursi tidak valid.');const existing=await retry(owner,input);if(existing)return existing;
  try{return await inventoryTransaction(repo.client,async tx=>{
   await repo.guards(tx,input.tripId);
   const snapshot=await repo.snapshot(tx,input.tripId),range=resolveInterval(snapshot.stops,input.fromStopId,input.toStopId);
   if(!snapshot.seats.some(s=>s.id===input.seatId))throw new DomainError('validation','Kursi tidak tersedia pada perjalanan ini.');
   await repo.anchors(tx,input.tripId,input.seatId,range);
   const previous=await repo.byKey(tx,owner,input.requestKey);if(previous){if(!sameHoldPayload(previous,input))throw new DomainError('conflict','Kunci permintaan sudah dipakai untuk pilihan lain.');return view(tx,previous);}
   // This statement's clock and snapshot are taken after every inventory lock.
   const current=await repo.snapshot(tx,input.tripId),v=availability(current,input.fromStopId,input.toStopId);
   if(!v.saleOpen)throw new DomainError('conflict','Penjualan interval ini sudah ditutup.');
   if(v.seats.find(s=>s.id===input.seatId)?.status!=='AVAILABLE')throw new DomainError('conflict','Kursi sedang ditahan. Pilih kursi lain.');
   const profile=await tx`select id from public.users where id=${owner}`;if(profile.length!==1)throw new DomainError('forbidden','Akun tidak tersedia.');
   const id=randomUUID(),now=current.serverNow;
   await tx`insert into public.seat_holds(id,company_id,trip_id,trip_seat_id,from_trip_stop_id,to_trip_stop_id,from_sequence,to_sequence,held_by_user_id,request_key,created_at,base_expires_at,effective_expires_at) values(${id},${current.trip.companyId},${input.tripId},${input.seatId},${input.fromStopId},${input.toStopId},${range.from},${range.to},${owner},${input.requestKey},${now}::timestamptz,${now}::timestamptz+interval '10 minutes',${now}::timestamptz+interval '10 minutes')`;
   const h=(await repo.own(tx,owner,id))!;await repo.audit(tx,h,'HOLD_CREATED',owner,now);return view(tx,h);
  });}catch(error){if(databaseCode(error)==='23505'){const result=await retry(owner,input);if(result)return result;throw new DomainError('unavailable','Permintaan belum dapat dipastikan. Coba lagi.');}throw error;}
 },
 async readMine(owner:string,id:string){actor(owner);if(!z.uuid().safeParse(id).success)throw new DomainError('validation','Hold tidak valid.');const h=await repo.own(repo.client,owner,id);if(!h)throw new DomainError('forbidden','Hold tidak tersedia.');return view(repo.client,h);},
 async release(owner:string,id:string){actor(owner);if(!z.uuid().safeParse(id).success)throw new DomainError('validation','Hold tidak valid.');const h=await repo.own(repo.client,owner,id);if(!h)throw new DomainError('forbidden','Hold tidak tersedia.');return inventoryTransaction(repo.client,async tx=>view(tx,(await transition(repo,tx,h,owner)).hold));},
 };
}
