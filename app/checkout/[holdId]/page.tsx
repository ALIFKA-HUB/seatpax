import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {checkoutData} from '../data';
import CheckoutForm from '../components/checkout-form';
import PassengerShell from '@/app/components/passenger-shell';
import JourneySummary from '@/app/components/journey-summary';
import StatePanel from '@/app/components/state-panel';
import {holdPresentation} from '@/app/presentation';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function CheckoutPage({params}:{params:Promise<{holdId:string}>}){
 const {holdId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/checkout/'+holdId));const data=await checkoutData(holdId);
 if(!data)return <PassengerShell active="search"><StatePanel title="Hold tidak tersedia" action={<Link className="sp-primary" href="/trips">Cari perjalanan</Link>}>Masuk dengan akun pemilik hold dan pilih kursi kembali bila hold telah berakhir.</StatePanel></PassengerShell>;
 const h=data.hold.record,from=data.hold.detail.stops.find(s=>s.id===h.fromStopId),to=data.hold.detail.stops.find(s=>s.id===h.toStopId),seat=data.hold.detail.seats.find(s=>s.id===h.seatId);
 if(data.hold.effectiveStatus!=='ACTIVE')return <PassengerShell active="search"><StatePanel title="Checkout berakhir" action={<Link className="sp-primary" href="/trips">Cari perjalanan</Link>}>Hold ini berstatus {holdPresentation(data.hold.effectiveStatus).label.toLowerCase()}. Pilih kursi yang tersedia untuk memulai lagi.</StatePanel></PassengerShell>;
 return <PassengerShell active="search"><Link className="sp-back" href={`/holds/${h.id}`}>← Detail hold</Link><div className="sp-page-heading"><h1>Checkout</h1><p className="sp-muted">Periksa penumpang dan perjalanan sebelum melanjutkan.</p></div><div className="sp-checkout-layout"><section className="passenger-card"><h2>Perjalanan Anda</h2><JourneySummary fromName={from!.name} toName={to!.name} departureAt={from!.departureAt} seatCode={seat?.seatCode} fare={data.hold.fare} operator={data.hold.detail.trip.name}/></section>{data.clientKey?<CheckoutForm holdId={holdId} profile={data.profile} email={data.email} payment={{clientKey:data.clientKey}}/>:<StatePanel title="Checkout belum tersedia">Pembayaran Sandbox belum dikonfigurasi dengan lengkap. Hold Anda masih dapat dilepas atau dibiarkan berakhir.</StatePanel>}</div></PassengerShell>;
}
