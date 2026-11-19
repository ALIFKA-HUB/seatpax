import Link from 'next/link';
import { sourceStatusPresentation } from '@/app/admin/presentation';
import { fleetData } from '../../../fleet-data';
import SeatTemplateBuilder from '../../../components/seat-template-builder';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, templates } = await fleetData(companyId);
  const list = await templates.list(context);

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Template kursi</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">SUMBER DENAH</p>
          <h1>Template kursi</h1>
          <p>Susun denah yang dapat digunakan oleh armada PO Anda.</p>
        </div>
        <a href="#template-baru" className="dash-primary-cta">
          Buat template baru
        </a>
      </header>

      <section className="admin-panel admin-panel-modern">
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
                  <th>Status / versi</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => {
                  const status = sourceStatusPresentation(t.status);
                  return (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td className="admin-tabular">
                        {t.rows} × {t.cols}
                      </td>
                      <td className="admin-tabular">{t.capacity} kursi</td>
                      <td>
                        <span className={`admin-status-pill is-${status.tone}`}>
                          {status.label} / {t.version}
                        </span>
                      </td>
                      <td>
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
          <p className="admin-empty-copy">
            Belum ada template. Pilih sel pada grid di bawah untuk membuat kursi pertama.
          </p>
        )}
      </section>

      <section className="admin-panel admin-panel-modern" id="template-baru">
        <div className="admin-panel-head">
          <h2>Template baru</h2>
        </div>
        <SeatTemplateBuilder companyId={companyId} />
      </section>
    </>
  );
}
