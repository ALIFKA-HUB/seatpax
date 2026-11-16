import Link from 'next/link';
import {ArrowLeft,Clock,MapPin,Van} from '@phosphor-icons/react/ssr';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
import {formatDepartureWib} from '@/app/presentation';
import {passengerServices} from '../data';
import {getVerifiedUser} from '@/modules/auth/identity';
import SeatSelection from '../components/seat-selection';
import '../../passenger.css';
import '../../components/passenger-flow.css';

export const dynamic='force-dynamic';

export default async function TripPage({params,searchParams}:{params:Promise<{tripId:string}>;searchParams:Promise<Record<string,string|undefined>>}){
 const {tripId}=await params,p=await searchParams;
 let v;
 try{v=await passengerServices().availability.detail(tripId,p.from??'',p.to??'');}catch{}
 const loggedIn=Boolean(await getVerifiedUser());

 if(!v)return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar"><Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Kembali ke jadwal</Link></div>
   <StatePanel title="Perjalanan tidak tersedia" action={<Link className="sp-primary" href="/trips">Lihat jadwal lain</Link>}>
    Interval naik atau turun tidak valid atau perjalanan sudah ditutup. Kursi belum ditahan.
   </StatePanel>
  </div>
 </PassengerShell>;

 const originName=v.detail.stops.find(s=>s.id===p.from)?.name;
 const destName=v.detail.stops.find(s=>s.id===p.to)?.name;
 const identity=v.detail.trip.identity;

 return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar">
    <Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Semua jadwal</Link>
    <BookingStepper step={1}/>
   </div>
   <header className="pf-head" aria-labelledby="trip-seat-title">
    <h1 id="trip-seat-title">{v.detail.trip.name}</h1>
    <div className="pf-fact-row" aria-label="Ringkasan armada dan batas pemesanan">
     {originName&&destName&&<span className="pf-fact-chip"><MapPin size={15} aria-hidden="true"/>{originName} ke {destName}</span>}
     {identity&&<span className="pf-fact-chip"><Van size={15} aria-hidden="true"/>{identity.className}, {identity.vehicleName} ({identity.plateNumber})</span>}
     <span className="pf-fact-chip"><Clock size={15} aria-hidden="true"/>Batas pesan {formatDepartureWib(v.cutoff)}</span>
    </div>
   </header>
   <SeatSelection key={`${p.from}:${p.to}`} initial={v} from={p.from!} to={p.to!} loggedIn={loggedIn}/>
  </div>
 </PassengerShell>;
}
