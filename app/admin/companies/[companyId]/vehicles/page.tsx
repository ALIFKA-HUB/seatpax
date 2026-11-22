import Link from 'next/link';
import { Armchair, Bus, CheckCircle, Plus } from '@phosphor-icons/react/ssr';
import AdminEmptyState from '@/app/admin/components/admin-empty-state';
import { sourceStatusPresentation } from '@/app/admin/presentation';
import { fleetData } from '../../../fleet-data';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<{ deleted?: string }>;
}) {
  const { companyId } = await params;
  const deleted = (searchParams ? await searchParams : undefined)?.deleted === '1';
  const { context, vehicles } = await fleetData(companyId);
  const list = await vehicles.list(context);
  const activeCount = list.filter(v => v.status === 'ACTIVE').length;
  const totalCapacity = list.reduce((sum, v) => sum + v.capacity, 0);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Armada</h1>
          <p>Hubungkan kendaraan dengan template kursi dan kelas layanan default.</p>
        </div>
        <div className="dash-hero-actions">
          <Link href={`/admin/companies/${companyId}/vehicles/new`} className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Tambah armada</span>
          </Link>
        </div>
      </header>

      {deleted && (
        <div className="admin-flash-ok" role="status">
          Data berhasil dihapus permanen.
        </div>
      )}

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan armada">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <Bus size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{list.length}</strong>
            <span className="admin-stat-label">Total unit armada</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-green" aria-hidden="true">
            <CheckCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-label">Armada aktif</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-indigo" aria-hidden="true">
            <Armchair size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{totalCapacity}</strong>
            <span className="admin-stat-label">Total kapasitas kursi</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-table-card">
        <div className="admin-panel-head">
          <h2>
            Daftar armada <span className="admin-count">{list.length}</span>
          </h2>
        </div>
        {list.length ? (
          <div className="admin-table-wrap" role="region" aria-label="Daftar sumber armada" tabIndex={0}>
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Armada</th>
                  <th>Plat</th>
                  <th>Kursi</th>
                  <th>Status</th>
                  <th className="admin-col-action">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map(v => {
                  const status = sourceStatusPresentation(v.status);
                  return (
                    <tr key={v.id} data-row-id={v.id} data-row-name={v.name}>
                      <td>
                        <strong>{v.name}</strong>
                      </td>
                      <td>
                        <code>{v.plateNumber}</code>
                      </td>
                      <td className="admin-tabular">{v.capacity}</td>
                      <td>
                        <span className={`admin-status-pill is-${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="admin-col-action">
                        <Link
                          className="admin-row-link"
                          href={`/admin/companies/${companyId}/vehicles/${v.id}`}
                        >
                          Buka armada →
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
            icon={<Bus size={24} weight="duotone" />}
            title="Belum ada armada"
            description="Siapkan template kursi aktif dan kelas layanan terlebih dahulu."
          />
        )}
      </section>
    </div>
  );
}
