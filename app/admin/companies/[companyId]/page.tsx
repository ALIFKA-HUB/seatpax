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
  const total7d = data.dailyActivity.reduce((sum, d) => sum + d.count, 0);

  // SVG Chart Calculation
  const maxVal = Math.max(4, ...data.dailyActivity.map(d => d.count));
  const svgWidth = 540;
  const svgHeight = 110;
  const padX = 26;
  const padYTop = 16;
  const padYBottom = 16;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padYTop - padYBottom;

  const chartPoints = data.dailyActivity.map((d, i) => {
    const x = padX + (i / Math.max(1, data.dailyActivity.length - 1)) * plotW;
    const y = padYTop + plotH - (d.count / maxVal) * plotH;
    return {
      x,
      y,
      count: d.count,
      dayShort: d.dayShort,
      dateNum: d.dateNum,
      dayKey: d.dayKey,
    };
  });

  const pathD = chartPoints.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = arr[i - 1];
    const cpX = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpX},${prev.y.toFixed(1)} ${cpX},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${(padX + plotW).toFixed(1)},${(padYTop + plotH).toFixed(1)} L ${padX.toFixed(1)},${(padYTop + plotH).toFixed(1)} Z`;

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
            <CalendarBlank size={15} weight="bold" aria-hidden="true" />
            <span>{data.nowWibLabel}</span>
          </span>
        </div>
      </header>

      <div className="dash-bento">
        {/* Left Column: KPIs, Activity Chart, Master Resources */}
        <div className="dash-primary-col">
          <section className="dash-kpi-grid" aria-label="Ringkasan operasional">
            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-blue" aria-hidden="true">
                  <CalendarBlank size={20} weight="duotone" />
                </span>
                <div className="dash-kpi-meta">
                  <strong className="dash-kpi-value">{data.kpis.openTrips}</strong>
                  <span className="dash-kpi-label">Jadwal aktif dijual</span>
                </div>
              </div>
              <div className="dash-kpi-foot">
                <span>{data.kpis.draftTrips} draft</span>
                <Link href={`${base}/trips`} className="dash-link">
                  Detail <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-green" aria-hidden="true">
                  <Ticket size={20} weight="duotone" />
                </span>
                <div className="dash-kpi-meta">
                  <strong className="dash-kpi-value">{data.kpis.confirmedBookings}</strong>
                  <span className="dash-kpi-label">Pesanan terkonfirmasi</span>
                </div>
              </div>
              <div className="dash-kpi-foot">
                <span>{data.kpis.totalTrips} jadwal PO</span>
                <Link href={`${base}/trips`} className="dash-link">
                  Detail <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article className="dash-card dash-kpi-card">
              <div className="dash-kpi-top">
                <span className="dash-icon-badge is-amber" aria-hidden="true">
                  <WarningCircle size={20} weight="duotone" />
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
                <Link href={`${base}/payment-conflicts`} className="dash-link">
                  Periksa <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </section>

          <section className="dash-card dash-activity-card" aria-label="Aktivitas pemesanan 7 hari terakhir">
            <div className="dash-card-head">
              <div>
                <h2>Aktivitas Pemesanan 7 Hari</h2>
                <p>Jumlah pesanan terkonfirmasi per hari (WIB).</p>
              </div>
              <span className="dash-pill-muted">{total7d} pesanan minggu ini</span>
            </div>

            <div className="dash-chart-wrap" aria-label="Grafik pemesanan 7 hari">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="dash-chart-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="dashChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#005bd1" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#005bd1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line
                  x1={padX}
                  y1={padYTop}
                  x2={padX + plotW}
                  y2={padYTop}
                  stroke="#eef2f7"
                  strokeDasharray="3 3"
                />
                <line
                  x1={padX}
                  y1={padYTop + plotH / 2}
                  x2={padX + plotW}
                  y2={padYTop + plotH / 2}
                  stroke="#eef2f7"
                  strokeDasharray="3 3"
                />
                <line
                  x1={padX}
                  y1={padYTop + plotH}
                  x2={padX + plotW}
                  y2={padYTop + plotH}
                  stroke="#e2e8f0"
                />

                {/* Y-axis Ticks */}
                <text x={padX - 8} y={padYTop + 4} className="dash-chart-axis-label">
                  {maxVal}
                </text>
                <text x={padX - 8} y={padYTop + plotH / 2 + 3} className="dash-chart-axis-label">
                  {Math.round(maxVal / 2)}
                </text>
                <text x={padX - 8} y={padYTop + plotH} className="dash-chart-axis-label">
                  0
                </text>

                {/* Fill & Curve */}
                <path d={areaD} fill="url(#dashChartGrad)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#005bd1"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {chartPoints.map(p => (
                  <circle
                    key={p.dayKey}
                    cx={p.x}
                    cy={p.y}
                    r={p.count > 0 ? 4 : 3}
                    className={`dash-chart-dot${p.count > 0 ? ' has-val' : ''}`}
                  />
                ))}
              </svg>

              {/* X-axis Days */}
              <div className="dash-chart-x-labels" role="list">
                {chartPoints.map(p => (
                  <div key={p.dayKey} className="dash-chart-x-col" role="listitem">
                    <span className="dash-chart-day">{p.dayShort}</span>
                    <span className="dash-chart-date">{p.dateNum}</span>
                    <span className="dash-chart-val">{p.count}</span>
                  </div>
                ))}
              </div>
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
                Semua rute <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="dash-resource-grid">
              {resourceCards.map(({ href, label, meta, Icon, tone }) => (
                <Link key={href} href={href} className="dash-resource-item">
                  <span className={`dash-icon-badge is-${tone}`} aria-hidden="true">
                    <Icon size={18} weight="duotone" />
                  </span>
                  <span className="dash-resource-copy">
                    <strong>{label}</strong>
                    <small>{meta}</small>
                  </span>
                  <ArrowRight size={14} className="dash-resource-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Calendar Agenda + Alerts Stack */}
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
                <CalendarBlank size={24} weight="duotone" aria-hidden="true" />
                <strong>Belum ada keberangkatan terjadwal</strong>
                <p>Buat jadwal perjalanan baru dari rute dan armada yang sudah siap.</p>
                <Link href={`${base}/trips#perjalanan-baru`} className="dash-outline-cta">
                  Buat jadwal pertama <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="dash-alerts-stack" aria-label="Status pembayaran dan pengaduan">
            <Link href={`${base}/payment-conflicts`} className="dash-tint-card is-blue">
              <div className="dash-tint-head">
                <span className="dash-tint-icon" aria-hidden="true">
                  <CreditCard size={18} weight="duotone" />
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
                Tinjau pembayaran <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>

            <Link href={`${base}/helpdesk`} className="dash-tint-card is-amber">
              <div className="dash-tint-head">
                <span className="dash-tint-icon" aria-hidden="true">
                  <ClipboardText size={18} weight="duotone" />
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
                Buka helpdesk <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
