import type {SearchResult} from './types';
export function readDiscoveryQuery(raw:Record<string,string|string[]|undefined>,today:string):{from?:string;to?:string;date:string;malformed:boolean}{
 const value=(key:string)=>typeof raw[key]==='string'?raw[key] as string:undefined;
 return {from:value('from'),to:value('to'),date:value('date')??today,malformed:['from','to','date'].some(key=>Array.isArray(raw[key]))};
}
export function filterAndSortTrips(trips:SearchResult[],filters:{classNames:string[];maxFare:string;sort:'departure'|'price'}):SearchResult[]{
 const maximum=/^\d+$/.test(filters.maxFare)?BigInt(filters.maxFare):null;
 return trips.filter(trip=>(!filters.classNames.length||filters.classNames.includes(trip.className))&&(maximum===null||BigInt(trip.fare)<=maximum)).sort((a,b)=>{
  if(filters.sort==='price'){const difference=BigInt(a.fare)-BigInt(b.fare);if(difference!==BigInt(0))return difference<BigInt(0)?-1:1;}
  return Date.parse(a.departureAt)-Date.parse(b.departureAt)||a.tripId.localeCompare(b.tripId);
 });
}
