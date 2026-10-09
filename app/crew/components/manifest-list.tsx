'use client';
import {useState} from 'react';
import {wibTime} from './passenger-profile';
import Link from 'next/link';
import type {ManifestView} from '@/modules/boarding/types';
import {filterPassengers,manifestCounters} from '@/modules/boarding/ui-state';
export default function ManifestList({view,readOnly=false}:{view:ManifestView;readOnly?:boolean}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState<'ALL'|'PENDING'|'BOARDED'>('ALL');const passengers=filterPassengers(view.passengers,query,filter);
 return <><dl className="manifest-counters">{manifestCounters(view).map(c=><div key={c.label}><dt>{c.label}</dt><dd>{c.value}</dd></div>)}</dl><div className="manifest-controls"><label>Cari nama atau kursi<input type="search" value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/></label><label>Status boarding<select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="ALL">Semua</option><option value="PENDING">Belum naik</option><option value="BOARDED">Sudah naik</option></select></label></div><p role="status">{passengers.length} penumpang ditampilkan</p><ul className="manifest-passengers">{passengers.map(p=><li key={p.ticketId}><div><strong>{p.name}</strong><span>Kursi {p.seatCode} · {p.fromName} → {p.toName}</span><span>{p.boarding?`Sudah naik · ${wibTime(p.boarding.boardedAt)}`:'Belum naik'}</span><span>{p.snack?`Snack sudah diserahkan · ${wibTime(p.snack.claimedAt)}`:'Snack belum diserahkan'}</span></div>{!readOnly&&<Link href={`/crew/trips/${view.tripId}/passengers/${p.ticketId}`}>Buka profil →</Link>}</li>)}</ul>{passengers.length===0&&<p>Belum ada penumpang yang cocok dengan pencarian ini.</p>}{readOnly&&<p>Manifest ini hanya untuk dibaca. Boarding dicatat crew yang ditugaskan.</p>}</>;
}
