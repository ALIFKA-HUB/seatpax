import Link from 'next/link';
import PassengerShell from '@/app/components/passenger-shell';
import {passengerServices} from '../data';
import {getVerifiedUser} from '@/modules/auth/identity';
import SeatSelection from '../components/seat-selection';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function TripPage({params,searchParams}:{params:Promise<{tripId:string}>;searchParams:Promise<Record<string,string|undefined>>}){const {tripId}=await params,p=await searchParams;let v;try{v=await passengerServices().availability.detail(tripId,p.from??'',p.to??'');}catch{} const loggedIn=Boolean(await getVerifiedUser());if(v)return <PassengerShell active="search"><Link href="/trips">← Cari perjalanan</Link><h1>{v.detail.trip.name}</h1><p>{v.detail.trip.identity?.routeName} · {v.detail.trip.identity?.className}</p><form className="passenger-form"><label>Asal<select name="from" defaultValue={p.from}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Tujuan<select name="to" defaultValue={p.to}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="sp-secondary">Terapkan interval</button></form><SeatSelection key={`${p.from}:${p.to}`} initial={v} from={p.from!} to={p.to!} loggedIn={loggedIn}/></PassengerShell>;return <PassengerShell active="search"><h1>Perjalanan tidak tersedia</h1><p>Interval tidak valid atau inventori belum dapat dibaca. Kursi belum ditahan.</p><Link href="/trips">Kembali ke pencarian</Link></PassengerShell>;}

