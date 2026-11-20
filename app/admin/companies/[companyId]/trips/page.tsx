import Link from 'next/link';
import { CalendarBlank, Clock, Plus, Ticket } from '@phosphor-icons/react/ssr';
import { tripStatusPresentation } from '@/app/admin/presentation';
import { tripData } from '@/app/admin/trip-data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, trips } = await tripData(companyId);
  const list = await trips.list(context);
  const openCount = list.filter(t => t.status === 'OPEN_FOR_SALE').length;
  const draftCount = list.filter(t => t.status === 'DRAFT').length;

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Perjalanan</h1>
          <p>Siapkan draft, lalu buka penjualan untuk mengunci jadwal, tarif, dan layout.</p>
        </div>
        <div className="dash-hero-actions">
          <Link href={`/admin/companies/${companyId}/trips/new`} className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat perjalanan</span>
          </Link>
        </div>
      </header>

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan perjalanan">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <CalendarBlank size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{openCount}</strong>
            <span className="admin-stat-label">Jadwal aktif dijual</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-amber" aria-hidden="true">
            <Clock size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{draftCount}</strong>
            <span className="admin-stat-label">Draft menunggu rilis</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-indigo" aria-hidden="true">
            <Ticket size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{list.length}</strong>
            <span className="admin-stat-label">Total perjalanan PO</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-panel-modern">
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
                        <Link
                          className="admin-row-link"
                          href={`/admin/companies/${companyId}/trips/${t.id}`}
                        >
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
    </div>
  );
}
