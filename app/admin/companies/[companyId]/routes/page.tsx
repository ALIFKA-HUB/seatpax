import Link from 'next/link';
import { CheckCircle, MapPin, Path, Plus } from '@phosphor-icons/react/ssr';
import { companyData } from '../../../data';
import RouteEditor from '../../../components/route-editor';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
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
          <a href="#rute-baru" className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat rute baru</span>
          </a>
        </div>
      </header>

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

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Daftar rute <span className="admin-count">{data.routes.length}</span>
          </h2>
        </div>
        {!data.routes.length ? (
          <p className="admin-empty-copy">
            Belum ada rute. Buat minimal dua stop, lalu susun rute pertama.
          </p>
        ) : (
          <div className="admin-table-wrap" role="region" aria-label="Daftar rute" tabIndex={0}>
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Rute</th>
                  <th>Kode</th>
                  <th>Status</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {data.routes.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>{r.code ?? '—'}</td>
                    <td>
                      <span
                        className={`admin-badge admin-status-pill ${r.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                      >
                        {r.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/companies/${companyId}/routes/${r.id}`}
                      >
                        Buka rute →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-card admin-panel-modern" id="rute-baru">
        <div className="admin-panel-head">
          <h2>Rute baru</h2>
        </div>
        <RouteEditor companyId={companyId} choices={data.stops} />
      </section>
    </div>
  );
}
