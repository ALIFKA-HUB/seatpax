import Link from 'next/link';
import type {TicketView} from '@/modules/ticket/service';
import {bookingPresentation} from '../presentation';
import JourneySummary from './journey-summary';
import StatusBadge from './status-badge';

export default function TicketCard({ticket}:{ticket:TicketView}) {
 return <article className="passenger-card sp-ticket-card">
  <StatusBadge {...bookingPresentation(ticket.bookingStatus)}/>
  <JourneySummary fromName={ticket.snapshot.fromName} toName={ticket.snapshot.toName} departureAt={ticket.snapshot.departureAt} seatCode={ticket.snapshot.seatCode} fare={ticket.amount} operator={ticket.snapshot.tripName}/>
  <p className="sp-passenger-name">{ticket.passenger.name}</p>
  <Link className="sp-secondary" href={`/tickets/${ticket.id}`}>Buka tiket →</Link>
 </article>;
}
