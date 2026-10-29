# Seatpax

Aplikasi pemesanan tiket dan operasional untuk **satu perusahaan shuttle**: rute multi-stop, inventory kursi per segmen, pembayaran Midtrans Sandbox, QR penumpang dan pengaduan pelanggan.

## Status project

Baseline mencakup login/session, lokasi/rute/tarif/armada/layout/jadwal, booking satu penumpang untuk diri sendiri atau orang lain, pembayaran Sandbox, Pesanan saya, manifest Crew, boarding/snack serta Helpdesk berbasis formulir. Kode dan migrasi tersedia; ini bukan klaim seluruh alur sudah lolos pengujian perangkat atau siap produksi.

SaaS Free/Pro, billing langganan dan onboarding perusahaan mandiri ditunda; branch eksperimen tersebut tidak termasuk baseline aktif. Flutter Crew belum diimplementasikan; Crew web tetap tersedia. Dashboard Helpdesk, sidebar, daftar dan detail pengaduan sudah diimplementasikan; penerimaan alur perangkat/provider tetap terpisah.

## Mulai membaca

- [Indeks dan source map](docs/seatpax/00_INDEX.md)
- [Scope MVP](docs/seatpax/02_MVP_SCOPE.md)
- [Keputusan produk](docs/seatpax/19_DECISION_LEDGER.md)
- [Hasil analisis spesifikasi](docs/analysis/SEATPAX_SPEC_REVIEW.md)
- [Roadmap](docs/seatpax/17_DEVELOPMENT_ROADMAP.md)
- [Rencana harian 30 hari — scope diadopsi untuk 2–3 jam/hari](docs/superpowers/plans/2026-10-05-seatpax-30-day-delivery.md)

Scope demo diadopsi pada 6 Oktober 2026 dan arah satu perusahaan pada 21 Oktober. Domain flow sudah diimplementasikan bertahap; bukti dan keterbatasannya tercatat dalam `docs/setup`, bukan hanya rencana spesifikasi.

Dokumen modular menjadi acuan aktif. Arsip master dipertahankan sebagai konteks historis. Temuan analisis perlu dituntaskan pada spesifikasi terkait sebelum dipakai sebagai kontrak implementasi.

## Menjalankan aplikasi lokal

Prasyarat: Node.js >=26 dan npm; gunakan versi yang kompatibel dengan engine dependency pada package-lock.json.

```powershell
npm.cmd ci
npm.cmd run dev -- --port 3001
```

Buka http://localhost:3001. Salin `.env.example` ke `.env.local` bila belum ada, lalu isi konfigurasi development; jangan menimpa environment yang sudah terisi. Login dan alur berbasis data membutuhkan Supabase/database. Pembayaran, email dan lampiran memerlukan provider masing-masing. Kredensial tidak boleh dicommit. Gunakan sertifikat CA tepercaya jika dibutuhkan environment database, tanpa menonaktifkan verifikasi TLS.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Jika Turbopack menolak symlink `node_modules` yang keluar dari root pada managed worktree, gunakan `npm.cmd run build -- --webpack`. Verifikasi baseline P01 dengan Webpack lolos; kegagalan default Turbopack lokal ini tidak disembunyikan sebagai hasil build yang lolos.

`package-lock.json` mencatat versi dependency. Business logic berada dalam domain modules/services. Pemeriksaan database/provider dan browser memiliki prasyarat terpisah; browser scripts membutuhkan runtime eksternal yang disebutkan dalam script, misalnya `PLAYWRIGHT_MODULE`. Hasil otomatis bukan pengganti pengujian HP/kamera/provider sungguhan.
## Koneksi database

Jalankan npm.cmd run db:check setelah DATABASE_URL terisi. Perintah ini membaca select 1 dan menutup koneksi. Schema dan migrasi domain sudah tersedia; baca panduan setup sebelum migrate/seed/maintenance karena operasi tersebut dapat mengubah data.

## Setup Supabase development

Ikuti [panduan Supabase](docs/setup/SUPABASE_DEV_SETUP.md), [checkout/payment](docs/setup/CHECKOUT_PAYMENT_SETUP.md) dan [Helpdesk](docs/setup/HELPDESK_SETUP.md). Login OTP dan session refresh sudah tersedia; client server read-only secara default, read-write pada route/action yang sesuai.

## Halaman dan role

| Pengguna | Halaman | Batas akses |
| --- | --- | --- |
| Pengunjung/pelanggan | `/`, `/trips`, `/login`, `/tickets`, `/account` | Booking/tiket pribadi memerlukan login |
| Pelapor | `/pengaduan`, `/pengaduan/buat`, `/pengaduan/cek` | Tanpa login; pelengkapan melalui tautan email khusus |
| Admin operasional | `/admin` | Membership perusahaan aktif |
| Petugas Helpdesk | `/helpdesk` | Helpdesk menangani, Admin perusahaan dapat memantau read-only |
| Crew | `/crew` | Perjalanan yang ditugaskan, boarding/snack terpisah |
| Super Admin teknis | `/super-admin/companies` | Akses teknis yang dipertahankan, bukan aktivasi SaaS |

Login normal memakai kode email. [Quick login testing](docs/setup/LOCAL_QUICK_LOGIN_SETUP.md) hanya aktif dengan flag eksplisit di development, project development yang ditentukan dan host loopback. Ini tetap menghasilkan session Supabase serta mengikuti role guard. Production mempertahankan login normal.

## Audit dan pekerjaan berikutnya

Audit dan perbaikan 29 Oktober: temuan retry email, pagination dan konteks pemantauan Helpdesk sudah diperbaiki. Hasil pemeriksaan terbaru tercatat di [laporan delivery](docs/setup/DELIVERY_2026_10_29.md). Computer Use terbaru terhambat geometri input browser sehingga tidak ada flow baru yang dianggap lolos. Bukti historis mencakup pembayaran Sandbox yang ditunjukkan pengguna dan satu email receipt Helpdesk yang dikonfirmasi masuk inbox. Lifecycle lengkap, unduhan privat melalui UI dan perangkat fisik masih memerlukan verifikasi.

- [Roadmap task, tujuan dan kriteria selesai](docs/superpowers/plans/2026-10-29-project-stabilization-roadmap.md)
- [Audit sumber](docs/analysis/2026-10-29-source-bug-audit.md)
- [Batas Computer Use](docs/analysis/2026-10-29-computer-use-flow-audit.md)

Task yang sudah di-ACC: implementasi sesuai scope, verifikasi, commit bermakna lalu push terverifikasi. Jangan sertakan kredensial atau artefak pribadi.

- [Panduan demo dan pemeriksaan ulang](docs/setup/DEMO_CHECKLIST_2026_10_29.md)
- [Bukti responsif dan batas penerimaan](docs/setup/RESPONSIVE_AUDIT_2026_10_29.md)
