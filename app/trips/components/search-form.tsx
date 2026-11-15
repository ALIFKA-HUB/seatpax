'use client';

import Link from 'next/link';
import {useState} from 'react';
import {ArrowsLeftRight,CalendarBlank,MagnifyingGlass,MapPin} from '@phosphor-icons/react';

export default function SearchForm({
 locations,
 initial,
}:{
 locations:{id:string;name:string;city:string}[];
 initial:{from?:string;to?:string;date?:string;hasExplicitDate?:boolean};
}){
 const [from,setFrom]=useState(initial.from??'');
 const [to,setTo]=useState(initial.to??'');
 const [date,setDate]=useState(initial.hasExplicitDate?(initial.date??''):'');
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 const hasFilters=Boolean(from||to||date);

 return <div className="tp-search-card">
  <form
   className="tp-search-grid"
   action="/trips"
   onSubmit={event=>{
    if((from&&!to)||(!from&&to)){
     event.preventDefault();
     setError('Pilih asal dan tujuan sekaligus, atau kosongkan keduanya untuk melihat semua rute.');
     setPending(false);
     return;
    }
    if(from&&from===to){
     event.preventDefault();
     setError('Titik asal dan tujuan tidak boleh sama.');
     setPending(false);
     return;
    }
    setError('');
    setPending(true);
   }}
  >
   <label className="tp-field">
    <span><MapPin size={15} aria-hidden="true"/>Dari mana?</span>
    <select name="from" value={from} onChange={event=>{setFrom(event.target.value);setError('');}}>
     <option value="">Semua asal</option>
     {locations.map(location=><option key={location.id} value={location.id}>{location.name} · {location.city}</option>)}
    </select>
   </label>
   <button
    className="tp-swap"
    type="button"
    aria-label="Tukar asal dan tujuan"
    onClick={()=>{setFrom(to);setTo(from);setError('');}}
   >
    <ArrowsLeftRight size={18} aria-hidden="true"/>
   </button>
   <label className="tp-field">
    <span><MapPin size={15} aria-hidden="true"/>Mau ke mana?</span>
    <select name="to" value={to} onChange={event=>{setTo(event.target.value);setError('');}}>
     <option value="">Semua tujuan</option>
     {locations.map(location=><option key={location.id} value={location.id}>{location.name} · {location.city}</option>)}
    </select>
   </label>
   <label className="tp-field tp-field-date">
    <span><CalendarBlank size={15} aria-hidden="true"/>Tanggal (opsional)</span>
    <input name="date" type="date" value={date} onChange={event=>{setDate(event.target.value);setError('');}}/>
   </label>
   <button className="sp-primary tp-search-submit" type="submit" disabled={pending}>
    <MagnifyingGlass size={18} aria-hidden="true"/>{pending?'Mencari…':'Cari jadwal'}
   </button>
  </form>
  <div className="tp-search-meta">
   <span>Kosongkan tanggal untuk menampilkan seluruh jadwal shuttle mendatang.</span>
   {hasFilters&&<Link href="/trips">Reset pencarian</Link>}
  </div>
  {error&&<p className="tp-search-error" role="alert">{error}</p>}
 </div>;
}
