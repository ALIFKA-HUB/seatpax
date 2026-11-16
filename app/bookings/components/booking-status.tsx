'use client';
import Link from 'next/link';
import {ArrowsClockwise,CreditCard} from '@phosphor-icons/react';
import BookingOutcome from '@/app/components/booking-outcome';
import JourneySummary from '@/app/components/journey-summary';
import {useEffect,useState} from 'react';
import type {BookingView} from '@/modules/booking/types';
import {refreshBookingAction,prepareBookingPaymentAction} from '@/app/checkout/actions';
import {openSnap} from '@/app/checkout/snap-client';

const terminal=(s:string)=>s!=='PENDING_PAYMENT';

export default function BookingStatus({initial,clientKey}:{initial:BookingView;clientKey:string|null}){
 const [booking,setBooking]=useState(initial),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);

 async function refresh(){
  const r=await refreshBookingAction(booking.id);
  if(r.ok){setBooking(r.booking);setMessage('');}
  else setMessage(r.message);
 }

 async function pay(){
  if(!clientKey||busy)return;
  setBusy(true);setMessage('');
  try{
   const r=await prepareBookingPaymentAction(booking.id);
   if(!r.ok){setMessage(r.message);return;}
   setBooking(r.booking);
   if(r.token)await openSnap(r.token,clientKey,()=>void refresh());
   else setMessage('Pembayaran belum memiliki token aktif. Status akan diperbarui otomatis.');
  }catch{setMessage('Jendela pembayaran belum tersedia.');}
  finally{setBusy(false);}
 }

 useEffect(()=>{
  if(terminal(booking.status))return;
  let alive=true,reading=false;
  const timer=window.setInterval(()=>{
   if(document.visibilityState!=='visible'||reading)return;
   reading=true;
   void refreshBookingAction(booking.id).then(r=>{if(alive&&r.ok)setBooking(r.booking);}).finally(()=>{reading=false;});
  },5000);
  return()=>{alive=false;window.clearInterval(timer);};
 },[booking.id,booking.status]);

 return <section className="pf-card sp-ticket-panel">
  <div className="pf-card-head">
   <div>
    <h2 style={{marginBottom:'2px'}}>Detail booking</h2>
    <p className="pf-summary-note">Penumpang: <strong>{booking.passenger.name}</strong></p>
   </div>
  </div>
  <JourneySummary fromName={booking.snapshot.fromName} toName={booking.snapshot.toName} departureAt={booking.snapshot.departureAt} seatCode={booking.snapshot.seatCode} fare={booking.amount} operator={booking.snapshot.tripName}/>
  <BookingOutcome booking={booking}/>
  <div className="pf-action-row" style={{paddingTop:'16px',borderTop:'1px solid var(--pf-border)'}}>
   {booking.status==='PENDING_PAYMENT'&&clientKey&&<button className="sp-primary" type="button" disabled={busy} onClick={()=>void pay()}><CreditCard size={17} aria-hidden="true" style={{marginRight:6}}/>{busy?'Menyiapkan…':'Buka pembayaran'}</button>}
   <button className="sp-secondary" type="button" onClick={()=>void refresh()}><ArrowsClockwise size={16} aria-hidden="true" style={{marginRight:6}}/>Perbarui status</button>
   <Link className="sp-secondary" href="/tickets">Lihat semua tiket</Link>
  </div>
  {message&&<p role="status" className="auth-message" style={{margin:'12px 0 0'}}>{message}</p>}
 </section>;
}
