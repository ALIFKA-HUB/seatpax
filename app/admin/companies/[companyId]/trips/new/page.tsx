import AdminBackLink from '@/app/admin/components/admin-back-link';
import TripForm from '@/app/admin/components/trip-form';
import { tripData } from '@/app/admin/trip-data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { context, trips } = await tripData(companyId);
  const choices = await trips.choices(context);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/trips`} label="Daftar perjalanan" />
          <h1>Perjalanan baru</h1>
          <p>Siapkan draft perjalanan dari rute, armada, dan kelas layanan yang tersedia.</p>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Detail perjalanan</h2>
        </div>
        <TripForm companyId={companyId} choices={choices} />
      </section>
    </div>
  );
}
