import Link from 'next/link';
import { Armchair, CheckCircle, Plus, Stack } from '@phosphor-icons/react/ssr';
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
  const { context, templates } = await fleetData(companyId);
  const list = await templates.list(context);
  const activeCount = list.filter(t => t.status === 'ACTIVE').length;
  const maxCapacity = list.reduce((max, t) => Math.max(max, t.capacity), 0);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Template kursi</h1>
          <p>Susun denah yang dapat digunakan oleh armada PO Anda.</p>
        </div>
        <div className="dash-hero-actions">
          <Link href={`/admin/companies/${companyId}/seat-templates/new`} className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat template baru</span>
          </Link>
        </div>
      </header>

      {deleted && (
        <div className="admin-flash-ok" role="status">
          Data berhasil dihapus permanen.
        </div>
      )}

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan template kursi">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <Armchair size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{list.length}</strong>
            <span className="admin-stat-label">Total template denah</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-green" aria-hidden="true">
            <CheckCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-label">Template aktif</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-indigo" aria-hidden="true">
            <Stack size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{maxCapacity}</strong>
            <span className="admin-stat-label">Kapasitas tertinggi</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-table-card">
        <div className="admin-panel-head">
          <h2>
            Daftar template <span className="admin-count">{list.length}</span>
          </h2>
        </div>
        {list.length ? (
          <div className="admin-table-wrap" role="region" aria-label="Daftar sumber armada" tabIndex={0}>
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Ukuran</th>
                  <th>Kapasitas</th>
                  <th>Status</th>
                  <th className="admin-col-action">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => {
                  const status = sourceStatusPresentation(t.status);
                  return (
                    <tr key={t.id} data-row-id={t.id} data-row-name={t.name}>
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td className="admin-tabular">
                        {t.rows} × {t.cols}
                      </td>
                      <td className="admin-tabular">{t.capacity} kursi</td>
                      <td>
                        <span className={`admin-status-pill is-${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="admin-col-action">
                        <Link
                          className="admin-row-link"
                          href={`/admin/companies/${companyId}/seat-templates/${t.id}`}
                        >
                          Buka template →
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
            icon={<Armchair size={24} weight="duotone" />}
            title="Belum ada template kursi"
            description="Buat template baru untuk menyusun denah kursi pertama."
          />
        )}
      </section>
    </div>
  );
}
