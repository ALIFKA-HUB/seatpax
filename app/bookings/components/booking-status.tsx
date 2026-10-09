'use client';
import Link from 'next/link';
import BookingOutcome from '@/app/components/booking-outcome';
import JourneySummary from '@/app/components/journey-summary';
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
 return <section className="passenger-card sp-ticket-panel" aria-live="polite"><h2>Detail booking</h2><JourneySummary fromName={booking.snapshot.fromName} toName={booking.snapshot.toName} departureAt={booking.snapshot.departureAt} seatCode={booking.snapshot.seatCode} fare={booking.amount} operator={booking.snapshot.tripName}/><p className="sp-passenger-name">{booking.passenger.name}</p><BookingOutcome booking={booking}/>{booking.status==='PENDING_PAYMENT'&&clientKey&&<button className="sp-primary" type="button" disabled={busy} onClick={()=>void pay()}>{busy?'Menyiapkan…':'Buka pembayaran'}</button>}<div className="sp-actions"><button className="sp-secondary" type="button" onClick={()=>void refresh()}>Perbarui status</button><Link href="/tickets">Tiket saya</Link></div><p role="status">{message}</p></section>;
}
