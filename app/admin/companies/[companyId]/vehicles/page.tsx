import Link from 'next/link';
import { sourceStatusPresentation } from '@/app/admin/presentation';
import { fleetData } from '../../../fleet-data';
import VehicleForm from '../../../components/vehicle-form';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, vehicles, templates, data } = await fleetData(companyId);
  const [list, choices] = await Promise.all([vehicles.list(context), templates.list(context)]);

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Armada</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">KENDARAAN PO</p>
          <h1>Armada</h1>
          <p>Hubungkan kendaraan dengan template kursi dan kelas layanan default.</p>
        </div>
        <a href="#armada-baru" className="dash-primary-cta">
          Tambah armada
        </a>
      </header>

      <section className="admin-panel admin-panel-modern">
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
                  <th>Status / revisi</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {list.map(v => {
                  const status = sourceStatusPresentation(v.status);
                  return (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                      </td>
                      <td>
                        <code>{v.plateNumber}</code>
                      </td>
                      <td className="admin-tabular">{v.capacity}</td>
                      <td>
                        <span className={`admin-status-pill is-${status.tone}`}>
                          {status.label} / {v.revision}
                        </span>
                      </td>
                      <td>
                        <Link className="admin-row-link" href={`/admin/companies/${companyId}/vehicles/${v.id}`}>
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
          <p className="admin-empty-copy">
            Belum ada armada. Siapkan template aktif dan kelas layanan terlebih dahulu.
          </p>
        )}
      </section>

      <section className="admin-panel admin-panel-modern" id="armada-baru">
        <div className="admin-panel-head">
          <h2>Armada baru</h2>
        </div>
        <VehicleForm companyId={companyId} templates={choices} classes={data.classes} />
      </section>
    </>
  );
}
