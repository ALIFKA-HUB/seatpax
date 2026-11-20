import Link from 'next/link';
import { CheckCircle, MinusCircle, Plus, Stack } from '@phosphor-icons/react/ssr';
import { companyData } from '../../../data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { data } = await companyData(companyId);
  const activeCount = data.classes.filter(c => c.status === 'ACTIVE').length;
  const inactiveCount = data.classes.length - activeCount;

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Kelas layanan</h1>
          <p>Setiap kelas memiliki konfigurasi tarif segmennya sendiri.</p>
        </div>
        <div className="dash-hero-actions">
          <Link
            href={`/admin/companies/${companyId}/service-classes/new`}
            className="dash-primary-cta"
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat kelas baru</span>
          </Link>
        </div>
      </header>

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan kelas layanan">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <Stack size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{data.classes.length}</strong>
            <span className="admin-stat-label">Total kelas layanan</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-green" aria-hidden="true">
            <CheckCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-label">Kelas aktif</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-slate" aria-hidden="true">
            <MinusCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{inactiveCount}</strong>
            <span className="admin-stat-label">Nonaktif</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Daftar kelas layanan <span className="admin-count">{data.classes.length}</span>
          </h2>
        </div>
        {data.classes.length ? (
          <div
            className="admin-table-wrap"
            role="region"
            aria-label="Daftar kelas layanan"
            tabIndex={0}
          >
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Nama kelas</th>
                  <th>Kode</th>
                  <th>Status</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <code>{c.code ?? '—'}</code>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill ${c.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                      >
                        {c.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/companies/${companyId}/service-classes/${c.id}`}
                      >
                        Kelola kelas →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty-copy">
            Belum ada kelas layanan. Tambahkan kelas pertama untuk mengatur tarif segmen.
          </p>
        )}
      </section>
    </div>
  );
}
