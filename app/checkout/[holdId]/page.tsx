import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ArrowLeft,WarningCircle} from '@phosphor-icons/react/ssr';
import {getVerifiedUser} from '@/modules/auth/identity';
import {checkoutData} from '../data';
import CheckoutForm from '../components/checkout-form';
import HoldSidebar from '../components/hold-sidebar';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
import {holdPresentation} from '@/app/presentation';
import '../../passenger.css';
import '../../components/passenger-flow.css';

export const dynamic='force-dynamic';

export default async function CheckoutPage({params}:{params:Promise<{holdId:string}>}){
 const {holdId}=await params,user=await getVerifiedUser();
 if(!user)redirect('/login?next='+encodeURIComponent('/checkout/'+holdId));
 const data=await checkoutData(holdId);

 if(!data)return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar"><Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Cari perjalanan</Link></div>
   <StatePanel title="Hold tidak tersedia" action={<Link className="sp-primary" href="/trips">Cari perjalanan</Link>}>
    Masuk dengan akun pemilik hold dan pilih kursi kembali bila waktu hold telah berakhir.
   </StatePanel>
  </div>
 </PassengerShell>;

 const h=data.hold.record;
 const seatUrl=`/trips/${h.tripId}?from=${h.fromStopId}&to=${h.toStopId}`;

 if(data.hold.effectiveStatus!=='ACTIVE')return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar"><Link className="pf-back-link" href={seatUrl}><ArrowLeft size={16} aria-hidden="true"/>Pilih kursi lagi</Link></div>
   <StatePanel title="Checkout berakhir" action={<Link className="sp-primary" href={seatUrl}>Pilih kursi lagi</Link>}>
    Hold ini berstatus {holdPresentation(data.hold.effectiveStatus).label.toLowerCase()}. Pilih kursi yang tersedia untuk memulai kembali.
   </StatePanel>
  </div>
 </PassengerShell>;

 return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar">
    <Link className="pf-back-link" href={`/holds/${h.id}`}><ArrowLeft size={16} aria-hidden="true"/>Detail hold</Link>
    <BookingStepper step={2}/>
   </div>
   <section className="pf-hero" aria-labelledby="checkout-title">
    <div>
     <p className="pf-eyebrow">Konfirmasi Pemesanan</p>
     <h1 id="checkout-title">Data penumpang &amp; pembayaran</h1>
     <p className="pf-hero-sub">Kursi Anda dikunci sementara selama 10 menit. Lengkapi data penumpang di bawah untuk melanjutkan pembayaran.</p>
    </div>
   </section>
   <div className="pf-grid">
    {data.clientKey
     ?<CheckoutForm holdId={holdId} profile={data.profile} email={data.email} payment={{clientKey:data.clientKey}}/>
     :<section className="pf-sandbox-alert" aria-labelledby="sandbox-unavailable-title">
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
       <WarningCircle size={22} weight="fill" aria-hidden="true"/>
       <h2 id="sandbox-unavailable-title">Checkout belum tersedia</h2>
      </div>
      <p>Pembayaran Sandbox belum dikonfigurasi dengan lengkap (`MIDTRANS_ENVIRONMENT`, `MIDTRANS_MERCHANT_ID`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan `TICKET_ENCRYPTION_KEY`).</p>
      <p>Anda dapat langsung melepas kursi di panel kanan agar kursi kembali tersedia, atau lengkapi konfigurasi Sandbox pada `.env.local` lalu muat ulang halaman ini.</p>
      <div className="pf-action-row">
       <Link className="sp-secondary" href={seatUrl}>Kembali ke peta kursi</Link>
       <Link className="sp-secondary" href="/trips">Lihat jadwal lain</Link>
      </div>
     </section>}
    <HoldSidebar initial={data.hold}/>
   </div>
  </div>
 </PassengerShell>;
}
