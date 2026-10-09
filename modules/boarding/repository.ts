import type {Sql} from 'postgres';
import {DomainError,type DomainTx} from '@/modules/access/transaction';
import type {BoardingActor,PassengerProfile} from './types';
export function createBoardingRepository(client:Sql){return {
 client,
 async authorize(tx:DomainTx,actor:BoardingActor,tripId:string){
  const identity=await tx<{companyId:string}[]>`select company_id as "companyId" from public.trips where id=${tripId}`;
  if(!identity.length)throw new DomainError('forbidden','Perjalanan tidak tersedia.');
  const companyId=identity[0].companyId;
  const membership=await tx<{id:string}[]>`select id from public.memberships where company_id=${companyId} and user_id=${actor.userId} and role=${actor.role} and status='ACTIVE' for share`;
  if(membership.length!==1)throw new DomainError('forbidden','Akses perjalanan ditolak.');
  await tx`select id from public.companies where id=${companyId} for share`;
  const trips=await tx<{name:string;departureAt:string}[]>`select name,departure_at::text as "departureAt" from public.trips where id=${tripId} and company_id=${companyId} and status='OPEN_FOR_SALE' for share`;
  if(!trips.length)throw new DomainError('forbidden','Perjalanan tidak tersedia.');
  if(actor.role==='CREW'){
   const assignment=await tx`select id from public.trip_crew_assignments where trip_id=${tripId} and company_id=${companyId} and user_id=${actor.userId} and membership_id=${membership[0].id} and status='ACTIVE' for share`;
   if(assignment.length!==1)throw new DomainError('forbidden','Crew tidak ditugaskan pada perjalanan ini.');
  }
  return {companyId,...trips[0]};
 },
 async passengers(tx:DomainTx,tripId:string,companyId:string,ticketId?:string):Promise<PassengerProfile[]>{
  return await tx<PassengerProfile[]>`select t.id as "ticketId",p.name,s.seat_code as "seatCode",origin.id as "fromStopId",a.from_sequence as "fromSequence",origin.name as "fromName",destination.name as "toName",b.snapshot->>'tripName' as "tripName",b.snapshot->>'vehicleName' as "vehicleName",b.snapshot->>'plateNumber' as "plateNumber",origin.departure_at::text as "departureAt",
   case when e.id is null then null else json_build_object('id',e.id,'ticketId',e.ticket_id,'tripId',e.trip_id,'stopId',e.boarding_stop_id,'actorId',e.actor_user_id,'source',e.source,'boardedAt',e.boarded_at::text) end as boarding
   from public.tickets t join public.booking_passengers p on p.id=t.booking_passenger_id and p.trip_id=t.trip_id and p.company_id=t.company_id
   join public.bookings b on b.id=p.booking_id and b.trip_id=t.trip_id and b.company_id=t.company_id and b.status='CONFIRMED'
   join public.seat_assignments a on a.id=t.assignment_id and a.booking_passenger_id=p.id and a.trip_id=t.trip_id and a.company_id=t.company_id
   join public.trip_seats s on s.id=a.trip_seat_id and s.trip_id=t.trip_id and s.company_id=t.company_id
   join public.trip_stops origin on origin.trip_id=t.trip_id and origin.company_id=t.company_id and origin.sequence=a.from_sequence
   join public.trip_stops destination on destination.trip_id=t.trip_id and destination.company_id=t.company_id and destination.sequence=a.to_sequence
   left join public.boarding_events e on e.ticket_id=t.id and e.trip_id=t.trip_id and e.company_id=t.company_id
   where t.trip_id=${tripId} and t.company_id=${companyId} ${ticketId?tx`and t.id=${ticketId}`:tx``}
   order by s.seat_code,a.from_sequence,t.id`;
 },
 async stops(tx:DomainTx,tripId:string,companyId:string){return await tx<{id:string;name:string;sequence:number}[]>`select id,name,sequence from public.trip_stops where trip_id=${tripId} and company_id=${companyId} order by sequence`;},
 async capacity(tx:DomainTx,tripId:string,companyId:string){return (await tx<{capacity:number}[]>`select count(*)::int as capacity from public.trip_seats where trip_id=${tripId} and company_id=${companyId}`)[0].capacity;},
};}
export type BoardingRepository=ReturnType<typeof createBoardingRepository>;
