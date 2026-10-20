'use client';
import {useState} from 'react';
import {MagnifyingGlass,ArrowsLeftRight,MapPin,CalendarBlank} from '@phosphor-icons/react';
export default function SearchForm({locations,initial}:{locations:{id:string;name:string;city:string}[];initial:Record<string,string|undefined>}){
 const [from,setFrom]=useState(initial.from??''),[to,setTo]=useState(initial.to??'');
 const [pending,setPending]=useState(false);
 return <form className="passenger-form sp-discovery-search" action="/trips" onSubmit={()=>setPending(true)}>
  <label><span><MapPin size={17} aria-hidden="true"/>Dari mana?</span><select name="from" value={from} onChange={event=>setFrom(event.target.value)}><option value="">Semua asal</option>{locations.map(location=><option key={location.id} value={location.id}>{location.name} · {location.city}</option>)}</select></label>
  <button className="sp-swap" type="button" aria-label="Tukar asal dan tujuan" onClick={()=>{setFrom(to);setTo(from);}}><ArrowsLeftRight size={20} aria-hidden="true"/></button>
  <label><span><MapPin size={17} aria-hidden="true"/>Mau ke mana?</span><select name="to" value={to} onChange={event=>setTo(event.target.value)}><option value="">Semua tujuan</option>{locations.map(location=><option key={location.id} value={location.id}>{location.name} · {location.city}</option>)}</select></label>
  <label><span><CalendarBlank size={17} aria-hidden="true"/>Tanggal berangkat</span><input name="date" type="date" required defaultValue={initial.date}/></label>
  <button className="sp-primary sp-search-submit" type="submit" disabled={pending}><MagnifyingGlass size={20} aria-hidden="true"/>{pending?'Mencari…':'Cari perjalanan'}</button>
 </form>;
}
