import {Suspense} from 'react';
import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Armchair, Ticket, MapPin, Clock, MagnifyingGlass, CreditCard, ArrowRight} from '@phosphor-icons/react/ssr';
import PassengerShell from './components/passenger-shell';
import JourneyPlanner, {PlannerSkeleton} from './landing/journey-planner';
import './landing/landing.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Seatpax | Perjalanan shuttle antarkota',
  description: 'Rencanakan perjalanan bersama Seatpax. Cari jadwal, pilih kursi, dan buka tiket perjalanan Anda dalam satu tempat.',
};

const bookingFlow = [
  {Icon: MagnifyingGlass, title: 'Cari perjalanan', copy: 'Tentukan asal, tujuan, dan tanggal keberangkatan.'},
  {Icon: Armchair, title: 'Pilih kursi', copy: 'Lihat susunan kursi dan pilih yang tersedia.'},
  {Icon: CreditCard, title: 'Selesaikan pembayaran', copy: 'Ikuti petunjuk pembayaran pada pesanan Anda.'},
  {Icon: Ticket, title: 'Buka tiket', copy: 'Setelah dikonfirmasi, tiket dan QR siap dibuka.'},
];

export default function Home() {
  return <PassengerShell landing>
    <div className="lp-content">
      <section className="lp-hero" aria-labelledby="landing-title">
        <Image src="/landing/forest-road.jpg" alt="Ilustrasi jalan berkelok di antara pepohonan" fill sizes="(max-width: 1240px) 100vw, 1200px" priority/>
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">SHUTTLE ANTARKOTA</p>
          <h1 id="landing-title">Antarkota,<br/>lebih nyaman.</h1>
          <p className="lp-hero-intro">Cari jadwal, pilih kursi, dan pesan perjalanan Anda bersama Seatpax.</p>
        </div>
      </section>

      <Suspense fallback={<PlannerSkeleton/>}><JourneyPlanner/></Suspense>

      <section className="lp-booking" aria-labelledby="booking-title">
        <div className="lp-section-title"><h2 id="booking-title">Dari rencana menjadi perjalanan.</h2><p>Pemesanan yang bisa Anda atur sendiri, dari awal sampai siap berangkat.</p></div>
        <ol className="lp-booking-flow">
          {bookingFlow.map(({Icon, title, copy}) => <li key={title}>
            <span className="lp-flow-icon"><Icon size={27} weight="light" aria-hidden="true"/></span>
            <h3>{title}</h3><p>{copy}</p>
          </li>)}
        </ol>
      </section>

      <section className="lp-experience" aria-labelledby="experience-title">
        <figure className="lp-experience-photo">
          <Image src="/landing/morning-road.jpg" alt="Ilustrasi jalan di tengah hutan berkabut" fill sizes="(max-width: 767px) 100vw, 45vw"/>
          <figcaption>Foto ilustrasi perjalanan</figcaption>
        </figure>
        <div className="lp-experience-copy">
          <h2 id="experience-title">Persiapkan perjalanan.<br/>Nikmati setiap kilometernya.</h2>
          <p>Detail yang Anda perlukan, mudah ditemukan sebelum berangkat.</p>
          <div className="lp-benefit"><MapPin size={25} weight="light" aria-hidden="true"/><div><h3>Ketahui titik naik Anda</h3><p>Periksa lokasi keberangkatan dan tujuan pada detail perjalanan.</p></div></div>
          <div className="lp-benefit"><Clock size={25} weight="light" aria-hidden="true"/><div><h3>Jadwal dan armada jelas</h3><p>Lihat jam keberangkatan, armada, dan kelas layanan sebelum memesan.</p></div></div>
          <div className="lp-benefit"><Ticket size={25} weight="light" aria-hidden="true"/><div><h3>Tiket mudah dibuka kembali</h3><p>Tiket dan QR yang sudah dikonfirmasi tersimpan di Pesanan saya.</p></div></div>
          <Link className="lp-text-link" href="/tickets">Pesanan saya<span className="lp-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link>
        </div>
      </section>

      <section className="lp-help" aria-labelledby="help-title">
        <div className="lp-section-title"><h2 id="help-title">Sebelum Anda berangkat</h2><p>Beberapa hal yang mungkin ingin Anda ketahui.</p></div>
        <div className="lp-faq">
          <details><summary>Bagaimana cara memesan perjalanan?</summary><p>Pilih asal, tujuan, dan tanggal. Buka jadwal yang sesuai, pilih kursi yang tersedia, lalu masuk dengan email untuk melanjutkan pemesanan.</p></details>
          <details><summary>Bisa memesan untuk orang lain?</summary><p>Bisa. Saat mengisi data penumpang, pilih pemesanan untuk orang lain dan isi nama serta nomor telepon penumpang yang akan berangkat.</p></details>
          <details><summary>Di mana saya bisa membuka tiket?</summary><p>Masuk menggunakan akun pemesan, lalu buka <Link href="/tickets">Pesanan saya</Link>. Tiket dan QR tersedia setelah pembayaran dikonfirmasi.</p></details>
          <details><summary>Apa yang diperiksa sebelum keberangkatan?</summary><p>Periksa tanggal, jam, titik naik, dan nama penumpang pada tiket. Siapkan QR untuk ditunjukkan kepada petugas saat naik.</p></details>
        </div>
      </section>

      <div className="lp-photo-credits"><p>Foto ilustrasi: <a href="https://unsplash.com/photos/aerial-view-of-road-in-the-middle-of-green-trees--97jc08hg8Y" target="_blank" rel="noreferrer">CHUTTERSNAP</a> dan <a href="https://unsplash.com/photos/an-empty-road-in-the-middle-of-a-forest-4jUOijefE1g" target="_blank" rel="noreferrer">Gamma</a> / Unsplash.</p></div>
    </div>
  </PassengerShell>;
}
