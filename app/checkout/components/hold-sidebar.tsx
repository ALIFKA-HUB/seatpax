'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {Clock,Trash} from '@phosphor-icons/react';
import JourneySummary from '@/app/components/journey-summary';
import StatusBadge from '@/app/components/status-badge';
import {formatDepartureWib,holdPresentation} from '@/app/presentation';
import {releaseHoldAction} from '@/app/trips/actions';
import {deadlineCountdown} from '@/modules/inventory/selection-state';
import type {HoldView} from '@/modules/inventory/types';

export default function HoldSidebar({initial}:{initial:HoldView}){
 const [view,setView]=useState(initial);
 const [remaining,setRemaining]=useState(Math.max(0,Date.parse(initial.record.effectiveExpiresAt)-Date.parse(initial.serverNow)));
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState('');
 const busy=useRef(false);
 const router=useRouter();
 const h=view.record;
 const from=view.detail.stops.find(s=>s.id===h.fromStopId);
 const to=view.detail.stops.find(s=>s.id===h.toStopId);
 const seat=view.detail.seats.find(s=>s.id===h.seatId);
 const seatPath=`/trips/${h.tripId}?from=${h.fromStopId}&to=${h.toStopId}`;

 useEffect(()=>{
  if(view.effectiveStatus!=='ACTIVE')return;
  let alive=true;
  const tick=deadlineCountdown(view.record.effectiveExpiresAt,view.serverNow,Date.now(),()=>{
   if(alive)router.refresh();
  });
  const timer=setInterval(()=>setRemaining(tick(Date.now())),1000);
  return()=>{alive=false;clearInterval(timer);};
 },[view.effectiveStatus,view.record.effectiveExpiresAt,view.serverNow,router]);

 async function release(){
  if(busy.current)return;
  busy.current=true;setPending(true);setMessage('');
  try{
   const result=await releaseHoldAction(h.id);
   if(result.ok){router.push(seatPath);return;}
   setView(view);
   setMessage(result.message);
  }catch{
   setMessage('Gagal melepas kursi. Coba lagi.');
  }finally{
   busy.current=false;setPending(false);
  }
 }

 const seconds=Math.max(0,Math.ceil(remaining/1000));
 const urgent=seconds<=120;

 return <aside className="pf-summary-sticky" aria-label="Ringkasan perjalanan dan batas hold">
  <div className="pf-summary-card">
   <div className="pf-card-head" style={{marginBottom:0}}>
    <h2>Perjalanan Anda</h2>
    <StatusBadge {...holdPresentation(view.effectiveStatus)}/>
   </div>
   <JourneySummary fromName={from?.name??''} toName={to?.name??''} departureAt={from!.departureAt} seatCode={seat?.seatCode} fare={view.fare} operator={view.detail.trip.name}/>
   <div className={`pf-countdown-box${urgent?' is-urgent':''}`}>
    <div className="pf-countdown-label">
     <span><Clock size={13} aria-hidden="true" style={{verticalAlign:'-2px',marginRight:5}}/>Sisa waktu kunci kursi</span>
     <small>Berakhir {formatDepartureWib(h.effectiveExpiresAt)}</small>
    </div>
    <strong className="pf-countdown-time">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong>
   </div>
   <button className="sp-secondary pf-danger-btn" type="button" disabled={pending} onClick={()=>void release()}>
    <Trash size={16} aria-hidden="true" style={{marginRight:6}}/>{pending?'Melepas kursi…':'Lepaskan & ganti kursi'}
   </button>
   <Link className="sp-secondary" href={seatPath}>Lihat peta kursi</Link>
   {message&&<p role="status" className="auth-message" style={{margin:0}}>{message}</p>}
  </div>
 </aside>;
}
