import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import type {InventoryRepository,Snapshot} from './repository';
import type {AvailabilityView,DiscoveryInput,SearchInput,SearchResult} from './types';
import {overlaps,resolveInterval,wibDayBounds} from './interval';
import {quoteInterval} from './fare';
import {searchInputSchema} from './validation';
import {deadlineReached} from './deadline';
export function availability(s:Snapshot,fromId:string,toId:string):AvailabilityView{
 const range=resolveInterval(s.stops,fromId,toId),fare=quoteInterval(s.segments,range);
 const origin=s.stops.find(x=>x.id===fromId)!;
 const cutoff=s.trip.salesCloseAt&&deadlineReached(origin.departureAt,s.trip.salesCloseAt)?s.trip.salesCloseAt:origin.departureAt;
 const seats=s.seats.map(seat=>{if(!seat.id)throw new DomainError('unavailable','Inventori kursi tidak lengkap.');for(let seq=range.from;seq<range.to;seq++)if(s.anchors.filter(a=>a.seatId===seat.id&&a.sequence===seq).length!==1)throw new DomainError('unavailable','Inventori kursi tidak lengkap.');const booked=s.booked.some(a=>a.seatId===seat.id&&overlaps(a,range));return {...seat,id:seat.id,status:booked?'BOOKED' as const:s.holds.some(h=>h.seatId===seat.id&&overlaps(h,range))?'HELD' as const:'AVAILABLE' as const};});
 const {trip,stops,segments,layout,inventoryCount}=s;
 return {detail:{trip,stops,segments,seats:s.seats,layout,inventoryCount},fare,cutoff,serverNow:s.serverNow,saleOpen:s.companyStatus==='ACTIVE'&&trip.status==='OPEN_FOR_SALE'&&!deadlineReached(s.serverNow,cutoff),seats};
}
export function createAvailabilityService(repo:InventoryRepository){
 async function resultsFor(rows:{tripId:string;fromStopId:string;toStopId:string}[]):Promise<SearchResult[]>{
  const results:SearchResult[]=[];
  for(const row of rows){
   let snapshot:Snapshot;
   try{snapshot=await repo.snapshot(repo.client,row.tripId);}catch(error){if(error instanceof DomainError&&error.code==='unavailable')continue;throw error;}
   const view=availability(snapshot,row.fromStopId,row.toStopId);
   if(!view.saleOpen)continue;
   const from=snapshot.stops.find(stop=>stop.id===row.fromStopId)!;
   const to=snapshot.stops.find(stop=>stop.id===row.toStopId)!;
   results.push({...row,name:snapshot.trip.name,companyName:snapshot.companyName,originName:from.name,destinationName:to.name,departureAt:from.departureAt,arrivalAt:to.arrivalAt??null,className:snapshot.trip.identity!.className,fare:view.fare,availableCount:view.seats.filter(seat=>seat.status==='AVAILABLE').length});
  }
  return results;
 }
 return {
 locations:()=>repo.locations(),
 async discover(input:DiscoveryInput){const bounds=wibDayBounds(input.dateWib),rows=await repo.discoveryCandidates(bounds.start,bounds.end,51);return {trips:await resultsFor(rows.slice(0,50)),candidateLimitReached:rows.length>50};},
 async detail(tripId:string,fromStopId:string,toStopId:string){if(![tripId,fromStopId,toStopId].every(x=>z.uuid().safeParse(x).success))throw new DomainError('validation','Pilihan perjalanan tidak valid.');return availability(await repo.snapshot(repo.client,tripId),fromStopId,toStopId);},
 async search(input:SearchInput):Promise<SearchResult[]>{const parsed=searchInputSchema.safeParse(input);if(!parsed.success)throw new DomainError('validation','Pencarian tidak valid.');const bounds=wibDayBounds(input.dateWib);return resultsFor(await repo.candidates(input.fromSourceStopId,input.toSourceStopId,bounds.start,bounds.end));},
 };}
