'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {BookingView} from '@/modules/booking/types';
import {refreshBookingAction,prepareBookingPaymentAction} from '@/app/checkout/actions';
import {openSnap} from '@/app/checkout/snap-client';
const terminal=(s:string)=>s!=='PENDING_PAYMENT';
export default function BookingStatus({initial,clientKey}:{initial:BookingView;clientKey:string|null}){
 const [booking,setBooking]=useState(initial),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){const r=await refreshBookingAction(booking.id);if(r.ok){setBooking(r.booking);setMessage('');}else setMessage(r.message);}
 async function pay(){if(!clientKey||busy)return;setBusy(true);setMessage('');try{const r=await prepareBookingPaymentAction(booking.id);if(!r.ok){setMessage(r.message);return;}setBooking(r.booking);if(r.token)await openSnap(r.token,clientKey,()=>void refresh());else setMessage('Pembayaran belum memiliki token aktif. Status akan diperbarui otomatis.');}catch{setMessage('Jendela pembayaran belum tersedia.');}finally{setBusy(false);}}
 useEffect(()=>{if(terminal(booking.status))return;let alive=true,reading=false;const timer=window.setInterval(()=>{if(document.visibilityState!=='visible'||reading)return;reading=true;void refreshBookingAction(booking.id).then(r=>{if(alive&&r.ok)setBooking(r.booking);}).finally(()=>{reading=false;});},5000);return()=>{alive=false;window.clearInterval(timer);};},[booking.id,booking.status]);
 return <section className="passenger-card" aria-live="polite"><h2>Status: {booking.status.replaceAll('_',' ')}</h2><p>{booking.snapshot.fromName} → {booking.snapshot.toName} · Kursi {booking.snapshot.seatCode}</p><p>{booking.passenger.name} · Rp {BigInt(booking.amount).toLocaleString('id-ID')}</p>{booking.status==='PENDING_PAYMENT'&&<><p>Pembayaran masih menunggu konfirmasi. Anda dapat melanjutkan pembayaran atau memeriksa statusnya.</p>{clientKey&&<button type="button" disabled={busy} onClick={()=>void pay()}>{busy?'Menyiapkan…':'Buka pembayaran'}</button>}</>}{booking.status==='CONFIRMED'&&booking.ticketId&&<p><Link href={`/tickets/${booking.ticketId}`}>Buka tiket dan QR →</Link></p>}{booking.status==='PAYMENT_CONFLICT'&&<p>Pembayaran diterima setelah batas pemesanan. Tim operator sedang meninjau; tiket belum diterbitkan.</p>}{booking.status==='REFUNDED'&&<p>Refund simulasi tercatat. Proses ini tidak mengirim pengembalian uang.</p>}{booking.status==='EXPIRED'&&<p>Batas pembayaran berakhir. Mulai pemesanan baru untuk memilih kursi.</p>}<p><button type="button" onClick={()=>void refresh()}>Perbarui status</button> <Link href="/tickets">Tiket saya</Link></p><p role="status">{message}</p></section>;
}
