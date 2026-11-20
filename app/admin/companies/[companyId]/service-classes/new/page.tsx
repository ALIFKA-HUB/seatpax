import AdminBackLink from '@/app/admin/components/admin-back-link';
import MasterForm from '@/app/admin/components/master-form';
import { companyData } from '@/app/admin/data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await companyData(companyId);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/service-classes`}
            label="Kelas layanan"
          />
          <h1>Tambah kelas</h1>
          <p>Buat kelas layanan baru untuk mengatur tarif segmen rute dan default armada.</p>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Informasi kelas</h2>
        </div>
        <MasterForm
          companyId={companyId}
          kind="class"
          redirectTo={`/admin/companies/${companyId}/service-classes`}
        />
      </section>
    </div>
  );
}
