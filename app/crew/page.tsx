import Link from 'next/link';
import { IconCalendar, IconClipboard, IconMapPin, IconQrCode, IconVan } from './components/crew-icons';
import { crewData } from './data';
import { formatDepartureWib } from '@/app/presentation';

export default async function Page() {
  const { actorId, crew } = await crewData();
  const trips = await crew.listMine(actorId);

  return (
    <>
      <header className="crew-page-header crew-home-head">
        <div className="crew-home-head-top">
          <div>
            <p className="crew-eyebrow">Ruang kerja Crew</p>
            <h1>Perjalanan saya</h1>
          </div>
          {trips.length > 0 && (
            <span className="crew-count-pill">{trips.length} jadwal aktif ditugaskan</span>
          )}
        </div>
        <p className="crew-muted">
          Pilih <strong>Manifest &amp; Check-in</strong> untuk absen penumpang dan snack, atau{' '}
          <strong>Scan QR</strong> untuk memindai tiket saat penumpang naik.
        </p>
      </header>

      {trips.length ? (
        <ul className="crew-trip-list">
          {trips.map(trip => (
            <li key={trip.id} className="crew-panel crew-trip-item">
              <Link className="crew-trip-card" href={'/crew/trips/' + trip.id}>
                <div className="crew-trip-meta">
                  <span className="crew-time-badge">
                    <IconCalendar size={15} />
                    <span>{formatDepartureWib(trip.departureAt)}</span>
                  </span>
                  <h2>{trip.name}</h2>
                  {trip.identity?.routeName && (
                    <p className="crew-trip-route">
                      <IconMapPin size={15} />
                      <span>{trip.identity.routeName}</span>
                    </p>
                  )}
                  {trip.identity && (
                    <p className="crew-muted crew-trip-fleet">
                      <IconVan size={15} />
                      <span>
                        {trip.identity.vehicleName} · {trip.identity.plateNumber}
                      </span>
                    </p>
                  )}
                </div>
                <span className="crew-card-arrow" aria-hidden="true">→</span>
              </Link>

              <div className="crew-trip-quick-actions">
                <Link className="crew-button crew-primary" href={`/crew/trips/${trip.id}/manifest`}>
                  <IconClipboard size={18} />
                  <span>Manifest &amp; Check-in</span>
                </Link>
                <Link className="crew-button" href={`/crew/trips/${trip.id}/scan`}>
                  <IconQrCode size={18} />
                  <span>Scan QR</span>
                </Link>
                <Link className="crew-button crew-button-ghost" href={`/crew/trips/${trip.id}`}>
                  <span>Rute &amp; Denah →</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="crew-panel crew-empty-panel">
          <h2>Belum ada perjalanan yang ditugaskan</h2>
          <p className="crew-muted">Admin PO akan menambahkan penugasan perjalanan untuk akun Crew ini.</p>
        </section>
      )}
    </>
  );
}
