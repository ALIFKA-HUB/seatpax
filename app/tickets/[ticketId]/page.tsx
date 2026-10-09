import Link from 'next/link';
import {redirect} from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketData} from '../data';
import PassengerShell from '@/app/components/passenger-shell';
import JourneySummary from '@/app/components/journey-summary';
import StatePanel from '@/app/components/state-panel';
import StatusBadge from '@/app/components/status-badge';
import {bookingPresentation} from '@/app/presentation';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function TicketPage({params}:{params:Promise<{ticketId:string}>}){
 const {ticketId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/tickets/'+ticketId));const ticket=await ticketData(ticketId);
 if(!ticket)return <PassengerShell active="tickets"><StatePanel title="Tiket tidak tersedia" action={<Link className="sp-secondary" href="/tickets">Tiket saya</Link>}>Tiket hanya dapat dibuka oleh pemesan yang masuk.</StatePanel></PassengerShell>;
 const qr=ticket.bookingStatus==='CONFIRMED'?await QRCode.toDataURL(ticket.qrToken,{errorCorrectionLevel:'M',margin:1,width:320}):null;
 return <PassengerShell active="tickets"><Link className="sp-back" href="/tickets">← Tiket saya</Link><h1>Tiket perjalanan</h1><section className="passenger-card sp-ticket-panel"><div className="sp-ticket-card-top"><h2>Detail tiket</h2><StatusBadge {...bookingPresentation(ticket.bookingStatus)}/></div><JourneySummary fromName={ticket.snapshot.fromName} toName={ticket.snapshot.toName} departureAt={ticket.snapshot.departureAt} seatCode={ticket.snapshot.seatCode} fare={ticket.amount} operator={ticket.snapshot.tripName}/><dl className="ticket-meta"><dt>Penumpang</dt><dd>{ticket.passenger.name}</dd><dt>Armada</dt><dd>{ticket.snapshot.vehicleName} · {ticket.snapshot.plateNumber}</dd></dl><div className="sp-ticket-qr-region">{qr?<><Image className="ticket-qr" src={qr} unoptimized width={320} height={320} alt={`QR tiket untuk ${ticket.passenger.name}, kursi ${ticket.snapshot.seatCode}`}/><p>Tunjukkan QR ini kepada petugas saat naik.</p></>:<p>{ticket.bookingStatus==='REFUNDED'?'QR tidak tersedia untuk booking yang telah di-refund.':'QR belum tersedia untuk booking yang perlu ditinjau.'}</p>}</div></section></PassengerShell>;
}
