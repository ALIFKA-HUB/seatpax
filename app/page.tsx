export default function HomePage() {
  return (
    <main className="setup">
      <header className="brand">SEATPAX <span>Development</span></header>
      <section aria-labelledby="setup-title">
        <p className="eyebrow">Fondasi aplikasi</p>
        <h1 id="setup-title">Seatpax</h1>
        <p className="intro">Ticketing dan operasional penumpang bus antarkota.</p>
        <p>Aplikasi sedang disiapkan. Pemesanan dan login belum tersedia.</p>
        <a href="#langkah-berikutnya">Lihat langkah berikutnya <span aria-hidden="true">→</span></a>
      </section>
      <section id="langkah-berikutnya" aria-labelledby="next-title" className="next-steps">
        <h2 id="next-title">Langkah berikutnya</h2>
        <ol><li>Hubungkan project Supabase development.</li><li>Siapkan login Email OTP.</li><li>Bangun akses Passenger, Admin PO, Crew, dan Super Admin.</li></ol>
      </section>
      <footer>Seatpax · Lingkungan pengembangan</footer>
    </main>
  );
}
