import Link from 'next/link';
import {MapPin} from '@phosphor-icons/react/ssr';
import {passengerServices} from '@/app/trips/data';
import LandingSearch from './search';
export default async function JourneyPlanner(){
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
 let points:{id:string;name:string;city:string}[]=[],failed=false;
 try{points=await passengerServices().availability.locations();}catch{failed=true;}
 return <><section className="lp-search-panel" aria-labelledby="planner-title" id="cari-perjalanan"><h2 id="planner-title">Mau pergi ke mana?</h2><LandingSearch locations={points} date={date}/>{failed?<p className="lp-search-note" role="status">Titik keberangkatan belum dapat dimuat. <Link href="/">Muat ulang</Link> atau periksa perjalanan dari menu Perjalanan.</p>:!points.length?<p className="lp-search-note">Belum ada titik dengan jadwal yang dibuka. Pilih tanggal dan cari perjalanan untuk memeriksa ketersediaan.</p>:null}</section>
 <RouteShowcase/></>;
}
// Intentionally empty presentation, independent of actual searchable inventory.
function RouteShowcase(){return <section className="lp-network" aria-labelledby="network-title"><div className="lp-section-title"><h2 id="network-title">Temukan perjalanan Anda</h2><p>Pilihan perjalanan antarkota bersama Seatpax.</p></div><div className="lp-network-empty"><span className="lp-empty-icon"><MapPin size={29} weight="light" aria-hidden="true"/></span><div><h3>Daftar perjalanan belum ditampilkan.</h3><p>Informasi rute dan jadwal akan hadir di sini.</p></div></div></section>;}
export function PlannerSkeleton(){return <><section className="lp-search-panel" aria-busy="true" aria-label="Memuat pencarian perjalanan"><h2>Mau pergi ke mana?</h2><div className="lp-search-skeleton" aria-hidden="true"><span/><span/><span/><span/></div><p className="lp-search-note" role="status">Memuat titik keberangkatan…</p></section><RouteShowcase/></>;}
