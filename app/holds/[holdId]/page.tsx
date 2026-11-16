import Link from 'next/link';
import {ArrowLeft} from '@phosphor-icons/react/ssr';
import PassengerShell from '@/app/components/passenger-shell';
import BookingStepper from '@/app/components/booking-stepper';
import StatePanel from '@/app/components/state-panel';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {passengerServices} from '@/app/trips/data';
import HoldDetail from '../components/hold-detail';
import '../../passenger.css';
import '../../components/passenger-flow.css';

export const dynamic='force-dynamic';

export default async function HoldPage({params}:{params:Promise<{holdId:string}>}){
 const {holdId}=await params,user=await getVerifiedUser();
 if(!user)redirect('/login?next='+encodeURIComponent('/holds/'+holdId));
 let initial;
 try{initial=await passengerServices().holds.readMine(user.id,holdId);}catch{}

 if(!initial)return <PassengerShell active="search">
  <div className="pf-wrap">
   <div className="pf-topbar"><Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Cari perjalanan</Link></div>
   <StatePanel title="Hold tidak tersedia" action={<Link className="sp-primary" href="/trips">Cari perjalanan</Link>}>
    Hold hanya dapat dibuka oleh pemiliknya atau masa tahan kursi sudah berakhir.
   </StatePanel>
  </div>
 </PassengerShell>;

 return <PassengerShell active="search">
  <div className="pf-wrap pf-status-shell">
   <div className="pf-topbar">
    <Link className="pf-back-link" href="/trips"><ArrowLeft size={16} aria-hidden="true"/>Cari perjalanan</Link>
    <BookingStepper step={2}/>
   </div>
   <header className="pf-head" aria-labelledby="hold-title">
    <h1 id="hold-title">Kursi Anda</h1>
    <p className="pf-head-sub">Lanjutkan ke pengisian data dan pembayaran atau lepaskan kursi bila ingin mengganti pilihan.</p>
   </header>
   <HoldDetail initial={initial}/>
  </div>
 </PassengerShell>;
}
