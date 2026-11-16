import Link from 'next/link';
import {redirect} from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import {ArrowLeft,ArrowRight} from '@phosphor-icons/react/ssr';
import {getVerifiedUser} from '@/modules/auth/identity';
import {ticketData} from '../data';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
import StatusBadge from '@/app/components/status-badge';
import {bookingPresentation,formatDepartureWib,formatIdr} from '@/app/presentation';
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
   <header className="pf-head tk-print-hide" aria-labelledby="ticket-detail-title">
    <h1 id="ticket-detail-title">Tiket perjalanan</h1>
    <p className="pf-head-sub">Simpan atau tunjukkan kode QR di sebelah kanan kepada petugas shuttle saat naik kendaraan.</p>
   </header>
   <article className="tk-pass" aria-label="Boarding pass elektronik">
    <div className="tk-pass-main">
     <div className="tk-pass-head">
      <StatusBadge {...bookingPresentation(ticket.bookingStatus)}/>
      <span className="tk-trip-name">{ticket.snapshot.tripName}</span>
     </div>
     <div className="tk-pass-route">
      <h2>
       <span>{ticket.snapshot.fromName}</span>
       <ArrowRight size={20} weight="bold" aria-hidden="true" style={{color:'var(--tk-primary)'}}/>
       <span>{ticket.snapshot.toName}</span>
      </h2>
      <p>{formatDepartureWib(ticket.snapshot.departureAt)}</p>
     </div>
     <dl className="tk-pass-facts">
      <div><dt>Penumpang</dt><dd>{ticket.passenger.name}</dd></div>
      <div><dt>Nomor kursi</dt><dd>Kursi {ticket.snapshot.seatCode}</dd></div>
      <div><dt>Armada</dt><dd>{ticket.snapshot.vehicleName}</dd></div>
      <div><dt>Nomor polisi</dt><dd>{ticket.snapshot.plateNumber}</dd></div>
      <div><dt>Tarif dibayar</dt><dd>{formatIdr(ticket.amount)}</dd></div>
     </dl>
    </div>
    <div className="tk-pass-qr sp-ticket-qr-region" style={{borderTop:0,paddingTop:'26px',marginTop:0}}>
     {qr
      ?<>
       <div className="tk-qr-frame">
        <Image className="ticket-qr" style={{margin:0,border:0,width:210}} src={qr} unoptimized width={210} height={210} alt={`QR tiket untuk ${ticket.passenger.name}, kursi ${ticket.snapshot.seatCode}`}/>
       </div>
       <p>Tunjukkan QR ini kepada petugas saat naik.</p>
       <PrintButton/>
      </>
      :<p>{ticket.bookingStatus==='REFUNDED'?'QR tidak tersedia untuk booking yang telah di-refund.':'QR belum tersedia untuk booking yang perlu ditinjau.'}</p>}
    </div>
   </article>
  </div>
 </PassengerShell>;
}
