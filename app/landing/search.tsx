 'use client';
import {useState} from 'react';
import {ArrowsLeftRight,ArrowRight,CalendarBlank,MapPin} from '@phosphor-icons/react';
type Point={id:string;name:string;city:string};
export default function LandingSearch({locations,date}:{locations:Point[];date:string}){
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState('');
 return <form className="lp-search-form" action="/trips" onSubmit={event=>{
  if((from&&!to)||(!from&&to)||from&&from===to){event.preventDefault();setError(from===to?'Asal dan tujuan harus berbeda.':'Pilih asal dan tujuan, atau kosongkan keduanya untuk melihat semua perjalanan.');return;}
  setError('');setPending(true);
 }}>
 <div className="lp-search-fields"><label htmlFor="landing-from"><span><MapPin size={16} aria-hidden="true"/>Dari</span><select id="landing-from" name="from" value={from} onChange={e=>{setFrom(e.target.value);setError('');}} aria-describedby={error?'landing-search-error':undefined}><option value="">Semua keberangkatan</option>{locations.map(p=><option key={p.id} value={p.id}>{p.city} - {p.name}</option>)}</select></label>
 <button className="lp-swap" type="button" aria-label="Tukar asal dan tujuan" onClick={()=>{setFrom(to);setTo(from);setError('');}}><ArrowsLeftRight size={18} aria-hidden="true"/></button>
 <label htmlFor="landing-to"><span><MapPin size={16} aria-hidden="true"/>Ke</span><select id="landing-to" name="to" value={to} onChange={e=>{setTo(e.target.value);setError('');}} aria-describedby={error?'landing-search-error':undefined}><option value="">Semua tujuan</option>{locations.map(p=><option key={p.id} value={p.id}>{p.city} - {p.name}</option>)}</select></label>
 <label htmlFor="landing-date"><span><CalendarBlank size={16} aria-hidden="true"/>Tanggal berangkat</span><input id="landing-date" name="date" type="date" min={date} defaultValue={date} required/></label>
 <button className="lp-button" type="submit" disabled={pending} aria-busy={pending}>{pending?'Mencari…':'Cari perjalanan'}<ArrowRight size={19} aria-hidden="true"/></button></div>
 {error&&<p className="lp-form-error" id="landing-search-error" role="alert">{error}</p>}
 </form>;
}
