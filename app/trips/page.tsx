import Link from 'next/link';
import {passengerServices} from './data';
import SearchForm from './components/search-form';
import TripDiscovery from './components/trip-discovery';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import {DomainError} from '@/modules/access/transaction';
import type {SearchResult} from '@/modules/inventory/types';
import {readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
import './trips.css';

export const dynamic='force-dynamic';

function wibDateKey(iso:string){
 return new Date(iso).toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
}

function formatDateChip(dateWib:string){
 return new Intl.DateTimeFormat('id-ID',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Jakarta'}).format(new Date(`${dateWib}T12:00:00+07:00`));
}

export default async function TripsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const raw=await searchParams;
 const p=readDiscoveryQuery(raw,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}));
 const date=p.date;
 let locations:{id:string;name:string;city:string}[]=[];
 let trips:SearchResult[]=[];
 let fallbackTrips:SearchResult[]=[];
 const quickDates:{dateWib:string;label:string}[]=[];
 let candidateLimitReached=false;
 let failed=false,validation='',invalid=p.malformed;

 try{
  if(invalid)throw new DomainError('validation','Pencarian tidak valid.');
  const service=passengerServices().availability;

  if(p.from&&p.to){
   const [locs,matched]=await Promise.all([
    service.locations(),
    p.hasExplicitDate
     ?service.search({fromSourceStopId:p.from,toSourceStopId:p.to,dateWib:date})
     :service.searchUpcoming(p.from,p.to),
   ]);
   locations=locs;
   trips=matched;
   if(trips.length===0){
    const routeUpcoming=p.hasExplicitDate?await service.searchUpcoming(p.from,p.to,6):[];
    fallbackTrips=routeUpcoming.length>0?routeUpcoming:(await service.discoverUpcoming(6)).trips;
   }
   const datePool=trips.length>0?trips:fallbackTrips;
   const seen=new Set<string>();
   for(const t of datePool){
    const k=wibDateKey(t.departureAt);
    if(!seen.has(k)){seen.add(k);quickDates.push({dateWib:k,label:formatDateChip(k)});}
    if(quickDates.length>=5)break;
   }
  }else if(p.from||p.to){
   validation='Pilih asal dan tujuan untuk mencari rute spesifik, atau kosongkan keduanya untuk melihat semua jadwal.';
   const [locs,upcoming]=await Promise.all([service.locations(),service.discoverUpcoming(50)]);
   locations=locs;
   trips=upcoming.trips;
   candidateLimitReached=upcoming.candidateLimitReached;
  }else if(p.hasExplicitDate){
   const [locs,dayResult,upcomingResult]=await Promise.all([
    service.locations(),
    service.discover({dateWib:date}),
    service.discoverUpcoming(50),
   ]);
   locations=locs;
   trips=dayResult.trips;
   candidateLimitReached=dayResult.candidateLimitReached;
   if(trips.length===0)fallbackTrips=upcomingResult.trips.slice(0,8);
   const seen=new Set<string>();
   for(const t of upcomingResult.trips){
    const k=wibDateKey(t.departureAt);
    if(!seen.has(k)){seen.add(k);quickDates.push({dateWib:k,label:formatDateChip(k)});}
    if(quickDates.length>=5)break;
   }
  }else{
   const [locs,upcoming]=await Promise.all([service.locations(),service.discoverUpcoming(50)]);
   locations=locs;
   trips=upcoming.trips;
   candidateLimitReached=upcoming.candidateLimitReached;
   const seen=new Set<string>();
   for(const t of upcoming.trips){
    const k=wibDateKey(t.departureAt);
    if(!seen.has(k)){seen.add(k);quickDates.push({dateWib:k,label:formatDateChip(k)});}
    if(quickDates.length>=5)break;
   }
  }
 }catch(error){
  if(error instanceof DomainError&&error.code==='validation'){
   invalid=true;
   validation='Pilihan pencarian tidak valid. Periksa asal, tujuan, dan tanggal.';
  }else{
   failed=true;
  }
 }

 const shownCount=trips.length>0?trips.length:fallbackTrips.length;

 return <PassengerShell active="search">
  <div className="tp-page">
   <section className="tp-hero" aria-labelledby="discovery-title">
    <div className="tp-hero-top">
     <div>
      <p className="tp-eyebrow">Jadwal Shuttle Resmi</p>
      <h1 id="discovery-title">Pilih jadwal keberangkatan Anda</h1>
      <p className="tp-hero-sub">Lihat semua jadwal shuttle yang sedang dibuka, pilih titik naik–turun, lalu kunci kursi Anda secara langsung.</p>
     </div>
     {!failed&&!invalid&&<div className="tp-hero-stats" aria-label="Ringkasan ketersediaan">
      <span className="tp-stat-chip"><span className="tp-stat-dot" aria-hidden="true"/>{shownCount} jadwal aktif</span>
      {locations.length>0&&<span className="tp-stat-chip">{locations.length} titik pemberhentian</span>}
     </div>}
    </div>
    <SearchForm
     key={`${p.from??''}-${p.to??''}-${p.hasExplicitDate?date:''}`}
     locations={locations}
     initial={{from:p.from,to:p.to,date,hasExplicitDate:p.hasExplicitDate}}
    />
   </section>

   {validation&&<p role="alert" className="sp-search-validation">{validation}</p>}

   {failed?<StatePanel title="Perjalanan belum dapat dimuat" tone="danger" action={<Link className="sp-secondary" href="/trips">Coba lagi</Link>}><p>Koneksi ke jadwal perjalanan sedang bermasalah. Coba muat ulang sebentar lagi.</p></StatePanel>
    :invalid?<StatePanel title="Periksa pilihan perjalanan" action={<Link href="/trips" className="sp-secondary">Tampilkan semua jadwal</Link>}><p>Gunakan titik asal, tujuan, dan tanggal yang valid.</p></StatePanel>
    :<TripDiscovery
     key={`${p.from??''}-${p.to??''}-${p.hasExplicitDate?date:'all'}`}
     trips={trips}
     fallbackTrips={fallbackTrips}
     locations={locations}
     quickDates={quickDates}
     candidateLimitReached={candidateLimitReached}
     dateWib={date}
     hasExplicitDate={p.hasExplicitDate}
     from={p.from}
     to={p.to}
    />}
  </div>
 </PassengerShell>;
}
