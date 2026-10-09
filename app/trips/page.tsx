import Link from 'next/link';
import {passengerServices} from './data';
import SearchForm from './components/search-form';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import TripCard from '../components/trip-card';
export const dynamic='force-dynamic';
export default async function TripsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const p=await searchParams,service=passengerServices().availability;
 let locations:Awaited<ReturnType<typeof service.locations>>=[],results:Awaited<ReturnType<typeof service.search>>|null=null,failed=false;
 try{locations=await service.locations();if(p.from&&p.to&&p.date)results=await service.search({fromSourceStopId:p.from,toSourceStopId:p.to,dateWib:p.date});}catch{failed=true;}
 return <PassengerShell active="search"><div className="sp-page-heading"><p className="eyebrow">Cari perjalanan</p><h1>Pilih tujuan berikutnya.</h1><p className="sp-muted">Pilih asal, tujuan, dan tanggal berangkat dalam WIB.</p></div><SearchForm locations={locations} initial={p}/>{failed?<StatePanel title="Pencarian belum tersedia" tone="danger" action={<Link className="sp-secondary" href="/trips">Ulangi pencarian</Link>}><p>Periksa pilihan pencarian atau coba lagi sebentar.</p></StatePanel>:results!==null?<section aria-label="Hasil pencarian"><div className="sp-result-heading"><h2>{results.length} perjalanan</h2></div>{results.length===0?<StatePanel title="Belum ada perjalanan"><p>Tidak ada perjalanan yang sedang dijual untuk pilihan ini. Coba tanggal atau tujuan lain.</p></StatePanel>:results.map(trip=><TripCard key={trip.tripId} trip={trip}/>)}</section>:<p className="sp-muted">Perjalanan yang tersedia akan muncul setelah Anda mencari.</p>}</PassengerShell>;
}
