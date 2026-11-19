import { notFound } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import { boardingData, enforceManifestCompany } from '@/app/crew/boarding-data';
import ManifestList from '@/app/crew/components/manifest-list';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; tripId: string }>;
}) {
  const { companyId, tripId } = await params;
  const { actor, service } = await boardingData('ADMIN_PO');
  let view;
  try {
    view = await service.manifest(actor, tripId);
    enforceManifestCompany(view.companyId, companyId);
  } catch {
    notFound();
  }

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/trips/${tripId}`} label="Ringkasan trip" />
          <h1>Manifest penumpang</h1>
          <p>{view.tripName}</p>
        </div>
        <div className="dash-hero-actions">
          <span className="dash-pill-muted">
            {view.boardedCount}/{view.passengerCount} sudah naik
          </span>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <ManifestList view={view} readOnly />
      </section>
    </div>
  );
}
