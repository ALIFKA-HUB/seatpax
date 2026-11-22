import Link from 'next/link';
import { IconCalendar, IconClipboard, IconQrCode, IconVan } from './crew-icons';
import type { TripDetail } from '@/modules/trip/types';
import SeatGrid from '@/app/admin/components/seat-grid';
import { formatDepartureWib, formatIdr } from '@/app/presentation';

export default function CrewTripSummary({ detail }: { detail: TripDetail }) {
  const { trip, stops, segments, layout } = detail;
  const identity = trip.identity;

  return (
    <div className="crew-stack">
      <section
        className="crew-panel crew-table-card crew-summary-card"
        aria-label="Ringkasan perjalanan"
      >
        <div className="crew-panel-head">
          <h2>{identity?.routeName ?? trip.name}</h2>
          <span className="crew-time-badge">
            <IconCalendar size={15} />
            <span>{formatDepartureWib(trip.departureAt)}</span>
          </span>
        </div>
        <div className="crew-summary-body">
          {identity && (
            <div className="crew-muted crew-trip-fleet">
              <IconVan size={16} />
              <span>{identity.vehicleName}</span>
              <span className="crew-code-pill">{identity.plateNumber}</span>
              <span className="crew-status-pill is-info">{identity.className}</span>
            </div>
          )}
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
        </div>
      </section>

      <section
        className="crew-panel crew-table-card"
        aria-labelledby="crew-schedule-title"
      >
        <div className="crew-panel-head">
          <h2 id="crew-schedule-title">
            Urutan titik naik &amp; turun <span className="crew-count">{stops.length}</span>
          </h2>
          <span className="crew-status-pill is-neutral">{stops.length} pemberhentian terdaftar</span>
        </div>
        <ol className="crew-schedule">
          {stops.map(stop => (
            <li key={stop.sequence}>
              <span className="crew-stop-number" aria-hidden="true">
                {stop.sequence}
              </span>
              <div className="crew-stop-body">
                <h3>{stop.name}</h3>
                <p className="crew-muted crew-stop-location">
                  <span className="crew-stop-city">{stop.city}</span>
                  {stop.address && (
                    <span className="crew-code-pill crew-stop-address">{stop.address}</span>
                  )}
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

      <details className="crew-panel crew-table-card crew-details">
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
