import Link from 'next/link';
import { tripStatusPresentation } from '@/app/admin/presentation';
import { tripData } from '@/app/admin/trip-data';
import TripForm from '@/app/admin/components/trip-form';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, trips } = await tripData(companyId);
  const [list, choices] = await Promise.all([trips.list(context), trips.choices(context)]);

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Perjalanan</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">JADWAL PO</p>
          <h1>Perjalanan</h1>
          <p>Siapkan draft, lalu buka penjualan untuk mengunci jadwal, tarif, dan layout.</p>
        </div>
        <a href="#perjalanan-baru" className="dash-primary-cta">
          Buat perjalanan
        </a>
      </header>

      <section className="admin-panel admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Daftar perjalanan <span className="admin-count">{list.length}</span>
          </h2>
        </div>
        {list.length ? (
          <div className="admin-table-wrap" role="region" aria-label="Daftar perjalanan" tabIndex={0}>
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Perjalanan</th>
                  <th>Berangkat (WIB)</th>
                  <th>Status / revisi</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => {
                  const status = tripStatusPresentation(t.status);
                  return (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.name}</strong>
                        <small>
                          {t.identity?.routeName}
                          {t.identity ? ' · ' + t.identity.vehicleName : ''}
                          {t.identity ? ' · ' + t.identity.className : ''}
                        </small>
                      </td>
                      <td className="admin-tabular">
                        {new Intl.DateTimeFormat('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(t.departureAt))}
                      </td>
                      <td>
                        <span className={`admin-status-pill is-${status.tone}`}>
                          {status.label} · {t.revision}
                        </span>
                      </td>
                      <td>
                        <Link className="admin-row-link" href={`/admin/companies/${companyId}/trips/${t.id}`}>
                          Buka perjalanan →
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
            Belum ada perjalanan. Gunakan rute dan armada yang sudah disiapkan.
          </p>
        )}
      </section>

      <section className="admin-panel admin-panel-modern" id="perjalanan-baru">
        <div className="admin-panel-head">
          <h2>Perjalanan baru</h2>
        </div>
        <TripForm companyId={companyId} choices={choices} />
      </section>
    </>
  );
}
