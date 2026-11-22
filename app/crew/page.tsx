import Link from 'next/link';
import { IconCalendar, IconClipboard, IconMapPin, IconQrCode, IconVan } from './components/crew-icons';
import { crewData } from './data';
import { formatDepartureWib } from '@/app/presentation';

function formatWibToday(): string {
  return `${new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())} WIB`;
}

export default async function Page() {
  const { actorId, crew } = await crewData();
  const trips = await crew.listMine(actorId);

  const statItems = [
    {
      label: 'Jadwal aktif ditugaskan',
      value: trips.length,
      tone: 'is-blue',
      Icon: IconCalendar,
    },
    {
      label: 'Armada bertugas',
      value: new Set(trips.map(t => t.vehicleId)).size,
      tone: 'is-indigo',
      Icon: IconVan,
    },
    {
      label: 'Rute beroperasi',
      value: new Set(trips.map(t => t.routeId)).size,
      tone: 'is-green',
      Icon: IconMapPin,
    },
  ];

  return (
    <div className="crew-dash-root">
      <header className="crew-hero">
        <div className="crew-hero-copy">
          <h1>Perjalanan saya</h1>
          <p className="crew-muted">
            Pilih <strong>Manifest &amp; Check-in</strong> untuk absen penumpang dan snack, atau{' '}
            <strong>Scan QR</strong> untuk memindai tiket saat penumpang naik.
          </p>
        </div>
        <div className="crew-hero-actions">
          <span className="crew-date-pill">
            <IconCalendar size={16} weight="bold" />
            <span>{formatWibToday()}</span>
          </span>
          {trips.length > 0 && (
            <span className="crew-count-pill">{trips.length} jadwal aktif ditugaskan</span>
          )}
        </div>
      </header>

      {trips.length ? (
        <>
          <div className="crew-stat-grid" role="region" aria-label="Ringkasan penugasan perjalanan">
            {statItems.map(({ label, value, tone, Icon }) => (
              <div key={label} className="crew-stat-card">
                <span className={`crew-icon-badge ${tone}`} aria-hidden="true">
                  <Icon size={20} weight="duotone" />
                </span>
                <div className="crew-stat-meta">
                  <strong className="crew-stat-value">{value}</strong>
                  <span className="crew-stat-label">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <section className="crew-panel crew-table-card" aria-label="Daftar perjalanan ditugaskan">
            <div className="crew-panel-head">
              <h2>
                Daftar perjalanan tugas <span className="crew-count">{trips.length}</span>
              </h2>
            </div>
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
                        <div className="crew-muted crew-trip-fleet">
                          <IconVan size={15} />
                          <span>{trip.identity.vehicleName}</span>
                          <span className="crew-code-pill">{trip.identity.plateNumber}</span>
                          {trip.identity.className && (
                            <span className="crew-status-pill is-info">
                              {trip.identity.className}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="crew-card-arrow" aria-hidden="true">
                      →
                    </span>
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
          </section>
        </>
      ) : (
        <section className="crew-panel crew-empty-panel">
          <span className="crew-empty-icon is-blue" aria-hidden="true">
            <IconCalendar size={24} weight="duotone" />
          </span>
          <h2>Belum ada perjalanan yang ditugaskan</h2>
          <p className="crew-muted">
            Admin PO akan menambahkan penugasan perjalanan untuk akun Crew ini.
          </p>
        </section>
      )}
    </div>
  );
}
