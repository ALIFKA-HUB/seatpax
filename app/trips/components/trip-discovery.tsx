'use client';
import {useRef,useState} from 'react';
import {SlidersHorizontal,X,MapTrifold} from '@phosphor-icons/react';
import type {SearchResult} from '@/modules/inventory/types';
import {filterAndSortTrips} from '@/modules/inventory/discovery-presentation';
import TripCard from '@/app/components/trip-card';

export default function TripDiscovery({trips,candidateLimitReached,dateWib}:{trips:SearchResult[];candidateLimitReached:boolean;dateWib:string}){
 const [classes,setClasses]=useState<string[]>([]),[maxFare,setMaxFare]=useState('');
 const [draftClasses,setDraftClasses]=useState<string[]>([]),[draftFare,setDraftFare]=useState('');
 const [sort,setSort]=useState<'departure'|'price'>('departure');
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const options=Array.from(new Set(trips.map(trip=>trip.className))).sort();
 const visible=filterAndSortTrips(trips,{classNames:classes,maxFare,sort});
 const count=classes.length+(maxFare?1:0);
 const clear=()=>{setClasses([]);setMaxFare('');};
 const open=()=>{setDraftClasses([...classes]);setDraftFare(maxFare);dialog.current?.showModal();};
 return <section className="sp-discovery-results" aria-labelledby="results-title">
  <div className="sp-discovery-toolbar"><div><h2 id="results-title">Perjalanan tersedia</h2><p className="sp-muted" aria-live="polite">{visible.length} perjalanan ditampilkan · {dateWib} WIB</p></div><div className="sp-discovery-tools"><label className="sp-sort"><span className="sp-sr">Urutkan perjalanan</span><select value={sort} onChange={event=>setSort(event.target.value as 'departure'|'price')}><option value="departure">Berangkat paling awal</option><option value="price">Harga terendah</option></select></label><button ref={trigger} className="sp-filter-button" type="button" onClick={open} aria-haspopup="dialog"><SlidersHorizontal size={19} aria-hidden="true"/>Filter{count>0&&<span className="sp-filter-count">{count}</span>}</button></div></div>
  {count>0&&<div className="sp-applied-filters"><span>{classes.join(', ')}{classes.length>0&&maxFare?' · ':''}{maxFare?`Maks. Rp ${BigInt(maxFare).toLocaleString('id-ID')}`:''}</span><button type="button" onClick={clear}>Hapus filter</button></div>}
  {candidateLimitReached&&<p className="sp-limit-note">Daftar dibatasi 50 jadwal terdekat pada tanggal ini. Gunakan pencarian rute untuk mempersempit pilihan.</p>}
  {visible.length>0?<div className="sp-discovery-list">{visible.map(trip=><TripCard key={`${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`} trip={trip}/>)}</div>:<div className="sp-discovery-empty"><MapTrifold size={36} aria-hidden="true"/><h3>{count?'Belum ada yang cocok':'Belum ada perjalanan untuk tanggal ini'}</h3><p>{count?'Coba hapus filter untuk melihat pilihan lainnya.':'Coba tanggal atau rute lain untuk menemukan perjalanan Anda.'}</p>{count>0&&<button type="button" className="sp-secondary" onClick={clear}>Hapus filter</button>}</div>}
  <dialog ref={dialog} className="sp-filter-dialog" aria-labelledby="filter-title" onClose={()=>trigger.current?.focus()} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.current?.close();}}}>
   <form onSubmit={event=>{event.preventDefault();setClasses(draftClasses);setMaxFare(draftFare);dialog.current?.close();}}>
    <div className="sp-filter-heading"><h2 id="filter-title">Filter perjalanan</h2><button className="sp-icon-button" type="button" aria-label="Tutup filter" onClick={()=>dialog.current?.close()}><X size={22} aria-hidden="true"/></button></div>
    <fieldset><legend>Kelas layanan</legend>{options.length?options.map(name=><label className="sp-filter-option" key={name}><input type="checkbox" checked={draftClasses.includes(name)} onChange={event=>setDraftClasses(current=>event.target.checked?[...current,name]:current.filter(item=>item!==name))}/>{name}</label>):<p className="sp-muted">Kelas tersedia setelah perjalanan ditemukan.</p>}</fieldset>
    <label className="sp-fare-filter">Harga maksimum (Rp)<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={18} value={draftFare} placeholder="Tanpa batas harga" onChange={event=>{if(/^\d*$/.test(event.target.value))setDraftFare(event.target.value);}}/><span>Harga per penumpang</span></label>
    <div className="sp-filter-actions"><button className="sp-secondary" type="button" onClick={()=>{setDraftClasses([]);setDraftFare('');}}>Reset</button><button className="sp-primary" type="submit">Terapkan</button></div>
   </form>
  </dialog>
 </section>;
}
