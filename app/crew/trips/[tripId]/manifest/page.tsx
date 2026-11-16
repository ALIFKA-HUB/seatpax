import { notFound } from 'next/navigation';
import { boardingData } from '../../../boarding-data';
import ManifestList from '../../../components/manifest-list';
import { wibTime } from '../../../components/passenger-profile';
import CrewTripTabs from '../../../components/trip-tabs';

export default async function Page({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { actor, service } = await boardingData();
  let view;
  try {
    view = await service.manifest(actor, tripId);
  } catch {
    notFound();
  }

  return (
    <>
      <CrewTripTabs
        tripId={tripId}
        tripName={view.tripName}
        subtitle={`Keberangkatan ${wibTime(view.departureAt)}`}
        active="manifest"
      />
      <section className="crew-panel crew-stack">
        <ManifestList view={view} />
      </section>
    </>
  );
}
