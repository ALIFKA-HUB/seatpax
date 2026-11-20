import AdminBackLink from '@/app/admin/components/admin-back-link';
import SeatTemplateBuilder from '@/app/admin/components/seat-template-builder';
import { fleetData } from '@/app/admin/fleet-data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await fleetData(companyId);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/seat-templates`}
            label="Template kursi"
          />
          <h1>Template baru</h1>
          <p>Rancang susunan kursi, lorong, pintu, dan fasilitas pada grid armada.</p>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Konfigurasi denah kursi</h2>
        </div>
        <SeatTemplateBuilder companyId={companyId} />
      </section>
    </div>
  );
}
