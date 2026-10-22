import Link from 'next/link';
import Brand from './brand';
import './passenger-footer.css';

export default function PassengerFooter() {
  return <footer className="sp-site-footer" aria-label="Footer Seatpax">
    <div className="sp-footer-top">
      <div className="sp-footer-brand">
        <Brand/>
        <p className="sp-footer-tagline">Perjalanan antarkota,<br/>lebih nyaman.</p>
        <p className="sp-footer-description">Cari jadwal, pilih kursi, dan buka tiket dalam satu tempat.</p>
      </div>
      <nav className="sp-footer-links" aria-label="Jelajahi Seatpax">
        <h2>Jelajahi</h2>
        <Link href="/trips">Perjalanan</Link>
        <Link href="/tickets">Pesanan saya</Link>
        <Link href="/account">Akun</Link>
      </nav>
      <nav className="sp-footer-links" aria-label="Panduan Seatpax">
        <h2>Panduan</h2>
        <Link href="/#booking-title">Cara memesan</Link>
        <Link href="/#help-title">Pertanyaan umum</Link>
      </nav>
    </div>
    <div className="sp-footer-bottom">
      <span>© {new Date().getFullYear()} Seatpax. Hak cipta dilindungi.</span>
      <span>Perjalanan Anda, dalam satu tempat.</span>
    </div>
  </footer>;
}
