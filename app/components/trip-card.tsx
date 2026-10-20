import Link from 'next/link';
import {ArrowRight,MapPin} from '@phosphor-icons/react/ssr';
import type {SearchResult} from '@/modules/inventory/types';
import {formatDepartureWib,formatIdr} from '../presentation';
const time=(value:string)=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(value));
export default function TripCard({trip}:{trip:SearchResult}){
 const duration=trip.arrivalAt?(Date.parse(trip.arrivalAt)-Date.parse(trip.departureAt))/60000:null;
 const validArrival=duration!==null&&Number.isFinite(duration)&&duration>=0;
 return <article className="passenger-card sp-trip-card sp-discovery-card">
  <div className="sp-trip-main"><div className="sp-trip-operator"><span className="sp-operator-mark" aria-hidden="true">{trip.companyName.trim().slice(0,1)}</span><strong>{trip.companyName}</strong><span className="sp-class-tag">{trip.className}</span></div>
   <div className="sp-trip-route"><div><strong className="sp-route-time">{time(trip.departureAt)}</strong><span>{trip.originName}</span></div><div className="sp-route-connector"><span>{validArrival?`${Math.floor(duration/60)}j ${Math.floor(duration%60)}m`:'WIB'}</span><div aria-hidden="true"><span/><ArrowRight size={16}/></div></div><div><strong className="sp-route-time">{validArrival?time(trip.arrivalAt!):'Belum tersedia'}</strong><span>{trip.destinationName}</span></div></div>
   <p className="sp-trip-date"><MapPin size={15} aria-hidden="true"/>{formatDepartureWib(trip.departureAt)}{!validArrival&&<span> · Waktu tiba belum tersedia</span>}</p>
  </div><div className="sp-trip-purchase"><span className="sp-price-label">Harga per penumpang</span><strong className="sp-fare sp-numbers">{formatIdr(trip.fare)}</strong><span className="sp-availability">{trip.availableCount} kursi tersedia</span><Link className="sp-primary" href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}>Pilih kursi<ArrowRight size={18} aria-hidden="true"/></Link></div>
 </article>;
}
