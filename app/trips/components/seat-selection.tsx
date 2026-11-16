'use client';
import Link from 'next/link';
import JourneySummary from '@/app/components/journey-summary';
import {formatDepartureWib} from '@/app/presentation';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {AvailabilityView} from '@/modules/inventory/types';
import {holdIntent,startVisiblePolling,type Intent} from '@/modules/inventory/selection-state';
import {createHoldAction,refreshAvailabilityAction} from '../actions';

export default function SeatSelection({initial,from,to,loggedIn}:{initial:AvailabilityView;from:string;to:string;loggedIn:boolean}){
 const [view,setView]=useState(initial),[selected,setSelected]=useState(''),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const intent=useRef<Intent|null>(null),busy=useRef(false),router=useRouter();
 const path=`/trips/${view.detail.trip.id}?from=${from}&to=${to}`;
 const selectedAvailable=view.seats.some(seat=>seat.id===selected&&seat.status==='AVAILABLE');
 const originStop=view.detail.stops.find(s=>s.id===from);
 const destinationStop=view.detail.stops.find(s=>s.id===to);
 const selectedSeat=view.seats.find(s=>s.id===selected);
 const availableTotal=view.seats.filter(s=>s.status==='AVAILABLE').length;

 useEffect(()=>{
  let alive=true,reading=false;
  async function refresh(){
   if(reading)return;
   reading=true;
   try{
    const result=await refreshAvailabilityAction(initial.detail.trip.id,from,to);
    if(alive){if(result.ok)setView(result.data);else setMessage(result.message);}
   }catch{if(alive)setMessage('Availability belum dapat diperbarui.');}
   finally{reading=false;}
  }
  const stop=startVisiblePolling({
   visible:()=>document.visibilityState==='visible',
   subscribe:fn=>{document.addEventListener('visibilitychange',fn);return ()=>document.removeEventListener('visibilitychange',fn);},
  },()=>void refresh());
  return ()=>{alive=false;stop();};
 },[initial.detail.trip.id,from,to]);

 async function hold(){
  if(busy.current||!selectedAvailable)return;
  busy.current=true;setPending(true);setMessage('');
  const selection=[view.detail.trip.id,from,to,selected].join(':');
  intent.current=holdIntent(intent.current,selection,()=>crypto.randomUUID());
  try{
   const result=await createHoldAction({tripId:view.detail.trip.id,seatId:selected,fromStopId:from,toStopId:to,requestKey:intent.current.requestKey});
   if(result.ok){router.push('/checkout/'+result.data.record.id);return;}
   setMessage(result.message);
   if(result.code!=='unavailable'){
    intent.current=null;
    if(result.code==='conflict'){
     const fresh=await refreshAvailabilityAction(view.detail.trip.id,from,to);
     if(fresh.ok)setView(fresh.data);
     setSelected('');
    }
   }
  }catch{setMessage('Hasil belum diketahui. Coba lagi untuk memeriksa permintaan yang sama.');}
  finally{busy.current=false;setPending(false);}
 }

 return <div className="pf-grid">
  <section className="pf-card pf-seat-stage" aria-labelledby="seat-map-title">
   <div className="pf-card-head">
    <div>
     <h2 id="seat-map-title">Pilih satu kursi</h2>
     <p className="pf-summary-note">{availableTotal} dari {view.seats.length} kursi tersedia untuk rute ini.</p>
    </div>
   </div>
   <div className="seat-legend" aria-label="Legenda kursi">
    {[['available','Tersedia'],['selected','Dipilih'],['held','Ditahan'],['booked','Terjual']].map(([kind,label])=><span key={kind}><i aria-hidden="true" className={`sp-legend-swatch sp-legend-${kind}`}/>{label}</span>)}
   </div>
   <div className="seat-scroll" role="region" aria-label="Peta kursi" tabIndex={0}>
    <div className="passenger-layout" style={{gridTemplateColumns:`repeat(${view.detail.layout?.cols??1},64px)`}}>
     <p className="seat-front" style={{gridColumn:'1 / -1'}}>Depan kendaraan</p>
     {view.detail.layout?.cells.map(cell=>{
      const seat=view.seats.find(s=>s.rowIndex===cell.rowIndex&&s.colIndex===cell.colIndex);
      return seat
       ?<button type="button" key={`${cell.rowIndex}-${cell.colIndex}`} disabled={pending||!view.saleOpen||seat.status!=='AVAILABLE'} aria-pressed={selected===seat.id} aria-label={`Kursi ${seat.seatCode}, ${seat.status==='HELD'?'ditahan':seat.status==='BOOKED'?'terjual':selected===seat.id?'dipilih':'tersedia'}`} className={`seat-cell ${selected===seat.id?'selected':''} ${seat.status==='BOOKED'?'booked':''} ${seat.status==='HELD'?'held':''}`} onClick={()=>{if(selected!==seat.id)intent.current=null;setSelected(seat.id);setMessage('');}}>{seat.seatCode}<small>{seat.status==='HELD'?'Ditahan':seat.status==='BOOKED'?'Terjual':selected===seat.id?'Dipilih':'Tersedia'}</small></button>
       :<span className="non-seat" key={`${cell.rowIndex}-${cell.colIndex}`}>{cell.type==='EMPTY'?'':cell.label??({DRIVER:'Sopir',AISLE:'Lorong',DOOR:'Pintu',FACILITY:'Fasilitas',SEAT:'Kursi'}[cell.type])}</span>;
     })}
    </div>
   </div>
   <details className="pf-stops-details">
    <summary>Lihat urutan titik naik &amp; turun ({view.detail.stops.length} stop)</summary>
    <ol className="pf-stops-list">{view.detail.stops.map(stop=><li key={stop.id}>{stop.name}, {formatDepartureWib(stop.departureAt)}</li>)}</ol>
   </details>
  </section>

  <aside className="pf-summary-sticky" aria-label="Ringkasan pilihan">
   <div className="pf-summary-card">
    <h2>Ringkasan perjalanan</h2>
    <JourneySummary fromName={originStop?.name??''} toName={destinationStop?.name??''} departureAt={originStop!.departureAt} fare={view.fare} seatCode={selectedSeat?.seatCode}/>
    <p className="pf-summary-note">{view.saleOpen?'Setelah memilih kursi, Anda langsung diarahkan ke halaman isi data & bayar (kursi dikunci 10 menit).':'Penjualan interval ini sudah ditutup.'}</p>
    {loggedIn
     ?<button className="sp-primary" type="button" onClick={()=>void hold()} disabled={pending||!selectedAvailable||!view.saleOpen}>{pending?'Mengunci kursi…':'Tahan kursi 10 menit'}</button>
     :<Link className="sp-primary" href={`/login?next=${encodeURIComponent(path)}`}>Masuk untuk menahan kursi</Link>}
    {message&&<p role="status" aria-live="polite" className="auth-message" style={{margin:0}}>{message}</p>}
   </div>
  </aside>
 </div>;
}
