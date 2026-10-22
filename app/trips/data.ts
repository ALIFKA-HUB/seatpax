import 'server-only';
import {getDatabase} from '@/lib/db';
import {createDatabaseConnection} from '@/lib/db/connection';
import {getDatabaseEnv} from '@/lib/env/server';
import {createInventoryRepository} from '@/modules/inventory/repository';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {createHoldService} from '@/modules/inventory/hold-service';
import type {DiscoveryInput, SearchInput} from '@/modules/inventory/types';

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

export const passengerServices=()=>({
 availability:{
  locations:()=>readAvailability(service=>service.locations()),
  discover:(input:DiscoveryInput)=>readAvailability(service=>service.discover(input)),
  detail:(tripId:string,fromStopId:string,toStopId:string)=>readAvailability(service=>service.detail(tripId,fromStopId,toStopId)),
  search:(input:SearchInput)=>readAvailability(service=>service.search(input)),
 },
 holds:createHoldService(createInventoryRepository(getDatabase().$client)),
});
