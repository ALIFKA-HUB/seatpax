import Link from 'next/link';
import {
  Armchair,
  ArrowRight,
  Bus,
  CalendarBlank,
  ClipboardText,
  CreditCard,
  MapPin,
  Path,
  Stack,
  Ticket,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
import { adminDashboardData } from '../../dashboard-data';
import { tripStatusPresentation } from '../../presentation';

export const dynamic = 'force-dynamic';

function formatWibDateTime(iso: string): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso)) + ' WIB'
  );
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const data = await adminDashboardData(companyId);
  const base = `/admin/companies/${companyId}`;
  const actionNeeded = data.kpis.openConflicts + data.kpis.openComplaints;
  const maxDaily = Math.max(1, ...data.dailyActivity.map(d => d.count));
  const total7d = data.dailyActivity.reduce((sum, d) => sum + d.count, 0);

  const resourceCards = [
    {
      href: `${base}/trips`,
      label: 'Perjalanan',
      meta: `${data.kpis.totalTrips} jadwal tercatat`,
      Icon: CalendarBlank,
      tone: 'blue',
    },
    {
      href: `${base}/routes`,
      label: 'Rute & tarif',
      meta: `${data.resources.routes} rute aktif/draft`,
      Icon: Path,
      tone: 'indigo',
    },
    {
      href: `${base}/stops`,
      label: 'Titik naik & turun',
      meta: `${data.resources.stops} lokasi terdaftar`,
      Icon: MapPin,
      tone: 'teal',
    },
    {
      href: `${base}/vehicles`,
      label: 'Armada',
      meta: `${data.resources.vehicles} unit kendaraan`,
      Icon: Bus,
      tone: 'blue',
    },
    {
      href: `${base}/seat-templates`,
      label: 'Template kursi',
      meta: `${data.resources.templates} denah kabin`,
      Icon: Armchair,
      tone: 'slate',
    },
    {
      href: `${base}/service-classes`,
      label: 'Kelas layanan',
      meta: `${data.resources.classes} kelas tarif`,
      Icon: Stack,
      tone: 'amber',
    },
  ] as const;

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Selamat datang, {data.companyName}</h1>
          <p>Pantau jadwal keberangkatan, kesiapan armada, dan tindak lanjut pesanan PO Anda.</p>
        </div>
        <div className="dash-hero-actions">
          <span className="dash-date-pill">
            <CalendarBlank size={16} weight="bold" aria-hidden="true" />
            <span>{data.nowWibLabel}</span>
          </span>
        </div>
      </header>

      <div className="dash-bento">
        <div className="dash-primary-col">
          <div className="dash-kpi-grid" role="region" aria-label="Ringkasan operasional">
            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-blue" aria-hidden="true">
                  <CalendarBlank size={22} weight="duotone" />
                </span>
                <div className="dash-kpi-meta">
                  <strong className="dash-kpi-value">{data.kpis.openTrips}</strong>
                  <span className="dash-kpi-label">Jadwal aktif dijual</span>
                </div>
              </div>
              <div className="dash-kpi-foot">
                <span>{data.kpis.draftTrips} draft</span>
                <Link href={`${base}/trips`} className="dash-link">
                  Detail <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-green" aria-hidden="true">
                  <Ticket size={22} weight="duotone" />
                </span>
                <div className="dash-kpi-meta">
                  <strong className="dash-kpi-value">{data.kpis.confirmedBookings}</strong>
                  <span className="dash-kpi-label">Pesanan terkonfirmasi</span>
                </div>
              </div>
              <div className="dash-kpi-foot">
                <span>{data.kpis.totalTrips} jadwal</span>
                <Link href={`${base}/trips`} className="dash-link">
                  Detail <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-amber" aria-hidden="true">
                  <WarningCircle size={22} weight="duotone" />
                </span>
                <div className="dash-kpi-meta">
                  <strong className="dash-kpi-value">{actionNeeded}</strong>
                  <span className="dash-kpi-label">Perlu tindak lanjut</span>
                </div>
              </div>
              <div className="dash-kpi-foot">
                <span>
                  {data.kpis.openConflicts} konflik · {data.kpis.openComplaints} aduan
                </span>
                <Link
                  href={
                    data.kpis.openConflicts === 0 && data.kpis.openComplaints > 0
                      ? `${base}/helpdesk`
                      : `${base}/payment-conflicts`
                  }
                  className="dash-link"
                >
                  Periksa <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>

          <section className="dash-card dash-activity-card" aria-label="Aktivitas pemesanan 7 hari terakhir">
            <div className="dash-card-head">
              <div>
                <h2>Aktivitas Pemesanan 7 Hari</h2>
                <p>Jumlah pesanan terkonfirmasi per hari (WIB).</p>
              </div>
              <span className="dash-pill-muted">{total7d} pesanan minggu ini</span>
            </div>

            <div className="dash-bars" role="list" aria-label="Grafik batang pemesanan 7 hari">
              {data.dailyActivity.map(point => {
                const heightPct = total7d > 0 ? Math.max(8, Math.round((point.count / maxDaily) * 100)) : 6;
                return (
                  <div key={point.dayKey} className="dash-bar-col" role="listitem">
                    <span className="dash-bar-count">{point.count}</span>
                    <div className="dash-bar-track">
                      <div
                        className={`dash-bar-fill${point.count > 0 ? ' has-value' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="dash-bar-day">{point.dayShort}</span>
                    <span className="dash-bar-date">{point.dateNum}</span>
                  </div>
                );
              })}
            </div>

            {total7d === 0 && (
              <p className="dash-activity-note">
                Belum ada pemesanan terkonfirmasi dalam 7 hari terakhir. Buka penjualan pada jadwal perjalanan untuk mulai menerima pesanan.
              </p>
            )}
          </section>

          <section className="dash-card dash-resources-card" aria-label="Master operasional PO">
            <div className="dash-card-head">
              <div>
                <h2>Master Operasional PO</h2>
                <p>Kelola data dasar rute, armada, dan denah sebelum merilis perjalanan.</p>
              </div>
              <Link href={`${base}/routes`} className="dash-link">
                Semua rute <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="dash-resource-grid">
              {resourceCards.map(({ href, label, meta, Icon, tone }) => (
                <Link key={href} href={href} className="dash-resource-item">
                  <span className={`dash-icon-badge is-${tone}`} aria-hidden="true">
                    <Icon size={20} weight="duotone" />
                  </span>
                  <span className="dash-resource-copy">
                    <strong>{label}</strong>
                    <small>{meta}</small>
                  </span>
                  <ArrowRight size={16} className="dash-resource-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="dash-side-col" aria-label="Agenda dan ringkasan tindak lanjut">
          <section className="dash-card dash-schedule-card">
            <div className="dash-card-head">
              <div>
                <h2>Agenda Keberangkatan</h2>
                <p>{data.monthYearWibLabel}</p>
              </div>
              <span className="dash-pill-blue">WIB</span>
            </div>

            <div className="dash-week-strip" aria-label="Kalender minggu ini">
              {data.weekStrip.map(day => (
                <div
                  key={`${day.dayShort}-${day.dateNum}`}
                  className={`dash-week-day${day.isToday ? ' is-today' : ''}`}
                >
                  <span className="dash-week-name">{day.dayShort}</span>
                  <span className="dash-week-num">{day.dateNum}</span>
                  <span
                    className={`dash-week-dot${day.tripCount > 0 ? ' is-visible' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            {data.upcomingTrips.length > 0 ? (
              <ul className="dash-agenda-list">
                {data.upcomingTrips.map(trip => {
                  const statusInfo = tripStatusPresentation(trip.status);
                  const isOpen = trip.status === 'OPEN_FOR_SALE';
                  return (
                    <li key={trip.id}>
                      <Link
                        href={`${base}/trips/${trip.id}`}
                        className={`dash-agenda-item ${isOpen ? 'is-open' : 'is-draft'}`}
                      >
                        <div className="dash-agenda-top">
                          <strong>{trip.name}</strong>
                          <span className={`dash-status-tag ${isOpen ? 'is-open' : 'is-draft'}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="dash-agenda-route">
                          {trip.routeName} · {trip.vehicleName}
                        </p>
                        <div className="dash-agenda-foot">
                          <span>{formatWibDateTime(trip.departureAt)}</span>
                          <span>
                            {trip.bookedCount}/{trip.seatCapacity} kursi
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="dash-agenda-empty">
                <CalendarBlank size={28} weight="duotone" aria-hidden="true" />
                <strong>Belum ada keberangkatan terjadwal</strong>
                <p>Buat jadwal perjalanan baru dari rute dan armada yang sudah siap.</p>
                <Link href={`${base}/trips/new`} className="dash-outline-cta">
                  Buat jadwal pertama <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="dash-alerts-stack" aria-label="Status pembayaran dan pengaduan">
            <Link href={`${base}/payment-conflicts`} className="dash-tint-card is-blue">
              <div className="dash-tint-head">
                <span className="dash-tint-icon" aria-hidden="true">
                  <CreditCard size={20} weight="duotone" />
                </span>
                <span className="dash-tint-count">{data.kpis.openConflicts}</span>
              </div>
              <strong>Konflik Pembayaran</strong>
              <p>
                {data.kpis.openConflicts > 0
                  ? `${data.kpis.openConflicts} pembayaran berstatus PAID perlu peninjauan manual.`
                  : 'Tidak ada konflik pembayaran yang menunggu pemeriksaan.'}
              </p>
              <span className="dash-tint-link">
                Tinjau pembayaran <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>

            <Link href={`${base}/helpdesk`} className="dash-tint-card is-amber">
              <div className="dash-tint-head">
                <span className="dash-tint-icon" aria-hidden="true">
                  <ClipboardText size={20} weight="duotone" />
                </span>
                <span className="dash-tint-count">{data.kpis.openComplaints}</span>
              </div>
              <strong>Pengaduan Pelanggan</strong>
              <p>
                {data.kpis.openComplaints > 0
                  ? `${data.kpis.openComplaints} kasus pelanggan masih terbuka dan perlu tindak lanjut.`
                  : 'Semua kasus pengaduan pelanggan sudah terselesaikan.'}
              </p>
              <span className="dash-tint-link">
                Buka helpdesk <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
