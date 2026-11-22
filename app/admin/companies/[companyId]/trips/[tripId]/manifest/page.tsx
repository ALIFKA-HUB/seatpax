import { notFound } from 'next/navigation';
import { Users } from '@phosphor-icons/react/ssr';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import AdminManifestView from '@/app/admin/components/admin-manifest-view';
import { boardingData, enforceManifestCompany } from '@/app/crew/boarding-data';

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
          <span className="dash-date-pill admin-tabular">
            <Users size={16} weight="bold" aria-hidden="true" />
            <span>
              {view.boardedCount}/{view.passengerCount} sudah naik
            </span>
          </span>
        </div>
      </header>

      <AdminManifestView view={view} />
    </div>
  );
}
