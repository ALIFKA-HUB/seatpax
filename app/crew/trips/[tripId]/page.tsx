import { notFound } from 'next/navigation';
import { crewData } from '../../data';
import CrewTripSummary from '../../components/trip-summary';
import CrewTripTabs from '../../components/trip-tabs';
import { formatDepartureWib } from '@/app/presentation';

export default async function Page({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { actorId, crew } = await crewData();
  let detail;
  try {
    detail = await crew.detailMine(actorId, tripId);
  } catch {
    notFound();
  }

  return (
    <div className="crew-dash-root">
      <CrewTripTabs
        tripId={tripId}
        tripName={detail.trip.name}
        subtitle={`Berangkat ${formatDepartureWib(detail.trip.departureAt)}`}
        active="summary"
      />
      <CrewTripSummary detail={detail} />
    </div>
  );
}
