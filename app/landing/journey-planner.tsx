import Link from 'next/link';
import {MapPin,ArrowRight} from '@phosphor-icons/react/ssr';
import {passengerServices} from '@/app/trips/data';
import LandingSearch from './search';
export default async function JourneyPlanner(){
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
 let points:{id:string;name:string;city:string}[]=[],failed=false;
 try{points=await passengerServices().availability.locations();}catch{failed=true;}
 const cities=[...new Set(points.map(p=>p.city))].slice(0,4);
 return <><section className="lp-search-panel" aria-labelledby="planner-title" id="cari-perjalanan"><h2 id="planner-title">Mau pergi ke mana?</h2><LandingSearch locations={points} date={date}/>{failed?<p className="lp-search-note" role="status">Titik keberangkatan belum dapat dimuat. <Link href="/">Muat ulang</Link> atau periksa perjalanan dari menu Perjalanan.</p>:!points.length?<p className="lp-search-note">Belum ada titik dengan jadwal yang dibuka. Pilih tanggal dan cari perjalanan untuk memeriksa ketersediaan.</p>:null}</section>
 <section className="lp-network" aria-labelledby="network-title"><div className="lp-section-title"><h2 id="network-title">Rute & titik keberangkatan</h2><p>Temukan titik naik dan tujuan yang tersedia untuk perjalanan Anda.</p></div>
 {cities.length?<div className="lp-points">{cities.map(city=><div className="lp-point" key={city}><MapPin size={25} weight="duotone" aria-hidden="true"/><div><h3>{city}</h3><p>{points.filter(p=>p.city===city).slice(0,3).map(p=>p.name).join(', ')}</p></div></div>)}</div>:<div className="lp-network-empty"><MapPin size={32} aria-hidden="true"/><div><h3>Perjalanan berikutnya menanti.</h3><p>{failed?'Daftar titik belum dapat ditampilkan saat ini.':'Rute dan titik naik akan tampil setelah jadwal perjalanan dibuka.'}</p></div></div>}
 <Link href="/trips" className="lp-text-link">Lihat jadwal<ArrowRight size={18} aria-hidden="true"/></Link></section></>;
}
export function PlannerSkeleton(){return <><section className="lp-search-panel" aria-busy="true" aria-label="Memuat pencarian perjalanan"><h2>Mau pergi ke mana?</h2><div className="lp-search-skeleton" aria-hidden="true"><span/><span/><span/><span/></div><p className="lp-search-note" role="status">Memuat titik keberangkatan…</p></section><section className="lp-network" aria-label="Memuat titik keberangkatan"><div className="lp-section-title"><h2>Rute & titik keberangkatan</h2></div><p>Memuat jadwal yang tersedia…</p></section></>;}
