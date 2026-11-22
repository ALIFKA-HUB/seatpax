import Link from 'next/link';
import { CheckCircle, MapPin, Path, Plus } from '@phosphor-icons/react/ssr';
import AdminEmptyState from '@/app/admin/components/admin-empty-state';
import AdminPaginatedTable from '@/app/admin/components/admin-paginated-table';
import { companyData } from '../../../data';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<{ deleted?: string }>;
}) {
  const { companyId } = await params;
  const deleted = (searchParams ? await searchParams : undefined)?.deleted === '1';
  const { data } = await companyData(companyId);
  const activeCount = data.routes.filter(r => r.status === 'ACTIVE').length;

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Rute &amp; tarif</h1>
          <p>Susun stop perjalanan dan tarif antar-stop untuk PO Anda.</p>
        </div>
        <div className="dash-hero-actions">
          <Link href={`/admin/companies/${companyId}/routes/new`} className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat rute baru</span>
          </Link>
        </div>
      </header>

      {deleted && (
        <div className="admin-flash-ok" role="status">
          Data berhasil dihapus permanen.
        </div>
      )}

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan rute">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <Path size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{data.routes.length}</strong>
            <span className="admin-stat-label">Total rute terdaftar</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-green" aria-hidden="true">
            <CheckCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-label">Rute aktif</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-teal" aria-hidden="true">
            <MapPin size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{data.stops.length}</strong>
            <span className="admin-stat-label">Titik tersedia</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-table-card">
        <div className="admin-panel-head">
          <h2>
            Daftar rute <span className="admin-count">{data.routes.length}</span>
          </h2>
        </div>
        {!data.routes.length ? (
          <AdminEmptyState
            icon={<Path size={24} weight="duotone" />}
            title="Belum ada rute"
            description="Buat minimal dua titik naik & turun, lalu susun rute pertama."
          />
        ) : (
          <AdminPaginatedTable
            ariaLabel="Daftar rute"
            itemLabel="rute"
            rowMeta={data.routes.map(r => ({ id: r.id, name: r.name }))}
            head={
              <tr>
                <th>Rute</th>
                <th>Kode</th>
                <th>Status</th>
                <th className="admin-col-action">Aksi</th>
              </tr>
            }
            rows={data.routes.map(r => (
              <tr key={r.id} data-row-id={r.id} data-row-name={r.name}>
                <td>
                  <strong>{r.name}</strong>
                </td>
                <td>
                  <code>{r.code ?? '—'}</code>
                </td>
                <td>
                  <span
                    className={`admin-status-pill ${r.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                  >
                    {r.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="admin-col-action">
                  <Link
                    className="admin-row-link"
                    href={`/admin/companies/${companyId}/routes/${r.id}`}
                  >
                    Buka rute →
                  </Link>
                </td>
              </tr>
            ))}
          />
        )}
      </section>
    </div>
  );
}
