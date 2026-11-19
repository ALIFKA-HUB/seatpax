import Link from 'next/link';
import { companyData } from '../../../data';
import MasterForm from '../../../components/master-form';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { data } = await companyData(companyId);

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Kelas layanan</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">PILIHAN LAYANAN</p>
          <h1>Kelas layanan</h1>
          <p>Setiap kelas memiliki konfigurasi tarif segmennya sendiri.</p>
        </div>
        <a href="#tambah-kelas" className="dash-primary-cta">
          Buat kelas baru
        </a>
      </header>

      <div className="admin-master-list">
        {data.classes.length ? (
          data.classes.map(c => (
            <section className="admin-panel admin-panel-modern" key={c.id}>
              <div className="admin-panel-head">
                <h2>{c.name}</h2>
              </div>
              <MasterForm companyId={companyId} kind="class" initial={c} />
            </section>
          ))
        ) : (
          <section className="admin-panel admin-panel-modern">
            <p className="admin-empty-copy">Belum ada kelas layanan. Tambahkan kelas pertama di bawah.</p>
          </section>
        )}
      </div>

      <section className="admin-panel admin-panel-modern" id="tambah-kelas">
        <div className="admin-panel-head">
          <h2>Tambah kelas</h2>
        </div>
        <MasterForm companyId={companyId} kind="class" />
      </section>
    </>
  );
}
