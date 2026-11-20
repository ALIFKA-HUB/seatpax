import AdminBackLink from '@/app/admin/components/admin-back-link';
import VehicleForm from '@/app/admin/components/vehicle-form';
import { fleetData } from '@/app/admin/fleet-data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, templates, data } = await fleetData(companyId);
  const choices = await templates.list(context);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/vehicles`} label="Armada" />
          <h1>Armada baru</h1>
          <p>Daftarkan unit kendaraan beserta template kursi dan kelas layanan default.</p>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Data kendaraan</h2>
        </div>
        <VehicleForm companyId={companyId} templates={choices} classes={data.classes} />
      </section>
    </div>
  );
}
