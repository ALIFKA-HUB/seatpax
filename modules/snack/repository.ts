import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
import type {SnackClaim} from './types';
export function createSnackRepository(client:Sql){return {
 client,
 async boarding(tx:DomainTx,tripId:string,companyId:string,ticketId:string){return (await tx`select id from public.boarding_events where ticket_id=${ticketId} and trip_id=${tripId} and company_id=${companyId} for share`).length===1;},
 async existing(tx:DomainTx,tripId:string,companyId:string,ticketId:string){return (await tx<SnackClaim[]>`select id,company_id as "companyId",trip_id as "tripId",ticket_id as "ticketId",actor_user_id as "actorId",claimed_at::text as "claimedAt" from public.snack_claims where ticket_id=${ticketId} and trip_id=${tripId} and company_id=${companyId}`)[0]??null;},
 async insert(tx:DomainTx,input:{companyId:string;tripId:string;ticketId:string;actorId:string}){return (await tx<SnackClaim[]>`insert into public.snack_claims(company_id,trip_id,ticket_id,actor_user_id) values(${input.companyId},${input.tripId},${input.ticketId},${input.actorId}) returning id,company_id as "companyId",trip_id as "tripId",ticket_id as "ticketId",actor_user_id as "actorId",claimed_at::text as "claimedAt"`)[0];},
};}
export type SnackRepository=ReturnType<typeof createSnackRepository>;
