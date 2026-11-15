import Link from 'next/link';
import {ArrowRight,CalendarBlank,MapPin} from '@phosphor-icons/react/ssr';
import type {SearchResult} from '@/modules/inventory/types';
import {formatDepartureWib,formatIdr} from '../presentation';

const time=(value:string)=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(value));
const dayLabel=(value:string)=>new Intl.DateTimeFormat('id-ID',{weekday:'long',timeZone:'Asia/Jakarta'}).format(new Date(value));

export default function TripCard({trip}:{trip:SearchResult}){
 const duration=trip.arrivalAt?(Date.parse(trip.arrivalAt)-Date.parse(trip.departureAt))/60000:null;
 const validArrival=duration!==null&&Number.isFinite(duration)&&duration>=0;
 const hours=validArrival?Math.floor(duration/60):0;
 const mins=validArrival?Math.floor(duration%60):0;
 const durationText=validArrival?(hours>0&&mins>0?`${hours}j ${mins}m`:hours>0?`${hours} jam`:`${mins} menit`):'Estimasi rute';
 const seatTone=trip.availableCount===0?'is-full':trip.availableCount<=3?'is-low':'is-open';

 return <article className="passenger-card sp-trip-card tp-card">
  <div className="tp-card-main">
   <div className="tp-card-top">
    <div className="tp-card-title-group">
     <h3 className="tp-card-title">{trip.name}</h3>
     <span className="tp-pill-class">{trip.className}</span>
    </div>
    {trip.companyName&&<span className="tp-pill-operator">{trip.companyName}</span>}
   </div>
   <div className="tp-card-route">
    <div className="tp-point">
     <span className="tp-time-row"><strong className="tp-time sp-numbers">{time(trip.departureAt)}</strong><span className="tp-wib">WIB</span></span>
     <span className="tp-stop-name">{trip.originName}</span>
    </div>
    <div className="tp-connector">
     <span>{durationText}</span>
     <div className="tp-connector-line" aria-hidden="true"><span/><ArrowRight size={15}/></div>
    </div>
    <div className="tp-point">
     {validArrival
      ?<span className="tp-time-row"><strong className="tp-time sp-numbers">{time(trip.arrivalAt!)}</strong><span className="tp-wib">WIB</span></span>
      :<strong className="tp-time-unknown">Waktu tiba belum tersedia</strong>}
     <span className="tp-stop-name">{trip.destinationName}</span>
    </div>
   </div>
   <p className="tp-card-meta">
    <span className="tp-card-meta-item"><CalendarBlank size={14} aria-hidden="true"/>{dayLabel(trip.departureAt)}, {formatDepartureWib(trip.departureAt)}</span>
    <span className="tp-card-meta-item"><MapPin size={14} aria-hidden="true"/>{trip.originName} → {trip.destinationName}</span>
   </p>
  </div>
  <div className="tp-card-purchase">
   <span className="tp-fare-label">Tarif per penumpang</span>
   <strong className="sp-fare sp-numbers">{formatIdr(trip.fare)}</strong>
   <span className={`tp-seat-pill ${seatTone}`}>{trip.availableCount} kursi tersedia</span>
   <Link className="sp-primary tp-card-cta" href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}>Pilih kursi<ArrowRight size={17} aria-hidden="true"/></Link>
  </div>
 </article>;
}
