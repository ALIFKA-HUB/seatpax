'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import {Armchair, ArrowCounterClockwise, Check, CreditCard, Cursor, Scan, Ticket} from '@phosphor-icons/react';
import {mountBookingMotion, type BookingMotionState, type MotionKind} from './booking-motion-timeline';
import './booking-motion.css';

function Logo() {
  return <Image src="/brand/seatpax-horizontal.png" alt="Seatpax" width={110} height={29} sizes="110px"/>;
}

function Seats({count = 9}: {count?: number}) {
  return <div className={count === 9 ? 'lpm-seats' : 'lpm-mini-seats'}>
    {Array.from({length: count}, (_, i) => <span key={i} className={`lpm-seat${i === 2 ? ' lpm-chosen' : ''}`}>{String(i + 1).padStart(2, '0')}</span>)}
  </div>;
}

function SeatIllustration() {
  return <>
    <div className="lpm-map" data-part="map" aria-hidden="true">
      <div className="lpm-map-heading"><strong>Pilih kursi</strong><Armchair size={20}/></div>
      <div className="lpm-front">Depan<span/></div>
      <Seats/>
      <div className="lpm-map-legend"><span>Tersedia</span><span>Pilihan Anda</span></div>
    </div>
    <span className="lpm-focus" data-part="focus" aria-hidden="true"/>
    <div className="lpm-morph-paper" data-part="surface" aria-hidden="true"><span className="lpm-seat-rail" data-part="rail"/></div>
    <div className="lpm-ticket" data-part="ticket" aria-hidden="true">
      <div className="lpm-ticket-paper" data-part="paper">
        <div className="lpm-ticket-content" data-part="content">
          <div className="lpm-ticket-brand"><Logo/><Ticket size={20}/></div>
          <div className="lpm-ticket-seat"><span>Kursi pilihan</span><strong data-part="destination">03</strong></div>
          <div className="lpm-confirmed"><Check size={17}/><span>Pembayaran dikonfirmasi</span></div>
        </div>
      </div>
      <div className="lpm-stub" data-part="stub"><Scan size={36}/><div><strong>Tiket siap dibuka.</strong><span>Di Pesanan saya</span></div></div>
      <span className="lpm-seal" data-part="seal"><Check size={24}/></span>
    </div>
    <span className="lpm-number" data-part="number" aria-hidden="true">03</span>
    <span className="lpm-cursor" data-part="cursor" aria-hidden="true"><Cursor size={25} weight="light"/></span>
  </>;
}

function DeckIllustration({advance, action, busy}: {advance: () => void; action: string; busy: boolean}) {
  return <div className="lpm-deck">
    <div className="lpm-card lpm-card-seat" data-part="seat">
      <div className="lpm-card-heading"><Armchair size={21}/><strong>Kursi pilihan</strong></div>
      <Seats count={6}/><div className="lpm-card-foot"><span>Kursi</span><strong>03</strong></div>
      <button className="lpm-card-hit" type="button" aria-label={`Kartu kursi. ${action}`} aria-disabled={busy} onClick={advance}/>
    </div>
    <div className="lpm-card lpm-card-payment" data-part="payment">
      <div className="lpm-card-heading"><CreditCard size={21}/><strong>Pembayaran</strong></div>
      <div className="lpm-confirm-symbol"><span data-part="ring"/><span data-part="check"><Check size={30}/></span></div>
      <strong className="lpm-card-title">Dikonfirmasi.</strong><span className="lpm-card-subtitle">Tiket Anda disiapkan.</span>
      <button className="lpm-card-hit" type="button" aria-label={`Kartu pembayaran. ${action}`} aria-disabled={busy} onClick={advance}/>
    </div>
    <div className="lpm-card lpm-card-ticket" data-part="ticket">
      <div className="lpm-card-heading"><Logo/><Ticket size={21}/></div>
      <span className="lpm-card-subhead">Tiket perjalanan</span><strong className="lpm-card-number">03</strong><span className="lpm-card-subtitle">Kursi Anda</span>
      <div className="lpm-perforation"/><div className="lpm-card-bottom"><Scan size={32}/><span>Siap dibuka<br/>di Pesanan saya.</span></div>
      <button className="lpm-card-hit" type="button" aria-label={`Kartu tiket. ${action}`} aria-disabled={busy} onClick={advance}/>
    </div>
  </div>;
}

/** Marketing illustration only. It never creates a hold, payment or ticket. */
export default function BookingMotion({kind}: {kind: MotionKind}) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof mountBookingMotion> | null>(null);
  const [state, setState] = useState<BookingMotionState>({playing: false, step: 0, finished: true, static: true, phase: kind === 'seat' ? 'Kursi pilihan, tersimpan di tiket Anda.' : 'Pilih kursi, bayar, lalu buka tiket.'});

  useEffect(() => {
    if (!root.current) return;
    const motion = mountBookingMotion(root.current, kind, setState);
    controller.current = motion;
    return () => {controller.current = null; motion.dispose();};
  }, [kind]);

  const action = state.finished ? 'Ulangi alur' : state.step === 0 ? 'Lihat pembayaran' : 'Lihat tiket';
  const advance = () => controller.current?.advance();

  return <div className="lpm-root" data-kind={kind} ref={root}>
    <div className={`lpm-field lpm-${kind}-field`} role={kind === 'seat' ? 'img' : 'group'} aria-label={kind === 'seat' ? 'Ilustrasi kursi 03 dipilih dan berubah menjadi tiket setelah pembayaran dikonfirmasi' : 'Ilustrasi tiga langkah pemesanan. Tekan kartu atau tombol untuk melanjutkan.'}>
      <div className="lpm-shadow" aria-hidden="true"/>
      {kind === 'seat' ? <SeatIllustration/> : <DeckIllustration advance={advance} action={action} busy={state.playing}/>}
    </div>
    <div className="lpm-caption">
      <p className="lpm-phase" aria-live="polite" aria-atomic="true">{state.phase}</p>
      {kind === 'deck' && !state.static && <div className="lpm-controls">
        <button type="button" className="lpm-action" aria-disabled={state.playing} onClick={advance}><span>{state.playing ? 'Sedang menampilkan' : action}</span></button><button type="button" className="lpm-restart" aria-label="Ulangi ilustrasi pemesanan dari awal" onClick={() => controller.current?.restart()}><ArrowCounterClockwise size={17}/></button>
      </div>}
      <span className="lpm-illustration-note">Ilustrasi pemesanan, bukan pesanan aktif.</span>
    </div>
  </div>;
}
