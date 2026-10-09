import Link from 'next/link';
export default function HomePage() {
  return (
    <main className="setup">
      <header className="brand">SEATPAX <span>Development</span></header>
      <section aria-labelledby="setup-title">
        <p className="eyebrow">Fondasi aplikasi</p>
        <h1 id="setup-title">Seatpax</h1>
        <p className="intro">Ticketing dan operasional penumpang bus antarkota.</p>
        <p>Masuk dengan email untuk mengakses perjalanan dan tiket Anda.</p>
        <Link href="/trips">Cari perjalanan →</Link><Link href="/tickets">Tiket saya →</Link><a href="/account">Masuk / Akun saya <span aria-hidden="true">→</span></a>
      </section>
      <section id="langkah-berikutnya" aria-labelledby="next-title" className="next-steps">
        <h2 id="next-title">Langkah berikutnya</h2>
        <ol><li>Verifikasi pengiriman Email OTP.</li><li>Bangun akses Passenger, Admin PO, Crew, dan Super Admin.</li><li>Siapkan rute dan inventory kursi.</li></ol>
      </section>
      <footer>Seatpax · Lingkungan pengembangan</footer>
    </main>
  );
}
