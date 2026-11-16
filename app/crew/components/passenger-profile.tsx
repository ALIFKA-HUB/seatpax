import { IconCheck, IconClock, IconPackage } from './crew-icons';
import type { PassengerProfile as Profile } from '@/modules/boarding/types';

export function wibTime(value: string) {
  return (
    new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(value)) + ' WIB'
  );
}

export default function PassengerProfile({ profile }: { profile: Profile }) {
  return (
    <section className="boarding-profile" aria-label="Profil perjalanan penumpang">
      <div className="crew-profile-heading">
        <div className="crew-seat">
          <span>Kursi</span>
          <strong>{profile.seatCode}</strong>
        </div>
        <div className="crew-profile-title">
          <h2>{profile.name}</h2>
          <p className="crew-trip-route">
            {profile.fromName} → {profile.toName}
          </p>
        </div>
      </div>

      <dl className="crew-profile-facts">
        <dt>Trip</dt>
        <dd>{profile.tripName}</dd>
        <dt>Armada</dt>
        <dd>
          {profile.vehicleName} · {profile.plateNumber}
        </dd>
        <dt>Keberangkatan</dt>
        <dd>{wibTime(profile.departureAt)}</dd>
      </dl>

      <div className="crew-profile-statuses">
        <div className={profile.boarding ? 'crew-state-card crew-state-success' : 'crew-state-card crew-state-pending'}>
          <span className="crew-state-label">
            {profile.boarding ? <IconCheck size={15} /> : <IconClock size={15} />}
            <span>Boarding</span>
          </span>
          <strong>{profile.boarding ? 'Sudah naik' : 'Belum naik'}</strong>
          {profile.boarding && <p>{wibTime(profile.boarding.boardedAt)}</p>}
        </div>

        <div className={profile.snack ? 'crew-state-card crew-state-success' : 'crew-state-card'}>
          <span className="crew-state-label">
            <IconPackage size={15} />
            <span>Snack</span>
          </span>
          <strong>{profile.snack ? 'Snack sudah diserahkan' : 'Snack belum diserahkan'}</strong>
          {profile.snack && <p>{wibTime(profile.snack.claimedAt)}</p>}
        </div>
      </div>
    </section>
  );
}
