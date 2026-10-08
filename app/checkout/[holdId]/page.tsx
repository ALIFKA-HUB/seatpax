import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {checkoutData} from '../data';
import CheckoutForm from '../components/checkout-form';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function CheckoutPage({params}:{params:Promise<{holdId:string}>}){
 const {holdId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/checkout/'+holdId));const data=await checkoutData(holdId);
 if(!data)return <main className="passenger"><h1>Hold tidak tersedia</h1><p>Masuk dengan akun pemilik hold dan pilih kursi kembali bila hold telah berakhir.</p><Link href="/trips">Cari perjalanan</Link></main>;
 const h=data.hold.record,from=data.hold.detail.stops.find(s=>s.id===h.fromStopId),to=data.hold.detail.stops.find(s=>s.id===h.toStopId),seat=data.hold.detail.seats.find(s=>s.id===h.seatId);
 if(data.hold.effectiveStatus!=='ACTIVE')return <main className="passenger"><Link href="/trips">← Cari perjalanan</Link><h1>Checkout berakhir</h1><p>Hold ini berstatus {data.hold.effectiveStatus}. Pilih kursi yang tersedia untuk memulai lagi.</p></main>;
 return <main className="passenger"><nav><Link href={`/holds/${h.id}`}>← Detail hold</Link><Link href="/tickets">Tiket saya</Link></nav><h1>Checkout</h1><p className="auth-intro">Periksa penumpang dan perjalanan sebelum melanjutkan.</p><section className="passenger-card"><h2>{from?.name} → {to?.name}</h2><p>{data.hold.detail.trip.name} · Kursi {seat?.seatCode}</p><p>{new Date(from!.departureAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</p><p className="checkout-total">Rp {BigInt(data.hold.fare).toLocaleString('id-ID')}</p></section>{data.clientKey?<CheckoutForm holdId={holdId} profile={data.profile} email={data.email} payment={{clientKey:data.clientKey}}/>:<section className="passenger-card"><h2>Checkout belum tersedia</h2><p>Pembayaran Sandbox belum dikonfigurasi dengan lengkap. Hold Anda masih dapat dilepas atau dibiarkan berakhir.</p></section>}</main>;
}
