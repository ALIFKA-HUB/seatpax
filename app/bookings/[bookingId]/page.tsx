import Link from 'next/link';
import {ArrowLeft} from '@phosphor-icons/react/ssr';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {createBookingRepository} from '@/modules/booking/repository';
import {createBookingQueryService} from '@/modules/booking/query-service';
import {getDatabase} from '@/lib/db';
import {parsePaymentEnv} from '@/lib/env/payment';
import BookingStatus from '../components/booking-status';
import '../../passenger.css';
import '../../components/passenger-flow.css';

export const dynamic='force-dynamic';

export default async function BookingPage({params}:{params:Promise<{bookingId:string}>}){
 const {bookingId}=await params,user=await getVerifiedUser();
 if(!user)redirect('/login?next='+encodeURIComponent('/bookings/'+bookingId));
 let booking;
 try{booking=await createBookingQueryService(createBookingRepository(getDatabase().$client)).readMine(user.id,bookingId);}catch{}

 if(!booking)return <PassengerShell active="tickets">
  <div className="pf-wrap pf-status-shell">
   <div className="pf-topbar"><Link className="pf-back-link" href="/tickets"><ArrowLeft size={16} aria-hidden="true"/>Tiket saya</Link></div>
   <StatePanel title="Booking tidak tersedia" action={<Link className="sp-secondary" href="/tickets">Tiket saya</Link>}>
    Booking hanya dapat dibuka oleh pemilik yang masuk.
   </StatePanel>
  </div>
 </PassengerShell>;

 let clientKey:string|null=null;
 try{clientKey=parsePaymentEnv(process.env).clientKey;}catch{}

 return <PassengerShell active="tickets">
  <div className="pf-wrap pf-status-shell">
   <div className="pf-topbar">
    <Link className="pf-back-link" href="/tickets"><ArrowLeft size={16} aria-hidden="true"/>Pesanan saya</Link>
    <BookingStepper step={booking.status==='CONFIRMED'?3:2}/>
   </div>
   <header className="pf-head" aria-labelledby="booking-status-title">
    <h1 id="booking-status-title">Booking Anda</h1>
    <p className="pf-head-sub">Pantau status pembayaran Anda. Tiket QR otomatis aktif begitu pembayaran terkonfirmasi.</p>
   </header>
   <BookingStatus initial={booking} clientKey={clientKey}/>
   <div className="pf-action-row">
    <Link className="sp-secondary" href={'/pengaduan/buat?pesanan='+encodeURIComponent(bookingId)}>Laporkan masalah pesanan</Link>
   </div>
  </div>
 </PassengerShell>;
}
