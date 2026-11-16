import Link from 'next/link';
import {ArrowRight,CalendarBlank,QrCode,User} from '@phosphor-icons/react/ssr';
import type {TicketView} from '@/modules/ticket/service';
import {bookingPresentation,formatDepartureWib,formatIdr} from '../presentation';
import StatusBadge from './status-badge';

export default function TicketCard({ticket}:{ticket:TicketView}) {
 const status=bookingPresentation(ticket.bookingStatus);
 const ready=ticket.bookingStatus==='CONFIRMED';

 return <article className="passenger-card tk-card">
  <div className="tk-card-main">
   <div className="tk-card-top">
    <StatusBadge {...status}/>
    <span className="tk-trip-name">{ticket.snapshot.tripName}</span>
   </div>
   <div className="tk-route-row">
    <span>{ticket.snapshot.fromName}</span>
    <ArrowRight size={18} weight="bold" aria-hidden="true" style={{color:'var(--sp-primary)'}}/>
    <span>{ticket.snapshot.toName}</span>
   </div>
   <div className="tk-meta-row">
    <span className="tk-meta-item"><CalendarBlank size={15} aria-hidden="true"/>{formatDepartureWib(ticket.snapshot.departureAt)}</span>
    <span className="tk-meta-item sp-passenger-name" style={{marginTop:0}}><User size={15} aria-hidden="true"/>{ticket.passenger.name}</span>
   </div>
  </div>
  <div className="tk-card-stub">
   <div className="tk-seat-box">
    <span>Kursi</span>
    <strong>{ticket.snapshot.seatCode}</strong>
   </div>
   <div className="tk-stub-actions">
    <span className="tk-fare">{formatIdr(ticket.amount)}</span>
    <Link className={ready?'sp-primary':'sp-secondary'} href={`/tickets/${ticket.id}`}>
     <QrCode size={16} aria-hidden="true" style={{marginRight:6}}/>
     {ready?'Buka tiket & QR':'Detail tiket'}
    </Link>
   </div>
  </div>
 </article>;
}
