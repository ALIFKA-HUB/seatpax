import Link from 'next/link';
import {passengerServices} from '@/app/trips/data';
import LandingSearch from './search';
export default async function JourneyPlanner(){
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
 let points:{id:string;name:string;city:string}[]=[],failed=false;
 try{points=await passengerServices().availability.locations();}catch{failed=true;}
 return <section className="lp-search-panel" aria-labelledby="planner-title"><h2 id="planner-title">Mau pergi ke mana?</h2><LandingSearch locations={points} date={date}/>{failed?<p className="lp-search-note" role="status">Titik keberangkatan belum dapat dimuat. <Link href="/">Muat ulang</Link> atau periksa perjalanan dari menu Perjalanan.</p>:!points.length?<p className="lp-search-note">Belum ada titik dengan jadwal yang dibuka. Pilih tanggal dan cari perjalanan untuk memeriksa ketersediaan.</p>:null}</section>;
}
export function PlannerSkeleton(){return <section className="lp-search-panel" aria-busy="true" aria-label="Memuat pencarian perjalanan"><h2>Mau pergi ke mana?</h2><div className="lp-search-skeleton" aria-hidden="true"><span/><span/><span/><span/></div><p className="lp-search-note" role="status">Memuat titik keberangkatan…</p></section>;}
