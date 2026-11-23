'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {ArrowRight,Clock,CreditCard,MagnifyingGlass,Ticket} from '@phosphor-icons/react';
import type {TicketView} from '@/modules/ticket/service';
import type {ActiveHoldSummary,PendingBookingSummary} from '../data';
import {formatDepartureWib,formatIdr} from '@/app/presentation';
import TicketCard from '@/app/components/ticket-card';
import StatusBadge from '@/app/components/status-badge';
import AdminSelect from '@/app/admin/components/admin-select';

type FilterTab='ALL'|'CONFIRMED'|'HISTORY';

export default function TicketCenter({
 tickets,
 activeHolds,
 pendingBookings,
 keyUnavailable=false,
}:{
 tickets:TicketView[];
 activeHolds:ActiveHoldSummary[];
 pendingBookings:PendingBookingSummary[];
 keyUnavailable?:boolean;
}){
 const [tab,setTab]=useState<FilterTab>('ALL');
 const [query,setQuery]=useState('');
 const [sort,setSort]=useState<'upcoming'|'recent'>('upcoming');

 const confirmedCount=tickets.filter(t=>t.bookingStatus==='CONFIRMED').length;
 const historyCount=tickets.length-confirmedCount;
 const inProgressCount=activeHolds.length+pendingBookings.length;

 const visible=useMemo(()=>{
  const q=query.trim().toLowerCase();
  return tickets
   .filter(t=>{
    if(tab==='CONFIRMED'&&t.bookingStatus!=='CONFIRMED')return false;
    if(tab==='HISTORY'&&t.bookingStatus==='CONFIRMED')return false;
    if(!q)return true;
    return [
     t.snapshot.tripName,
     t.snapshot.fromName,
     t.snapshot.toName,
     t.snapshot.seatCode,
     t.passenger.name,
    ].some(v=>v.toLowerCase().includes(q));
   })
   .sort((a,b)=>{
    const ta=Date.parse(a.snapshot.departureAt);
    const tb=Date.parse(b.snapshot.departureAt);
    return sort==='upcoming'?ta-tb:tb-ta;
   });
 },[tickets,tab,query,sort]);

 return <div className="tk-page">
  <header className="tk-head" aria-labelledby="tickets-title">
   <div>
    <h1 id="tickets-title">Pesanan saya</h1>
    <p className="tk-head-sub">Lanjutkan pemesanan yang sedang berjalan dan buka e-tiket QR Anda saat keberangkatan.</p>
   </div>
  </header>

  {inProgressCount>0&&<section className="tk-progress-section" aria-labelledby="in-progress-title">
   <h2 id="in-progress-title" className="tk-section-title">Perlu diselesaikan sekarang</h2>
   <div className="tk-progress-grid">
    {activeHolds.map(hold=><article key={hold.id} className="tk-progress-card">
     <div className="tk-progress-top">
      <StatusBadge label="Kursi dikunci (hold)" tone="warning"/>
      <strong>Kursi {hold.seatCode}</strong>
     </div>
     <h3>{hold.fromName} ke {hold.toName}</h3>
     <p className="tk-progress-meta"><Clock size={14} aria-hidden="true"/><span>{hold.tripName}, batas hold {formatDepartureWib(hold.expiresAt)}</span></p>
     <Link className="sp-primary pf-cta-primary" href={`/checkout/${hold.id}`}>Lanjutkan checkout<ArrowRight size={16} aria-hidden="true"/></Link>
    </article>)}
    {pendingBookings.map(booking=><article key={booking.id} className="tk-progress-card">
     <div className="tk-progress-top">
      <StatusBadge label="Menunggu pembayaran" tone="warning"/>
      <strong>{formatIdr(booking.amount)}</strong>
     </div>
     <h3>{booking.fromName} ke {booking.toName}</h3>
     <p className="tk-progress-meta"><CreditCard size={14} aria-hidden="true"/><span>Kursi {booking.seatCode}, berangkat {formatDepartureWib(booking.departureAt)}</span></p>
     <Link className="sp-primary pf-cta-primary" href={`/bookings/${booking.id}`}>Lanjutkan pembayaran<ArrowRight size={16} aria-hidden="true"/></Link>
    </article>)}
   </div>
  </section>}

  {keyUnavailable&&<section className="pf-sandbox-alert" role="status">
   <h2>Sebagian atau seluruh tiket terenkripsi belum dapat dimuat</h2>
   <p>Konfigurasi kunci tiket lingkungan ini belum cocok dengan tiket lama atau belum lengkap. Anda tetap dapat memesan perjalanan baru atau menghubungi Pusat Pengaduan jika membutuhkan bantuan tiket lama.</p>
   <div className="pf-action-row">
    <Link className="sp-primary" href="/trips">Cari perjalanan baru</Link>
    <Link className="sp-secondary" href="/pengaduan">Pusat pengaduan</Link>
   </div>
  </section>}

  {tickets.length>0&&<>
   <div className="tk-controls">
    <div className="tk-tabs" role="tablist" aria-label="Filter status tiket">
     {([
      ['ALL','Semua',tickets.length],
      ['CONFIRMED','Siap dipakai',confirmedCount],
      ['HISTORY','Riwayat dan refund',historyCount],
     ] as const).map(([value,label,count])=><button
      key={value}
      type="button"
      role="tab"
      aria-selected={tab===value}
      className={`tk-tab${tab===value?' is-active':''}`}
      onClick={()=>setTab(value)}
     >
      {label}<span className="tk-tab-count">{count}</span>
     </button>)}
    </div>
    <div className="tk-search-tools">
     <label className="tk-search-box">
      <span className="sp-sr">Cari tiket</span>
      <MagnifyingGlass size={16} aria-hidden="true"/>
      <input type="search" placeholder="Cari rute, kursi, penumpang" value={query} onChange={e=>setQuery(e.target.value)}/>
     </label>
     <div className="tk-sort-wrap">
      <AdminSelect
       ariaLabel="Urutkan tiket"
       value={sort}
       onChange={next=>setSort(next as 'upcoming'|'recent')}
       options={[
        {value:'upcoming',label:'Berangkat paling awal'},
        {value:'recent',label:'Berangkat paling akhir'},
       ]}
      />
     </div>
    </div>
   </div>

   {visible.length>0
    ?<section className="tk-list" aria-label="Daftar tiket">{visible.map(ticket=><TicketCard key={ticket.id} ticket={ticket}/>)}</section>
    :<div className="tk-empty">
      <div className="tk-empty-head">
       <Ticket size={34} aria-hidden="true" style={{color:'var(--tk-muted)'}}/>
       <h2>Tidak ada tiket yang cocok</h2>
       <p>Coba ubah kata kunci pencarian atau pilih tab filter lain.</p>
       <button type="button" className="sp-secondary" onClick={()=>{setTab('ALL');setQuery('');}}>Reset filter tiket</button>
      </div>
     </div>}
  </>}

  {!keyUnavailable&&tickets.length===0&&<section className="tk-empty" aria-label="Panduan pemesanan">
   <div className="tk-empty-head">
    <Ticket size={36} aria-hidden="true" style={{color:'var(--tk-primary)'}}/>
    <h2>Belum ada tiket aktif</h2>
    <p>Setelah Anda memilih kursi dan menyelesaikan pembayaran, e-tiket dan QR boarding akan langsung muncul di halaman ini.</p>
    <div className="sp-actions" style={{marginTop:'6px',justifyContent:'center'}}>
     <Link className="sp-primary pf-cta-primary" href="/trips">Cari perjalanan<ArrowRight size={17} aria-hidden="true"/></Link>
     <Link className="sp-secondary" href="/pengaduan">Pusat pengaduan</Link>
    </div>
   </div>
   <div className="tk-guide-grid">
    <div className="tk-guide-step"><strong>Pilih jadwal dan kursi</strong><p>Buka menu Perjalanan, pilih rute tujuan, lalu kunci kursi yang tersedia.</p></div>
    <div className="tk-guide-step"><strong>Isi data dan bayar</strong><p>Masukkan nama penumpang aktif dan selesaikan pembayaran dalam 10 menit.</p></div>
    <div className="tk-guide-step"><strong>Tunjukkan QR saat naik</strong><p>Buka e-tiket dari halaman ini untuk dipindai petugas shuttle sebelum berangkat.</p></div>
   </div>
  </section>}
 </div>;
}
