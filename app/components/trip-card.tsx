import Link from 'next/link';
import {ArrowRight, CalendarBlank, Clock, Van} from '@phosphor-icons/react/ssr';
import type {SearchResult} from '@/modules/inventory/types';
import {formatDepartureWib, formatIdr} from '../presentation';

const time = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'}).format(new Date(value));
const dayLabel = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {weekday: 'long', timeZone: 'Asia/Jakarta'}).format(new Date(value));

export default function TripCard({trip}: {trip: SearchResult}) {
  const duration = trip.arrivalAt ? (Date.parse(trip.arrivalAt) - Date.parse(trip.departureAt)) / 60000 : null;
  const validArrival = duration !== null && Number.isFinite(duration) && duration >= 0;
  const hours = validArrival ? Math.floor(duration / 60) : 0;
  const mins = validArrival ? Math.floor(duration % 60) : 0;
  const durationText = validArrival
    ? hours > 0 && mins > 0
      ? `${hours}j ${mins}m`
      : hours > 0
        ? `${hours} jam`
        : `${mins} menit`
    : 'Estimasi rute';
  const seatTone = trip.availableCount === 0 ? 'is-full' : trip.availableCount <= 3 ? 'is-low' : 'is-open';
  const seatLabel =
    trip.seatCapacity !== undefined && trip.seatCapacity > 0
      ? `${trip.availableCount} / ${trip.seatCapacity} kursi`
      : trip.availableCount > 0 && trip.availableCount <= 3
        ? `Sisa ${trip.availableCount} kursi`
        : `${trip.availableCount} kursi tersedia`;
  const viaLabel =
    trip.intermediateStops && trip.intermediateStops.length > 0
      ? `Via ${trip.intermediateStops.join(', ')}`
      : trip.stopCount === 2
        ? 'Langsung'
        : null;

  return (
    <article className="passenger-card sp-trip-card tp-card">
      <div className="tp-card-main">
        <div className="tp-card-top">
          <div className="tp-card-title-group">
            <h3 className="tp-card-title">{trip.name}</h3>
            <span className="tp-pill-class">{trip.className}</span>
            {trip.vehicleName && (
              <span className="tp-pill-vehicle">
                <Van size={13} aria-hidden="true" />
                {trip.vehicleName}
              </span>
            )}
          </div>
          {trip.companyName && <span className="tp-pill-operator">{trip.companyName}</span>}
        </div>
        <div className="tp-card-route">
          <div className="tp-point">
            <span className="tp-time-row">
              <strong className="tp-time sp-numbers">{time(trip.departureAt)}</strong>
              <span className="tp-wib">WIB</span>
            </span>
            <span className="tp-stop-name">{trip.originName}</span>
            {trip.originCity && <span className="tp-stop-city">{trip.originCity}</span>}
          </div>
          <div className="tp-connector">
            <span className="tp-duration-pill">{durationText}</span>
            <div className="tp-connector-track" aria-hidden="true">
              <span className="tp-dot-origin" />
              <span className="tp-track-line" />
              <span className="tp-dot-dest">
                <ArrowRight size={15} />
              </span>
            </div>
            {viaLabel && (
              <span className={`tp-via-pill${viaLabel === 'Langsung' ? ' is-direct' : ''}`}>{viaLabel}</span>
            )}
          </div>
          <div className="tp-point is-end">
            {validArrival ? (
              <span className="tp-time-row">
                <strong className="tp-time sp-numbers">{time(trip.arrivalAt!)}</strong>
                <span className="tp-wib">WIB</span>
              </span>
            ) : (
              <strong className="tp-time-unknown">Waktu tiba belum tersedia</strong>
            )}
            <span className="tp-stop-name">{trip.destinationName}</span>
            {trip.destinationCity && <span className="tp-stop-city">{trip.destinationCity}</span>}
          </div>
        </div>
        <p className="tp-card-meta">
          <span className="tp-card-meta-item">
            <CalendarBlank size={14} aria-hidden="true" />
            {dayLabel(trip.departureAt)}, {formatDepartureWib(trip.departureAt)}
          </span>
          <span className="tp-card-meta-item">Berangkat tepat waktu (WIB)</span>
          {trip.cutoff && (
            <span className="tp-card-meta-item">
              <Clock size={14} aria-hidden="true" />
              Pesan sebelum {formatDepartureWib(trip.cutoff)}
            </span>
          )}
        </p>
      </div>
      <div className="tp-card-purchase">
        <span className="tp-fare-label">Tarif per penumpang</span>
        <strong className="sp-fare sp-numbers">{formatIdr(trip.fare)}</strong>
        <span className={`tp-seat-pill ${seatTone}`}>
          <span className="tp-seat-dot" aria-hidden="true" />
          {seatLabel}
        </span>
        <Link
          className="tp-cta-accent tp-card-cta"
          href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}
        >
          Pilih kursi
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
