import {Suspense} from 'react';
import type {Metadata} from 'next';
import Link from 'next/link';
import {Armchair, Ticket, MagnifyingGlass, CreditCard, ArrowRight} from '@phosphor-icons/react/ssr';
import PassengerShell from './components/passenger-shell';
import JourneyPlanner, {PlannerSkeleton} from './landing/journey-planner';
import BookingRoute from './landing/booking-route';
import BookingMotion from './landing/booking-motion';
import FeaturedTrips from './landing/featured-trips';
import PreparationShowcase from './landing/preparation-showcase';
import './landing/landing.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Seatpax | Perjalanan shuttle antarkota',
  description: 'Rencanakan perjalanan bersama Seatpax. Cari jadwal, pilih kursi, dan buka tiket perjalanan Anda dalam satu tempat.',
};

const bookingFlow = [
  {Icon: MagnifyingGlass, title: 'Cari perjalanan', copy: 'Tentukan asal, tujuan, dan tanggal.'},
  {Icon: Armchair, title: 'Pilih kursi', copy: 'Pilih kursi yang masih tersedia.'},
  {Icon: CreditCard, title: 'Bayar pesanan', copy: 'Selesaikan pembayaran pesanan Anda.'},
  {Icon: Ticket, title: 'Buka tiket', copy: 'Buka tiket dan QR setelah dikonfirmasi.'},
];

export default function Home() {
  return <PassengerShell landing>
    <div className="lp-content">
      <div className="lp-screen lp-screen--hero" id="beranda" data-landing-section>
        <section className="lp-hero" aria-labelledby="landing-title">
          <svg className="lp-hero-arc" viewBox="0 0 420 220" fill="none" aria-hidden="true" focusable="false">
            <path className="lp-hero-arc-guide" d="M 32 184 C 122 178, 174 52, 266 56 C 324 58, 354 96, 392 42" strokeWidth="1.5" strokeDasharray="5 7" strokeLinecap="round"/>
            <path className="lp-hero-arc-main" d="M 52 154 C 138 148, 198 118, 282 104 C 330 96, 360 72, 392 42" strokeWidth="2" strokeLinecap="round"/>
            <circle className="lp-hero-node-ring" cx="52" cy="154" r="10" strokeWidth="1.5"/>
            <circle className="lp-hero-node" cx="52" cy="154" r="4"/>
            <circle className="lp-hero-node-ring" cx="222" cy="116" r="8" strokeWidth="1.5"/>
            <circle className="lp-hero-node" cx="222" cy="116" r="3.5"/>
            <circle className="lp-hero-node-ring" cx="392" cy="42" r="12" strokeWidth="1.5"/>
            <circle className="lp-hero-node-accent" cx="392" cy="42" r="5"/>
          </svg>
          <div className="lp-hero-copy">
            <h1 id="landing-title">Antarkota,<br/>lebih nyaman.</h1>
            <p className="lp-hero-intro">Cari jadwal, pilih kursi, dan pesan perjalanan Anda bersama Seatpax.</p>
          </div>
        </section>
        <div className="lp-hero-planner" id="cari-perjalanan"><Suspense fallback={<PlannerSkeleton/>}><JourneyPlanner/></Suspense></div>
      </div>

      <div className="lp-screen" id="pilihan-perjalanan" data-landing-section><FeaturedTrips/></div>

      <div className="lp-screen" id="pilih-kursi" data-landing-section>
        <section className="lp-seat-feature lp-seat-stage" aria-labelledby="seat-feature-title">
          <div className="lp-feature-copy">
            <h2 id="seat-feature-title">Pilih tempat<br/>nyaman Anda.</h2>
            <p>Lihat susunan kursi sebelum memesan. Pilih yang masih tersedia, lalu lanjutkan perjalanan sesuai rencana Anda.</p>
            <p>Setelah pembayaran dikonfirmasi, kursi pilihan Anda tercantum di tiket digital.</p>
            <Link className="lp-text-link" href="/trips">Lihat perjalanan<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link>
          </div>
          <BookingMotion kind="seat"/>
        </section>
      </div>

      <div className="lp-screen" id="cara-memesan" data-landing-section>
        <section className="lp-booking" aria-labelledby="booking-title">
          <div className="lp-section-title"><h2 id="booking-title">Dari rencana menjadi perjalanan.</h2><p>Pemesanan yang bisa Anda atur sendiri, dari awal sampai siap berangkat.</p></div>
          <BookingRoute><ol className="lp-booking-flow">
            {bookingFlow.map(({Icon, title, copy}) => <li key={title}>
              <span className="lp-flow-icon"><Icon size={27} weight="light" aria-hidden="true"/></span>
              <h3>{title}</h3><p>{copy}</p>
            </li>)}
          </ol></BookingRoute>
        </section>
      </div>

      <div className="lp-screen" id="persiapan" data-landing-section><PreparationShowcase/></div>

      <div className="lp-screen" id="alur-pemesanan" data-landing-section>
        <section className="lp-checkout-feature lp-checkout-band" aria-labelledby="checkout-feature-title">
          <BookingMotion kind="deck"/>
          <div className="lp-feature-copy">
            <h2 id="checkout-feature-title">Satu alur.<br/>Siap berangkat.</h2>
            <p>Pilih kursi, selesaikan pembayaran, lalu buka tiket di Pesanan saya. Semua bisa Anda ikuti dari satu tempat.</p>
            <p>Alur berputar otomatis. Tekan kartu atau pilih langkah untuk melompat.</p>
            <Link className="lp-text-link" href="/tickets">Buka pesanan saya<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link>
          </div>
        </section>
      </div>

      <div className="lp-screen" id="bantuan" data-landing-section>
        <section className="lp-help" aria-labelledby="help-title">
          <div className="lp-section-title"><h2 id="help-title">Sebelum Anda berangkat</h2><p>Beberapa hal yang mungkin ingin Anda ketahui.</p><div className="lp-help-actions"><Link className="lp-text-link" href="/pengaduan/buat">Buat pengaduan<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link><Link className="lp-text-link" href="/pengaduan/cek#riwayat">Pengaduan saya<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link></div></div>
          <div className="lp-faq">
            <details><summary>Bagaimana cara memesan perjalanan?</summary><p>Pilih asal, tujuan, dan tanggal. Buka jadwal yang sesuai, pilih kursi yang tersedia, lalu masuk dengan email untuk melanjutkan pemesanan.</p></details>
            <details><summary>Bisa memesan untuk orang lain?</summary><p>Bisa. Saat mengisi data penumpang, pilih pemesanan untuk orang lain dan isi nama serta nomor telepon penumpang yang akan berangkat.</p></details>
            <details><summary>Di mana saya bisa membuka tiket?</summary><p>Masuk menggunakan akun pemesan, lalu buka <Link href="/tickets">Pesanan saya</Link>. Tiket dan QR tersedia setelah pembayaran dikonfirmasi.</p></details>
            <details><summary>Apa yang diperiksa sebelum keberangkatan?</summary><p>Periksa tanggal, jam, titik naik, dan nama penumpang pada tiket. Siapkan QR untuk ditunjukkan kepada petugas saat naik.</p></details>
          </div>
        </section>
      </div>
    </div>
  </PassengerShell>;
}
