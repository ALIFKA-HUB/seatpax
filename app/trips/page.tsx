import Link from 'next/link';
import {passengerServices} from './data';
import SearchForm from './components/search-form';
import TripDiscovery from './components/trip-discovery';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import {DomainError} from '@/modules/access/transaction';
import type {SearchResult} from '@/modules/inventory/types';
import {readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
export const dynamic='force-dynamic';
export default async function TripsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const raw=await searchParams;
 const p=readDiscoveryQuery(raw,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}));
 const date=p.date;
 let locations:{id:string;name:string;city:string}[]=[],trips:SearchResult[]=[],candidateLimitReached=false;
 let failed=false,validation='',invalid=p.malformed;
 try{
  if(invalid)throw new DomainError('validation','Pencarian tidak valid.');
  const service=passengerServices().availability;
  locations=await service.locations();
  if(p.from&&p.to)trips=await service.search({fromSourceStopId:p.from,toSourceStopId:p.to,dateWib:date});
  else{
   if(p.from||p.to)validation='Pilih asal dan tujuan untuk mencari rute.';
   ({trips,candidateLimitReached}=await service.discover({dateWib:date}));
  }
 }catch(error){if(error instanceof DomainError&&error.code==='validation'){invalid=true;validation='Pilihan pencarian tidak valid. Periksa asal, tujuan, dan tanggal.';}else failed=true;}
 return <PassengerShell active="search">
  <section className="sp-discover-header" aria-labelledby="discovery-title"><p className="sp-greeting">Halo!</p><h1 id="discovery-title">Perjalanan berikutnya ke mana?</h1><p className="sp-discover-intro">Pilih perjalanan yang cocok untuk Anda.</p><SearchForm key={`${p.from}-${p.to}-${date}`} locations={locations} initial={{from:p.from,to:p.to,date}}/></section>
  {validation&&<p role="alert" className="sp-search-validation">{validation}</p>}
  {failed?<StatePanel title="Perjalanan belum dapat dimuat" tone="danger" action={<Link className="sp-secondary" href="/trips">Coba lagi</Link>}><p>Koneksi sedang bermasalah. Coba lagi sebentar.</p></StatePanel>:invalid?<StatePanel title="Periksa pilihan perjalanan" action={<Link href="/trips" className="sp-secondary">Reset pencarian</Link>}><p>Gunakan satu asal, satu tujuan, dan tanggal yang valid.</p></StatePanel>:<TripDiscovery key={`${p.from}-${p.to}-${date}`} trips={trips} candidateLimitReached={candidateLimitReached} dateWib={date}/>}
 </PassengerShell>;
}
