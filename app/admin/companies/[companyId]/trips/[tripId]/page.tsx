import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminBackLink, { IconArrowRight } from '@/app/admin/components/admin-back-link';
import { tripStatusPresentation } from '@/app/admin/presentation';
import { tripData } from '@/app/admin/trip-data';
import TripForm from '@/app/admin/components/trip-form';
import TripDetail from '@/app/admin/components/trip-detail';
import CrewAssignmentForm from '@/app/admin/components/crew-assignment-form';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; tripId: string }>;
}) {
  const { companyId, tripId } = await params;
  const { context, trips, publication, crew } = await tripData(companyId);
  let detail;
  try {
    detail = await trips.detail(context, tripId);
  } catch {
    notFound();
  }
  const [choices, assignments, crewChoices] = await Promise.all([
    trips.choices(context),
    crew.listAssignments(context, tripId),
    crew.crewChoices(context),
  ]);
  const preview = detail.trip.status === 'DRAFT' ? await publication.preview(context, tripId) : undefined;
  const status = tripStatusPresentation(detail.trip.status);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/trips`} label="Daftar perjalanan" />
          <h1>{detail.trip.name}</h1>
          <p>
            {status.label} · revisi {detail.trip.revision}
          </p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill is-${status.tone}`}>{status.label}</span>
          {detail.trip.status !== 'DRAFT' && (
            <Link
              className="dash-primary-cta"
              href={`/admin/companies/${companyId}/trips/${tripId}/manifest`}
            >
              <span>Lihat manifest</span>
              <IconArrowRight size={15} />
            </Link>
          )}
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        {detail.trip.status === 'DRAFT' ? (
          <TripForm
            key={tripId}
            companyId={companyId}
            initial={detail.trip}
            choices={choices}
            preview={preview}
          />
        ) : (
          <TripDetail detail={detail} />
        )}
      </section>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Penugasan crew</h2>
        </div>
        <CrewAssignmentForm
          companyId={companyId}
          tripId={tripId}
          assignments={assignments}
          choices={crewChoices}
        />
      </section>
    </div>
  );
}
