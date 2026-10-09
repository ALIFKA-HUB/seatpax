import Link from 'next/link';
import PassengerShell from './components/passenger-shell';
export default function Home(){
 return <PassengerShell><section className="sp-home"><div className="sp-home-rule" aria-hidden="true"/><p className="eyebrow">Perjalanan antarkota</p><h1>Perjalanan Anda, mulai dari satu kursi.</h1><p className="sp-muted">Cari perjalanan, pilih kursi, dan simpan tiket Anda dalam satu tempat.</p><div className="sp-actions"><Link href="/trips" className="sp-primary">Cari perjalanan <span aria-hidden="true">→</span></Link><Link href="/tickets" className="sp-secondary">Tiket saya</Link></div></section><section className="sp-home-note"><h2>Kursi pilihan Anda. Tiket yang mudah dibuka.</h2><p className="sp-muted">Masuk dengan email saat memesan. Setelah pembayaran dikonfirmasi, tiket dan QR tersedia di Tiket saya.</p></section></PassengerShell>;
}
