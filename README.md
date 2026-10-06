# Seatpax

Platform ticketing dan operasional penumpang bus antarkota multi-stop, dengan inventory kursi per segmen, layout armada dinamis, QR per penumpang, dan isolasi data antar-PO.

## Status project

Setup aplikasi Next.js sedang diimplementasikan pada branch feat/day2-supabase-setup. Halaman awal dan validasi environment tersedia; login, domain tables, booking dan payment belum diimplementasikan. Koneksi hosted Supabase belum diverifikasi.

## Mulai membaca

- [Indeks dan source map](docs/seatpax/00_INDEX.md)
- [Scope MVP](docs/seatpax/02_MVP_SCOPE.md)
- [Keputusan produk](docs/seatpax/19_DECISION_LEDGER.md)
- [Hasil analisis spesifikasi](docs/analysis/SEATPAX_SPEC_REVIEW.md)
- [Roadmap](docs/seatpax/17_DEVELOPMENT_ROADMAP.md)
- [Rencana harian 30 hari — scope diadopsi untuk 2–3 jam/hari](docs/superpowers/plans/2026-10-05-seatpax-30-day-delivery.md)

Scope demo 30 hari diadopsi pada 6 Oktober 2026. Fondasi teknis diadopsi sebagai D2026-10-06-02 pada [rancangan fondasi](docs/superpowers/specs/2026-10-06-foundation-design.md); aplikasi belum diimplementasikan.

Dokumen modular menjadi acuan aktif. Arsip master dipertahankan sebagai konteks historis. Temuan analisis perlu dituntaskan pada spesifikasi terkait sebelum dipakai sebagai kontrak implementasi.

## Menjalankan aplikasi lokal

Prasyarat: Node.js >=26 dan npm; gunakan versi yang kompatibel dengan engine dependency pada package-lock.json.

```powershell
npm.cmd ci
npm.cmd run dev
```

Buka http://localhost:3000. Halaman awal dapat berjalan tanpa kredensial Supabase.
Salin `.env.example` ke `.env.local` ketika project development tersedia; kredensial tidak boleh dicommit.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

`package-lock.json` mencatat versi dependency. Business logic berikutnya mengikuti modules/services sesuai spesifikasi.
## Koneksi database

Jalankan npm.cmd run db:check setelah DATABASE_URL di .env.local terisi. Perintah ini hanya membaca select 1 dan menutup koneksi. Belum ada schema atau migration yang dijalankan; konfigurasi Drizzle disiapkan untuk slice berikutnya.
