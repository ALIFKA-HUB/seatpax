import Link from 'next/link';
import { companyData } from '../../../data';
import RouteEditor from '../../../components/route-editor';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { data } = await companyData(companyId);

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Rute &amp; tarif</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">JARINGAN PERJALANAN</p>
          <h1>Rute &amp; tarif</h1>
          <p>Susun stop perjalanan dan tarif antar-stop untuk PO Anda.</p>
        </div>
        <a href="#rute-baru" className="dash-primary-cta">
          Buat rute baru
        </a>
      </header>

      <section className="admin-panel admin-panel-modern">
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
                      <Link className="admin-row-link" href={`/admin/companies/${companyId}/routes/${r.id}`}>
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

      <section className="admin-panel admin-panel-modern" id="rute-baru">
        <div className="admin-panel-head">
          <h2>Rute baru</h2>
        </div>
        <RouteEditor companyId={companyId} choices={data.stops} />
      </section>
    </>
  );
}
