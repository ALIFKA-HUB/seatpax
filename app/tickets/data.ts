import 'server-only';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createTicketRepository} from '@/modules/ticket/repository';
import {createTicketService,type TicketView} from '@/modules/ticket/service';
import type {TicketKeys} from '@/modules/ticket/crypto';

export type ActiveHoldSummary={
 id:string;
 tripName:string;
 fromName:string;
 toName:string;
 departureAt:string;
 seatCode:string;
 expiresAt:string;
};

export type PendingBookingSummary={
 id:string;
 tripName:string;
 fromName:string;
 toName:string;
 departureAt:string;
 seatCode:string;
 amount:string;
};

function service(){
 const text=process.env.TICKET_ENCRYPTION_KEY;
 if(!text||!/^[A-Za-z0-9+/]{43}=$/.test(text))return null;
 const key=Buffer.from(text,'base64');
 if(key.length!==32)return null;
 const keys:TicketKeys={v1:key};
 return createTicketService({...createTicketRepository(),client:getDatabase().$client},keys);
}

export async function ticketsData():Promise<{
 tickets:TicketView[]|null;
 activeHolds:ActiveHoldSummary[];
 pendingBookings:PendingBookingSummary[];
}>{
 const user=await getVerifiedUser();
 if(!user)return {tickets:null,activeHolds:[],pendingBookings:[]};

 const client=getDatabase().$client;
 const [activeHolds,pendingBookings,tickets]=await Promise.all([
  client<ActiveHoldSummary[]>`
   select h.id,t.name as "tripName",s1.name as "fromName",s2.name as "toName",
    s1.departure_at::text as "departureAt",st.seat_code as "seatCode",h.effective_expires_at::text as "expiresAt"
   from public.seat_holds h
   join public.trips t on t.id=h.trip_id
   join public.trip_stops s1 on s1.id=h.from_trip_stop_id
   join public.trip_stops s2 on s2.id=h.to_trip_stop_id
   join public.trip_seats st on st.id=h.trip_seat_id
   where h.held_by_user_id=${user.id} and h.status='ACTIVE' and h.effective_expires_at>clock_timestamp()
   order by h.created_at desc limit 5
  `.catch(()=>[] as ActiveHoldSummary[]),
  client<PendingBookingSummary[]>`
   select b.id,(b.snapshot->>'tripName') as "tripName",(b.snapshot->>'fromName') as "fromName",
    (b.snapshot->>'toName') as "toName",(b.snapshot->>'departureAt') as "departureAt",
    (b.snapshot->>'seatCode') as "seatCode",b.amount::text as amount
   from public.bookings b
   where b.booker_user_id=${user.id} and b.status='PENDING_PAYMENT'
   order by b.created_at desc limit 5
  `.catch(()=>[] as PendingBookingSummary[]),
  (async()=>{
   try{
    const svc=service();
    return svc?await svc.listMine(user.id):null;
   }catch{
    return null;
   }
  })(),
 ]);

 return {tickets,activeHolds,pendingBookings};
}

export async function ticketData(ticketId:string):Promise<TicketView|null>{
 const user=await getVerifiedUser();
 if(!user)return null;
 try{
  const svc=service();
  return svc?await svc.readMine(user.id,ticketId):null;
 }catch{
  return null;
 }
}
