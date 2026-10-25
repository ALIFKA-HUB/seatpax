import Link from 'next/link';
import PassengerShell from '@/app/components/passenger-shell';
import StatePanel from '@/app/components/state-panel';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {createBookingRepository} from '@/modules/booking/repository';
import {createBookingQueryService} from '@/modules/booking/query-service';
import {getDatabase} from '@/lib/db';
import {parsePaymentEnv} from '@/lib/env/payment';
import BookingStatus from '../components/booking-status';
import '../../passenger.css';
export const dynamic='force-dynamic';
export default async function BookingPage({params}:{params:Promise<{bookingId:string}>}){const {bookingId}=await params,user=await getVerifiedUser();if(!user)redirect('/login?next='+encodeURIComponent('/bookings/'+bookingId));let booking;try{booking=await createBookingQueryService(createBookingRepository(getDatabase().$client)).readMine(user.id,bookingId);}catch{}if(!booking)return <PassengerShell active="tickets"><StatePanel title="Booking tidak tersedia" action={<Link className="sp-secondary" href="/tickets">Tiket saya</Link>}>Booking hanya dapat dibuka oleh pemilik yang masuk.</StatePanel></PassengerShell>;let clientKey:string|null=null;try{clientKey=parsePaymentEnv(process.env).clientKey;}catch{}return <PassengerShell active="tickets"><Link className="sp-back" href="/tickets">← Tiket saya</Link><h1>Booking Anda</h1><BookingStatus initial={booking} clientKey={clientKey}/><p><Link className="sp-secondary" href={'/pengaduan/buat?pesanan='+encodeURIComponent(bookingId)}>Laporkan masalah</Link></p></PassengerShell>;}
