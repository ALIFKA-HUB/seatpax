import {Suspense} from 'react';
import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Armchair, Ticket, MapPin, Clock, MagnifyingGlass, CreditCard, ArrowRight} from '@phosphor-icons/react/ssr';
import PassengerShell from './components/passenger-shell';
import JourneyPlanner, {PlannerSkeleton} from './landing/journey-planner';
import BookingRoute from './landing/booking-route';
import BookingMotion from './landing/booking-motion';
import FeaturedTrips from './landing/featured-trips';
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
        <Image src="/landing/forest-road.jpg" alt="Ilustrasi jalan berkelok di antara pepohonan" fill sizes="(max-width: 1240px) 100vw, 1200px" priority/>
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">SHUTTLE ANTARKOTA</p>
          <h1 id="landing-title">Antarkota,<br/>lebih nyaman.</h1>
          <p className="lp-hero-intro">Cari jadwal, pilih kursi, dan pesan perjalanan Anda bersama Seatpax.</p>
        </div>
      </section>
      <div className="lp-hero-planner" id="cari-perjalanan"><Suspense fallback={<PlannerSkeleton/>}><JourneyPlanner/></Suspense></div>
      </div>
      <div className="lp-screen" id="pilihan-perjalanan" data-landing-section><FeaturedTrips/></div>

      <div className="lp-screen" id="pilih-kursi" data-landing-section>
      <section className="lp-seat-feature" aria-labelledby="seat-feature-title">
        <div className="lp-feature-copy">
          <p className="lp-feature-eyebrow">PILIHAN DI TANGAN ANDA</p>
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

      <div className="lp-screen" id="persiapan" data-landing-section>
      <section className="lp-experience" aria-labelledby="experience-title">
        <div className="lp-experience-copy">
          <h2 id="experience-title">Sebelum berangkat,<br/><em>semua sudah siap.</em></h2>
          <p>Periksa detail perjalanan Anda. Berangkat pun jadi lebih tenang.</p>
          <div className="lp-preparation-guide">
            <details name="preparation-guide" open>
              <summary><MapPin size={20} weight="regular" aria-hidden="true"/><span>Tahu harus naik di mana</span></summary>
              <p>Temukan titik naik dan turun pada detail perjalanan. Pastikan lokasi keberangkatan sudah sesuai.</p>
            </details>
            <details name="preparation-guide">
              <summary><Clock size={20} weight="regular" aria-hidden="true"/><span>Waktunya sudah sesuai</span></summary>
              <p>Periksa tanggal, jam keberangkatan, armada, dan kelas layanan sebelum berangkat.</p>
            </details>
            <details name="preparation-guide">
              <summary><Ticket size={20} weight="regular" aria-hidden="true"/><span>Tiket tinggal ditunjukkan</span></summary>
              <p>Setelah pembayaran dikonfirmasi, buka tiket dan QR melalui Pesanan saya.</p>
            </details>
          </div>
          <Link className="lp-button lp-preparation-cta" href="/tickets">Buka pesanan saya<ArrowRight size={18} aria-hidden="true"/></Link>
        </div>
        <figure className="lp-experience-photo">
          <Image src="/landing/morning-road.jpg" alt="Jalan berkelok di antara pepohonan berkabut" fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 45vw, 540px"/>
        </figure>
      </section>
      </div>

      <div className="lp-screen" id="alur-pemesanan" data-landing-section>
      <section className="lp-checkout-feature" aria-labelledby="checkout-feature-title">
        <BookingMotion kind="deck"/>
        <div className="lp-feature-copy">
          <p className="lp-feature-eyebrow">DARI PESAN HINGGA BERANGKAT</p>
          <h2 id="checkout-feature-title">Satu alur.<br/>Siap berangkat.</h2>
          <p>Pilih kursi, selesaikan pembayaran, lalu buka tiket di Pesanan saya. Semua bisa Anda ikuti dari satu tempat.</p>
          <p>Alur berputar otomatis. Tekan kartu untuk mempercepat.</p>
          <Link className="lp-text-link" href="/tickets">Buka Pesanan saya<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link>
        </div>
      </section>
      </div>

      <div className="lp-screen" id="bantuan" data-landing-section>
      <section className="lp-help" aria-labelledby="help-title">
        <div className="lp-section-title"><h2 id="help-title">Sebelum Anda berangkat</h2><p>Beberapa hal yang mungkin ingin Anda ketahui.</p><Link className="lp-text-link" href="/pengaduan/buat">Buat pengaduan<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link><br/><Link className="lp-text-link" href="/pengaduan/cek#riwayat">Pengaduan saya</Link></div>
        <div className="lp-faq">
          <details><summary>Bagaimana cara memesan perjalanan?</summary><p>Pilih asal, tujuan, dan tanggal. Buka jadwal yang sesuai, pilih kursi yang tersedia, lalu masuk dengan email untuk melanjutkan pemesanan.</p></details>
          <details><summary>Bisa memesan untuk orang lain?</summary><p>Bisa. Saat mengisi data penumpang, pilih pemesanan untuk orang lain dan isi nama serta nomor telepon penumpang yang akan berangkat.</p></details>
          <details><summary>Di mana saya bisa membuka tiket?</summary><p>Masuk menggunakan akun pemesan, lalu buka <Link href="/tickets">Pesanan saya</Link>. Tiket dan QR tersedia setelah pembayaran dikonfirmasi.</p></details>
          <details><summary>Apa yang diperiksa sebelum keberangkatan?</summary><p>Periksa tanggal, jam, titik naik, dan nama penumpang pada tiket. Siapkan QR untuk ditunjukkan kepada petugas saat naik.</p></details>
        </div>
      </section>
      </div>

      <div className="lp-photo-credits"><p>Foto ilustrasi: <a href="https://unsplash.com/photos/aerial-view-of-road-in-the-middle-of-green-trees--97jc08hg8Y" target="_blank" rel="noreferrer">CHUTTERSNAP</a> dan <a href="https://unsplash.com/photos/an-empty-road-in-the-middle-of-a-forest-4jUOijefE1g" target="_blank" rel="noreferrer">Gamma</a> / Unsplash.</p></div>
    </div>
  </PassengerShell>;
}
