import {z} from 'zod';
import type {Sql} from 'postgres';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import {inventoryRead} from '@/modules/inventory/transaction';
import type {TicketKeys} from './crypto';

export type TicketView={id:string;tripId:string;companyId:string;assignmentId:string;bookingStatus:'CONFIRMED'|'REFUNDED'|'PAYMENT_CONFLICT';passenger:{name:string;phone:string};snapshot:{tripName:string;vehicleName:string;plateNumber:string;seatCode:string;fromName:string;toName:string;departureAt:string};amount:string;qrToken:string};
type TicketRow=Omit<TicketView,'qrToken'>;
type TicketRepository={client:Sql;readToken:(tx:Sql|DomainTx,id:string,keys:TicketKeys)=>Promise<string|null>;resolveHash:(tx:Sql|DomainTx,token:string)=>Promise<{id:string}|null>};
export function createTicketService(repo:TicketRepository,keys:TicketKeys){
 const uuid=z.uuid(),tokenFormat=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
 async function ownerRow(userId:string,ticketId:string,tx:Sql|DomainTx=repo.client){const rows=await tx<TicketRow[]>`select t.id,t.trip_id as "tripId",t.company_id as "companyId",t.assignment_id as "assignmentId",b.status as "bookingStatus",json_build_object('name',bp.name,'phone',bp.phone) as passenger,b.snapshot,b.amount::text as amount from public.tickets t join public.booking_passengers bp on bp.id=t.booking_passenger_id join public.bookings b on b.id=bp.booking_id where t.id=${ticketId} and b.booker_user_id=${userId}`;return rows[0]??null;}
 async function readMine(userId:string,ticketId:string):Promise<TicketView>{if(!uuid.safeParse(userId).success||!uuid.safeParse(ticketId).success)throw new DomainError('forbidden','Ticket tidak tersedia.');return inventoryRead(async()=>{const row=await ownerRow(userId,ticketId);if(!row||!['CONFIRMED','REFUNDED'].includes(row.bookingStatus))throw new DomainError('forbidden','Ticket tidak tersedia.');const qrToken=await repo.readToken(repo.client,ticketId,keys);if(!qrToken)throw new DomainError('unavailable','Token ticket tidak tersedia.');return {...row,qrToken};});}
 async function listMine(userId:string):Promise<TicketView[]>{if(!uuid.safeParse(userId).success)throw new DomainError('forbidden','Masuk untuk melihat ticket.');const ids=await inventoryRead(()=>repo.client<{id:string}[]>`select t.id from public.tickets t join public.booking_passengers bp on bp.id=t.booking_passenger_id join public.bookings b on b.id=bp.booking_id where b.booker_user_id=${userId} order by b.created_at desc limit 100`);const result:TicketView[]=[];for(const row of ids){try{result.push(await readMine(userId,row.id));}catch(error){if(!(error instanceof DomainError)||error.code!=='forbidden')throw error;}}return result;}
 async function resolveOperational(actor:{userId:string;companyId:string;tripId:string;role:'ADMIN_PO'|'CREW'},rawToken:string):Promise<Omit<TicketView,'qrToken'>>{
  if(!uuid.safeParse(actor.userId).success||!uuid.safeParse(actor.companyId).success||!uuid.safeParse(actor.tripId).success||!z.enum(['ADMIN_PO','CREW']).safeParse(actor.role).success||!tokenFormat.safeParse(rawToken).success)throw new DomainError('forbidden','Ticket tidak tersedia.');
  return inventoryRead(()=>repo.client.begin(async tx=>{
   const match=await repo.resolveHash(tx,rawToken);if(!match)throw new DomainError('forbidden','Ticket tidak tersedia.');
   const rows=await tx<TicketRow[]>`select t.id,t.trip_id as "tripId",t.company_id as "companyId",t.assignment_id as "assignmentId",b.status as "bookingStatus",json_build_object('name',bp.name,'phone',bp.phone) as passenger,b.snapshot,b.amount::text as amount from public.tickets t join public.booking_passengers bp on bp.id=t.booking_passenger_id join public.bookings b on b.id=bp.booking_id where t.id=${match.id} and t.company_id=${actor.companyId} and t.trip_id=${actor.tripId} and b.status='CONFIRMED'`;
   const ticket=rows[0];if(!ticket)throw new DomainError('forbidden','Ticket tidak tersedia.');
   const membership=actor.role==='ADMIN_PO'?await tx<{ok:boolean}[]>`select true as ok from public.memberships m where m.user_id=${actor.userId} and m.company_id=${actor.companyId} and m.status='ACTIVE' and m.role='ADMIN_PO' limit 1`:await tx<{ok:boolean}[]>`select true as ok from public.memberships m where m.user_id=${actor.userId} and m.company_id=${actor.companyId} and m.status='ACTIVE' and m.role='CREW' and exists(select 1 from public.trip_crew_assignments a where a.user_id=m.user_id and a.company_id=m.company_id and a.trip_id=${actor.tripId} and a.membership_id=m.id and a.membership_role='CREW' and a.status='ACTIVE') limit 1`;
   if(!membership.length)throw new DomainError('forbidden','Akses operasional tidak tersedia.');return ticket;
  }));
 }
 return {readMine,listMine,resolveOperational};
}
