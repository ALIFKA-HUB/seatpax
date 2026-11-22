import Link from 'next/link';
import { MagnifyingGlass, ChatCircleText } from '@phosphor-icons/react/ssr';
import AdminSelect from '@/app/admin/components/admin-select';
import {
  categoryLabels,
  statusLabels,
  priorityLabels,
  type Category,
  type ComplaintStatus,
  type Priority,
} from '@/modules/helpdesk/types';
import type { createHelpdeskStaff } from '@/modules/helpdesk/staff';
import { normalizeHelpdeskPage } from '@/modules/helpdesk/staff';

type ListResult = Awaited<ReturnType<ReturnType<typeof createHelpdeskStaff>['list']>>;

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

const quickTabs: { value: '' | ComplaintStatus; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'DIPROSES', label: 'Diproses' },
  { value: 'PERLU_DILENGKAPI', label: 'Perlu dilengkapi' },
  { value: 'SELESAI', label: 'Selesai' },
];

export default function CaseList({
  data,
  query,
  base = '/helpdesk/pengaduan',
  detailBase = '/helpdesk',
  embedded = false,
  statusCounts,
}: {
  data: ListResult;
  query: { search?: string; status?: string; priority?: string; page?: string };
  base?: string;
  detailBase?: string;
  embedded?: boolean;
  statusCounts?: Record<ComplaintStatus, number>;
}) {
  const page = normalizeHelpdeskPage(query.page);
  const search = new URLSearchParams(
    Object.entries(query).filter(([k, v]) => k !== 'page' && !!v) as [string, string][],
  );
  const pageHref = (value: number) => {
    const params = new URLSearchParams(search);
    params.set('page', String(value));
    return base + '?' + params;
  };
  const statusHref = (nextStatus: '' | ComplaintStatus) => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.priority) params.set('priority', query.priority);
    if (nextStatus) params.set('status', nextStatus);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const hasFilter = Boolean(query.search || query.status || query.priority);
  const totalCount = statusCounts
    ? statusCounts.MENUNGGU +
      statusCounts.DIPROSES +
      statusCounts.PERLU_DILENGKAPI +
      statusCounts.SELESAI
    : undefined;

  if (embedded) {
    const activeStatus = query.status || '';
    return (
      <section className="dash-card admin-panel-modern hd-admin-card" aria-label="Daftar pengaduan pelanggan">
        <nav className="hd-status-tabs" aria-label="Filter cepat status pengaduan">
          {quickTabs.map(tab => {
            const isActive = activeStatus === tab.value;
            const tabCount = statusCounts
              ? tab.value === ''
                ? totalCount
                : statusCounts[tab.value]
              : undefined;
            return (
              <Link
                key={tab.value || 'ALL'}
                href={statusHref(tab.value)}
                className={isActive ? 'hd-status-tab is-active' : 'hd-status-tab'}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{tab.label}</span>
                {typeof tabCount === 'number' && <span className="hd-tab-count">{tabCount}</span>}
              </Link>
            );
          })}
        </nav>

        <form
          key={`${query.search || ''}|${query.priority || ''}`}
          className="hd-admin-toolbar"
          method="get"
        >
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <label className="hd-search-box">
            <MagnifyingGlass size={18} aria-hidden="true" />
            <span className="stop-sr-only">Cari laporan</span>
            <input
              name="search"
              defaultValue={query.search}
              placeholder="Cari judul atau kode laporan..."
              maxLength={160}
            />
          </label>
          <div className="hd-toolbar-select">
            <AdminSelect
              name="priority"
              ariaLabel="Filter prioritas pengaduan"
              defaultValue={query.priority || ''}
              options={[
                { value: '', label: 'Semua prioritas' },
                ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
          <div className="hd-toolbar-actions">
            <button className="admin-primary" type="submit">
              Terapkan
            </button>
            {hasFilter && (
              <Link className="hd-reset-link" href={base}>
                Reset
              </Link>
            )}
          </div>
        </form>

        {data.rows.length ? (
          <div className="admin-table-wrap" role="region" aria-label="Tabel pengaduan" tabIndex={0}>
            <table className="admin-modern-table hd-admin-table">
              <thead>
                <tr>
                  <th>Pengaduan</th>
                  <th>Status</th>
                  <th>Prioritas</th>
                  <th>Tanggal</th>
                  <th aria-label="Detail" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => {
                  const statusKey = r.status as ComplaintStatus;
                  const priorityKey = r.priority as Priority | null;
                  const categoryKey = r.category as Category;
                  return (
                    <tr key={String(r.id)}>
                      <td>
                        <Link className="hd-case-title-link" href={detailBase + '/' + r.id}>
                          {String(r.title)}
                        </Link>
                        <span className="hd-case-category">
                          {categoryLabels[categoryKey] ?? String(r.category)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-pill ${statusTone[statusKey] ?? 'is-neutral'}`}>
                          {statusLabels[statusKey]}
                        </span>
                      </td>
                      <td>
                        {priorityKey ? (
                          <span className={`admin-status-pill ${priorityTone[priorityKey] ?? 'is-neutral'}`}>
                            {priorityLabels[priorityKey]}
                          </span>
                        ) : (
                          <span className="hd-muted-dash" aria-label="Prioritas belum ditentukan">
                            —
                          </span>
                        )}
                      </td>
                      <td className="admin-tabular">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <Link className="admin-row-link hd-row-detail-link" href={detailBase + '/' + r.id}>
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
          <div className="admin-empty-state">
            <span className="admin-empty-icon is-blue" aria-hidden="true">
              <ChatCircleText size={24} weight="duotone" />
            </span>
            <h3>Belum ada laporan yang sesuai</h3>
            <p>Coba ubah kata kunci pencarian atau pilih status dan prioritas lainnya.</p>
          </div>
        )}

        <div className="hd-table-footer" role="status">
          <span>
            Menampilkan {data.rows.length} laporan · {data.count} belum selesai
          </span>
          {(page > 1 || (data.hasMore && page < 10000)) && (
            <nav className="hd-pagination" aria-label="Halaman laporan">
              {page > 1 && <Link href={pageHref(page - 1)}>Sebelumnya</Link>}
              {data.hasMore && page < 10000 && <Link href={pageHref(page + 1)}>Berikutnya</Link>}
            </nav>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="hd-heading">
        <p className="hd-kicker">Ruang kerja Helpdesk</p>
        <h1>Pengaduan pelanggan</h1>
        <p>
          {data.count} laporan belum selesai. Periksa laporan, tentukan prioritas, lalu catat hasil
          penanganan.
        </p>
      </header>
      <form className="hd-panel hd-form hd-list-controls" method="get">
        <div className="hd-grid">
          <label>
            Cari laporan
            <input
              name="search"
              defaultValue={query.search}
              placeholder="Nomor atau judul"
              maxLength={160}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={query.status || ''}>
              <option value="">Semua status</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioritas
            <select name="priority" defaultValue={query.priority || ''}>
              <option value="">Semua prioritas</option>
              {Object.entries(priorityLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="hd-primary">Terapkan filter</button>
      </form>
      <section className="hd-panel hd-table-scroll">
        <table className="hd-staff-table">
          <thead>
            <tr>
              <th>Pengaduan</th>
              <th>Status</th>
              <th>Prioritas</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={String(r.id)}>
                <td>
                  <Link href={detailBase + '/' + r.id}>{String(r.title)}</Link>
                  <div className="hd-code">{String(r.code)}</div>
                </td>
                <td>{statusLabels[r.status as ComplaintStatus]}</td>
                <td>{r.priority ? priorityLabels[r.priority as Priority] : 'Belum ditentukan'}</td>
                <td>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length && <p className="hd-empty">Belum ada laporan yang sesuai.</p>}
        <nav className="hd-pagination" aria-label="Halaman laporan">
          {page > 1 && <Link href={pageHref(page - 1)}>Sebelumnya</Link>}
          {data.hasMore && page < 10000 && <Link href={pageHref(page + 1)}>Berikutnya</Link>}
        </nav>
      </section>
    </>
  );
}
