import Link from 'next/link';
import type {BookingView} from '@/modules/booking/types';
import {bookingPresentation} from '../presentation';
import StatusBadge from './status-badge';

export default function BookingOutcome({booking}:{booking:BookingView}) {
 const state=bookingPresentation(booking.status);
 return <div className="sp-booking-outcome"><div role="status"><StatusBadge {...state}/>
  {booking.status==='PENDING_PAYMENT'&&<p>Pembayaran masih menunggu konfirmasi. Anda dapat melanjutkan pembayaran atau memeriksa statusnya.</p>}
  {booking.status==='CONFIRMED'&&<p>{booking.ticketId?'Pembayaran dikonfirmasi. Tiket Anda siap dibuka.':'Pembayaran dikonfirmasi. Tiket belum tersedia; perbarui status untuk memeriksanya.'}</p>}
  {booking.status==='PAYMENT_CONFLICT'&&<p>Pembayaran diterima setelah batas pemesanan. Tim operator sedang meninjau; tiket belum diterbitkan.</p>}
  {booking.status==='REFUNDED'&&<p>Refund simulasi tercatat. Proses ini tidak mengirim pengembalian uang.</p>}
  {booking.status==='EXPIRED'&&<p>Batas pembayaran berakhir. Mulai pemesanan baru untuk memilih kursi.</p>}
  {!['PENDING_PAYMENT','CONFIRMED','PAYMENT_CONFLICT','REFUNDED','EXPIRED'].includes(booking.status)&&<p>Status booking belum dapat dipastikan. Perbarui status untuk memeriksanya.</p>}
 </div>{booking.status==='CONFIRMED'&&booking.ticketId&&<p><Link className="sp-primary" href={`/tickets/${booking.ticketId}`}>Buka tiket dan QR →</Link></p>}</div>;
}
