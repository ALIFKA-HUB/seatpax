import Link from 'next/link';
import {redirect} from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import {ArrowLeft} from '@phosphor-icons/react/ssr';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketData} from '../data';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import JourneySummary from '@/app/components/journey-summary';
import StatePanel from '@/app/components/state-panel';
import StatusBadge from '@/app/components/status-badge';
import {bookingPresentation} from '@/app/presentation';
import PrintButton from './print-button';
import '../../passenger.css';
import '../../components/passenger-flow.css';
import '../tickets.css';

export const dynamic='force-dynamic';

export default async function TicketPage({params}:{params:Promise<{ticketId:string}>}){
 const {ticketId}=await params,user=await getVerifiedUser();
 if(!user)redirect('/login?next='+encodeURIComponent('/tickets/'+ticketId));
 const ticket=await ticketData(ticketId);

 if(!ticket)return <PassengerShell active="tickets">
  <div className="tk-detail-shell">
   <div className="pf-topbar"><Link className="pf-back-link" href="/tickets"><ArrowLeft size={16} aria-hidden="true"/>Tiket saya</Link></div>
   <StatePanel title="Tiket tidak tersedia" action={<Link className="sp-secondary" href="/tickets">Kembali ke tiket saya</Link>}>Tiket hanya dapat dibuka oleh pemesan yang masuk.</StatePanel>
  </div>
 </PassengerShell>;

 const qr=ticket.bookingStatus==='CONFIRMED'?await QRCode.toDataURL(ticket.qrToken,{errorCorrectionLevel:'M',margin:1,width:320}):null;

 return <PassengerShell active="tickets">
  <div className="tk-detail-shell">
   <div className="pf-topbar">
    <Link className="pf-back-link" href="/tickets"><ArrowLeft size={16} aria-hidden="true"/>Tiket saya</Link>
    <BookingStepper step={3}/>
   </div>
   <section className="pf-hero tk-print-hide" aria-labelledby="ticket-detail-title">
    <div>
     <p className="pf-eyebrow">E-Tiket Shuttle</p>
     <h1 id="ticket-detail-title">Tiket perjalanan</h1>
     <p className="pf-hero-sub">Simpan atau tunjukkan kode QR di bawah ini kepada petugas shuttle saat naik kendaraan.</p>
    </div>
   </section>
   <section className="passenger-card tk-detail-card sp-ticket-panel">
    <div className="tk-detail-actions">
     <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
      <h2 style={{margin:0}}>Detail tiket</h2>
      <StatusBadge {...bookingPresentation(ticket.bookingStatus)}/>
     </div>
     {qr&&<PrintButton/>}
    </div>
    <JourneySummary fromName={ticket.snapshot.fromName} toName={ticket.snapshot.toName} departureAt={ticket.snapshot.departureAt} seatCode={ticket.snapshot.seatCode} fare={ticket.amount} operator={ticket.snapshot.tripName}/>
    <dl className="ticket-meta" style={{margin:'8px 0'}}>
     <dt>Penumpang</dt><dd>{ticket.passenger.name}</dd>
     <dt>Armada</dt><dd>{ticket.snapshot.vehicleName} · {ticket.snapshot.plateNumber}</dd>
    </dl>
    <div className="sp-ticket-qr-region">
     {qr
      ?<><Image className="ticket-qr" src={qr} unoptimized width={320} height={320} alt={`QR tiket untuk ${ticket.passenger.name}, kursi ${ticket.snapshot.seatCode}`}/><p>Tunjukkan QR ini kepada petugas saat naik.</p></>
      :<p>{ticket.bookingStatus==='REFUNDED'?'QR tidak tersedia untuk booking yang telah di-refund.':'QR belum tersedia untuk booking yang perlu ditinjau.'}</p>}
    </div>
   </section>
  </div>
 </PassengerShell>;
}
