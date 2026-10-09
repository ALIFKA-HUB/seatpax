import postgres,{type Sql} from 'postgres';
import {parseMigrationEnvironment} from '@/lib/env/migration';
import {tripFixture} from './trip-fixture';
import {createTripRepository} from '@/modules/trip/repository';
import {createDraftService} from '@/modules/trip/draft-service';
import {createPublicationService} from '@/modules/trip/publication-service';
import {createInventoryRepository} from '@/modules/inventory/repository';
import type {TripDetail} from '@/modules/trip/types';
import type {HoldInput} from '@/modules/inventory/types';
import {randomUUID} from 'node:crypto';
import {cleanPaymentFixture} from './payment-cleanup';
import {scopedPaymentClient} from './scoped-payment-client';
type Base=Parameters<Parameters<typeof tripFixture>[1]>[0];
export const inventoryClient=()=>postgres(parseMigrationEnvironment(process.env).url,{ssl:{rejectUnauthorized:true},prepare:false,max:10,connect_timeout:15});
export async function inventoryFixture(c:Sql,run:(f:Base&{detail:TripDetail;inputHold:(from?:number,to?:number,seat?:number)=>HoldInput;repo:ReturnType<typeof createInventoryRepository>})=>Promise<void>){await tripFixture(c,async f=>{
 const trips=createTripRepository(c),draft=await createDraftService(trips).save(f.a,f.input);await createPublicationService(trips).publish(f.a,draft.tripId,1);const detail=await createDraftService(trips).detail(f.a,draft.tripId);
 try{await run({...f,detail,repo:createInventoryRepository(scopedPaymentClient(c,f.a.companyId)),inputHold:(from=0,to=3,seat=0)=>({tripId:draft.tripId,seatId:detail.seats[seat].id!,fromStopId:detail.stops[from].id!,toStopId:detail.stops[to].id!,requestKey:randomUUID()})});}finally{await cleanPaymentFixture(c,[f.a.companyId,f.b.companyId]);await c`delete from public.seat_hold_audit_events where company_id=${f.a.companyId}`;await c`delete from public.seat_holds where company_id=${f.a.companyId}`;}
 });}
