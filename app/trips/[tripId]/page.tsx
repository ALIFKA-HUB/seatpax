import Link from 'next/link';
import PassengerShell from '@/app/components/passenger-shell';
import StatePanel from '@/app/components/state-panel';
import {passengerServices} from '../data';
import {getVerifiedUser} from '@/modules/auth/identity';
import SeatSelection from '../components/seat-selection';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function TripPage({params,searchParams}:{params:Promise<{tripId:string}>;searchParams:Promise<Record<string,string|undefined>>}){const {tripId}=await params,p=await searchParams;let v;try{v=await passengerServices().availability.detail(tripId,p.from??'',p.to??'');}catch{} const loggedIn=Boolean(await getVerifiedUser());if(v)return <PassengerShell active="search"><Link className="sp-back" href="/trips">← Cari perjalanan</Link><div className="sp-page-heading"><h1>{v.detail.trip.name}</h1><p className="sp-muted">{v.detail.trip.identity?.routeName} · {v.detail.trip.identity?.className}</p></div><form className="passenger-form"><label>Asal<select name="from" defaultValue={p.from}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Tujuan<select name="to" defaultValue={p.to}>{v.detail.stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="sp-secondary">Terapkan interval</button></form><SeatSelection key={`${p.from}:${p.to}`} initial={v} from={p.from!} to={p.to!} loggedIn={loggedIn}/></PassengerShell>;return <PassengerShell active="search"><StatePanel title="Perjalanan tidak tersedia" action={<Link className="sp-primary" href="/trips">Kembali ke pencarian</Link>}>Interval tidak valid atau inventori belum dapat dibaca. Kursi belum ditahan.</StatePanel></PassengerShell>;}

