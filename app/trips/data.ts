import 'server-only';
import {z} from 'zod';
import {getDatabase} from '@/lib/db';
import {createDatabaseConnection} from '@/lib/db/connection';
import {getDatabaseEnv} from '@/lib/env/server';
import {createInventoryRepository} from '@/modules/inventory/repository';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {createHoldService} from '@/modules/inventory/hold-service';
import type {DiscoveryInput, SearchInput} from '@/modules/inventory/types';

export type TripActiveHold={id:string;seatCode:string;expiresAt:string};

type AvailabilityService = ReturnType<typeof createAvailabilityService>;
let readConnection:ReturnType<typeof createDatabaseConnection>|undefined;

// Public reads must not queue behind a stalled transaction connection after a
// laptop/network interruption. Bound queue + query time and recycle only the
// read pool on timeout; never terminate the pool used for holds/payment writes.
async function readAvailability<T>(work: (service: AvailabilityService) => Promise<T>): Promise<T> {
 const connection=readConnection??=createDatabaseConnection(getDatabaseEnv().databaseUrl);
 let timer:ReturnType<typeof setTimeout>|undefined;
 try {
  const deadline=new Promise<never>((_,reject)=>{
   timer=setTimeout(()=>{
    if(readConnection===connection)readConnection=undefined;
    void connection.db.$client.end({timeout:0}).catch(()=>{});
    reject(new Error('Passenger read unavailable'));
   },8000);
  });
  const service=createAvailabilityService(createInventoryRepository(connection.db.$client));
  return await Promise.race([work(service),deadline]);
 } finally {
  clearTimeout(timer);
 }
}

export async function activeHoldForTrip(userId:string,tripId:string):Promise<TripActiveHold|null>{
 if(!z.uuid().safeParse(userId).success||!z.uuid().safeParse(tripId).success)return null;
 try{
  const rows=await getDatabase().$client<TripActiveHold[]>`
   select h.id,st.seat_code as "seatCode",h.effective_expires_at::text as "expiresAt"
   from public.seat_holds h
   join public.trip_seats st on st.id=h.trip_seat_id
   where h.held_by_user_id=${userId} and h.trip_id=${tripId} and h.status='ACTIVE' and h.effective_expires_at>clock_timestamp()
   order by h.created_at desc limit 1
  `;
  return rows[0]??null;
 }catch{return null;}
}

export const passengerServices=()=>({
 availability:{
  locations:()=>readAvailability(service=>service.locations()),
  discover:(input:DiscoveryInput)=>readAvailability(service=>service.discover(input)),
  discoverUpcoming:(limit?:number)=>readAvailability(service=>service.discoverUpcoming(limit)),
  detail:(tripId:string,fromStopId:string,toStopId:string)=>readAvailability(service=>service.detail(tripId,fromStopId,toStopId)),
  search:(input:SearchInput)=>readAvailability(service=>service.search(input)),
  searchUpcoming:(fromSourceStopId:string,toSourceStopId:string,limit?:number)=>readAvailability(service=>service.searchUpcoming(fromSourceStopId,toSourceStopId,limit)),
 },
 holds:createHoldService(createInventoryRepository(getDatabase().$client)),
});
