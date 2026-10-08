import type {InventoryRepository} from './repository';
import {inventoryTransaction} from './transaction';
import {transition} from './lifecycle';
export function createCleanupService(repo:InventoryRepository){return {async expireBatch(limit=100){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Batch must be between 1 and 100');
 const candidates=await repo.client<{id:string;ownerId:string}[]>`select id,held_by_user_id as "ownerId" from public.seat_holds where status='ACTIVE' and effective_expires_at<=clock_timestamp() order by effective_expires_at,id limit ${limit}`;
 let expired=0,failed=0;for(const candidate of candidates)try{const h=await repo.own(repo.client,candidate.ownerId,candidate.id);if(h&&await inventoryTransaction(repo.client,async tx=>{const result=await transition(repo,tx,h,null);if(result.changed){const booking=await tx<{id:string}[]>`select id from public.bookings where seat_hold_id=${h.id} for update`;if(booking.length)await tx`update public.bookings set status='EXPIRED' where id=${booking[0].id} and status='PENDING_PAYMENT'`;}return result.changed;}))expired++;}catch{failed++;}
 return {examined:candidates.length,expired,failed};
 }};}
