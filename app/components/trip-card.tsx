import Link from 'next/link';
import type {SearchResult} from '@/modules/inventory/types';
import JourneySummary from './journey-summary';
import {formatIdr} from '../presentation';
export default function TripCard({trip}:{trip:SearchResult}){
 return <article className="passenger-card sp-trip-card"><JourneySummary fromName={trip.originName} toName={trip.destinationName} departureAt={trip.departureAt} operator={trip.companyName} className={trip.className}/><div className="sp-trip-purchase"><strong className="sp-fare sp-numbers">{formatIdr(trip.fare)}</strong><span className="sp-availability">{trip.availableCount} kursi tersedia</span><Link className="sp-primary" href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}>Lihat kursi <span aria-hidden="true">→</span></Link></div></article>;
}
