import { CheckCircle, MinusCircle, Plus, Stack } from '@phosphor-icons/react/ssr';
import { companyData } from '../../../data';
import MasterForm from '../../../components/master-form';

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
          <a href="#tambah-kelas" className="dash-primary-cta">
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Buat kelas baru</span>
          </a>
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

      <div className="admin-master-list">
        {data.classes.length ? (
          data.classes.map(c => (
            <section className="dash-card admin-panel-modern" key={c.id}>
              <div className="admin-panel-head">
                <h2>{c.name}</h2>
                <span
                  className={`admin-status-pill ${c.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                >
                  {c.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <MasterForm companyId={companyId} kind="class" initial={c} />
            </section>
          ))
        ) : (
          <section className="dash-card admin-panel-modern">
            <p className="admin-empty-copy">
              Belum ada kelas layanan. Tambahkan kelas pertama di bawah.
            </p>
          </section>
        )}
      </div>

      <section className="dash-card admin-panel-modern" id="tambah-kelas">
        <div className="admin-panel-head">
          <h2>Tambah kelas</h2>
        </div>
        <MasterForm companyId={companyId} kind="class" />
      </section>
    </div>
  );
}
