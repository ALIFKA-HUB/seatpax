import Link from 'next/link';
import type {TripDetail} from '@/modules/trip/types';
import SeatGrid from '@/app/admin/components/seat-grid';
import {formatIdr,formatDepartureWib} from '@/app/presentation';

export default function CrewTripSummary({detail}:{detail:TripDetail}) {
 const {trip,stops,segments,layout}=detail,identity=trip.identity;
 return <div className="crew-stack">
  <section className="crew-panel crew-stack" aria-label="Ringkasan perjalanan">
   <div className="crew-stack crew-trip-identity"><h2>{identity?.routeName??trip.name}</h2><p className="crew-departure">{formatDepartureWib(trip.departureAt)}</p>
    {identity&&<p className="crew-muted">{identity.vehicleName} · {identity.plateNumber} · {identity.className}</p>}
   </div>
   <div className="crew-actions"><Link className="crew-button crew-primary" href={`/crew/trips/${trip.id}/scan`}>Scan QR</Link><Link className="crew-button" href={`/crew/trips/${trip.id}/manifest`}>Manifest penumpang</Link></div>
  </section>
  <section className="crew-panel crew-stack" aria-labelledby="crew-schedule-title"><h2 id="crew-schedule-title">Jadwal perjalanan</h2>
   <ol className="crew-schedule">{stops.map(stop=><li key={stop.sequence}><span className="crew-stop-number" aria-hidden="true">{stop.sequence}</span><div><h3>{stop.name}</h3><p className="crew-muted">{stop.city}{stop.address?' · '+stop.address:''}</p><dl className="crew-stop-times"><div><dt>Tiba</dt><dd>{formatDepartureWib(stop.arrivalAt)}</dd></div><div><dt>Berangkat</dt><dd>{formatDepartureWib(stop.departureAt)}</dd></div></dl></div></li>)}</ol>
  </section>
  <details className="crew-panel crew-details"><summary>Rincian perjalanan</summary><div className="crew-stack">
   <p className="crew-muted">Jadwal, tarif, dan denah mengikuti data saat perjalanan dipublikasikan.</p>
   <section className="crew-stack"><h2>Tarif per segmen</h2><ul className="crew-fares">{segments.map(segment=><li key={segment.sequence}><span>{stops.find(stop=>stop.sequence===segment.fromSequence)?.name} → {stops.find(stop=>stop.sequence===segment.toSequence)?.name}</span><strong>{formatIdr(segment.price)}</strong></li>)}</ul></section>
   {layout&&<section className="crew-stack"><h2>Denah kursi</h2><SeatGrid layout={layout}/></section>}
  </div></details>
 </div>;
}
