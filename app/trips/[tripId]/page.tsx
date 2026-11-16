import Link from 'next/link';
import {ArrowLeft} from '@phosphor-icons/react/ssr';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
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
    Interval naik/turun tidak valid atau perjalanan sudah ditutup. Kursi belum ditahan.
   </StatePanel>
  </div>
 </PassengerShell>;

 return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar">
    <Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Semua jadwal</Link>
    <BookingStepper step={1}/>
   </div>
   <section className="pf-hero" aria-labelledby="trip-seat-title">
    <div>
     <p className="pf-eyebrow">{v.detail.trip.identity?.className??'Shuttle'} / {v.detail.trip.identity?.vehicleName??'Armada'}</p>
     <h1 id="trip-seat-title">{v.detail.trip.name}</h1>
     <p className="pf-hero-sub">{v.detail.trip.identity?.routeName??'Rute perjalanan shuttle'} ({v.detail.stops.length} titik pemberhentian)</p>
    </div>
   </section>
   <form className="pf-interval-bar" aria-label="Ubah titik naik dan turun">
    <label>Titik naik<select name="from" defaultValue={p.from}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>Titik turun<select name="to" defaultValue={p.to}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <button className="sp-secondary" type="submit">Ubah rute naik/turun</button>
   </form>
   <SeatSelection key={`${p.from}:${p.to}`} initial={v} from={p.from!} to={p.to!} loggedIn={loggedIn}/>
  </div>
 </PassengerShell>;
}
