import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {createBookingRepository} from '@/modules/booking/repository';
import {createBookingQueryService} from '@/modules/booking/query-service';
import {getDatabase} from '@/lib/db';
import {parsePaymentEnv} from '@/lib/env/payment';
import BookingStatus from '../components/booking-status';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function BookingPage({params}:{params:Promise<{bookingId:string}>}){const {bookingId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/bookings/'+bookingId));let booking;try{booking=await createBookingQueryService(createBookingRepository(getDatabase().$client)).readMine(user.id,bookingId);}catch{}if(!booking)return <main className="passenger"><h1>Booking tidak tersedia</h1><p>Booking hanya dapat dibuka oleh pemilik yang masuk.</p><Link href="/tickets">Tiket saya</Link></main>;let clientKey:string|null=null;try{clientKey=parsePaymentEnv(process.env).clientKey;}catch{}return <main className="passenger"><nav><Link href="/tickets">← Tiket saya</Link><Link href="/trips">Cari perjalanan</Link></nav><h1>Booking Anda</h1><BookingStatus initial={booking} clientKey={clientKey}/></main>;}
