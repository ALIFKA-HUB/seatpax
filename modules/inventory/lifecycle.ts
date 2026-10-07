import {DomainError,type DomainTx} from '@/modules/access/transaction';
import type {InventoryRepository} from './repository';
import type {HoldRecord} from './types';
import {deadlineReached} from './deadline';
export async function transition(repo:InventoryRepository,tx:DomainTx,identity:HoldRecord,owner:string|null){
 await repo.guards(tx,identity.tripId);await repo.anchors(tx,identity.tripId,identity.seatId,identity);
 const h=await repo.own(tx,identity.ownerId,identity.id,true);if(!h)throw new DomainError('forbidden','Hold tidak tersedia.');
 const now=await repo.now(tx);if(h.status!=='ACTIVE')return {hold:h,changed:false};
 const expired=deadlineReached(now,h.effectiveExpiresAt);
 if(!expired&&owner===null)return {hold:h,changed:false};
 if(!expired&&h.paymentInitiatedAt)throw new DomainError('conflict','Hold sudah memasuki proses pembayaran.');
 const status=expired?'EXPIRED':'RELEASED';
 await tx`update public.seat_holds set status=${status},released_at=${expired?null:now}::timestamptz,expired_at=${expired?now:null}::timestamptz where id=${h.id}`;
 await repo.audit(tx,h,expired?'HOLD_EXPIRED':'HOLD_RELEASED',expired?null:owner,now);
 return {hold:(await repo.own(tx,h.ownerId,h.id))!,changed:true};
}
