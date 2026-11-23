import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import type {InventoryRepository,Snapshot} from './repository';
import type {AvailabilityView,DiscoveryInput,NetworkCatalog,SearchInput,SearchResult} from './types';
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
  const resolved=await Promise.all(rows.map(async(row):Promise<SearchResult|null>=>{
   let snapshot:Snapshot;
   try{snapshot=await repo.snapshot(repo.client,row.tripId);}catch(error){if(error instanceof DomainError&&error.code==='unavailable')return null;throw error;}
   const view=availability(snapshot,row.fromStopId,row.toStopId);
   if(!view.saleOpen)return null;
   const from=snapshot.stops.find(stop=>stop.id===row.fromStopId)!;
   const to=snapshot.stops.find(stop=>stop.id===row.toStopId)!;
   const intervalStops=snapshot.stops.filter(stop=>stop.sequence>=from.sequence&&stop.sequence<=to.sequence).sort((a,b)=>a.sequence-b.sequence);
   const identity=snapshot.trip.identity;
   return {
    ...row,
    name:snapshot.trip.name,
    companyName:snapshot.companyName,
    originName:from.name,
    destinationName:to.name,
    departureAt:from.departureAt,
    arrivalAt:to.arrivalAt??null,
    className:identity!.className,
    fare:view.fare,
    availableCount:view.seats.filter(seat=>seat.status==='AVAILABLE').length,
    routeName:identity?.routeName??null,
    vehicleName:identity?.vehicleName??null,
    plateNumber:identity?.plateNumber??null,
    seatCapacity:snapshot.seats.length,
    stopCount:intervalStops.length,
    intermediateStops:intervalStops.slice(1,-1).map(stop=>stop.name),
    originCity:from.city??null,
    originAddress:from.address??null,
    destinationCity:to.city??null,
    destinationAddress:to.address??null,
    cutoff:view.cutoff,
   };
  }));
  return resolved.filter((item):item is SearchResult=>item!==null);
 }
 return {
 locations:()=>repo.locations(),
 networkCatalog:async():Promise<NetworkCatalog>=>typeof repo.networkCatalog==='function'?repo.networkCatalog():{routes:[],classes:[]},
 async discover(input:DiscoveryInput){const bounds=wibDayBounds(input.dateWib),rows=await repo.discoveryCandidates(bounds.start,bounds.end,51);return {trips:await resultsFor(rows.slice(0,50)),candidateLimitReached:rows.length>50};},
 async discoverUpcoming(limit=50){const cap=Math.max(1,Math.min(limit,50));const rows=await repo.upcomingCandidates(cap+1);return {trips:await resultsFor(rows.slice(0,cap)),candidateLimitReached:rows.length>cap};},
 async detail(tripId:string,fromStopId:string,toStopId:string){if(![tripId,fromStopId,toStopId].every(x=>z.uuid().safeParse(x).success))throw new DomainError('validation','Pilihan perjalanan tidak valid.');return availability(await repo.snapshot(repo.client,tripId),fromStopId,toStopId);},
 async search(input:SearchInput):Promise<SearchResult[]>{const parsed=searchInputSchema.safeParse(input);if(!parsed.success)throw new DomainError('validation','Pencarian tidak valid.');const bounds=wibDayBounds(input.dateWib);return resultsFor(await repo.candidates(input.fromSourceStopId,input.toSourceStopId,bounds.start,bounds.end));},
 async searchUpcoming(fromSourceStopId:string,toSourceStopId:string,limit=50):Promise<SearchResult[]>{const parsed=searchInputSchema.pick({fromSourceStopId:true,toSourceStopId:true}).safeParse({fromSourceStopId,toSourceStopId});if(!parsed.success)throw new DomainError('validation','Pencarian tidak valid.');const cap=Math.max(1,Math.min(limit,50));return resultsFor((await repo.upcomingRouteCandidates(fromSourceStopId,toSourceStopId,cap+1)).slice(0,cap));},
 };}
