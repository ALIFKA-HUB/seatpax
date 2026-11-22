import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconArrowLeft } from '../../../../components/crew-icons';
import { boardingData } from '../../../../boarding-data';
import PassengerProfile from '../../../../components/passenger-profile';
import BoardingForm from '../../../../components/boarding-form';
import SnackForm from '../../../../components/snack-form';

export default async function Page({
  params,
}: {
  params: Promise<{ tripId: string; ticketId: string }>;
}) {
  const { tripId, ticketId } = await params;
  const { actor, service } = await boardingData();
  let view, profile;
  try {
    view = await service.manifest(actor, tripId);
    profile = await service.profile(actor, tripId, ticketId);
  } catch {
    notFound();
  }

  return (
    <div className="crew-dash-root">
      <header className="crew-page-header crew-trip-header">
        <Link className="crew-back" href={`/crew/trips/${tripId}/manifest`}>
          <IconArrowLeft size={16} />
          <span>Kembali ke manifest penumpang</span>
        </Link>
        <div className="crew-hero">
          <div className="crew-head-copy">
            <h1>Profil penumpang</h1>
            <p className="crew-muted crew-head-sub">
              Verifikasi kursi, konfirmasi boarding di titik naik, dan catat penyerahan snack.
            </p>
          </div>
          <span className="crew-status-pill is-info">Check-in penumpang</span>
        </div>
      </header>

      <div className="crew-stack">
        <section className="crew-panel crew-table-card crew-stack">
          <PassengerProfile profile={profile} />
        </section>

        <div className="crew-ops-grid">
          <section className="crew-panel crew-table-card">
            <BoardingForm tripId={tripId} profile={profile} stops={view.stops} source="MANIFEST" />
          </section>
          <section className="crew-panel crew-table-card">
            <SnackForm key={profile.ticketId} tripId={tripId} profile={profile} />
          </section>
        </div>
      </div>
    </div>
  );
}
