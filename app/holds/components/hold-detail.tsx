'use client';
import Link from 'next/link';
import {ArrowRight,Clock,Trash} from '@phosphor-icons/react';
import JourneySummary from '@/app/components/journey-summary';
import StatusBadge from '@/app/components/status-badge';
import {formatDepartureWib,holdPresentation} from '@/app/presentation';
import {useEffect,useRef,useState} from 'react';
import {deadlineCountdown} from '@/modules/inventory/selection-state';
import type {HoldView} from '@/modules/inventory/types';
import {readHoldAction,releaseHoldAction} from '@/app/trips/actions';

export default function HoldDetail({initial}:{initial:HoldView}){
 const [view,setView]=useState(initial),[remaining,setRemaining]=useState(Math.max(0,Date.parse(initial.record.effectiveExpiresAt)-Date.parse(initial.serverNow))),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const busy=useRef(false);

 async function refresh(){
  try{
   const result=await readHoldAction(view.record.id);
   if(result.ok)setView(result.data);
   else setMessage(result.message);
  }catch{setMessage('Status belum dapat diperbarui.');}
 }

 useEffect(()=>{
  if(view.effectiveStatus!=='ACTIVE')return;
  let alive=true;
  const tick=deadlineCountdown(view.record.effectiveExpiresAt,view.serverNow,Date.now(),()=>{
   void readHoldAction(view.record.id).then(r=>{if(alive){if(r.ok)setView(r.data);else setMessage(r.message);}}).catch(()=>{if(alive)setMessage('Perbarui status untuk memastikan expiry.');});
  });
  const timer=setInterval(()=>setRemaining(tick(Date.now())),1000);
  return()=>{alive=false;clearInterval(timer);};
 },[view]);

 async function release(){
  if(busy.current)return;
  busy.current=true;setPending(true);
  try{
   const result=await releaseHoldAction(view.record.id);
   if(result.ok)setView(result.data);
   else setMessage(result.message);
  }catch{setMessage('Hasil release belum diketahui. Coba lagi.');}
  finally{busy.current=false;setPending(false);}
 }

 const h=view.record,from=view.detail.stops.find(s=>s.id===h.fromStopId),to=view.detail.stops.find(s=>s.id===h.toStopId),seat=view.detail.seats.find(s=>s.id===h.seatId),seconds=Math.ceil(remaining/1000);
 const urgent=seconds<=120;

 return <section className="pf-card">
  <div className="pf-card-head">
   <div>
    <h2 style={{marginBottom:'2px'}}>Kursi pilihan Anda</h2>
    <p className="pf-summary-note">Batas hold: {formatDepartureWib(h.effectiveExpiresAt)}</p>
   </div>
   <StatusBadge {...holdPresentation(view.effectiveStatus)}/>
  </div>
  <JourneySummary fromName={from?.name??''} toName={to?.name??''} departureAt={from!.departureAt} seatCode={seat?.seatCode} fare={view.fare} operator={view.detail.trip.name}/>

  {view.effectiveStatus==='ACTIVE'&&<div style={{display:'grid',gap:'14px',marginTop:'18px'}}>
   <div className={`pf-countdown-box${urgent?' is-urgent':''}`}>
    <div className="pf-countdown-label">
     <span><Clock size={13} aria-hidden="true" style={{verticalAlign:'-2px',marginRight:5}}/>Sisa waktu hold</span>
     <small>Selesaikan checkout sebelum timer habis</small>
    </div>
    <strong className="pf-countdown-time">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong>
   </div>
   <div className="pf-action-row">
    <Link className="sp-primary pf-cta-primary" href={`/checkout/${h.id}`}>Lanjutkan checkout<ArrowRight size={17} aria-hidden="true"/></Link>
    <button className="sp-secondary pf-danger-btn" disabled={pending} onClick={()=>void release()}><Trash size={16} aria-hidden="true" style={{marginRight:6}}/>{pending?'Memproses…':'Lepaskan kursi'}</button>
   </div>
  </div>}

  {view.effectiveStatus!=='ACTIVE'&&<p className="sp-muted" style={{marginTop:'18px'}}>Kursi tidak lagi ditahan melalui hold ini. Kembali ke pilihan kursi atau periksa status booking yang sudah dibuat.</p>}

  <div className="pf-action-row" style={{marginTop:'16px',paddingTop:'16px',borderTop:'1px solid var(--pf-border)'}}>
   <button className="sp-secondary" disabled={pending} onClick={()=>void refresh()}>Perbarui status</button>
   <Link className="sp-secondary" href={`/trips/${h.tripId}?from=${h.fromStopId}&to=${h.toStopId}`}>Kembali ke peta kursi</Link>
  </div>
  {message&&<p role="status" className="auth-message" style={{margin:'12px 0 0'}}>{message}</p>}
 </section>;
}
