import { notFound } from 'next/navigation';
import { boardingData } from '../../../boarding-data';
import TicketScanner from '../../../components/qr-scanner';
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
        active="scan"
      />
      <section className="crew-panel">
        <TicketScanner tripId={tripId} stops={view.stops} />
      </section>
    </>
  );
}
