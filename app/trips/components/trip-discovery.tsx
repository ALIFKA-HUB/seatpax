'use client';

import Link from 'next/link';
import {useRef,useState} from 'react';
import {MapTrifold,SlidersHorizontal,X} from '@phosphor-icons/react';
import type {SearchResult} from '@/modules/inventory/types';
import {filterAndSortTrips} from '@/modules/inventory/discovery-presentation';
import TripCard from '@/app/components/trip-card';

type DateOption={dateWib:string;label:string};

export default function TripDiscovery({
 trips,
 fallbackTrips=[],
 locations=[],
 quickDates=[],
 candidateLimitReached,
 dateWib,
 hasExplicitDate,
 from,
 to,
}:{
 trips:SearchResult[];
 fallbackTrips?:SearchResult[];
 locations?:{id:string;name:string;city:string}[];
 quickDates?:DateOption[];
 candidateLimitReached:boolean;
 dateWib:string;
 hasExplicitDate:boolean;
 from?:string;
 to?:string;
}){
 const [classes,setClasses]=useState<string[]>([]),[maxFare,setMaxFare]=useState('');
 const [draftClasses,setDraftClasses]=useState<string[]>([]),[draftFare,setDraftFare]=useState('');
 const [sort,setSort]=useState<'departure'|'price'>('departure');
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);

 const activeList=trips.length>0?trips:fallbackTrips;
 const isFallback=trips.length===0&&fallbackTrips.length>0;
 const options=Array.from(new Set(activeList.map(trip=>trip.className))).sort();
 const visible=filterAndSortTrips(trips,{classNames:classes,maxFare,sort});
 const visibleFallback=filterAndSortTrips(fallbackTrips,{classNames:classes,maxFare,sort});
 const count=classes.length+(maxFare?1:0);
 const clear=()=>{setClasses([]);setMaxFare('');};
 const open=()=>{setDraftClasses([...classes]);setDraftFare(maxFare);dialog.current?.showModal();};

 function hrefForDate(nextDate?:string){
  const params=new URLSearchParams();
  if(from)params.set('from',from);
  if(to)params.set('to',to);
  if(nextDate)params.set('date',nextDate);
  const qs=params.toString();
  return qs?`/trips?${qs}`:'/trips';
 }

 const formattedTargetDate=hasExplicitDate
  ?new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${dateWib}T12:00:00+07:00`))
  :'';

 return <section className="sp-discovery-results" aria-labelledby="results-title" style={{display:'grid',gap:'18px'}}>
  {(quickDates.length>0||hasExplicitDate)&&<nav className="tp-date-bar" aria-label="Filter tanggal cepat">
   <Link className={`tp-date-chip${!hasExplicitDate?' is-active':''}`} href={hrefForDate()} aria-current={!hasExplicitDate?'true':undefined}>
    Semua jadwal mendatang
   </Link>
   {quickDates.map(option=><Link
    key={option.dateWib}
    className={`tp-date-chip${hasExplicitDate&&dateWib===option.dateWib?' is-active':''}`}
    href={hrefForDate(option.dateWib)}
    aria-current={hasExplicitDate&&dateWib===option.dateWib?'true':undefined}
   >
    {option.label}
   </Link>)}
  </nav>}

  {isFallback&&<div className="tp-fallback-banner" role="status">
   <div>
    <strong>Belum ada jadwal pada {formattedTargetDate}</strong>
    <p>Berikut jadwal shuttle terdekat yang masih tersedia untuk rute dan tanggal mendatang.</p>
   </div>
   <Link className="sp-secondary" href={hrefForDate()}>Tampilkan semua jadwal</Link>
  </div>}

  {activeList.length>0&&<div className="tp-toolbar">
   <div>
    <h2 id="results-title">{isFallback?'Jadwal shuttle terdekat yang tersedia':hasExplicitDate?`Jadwal berangkat · ${formattedTargetDate}`:'Jadwal shuttle mendatang'}</h2>
    <p aria-live="polite">
     {isFallback
      ?`${visibleFallback.length} jadwal mendatang ditemukan`
      :`${visible.length} perjalanan tersedia${hasExplicitDate?` · ${dateWib} WIB`:' · Semua keberangkatan terdekat'}`}
    </p>
   </div>
   <div className="tp-tools">
    <label className="tp-sort"><span className="sp-sr">Urutkan perjalanan</span><select value={sort} onChange={event=>setSort(event.target.value as 'departure'|'price')}><option value="departure">Berangkat paling awal</option><option value="price">Harga terendah</option></select></label>
    <button ref={trigger} className="tp-filter-btn" type="button" onClick={open} aria-haspopup="dialog"><SlidersHorizontal size={17} aria-hidden="true"/>Filter{count>0&&<span className="sp-filter-count">{count}</span>}</button>
   </div>
  </div>}

  {count>0&&<div className="sp-applied-filters"><span>{classes.join(', ')}{classes.length>0&&maxFare?' · ':''}{maxFare?`Maks. Rp ${BigInt(maxFare).toLocaleString('id-ID')}`:''}</span><button type="button" onClick={clear}>Hapus filter</button></div>}
  {candidateLimitReached&&<p className="sp-limit-note">Daftar dibatasi 50 jadwal terdekat. Gunakan pencarian asal–tujuan atau tanggal untuk mempersempit pilihan.</p>}

  {trips.length>0?(
   visible.length>0
    ?<div className="tp-list">{visible.map(trip=><TripCard key={`${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`} trip={trip}/>)}</div>
    :<div className="tp-empty-card"><MapTrifold size={34} aria-hidden="true"/><h3>Belum ada yang cocok dengan filter Anda</h3><p>Coba hapus filter kelas layanan atau batas harga.</p><div className="sp-actions" style={{justifyContent:'center'}}><button type="button" className="sp-secondary" onClick={clear}>Hapus filter</button></div></div>
  ):isFallback?(
   visibleFallback.length>0
    ?<div className="tp-list">{visibleFallback.map(trip=><TripCard key={`${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`} trip={trip}/>)}</div>
    :<div className="tp-empty-card"><MapTrifold size={34} aria-hidden="true"/><h3>Belum ada yang cocok dengan filter Anda</h3><p>Coba hapus filter kelas layanan atau batas harga.</p><div className="sp-actions" style={{justifyContent:'center'}}><button type="button" className="sp-secondary" onClick={clear}>Hapus filter</button></div></div>
  ):<div className="tp-empty-card">
   <MapTrifold size={36} aria-hidden="true"/>
   <h2 id="results-title">Belum ada jadwal perjalanan terbuka</h2>
   <p>Saat ini belum ada keberangkatan shuttle yang dibuka untuk penjualan online. Periksa kembali nanti atau ubah pencarian rute.</p>
   {locations.length>0&&<div className="tp-empty-stops" aria-label="Titik shuttle yang dilayani">
    {locations.map(stop=><span className="tp-stop-chip" key={stop.id}>{stop.name} · {stop.city}</span>)}
   </div>}
  </div>}

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
