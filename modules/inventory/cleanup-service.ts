import type {InventoryRepository} from './repository';
import {inventoryTransaction} from './transaction';
import {transition} from './lifecycle';
export function createCleanupService(repo:InventoryRepository){return {async expireBatch(limit=100){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Batch must be between 1 and 100');
 const candidates=await repo.client<{id:string;ownerId:string}[]>`select id,held_by_user_id as "ownerId" from public.seat_holds where status='ACTIVE' and effective_expires_at<=clock_timestamp() order by effective_expires_at,id limit ${limit}`;
 let expired=0,failed=0;for(const candidate of candidates)try{const h=await repo.own(repo.client,candidate.ownerId,candidate.id);if(h&&await inventoryTransaction(repo.client,async tx=>(await transition(repo,tx,h,null)).changed))expired++;}catch{failed++;}
 return {examined:candidates.length,expired,failed};
 }};}
