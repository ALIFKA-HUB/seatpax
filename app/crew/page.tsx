import Link from 'next/link';
import {crewData} from './data';
import {formatDepartureWib} from '@/app/presentation';
export default async function Page() {
 const {actorId,crew}=await crewData(),trips=await crew.listMine(actorId);
 return <><header className="crew-page-header"><p className="crew-eyebrow">Ruang kerja Crew</p><h1>Perjalanan saya</h1><p className="crew-muted">Perjalanan yang sudah dibuka dan ditugaskan kepada akun ini.</p></header>
  {trips.length?<ul className="crew-trip-list">{trips.map(trip=><li key={trip.id}><Link className="crew-panel crew-trip-card" href={'/crew/trips/'+trip.id}><div><p className="crew-eyebrow">{formatDepartureWib(trip.departureAt)}</p><h2>{trip.name}</h2><p>{trip.identity?.routeName}</p>{trip.identity&&<p className="crew-muted">{trip.identity.vehicleName} · {trip.identity.plateNumber}</p>}</div><span className="crew-card-arrow" aria-hidden="true">→</span></Link></li>)}</ul>:<section className="crew-panel"><h2>Belum ada perjalanan yang ditugaskan</h2><p className="crew-muted">Admin PO akan menambahkan penugasan.</p></section>}
 </>;
}
