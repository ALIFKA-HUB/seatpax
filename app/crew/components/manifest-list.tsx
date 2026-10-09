'use client';
import {useState} from 'react';
import Link from 'next/link';
import {wibTime} from './passenger-profile';
import type {ManifestView} from '@/modules/boarding/types';
import {filterPassengers,manifestCounters} from '@/modules/boarding/ui-state';

export default function ManifestList({view,readOnly=false}:{view:ManifestView;readOnly?:boolean}) {
 const [query,setQuery]=useState(''),[filter,setFilter]=useState<'ALL'|'PENDING'|'BOARDED'>('ALL');
 const passengers=filterPassengers(view.passengers,query,filter);
 return <>
  <dl className="manifest-counters">{manifestCounters(view).map(counter=><div key={counter.label}><dt>{counter.label}</dt><dd>{counter.value}</dd></div>)}</dl>
  <div className="manifest-controls"><label>Cari nama atau kursi<input type="search" value={query} onChange={event=>setQuery(event.target.value)} autoComplete="off"/></label><label>Status boarding<select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="ALL">Semua</option><option value="PENDING">Belum naik</option><option value="BOARDED">Sudah naik</option></select></label></div>
  <p className="manifest-count" role="status">{passengers.length} penumpang ditampilkan</p>
  <ul className="manifest-passengers">{passengers.map(passenger=><li key={passenger.ticketId}>
   <div className="manifest-person"><span className="manifest-seat">Kursi <strong>{passenger.seatCode}</strong></span><strong className="manifest-name">{passenger.name}</strong><span>{passenger.fromName} → {passenger.toName}</span>
    <span className={passenger.boarding?'crew-state crew-state-success':'crew-state crew-state-pending'}>{passenger.boarding?`Sudah naik · ${wibTime(passenger.boarding.boardedAt)}`:'Belum naik'}</span>
    <span className="manifest-snack">{passenger.snack?`Snack sudah diserahkan · ${wibTime(passenger.snack.claimedAt)}`:'Snack belum diserahkan'}</span>
   </div>{!readOnly&&<Link className="crew-button" href={`/crew/trips/${view.tripId}/passengers/${passenger.ticketId}`}>Buka profil →</Link>}
  </li>)}</ul>
  {passengers.length===0&&<p className="crew-empty">{view.passengers.length===0?'Belum ada penumpang terkonfirmasi untuk perjalanan ini.':'Belum ada penumpang yang cocok dengan pencarian ini.'}</p>}
  {readOnly&&<p>Manifest ini hanya untuk dibaca. Boarding dicatat crew yang ditugaskan.</p>}
 </>;
}
