import Link from 'next/link';
import { IconClipboard, IconQrCode, IconVan } from './crew-icons';
import type { TripDetail } from '@/modules/trip/types';
import SeatGrid from '@/app/admin/components/seat-grid';
import { formatDepartureWib, formatIdr } from '@/app/presentation';

export default function CrewTripSummary({ detail }: { detail: TripDetail }) {
  const { trip, stops, segments, layout } = detail;
  const identity = trip.identity;

  return (
    <div className="crew-stack">
      <section className="crew-panel crew-stack crew-summary-card" aria-label="Ringkasan perjalanan">
        <div className="crew-stack crew-trip-identity">
          <h2>{identity?.routeName ?? trip.name}</h2>
          <p className="crew-departure">{formatDepartureWib(trip.departureAt)}</p>
          {identity && (
            <p className="crew-muted crew-trip-fleet">
              <IconVan size={16} />
              <span>
                {identity.vehicleName} · {identity.plateNumber} · {identity.className}
              </span>
            </p>
          )}
        </div>
        <div className="crew-actions">
          <Link className="crew-button crew-primary" href={`/crew/trips/${trip.id}/scan`}>
            <IconQrCode size={18} />
            <span>Scan QR</span>
          </Link>
          <Link className="crew-button" href={`/crew/trips/${trip.id}/manifest`}>
            <IconClipboard size={18} />
            <span>Manifest penumpang</span>
          </Link>
        </div>
      </section>

      <section className="crew-panel crew-stack" aria-labelledby="crew-schedule-title">
        <div className="crew-section-head">
          <h2 id="crew-schedule-title">Urutan titik naik &amp; turun</h2>
          <p className="crew-muted">{stops.length} pemberhentian terdaftar</p>
        </div>
        <ol className="crew-schedule">
          {stops.map(stop => (
            <li key={stop.sequence}>
              <span className="crew-stop-number" aria-hidden="true">
                {stop.sequence}
              </span>
              <div className="crew-stop-body">
                <h3>{stop.name}</h3>
                <p className="crew-muted">
                  {stop.city}
                  {stop.address ? ' · ' + stop.address : ''}
                </p>
                <dl className="crew-stop-times">
                  <div>
                    <dt>Tiba</dt>
                    <dd>{formatDepartureWib(stop.arrivalAt)}</dd>
                  </div>
                  <div>
                    <dt>Berangkat</dt>
                    <dd>{formatDepartureWib(stop.departureAt)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <details className="crew-panel crew-details">
        <summary>Rincian perjalanan (tarif segmen &amp; denah kursi)</summary>
        <div className="crew-stack">
          <p className="crew-muted">
            Jadwal, tarif, dan denah mengikuti data snapshot saat perjalanan dipublikasikan.
          </p>
          <section className="crew-stack">
            <h2>Tarif per segmen</h2>
            <ul className="crew-fares">
              {segments.map(segment => (
                <li key={segment.sequence}>
                  <span>
                    {stops.find(stop => stop.sequence === segment.fromSequence)?.name} →{' '}
                    {stops.find(stop => stop.sequence === segment.toSequence)?.name}
                  </span>
                  <strong>{formatIdr(segment.price)}</strong>
                </li>
              ))}
            </ul>
          </section>
          {layout && (
            <section className="crew-stack">
              <h2>Denah kursi</h2>
              <SeatGrid layout={layout} />
            </section>
          )}
        </div>
      </details>
    </div>
  );
}
