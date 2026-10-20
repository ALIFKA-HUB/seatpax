import type {SearchResult} from './types';
export function filterAndSortTrips(trips:SearchResult[],filters:{classNames:string[];maxFare:string;sort:'departure'|'price'}):SearchResult[]{
 const maximum=/^\d+$/.test(filters.maxFare)?BigInt(filters.maxFare):null;
 return trips.filter(trip=>(!filters.classNames.length||filters.classNames.includes(trip.className))&&(maximum===null||BigInt(trip.fare)<=maximum)).sort((a,b)=>{
  if(filters.sort==='price'){const difference=BigInt(a.fare)-BigInt(b.fare);if(difference!==BigInt(0))return difference<BigInt(0)?-1:1;}
  return Date.parse(a.departureAt)-Date.parse(b.departureAt)||a.tripId.localeCompare(b.tripId);
 });
}
