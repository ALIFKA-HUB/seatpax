import Link from 'next/link';
import { redirect, unstable_rethrow } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { ChatCircleText } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import AdminEmptyState from '@/app/admin/components/admin-empty-state';
import {
  categoryLabels,
  priorityLabels,
  statusLabels,
  type ComplaintStatus,
  type Priority,
} from '@/modules/helpdesk/types';
import type { HelpdeskDashboardData } from '@/modules/helpdesk/staff';
import { helpdeskContext } from './data';

const statusCards: {
  status: ComplaintStatus;
  hint: string;
  tone: 'amber' | 'blue' | 'indigo' | 'green';
  Icon: typeof Clock;
}[] = [
  { status: 'MENUNGGU', hint: 'Perlu pemeriksaan', tone: 'amber', Icon: Clock },
  { status: 'DIPROSES', hint: 'Dalam penanganan', tone: 'blue', Icon: ChatCircleText },
  { status: 'PERLU_DILENGKAPI', hint: 'Menunggu pelapor', tone: 'indigo', Icon: WarningCircle },
  { status: 'SELESAI', hint: 'Telah dituntaskan', tone: 'green', Icon: CheckCircle },
];

const statusTone: Record<ComplaintStatus, string> = {
  MENUNGGU: 'is-warn',
  DIPROSES: 'is-info',
  PERLU_DILENGKAPI: 'is-purple',
  SELESAI: 'is-ok',
};

const priorityTone: Record<Priority, string> = {
  HIGH: 'is-danger',
  MEDIUM: 'is-warn',
  LOW: 'is-neutral',
};

const eventLabels: Record<string, string> = {
  SUBMITTED: 'Laporan diterima',
  SUPPLEMENTED: 'Informasi tambahan diterima',
  PRIORITY: 'Prioritas diperbarui',
  DIPROSES: 'Mulai diproses',
  PERLU_DILENGKAPI: 'Meminta kelengkapan',
  SELESAI: 'Laporan selesai',
};

const eventTone: Record<string, string> = {
  SUBMITTED: 'is-neutral',
  SUPPLEMENTED: 'is-info',
  PRIORITY: 'is-warn',
  DIPROSES: 'is-info',
  PERLU_DILENGKAPI: 'is-purple',
  SELESAI: 'is-ok',
};

const wibDateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const wibTodayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatWibDateTime(value: Date | string): string {
  return `${wibDateTimeFormatter.format(new Date(value))} WIB`;
}

function formatWibToday(): string {
  return `${wibTodayFormatter.format(new Date())} WIB`;
}

export default async function HelpdeskPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; priority?: string; page?: string }>;
} = {}) {
  const query = searchParams ? await searchParams : {};
  if (Object.values(query).some(Boolean)) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, value]) => Boolean(value)) as [string, string][],
    );
    redirect('/helpdesk/pengaduan?' + params);
  }

  let data: HelpdeskDashboardData | undefined;
  let unavailable = false;
  try {
    const { ctx, staff } = await helpdeskContext();
    data = await staff.dashboard(ctx);
  } catch (error) {
    unstable_rethrow(error);
    unavailable = true;
  }

  if (unavailable || !data) {
    return (
      <div className="dash-root">
        <section className="dash-card admin-panel-modern hd-alert-card" role="alert">
          <h1>Dashboard belum tersedia</h1>
          <p>
            Data Helpdesk belum dapat dimuat. Muat ulang halaman atau periksa akses Petugas
            Helpdesk dan Admin perusahaan.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Dashboard</h1>
          <p>Ringkasan pengaduan dan pekerjaan yang perlu ditangani.</p>
        </div>
        <div className="dash-hero-actions">
          <span className="dash-date-pill">
            <CalendarBlank size={16} weight="bold" aria-hidden="true" />
            <span>{formatWibToday()}</span>
          </span>
          <Link className="dash-primary-cta" href="/helpdesk/pengaduan">
            <span>Buka daftar pengaduan</span>
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div
        className="dash-kpi-grid hd-kpi-4"
        role="region"
        aria-label="Jumlah laporan menurut status"
      >
        {statusCards.map(({ status, hint, tone, Icon }) => (
          <Link
            key={status}
            href={`/helpdesk/pengaduan?status=${status}`}
            className="dash-card dash-kpi-card hd-kpi-link"
          >
            <div className="dash-kpi-top">
              <span className={`dash-icon-badge is-${tone}`} aria-hidden="true">
                <Icon size={22} weight="duotone" />
              </span>
              <div className="dash-kpi-meta">
                <strong className="dash-kpi-value admin-tabular">{data.counts[status]}</strong>
                <span className="dash-kpi-label">{statusLabels[status]}</span>
              </div>
            </div>
            <div className="dash-kpi-foot">
              <span>{hint}</span>
              <span className="dash-link">
                Lihat <ArrowRight size={13} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dash-bento">
        <div className="dash-primary-col">
          <section className="dash-card admin-table-card" aria-label="Antrean penanganan">
            <div className="admin-panel-head">
              <h2>
                Antrean penanganan <span className="admin-count">{data.queue.length}</span>
              </h2>
              <Link className="dash-link" href="/helpdesk/pengaduan?status=MENUNGGU">
                Lihat semua <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            {data.queue.length > 0 ? (
              <ul className="hd-queue-cards">
                {data.queue.map(row => {
                  const priorityKey = row.priority as Priority | null;
                  return (
                    <li key={row.id}>
                      <Link className="hd-queue-card" href={`/helpdesk/${row.id}`}>
                        <div className="hd-queue-main">
                          <strong className="hd-queue-title">{row.title}</strong>
                          <div className="hd-queue-meta">
                            <span className="hd-code-pill">{row.code}</span>
                            <span className="hd-queue-category">
                              {categoryLabels[row.category] ?? row.category}
                            </span>
                            {priorityKey ? (
                              <span
                                className={`admin-status-pill ${priorityTone[priorityKey] ?? 'is-neutral'}`}
                              >
                                {priorityLabels[priorityKey] ?? priorityKey}
                              </span>
                            ) : (
                              <span className="admin-status-pill is-neutral">
                                Prioritas belum ditentukan
                              </span>
                            )}
                            <span className="hd-queue-time admin-tabular">
                              {formatWibDateTime(row.created_at)}
                            </span>
                          </div>
                        </div>
                        <span className="hd-queue-cta">Tangani →</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <AdminEmptyState
                icon={<CheckCircle size={24} weight="duotone" />}
                tone="ok"
                title="Antrean penanganan kosong"
                description="Tidak ada laporan yang menunggu pemeriksaan saat ini."
              />
            )}
          </section>

          <section className="dash-card admin-table-card" aria-label="Pengaduan terbaru">
            <div className="admin-panel-head">
              <h2>
                Pengaduan terbaru <span className="admin-count">{data.recent.length}</span>
              </h2>
              <Link className="dash-link" href="/helpdesk/pengaduan">
                Buka daftar <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            {data.recent.length > 0 ? (
              <div
                className="admin-table-wrap"
                role="region"
                aria-label="Tabel pengaduan terbaru"
                tabIndex={0}
              >
                <table className="admin-modern-table hd-dashboard-table">
                  <thead>
                    <tr>
                      <th>Pengaduan</th>
                      <th>Status</th>
                      <th>Diterima</th>
                      <th className="admin-col-action">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map(row => {
                      const statusKey = row.status;
                      const priorityKey = row.priority as Priority | null;
                      return (
                        <tr key={row.id}>
                          <td>
                            <Link className="hd-case-title-link" href={`/helpdesk/${row.id}`}>
                              {row.title}
                            </Link>
                            <div className="hd-case-meta">
                              <span className="hd-code-pill">{row.code}</span>
                              <span className="hd-case-category">
                                {categoryLabels[row.category] ?? row.category}
                              </span>
                              {priorityKey ? (
                                <span
                                  className={`admin-status-pill ${priorityTone[priorityKey] ?? 'is-neutral'}`}
                                >
                                  {priorityLabels[priorityKey] ?? priorityKey}
                                </span>
                              ) : (
                                <span className="hd-muted-label">Prioritas: Belum ditentukan</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`admin-status-pill ${statusTone[statusKey] ?? 'is-neutral'}`}
                            >
                              {statusLabels[statusKey] ?? statusKey}
                            </span>
                          </td>
                          <td className="admin-tabular">{formatWibDateTime(row.created_at)}</td>
                          <td className="admin-col-action">
                            <Link
                              className="admin-row-link hd-row-detail-link"
                              href={`/helpdesk/${row.id}`}
                            >
                              Detail →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <AdminEmptyState
                icon={<ChatCircleText size={24} weight="duotone" />}
                tone="blue"
                title="Belum ada pengaduan"
                description="Laporan pengaduan pelanggan yang masuk akan tampil di tabel ini."
              />
            )}
          </section>
        </div>

        <aside className="dash-side-col" aria-label="Aktivitas terbaru">
          <section className="dash-card hd-timeline-card">
            <div className="dash-card-head">
              <div>
                <h2>Aktivitas terbaru</h2>
                <p>Pembaruan penanganan pengaduan terkini.</p>
              </div>
              <span className="dash-pill-blue">WIB</span>
            </div>
            {data.events.length > 0 ? (
              <ol className="hd-timeline">
                {data.events.map(event => (
                  <li key={event.id} className={eventTone[event.kind] ?? 'is-neutral'}>
                    <div className="hd-timeline-head">
                      <strong>
                        <Link className="hd-timeline-link" href={`/helpdesk/${event.case_id}`}>
                          {eventLabels[event.kind] || event.kind}
                        </Link>
                      </strong>
                      <small>{formatWibDateTime(event.created_at)}</small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="hd-timeline-empty">
                <Clock size={24} weight="duotone" aria-hidden="true" />
                <p>Belum ada aktivitas penanganan.</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
