# Seatpax

Aplikasi pemesanan tiket shuttle dan manajemen operasional terpadu untuk **satu perusahaan shuttle**: rute multi-stop, alokasi inventaris kursi per segmen, checkout Midtrans Sandbox, tiket QR terenkripsi dengan split boarding pass, operasional kru darat, layanan pengaduan pelanggan, serta panel admin PO dan super admin.

---

## 1. Cakupan Produk (Product Scope)

Seatpax dikembangkan secara khusus untuk operasional **satu perusahaan shuttle (Single Shuttle Company MVP)**. Seluruh logika bisnis berfokus pada efisiensi operasional dan kenyamanan perjalanan:

1. **Segment-Based Inventory (Inventaris Kursi Berbasis Segmen):**
   - Mendukung rute multi-stop (contoh: Jakarta -> Karawang -> Bandung).
   - Kursi dihitung dan dikunci per segmen rute. Penumpang dengan segmen rute yang tidak tumpang tindih dapat menggunakan nomor kursi fisik yang sama (misal: Penumpang A Jakarta-Karawang dan Penumpang B Karawang-Bandung di kursi 01), mengoptimalkan utilisasi armada tanpa risiko *double booking*.
2. **10-Minute Seat Hold & Grace Period:**
   - Kursi yang dipilih langsung dikunci sementara (*hold*) selama **10 menit** begitu masuk tahap checkout untuk mencegah perebutan kursi secara konkuren.
   - Tersedia *conditional grace period* (+1 menit) saat transaksi pembayaran sedang diinisiasi di sisi server sebelum batas waktu berakhir.
   - Pelepasan kursi otomatis (*hold expiry/release*) jika pembayaran tidak diselesaikan tepat waktu.
3. **Midtrans Sandbox Checkout & Active Status Reconciliation:**
   - Mendukung pembelian tiket untuk **Saya Sendiri (`SELF`)** menggunakan profil akun yang sedang login, atau untuk **Orang Lain (`OTHER`)** dengan input identitas nama dan nomor HP penumpang tanpa mengubah data akun pemesan.
   - Pembayaran menggunakan antarmuka Midtrans Snap Sandbox (Virtual Account, QRIS, Kartu Uji Coba).
   - Sinkronisasi status pembayaran aktif melalui webhook tersertifikasi dan rekonsiliasi polling otomatis.
   - Penanganan idempotensi transaksi dan deteksi pembayaran terlambat (*late payment conflict* / `PAYMENT_CONFLICT`) dengan resolusi inventaris oleh admin.
4. **Encrypted QR Ticket & Split Boarding Pass:**
   - Tiket resmi diterbitkan otomatis setelah pembayaran berstatus `PAID` / `CONFIRMED`.
   - Menggunakan token QR unik terenkripsi (*encrypted ciphertext*, AES-256-GCM berbasis 32-byte base64 key) yang aman dari pemalsuan.
   - Desain tampilan **Split Boarding Pass** responsif dan siap cetak pada `/tickets/[ticketId]`, menyajikan informasi halte asal, tujuan, armada, waktu keberangkatan, nomor kursi, dan QR Code dinamis.
   - Terintegrasi dengan menu navigasi atas **Pesanan saya** (`/tickets`) untuk akun pelanggan yang login.
5. **Crew Manifest, Once-Only QR Boarding & Snack Handover:**
   - Kru bus/shuttle mengakses jadwal perjalanan yang ditugaskan (*assigned trip*) di `/crew`.
   - Manifest digital real-time menampilkan daftar seluruh penumpang terkonfirmasi, kursi, halte naik/turun, status boarding (`Belum naik` / `Sudah naik`), dan status snack (`Snack belum diserahkan` / `Snack sudah diserahkan`).
   - Pemindai kamera QR scanner bawaan peramban atau pencarian manual nomor tiket.
   - Pencatatan status **Boarding** satu kali (*once-only validation*, idempoten) dan penyerahan **Snack** terpisah (*snack handover tracking*).
6. **Public Pengaduan & Helpdesk Staff Triage:**
   - Pelanggan/tamu dapat mengirim pengaduan publik tanpa login di `/pengaduan/buat` dan menerima nomor tiket pelacakan unik (`SPX-ADU-xxxxxx`).
   - Pelacak status mandiri di `/pengaduan/cek`.
   - Workspace operasional petugas Helpdesk di `/helpdesk` untuk triage tiket, pengaturan prioritas (`Rendah`, `Sedang`, `Tinggi`), riwayat kejadian, dan eskalasi status (`Menunggu`, `Diproses`, `Perlu Dilengkapi`, `Selesai`).
   - Permintaan data tambahan terhubung langsung ke formulir aman `/pengaduan/lengkapi` menggunakan token ber-grant terverifikasi.
7. **Admin PO & Super Admin Internal:**
   - **Admin PO Operasional (`/admin`):** Konfigurasi lokasi halte, rute multi-stop, tarif per segmen, armada kendaraan, template layout kursi (*click-cell builder* 8 kursi), penjadwalan & rilis perjalanan (`OPEN_FOR_SALE`), penugasan kru, dan pemantauan konflik pembayaran.
   - **Super Admin (`/super-admin`):** Manajemen direktori staf perusahaan satu pintu (tambah petugas baru, pengubahan peran `ADMIN_PO`, `HELPDESK`, `CREW`, serta kontrol status `ACTIVE`/`DISABLED`), serta pemantauan entitas perusahaan di `/super-admin/companies`.

---

## 2. Tech Stack & Persyaratan Sistem

- **Framework Web:** Next.js 16 (App Router, React 19, Server Actions, TypeScript)
- **Styling:** Tailwind CSS v4, Modular CSS Per-Domain
- **Database & ORM:** PostgreSQL, Drizzle ORM, `postgres` driver
- **Autentikasi:** Supabase Auth (Email OTP di produksi, Dev Quick-Login di pengembangan lokal), `@supabase/ssr`
- **Payment Gateway:** Midtrans Sandbox (Snap Client & Server SDK)
- **Komponen & Utilitas:** Phosphor Icons, `@phosphor-icons/react`, QR Scanner (`qr-scanner`), QRCode Generator (`qrcode`), Zod v4
- **Pengujian (Testing):** Vitest v5 (Unit test suite & Integration test suite)
- **Engine Runtime:** Node.js `>=26.0.0`, npm `>=10.0.0`

---

## 3. Instalasi & Menjalankan Aplikasi Lokal

### 3.1 Prasyarat & Instalasi Dependency

Pastikan menggunakan Node.js versi 26 atau yang lebih baru:

```bash
# Clone repositori dan buka direktori proyek
cd SeatPax

# Install dependency sesuai lockfile
npm install
```

### 3.2 Konfigurasi Environment (`.env.local`)

Salin file `.env.example` menjadi `.env.local` lalu lengkapi variabel berikut (pastikan kredensial rahasia tidak pernah dicommit ke git):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database Connection (Server-only)
DATABASE_URL=postgresql://USER:PASSWORD@POOLER_HOST:6543/postgres
DATABASE_MIGRATION_URL=postgresql://USER:PASSWORD@DIRECT_HOST:5432/postgres

# Midtrans Payment Sandbox (Server & Client)
MIDTRANS_ENVIRONMENT=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_MERCHANT_ID=Gxxxxxxxxxx
# 32-byte Base64 encoded encryption key (regex: /^[A-Za-z0-9+/]{43}=$/)
TICKET_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=

# Helpdesk Service (Server-only)
HELPDESK_COMPANY_ID=00000000-0000-4000-8000-000000000001
HELPDESK_LINK_SECRET=your-helpdesk-token-secret
HELPDESK_PUBLIC_ORIGIN=http://localhost:3001
RESEND_API_KEY=re_xxxxxxxxxxxx
HELPDESK_EMAIL_FROM=helpdesk@seatpax.dev
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
HELPDESK_TRUST_PROXY=false

# Development Quick-Login Testing (Khusus localhost)
DEV_QUICK_LOGIN=true

# Single-company staff dashboard (Server-only, opsional di development lokal)
# Di development lokal otomatis fallback ke Demo PO A (00000000-0000-4000-8000-000000000001)
# SEATPAX_COMPANY_ID=00000000-0000-4000-8000-000000000001
```

### 3.3 Menjalankan Server Development

Jalankan Next.js development server pada port `3001`:

```bash
npm run dev -- --port 3001
```

Aplikasi dapat diakses melalui peramban di [http://localhost:3001](http://localhost:3001).

### 3.4 Perintah Verifikasi & Pengujian

Jalankan skrip pemeriksaan kualitas kode dan integritas basis data:

```bash
# Cek koneksi basis data
npm run db:check

# Typecheck TypeScript (tanpa emisi file)
npm run typecheck

# Linter ESLint
npm run lint

# Jalankan pengujian unit (Vitest)
npm run test
# atau jalankan spesifik:
npx vitest run tests/unit/
```

---

## 4. Pemetaan Role, Rute, & Akun Dev Quick-Login

### 4.1 Tabel Akses Halaman Berdasarkan Peran

| Peran Pengguna | Jalur Rute Akses Utama | Batasan & Hak Akses |
| --- | --- | --- |
| **Pengunjung / Pelanggan** | `/`, `/trips`, `/checkout/[holdId]`, `/bookings/[bookingId]`, `/tickets`, `/tickets/[ticketId]`, `/account` | Akses publik untuk pencarian perjalanan; pemesanan kursi, pembayaran, dan e-tiket pribadi terikat akun pemesan. |
| **Pelapor Pengaduan (Tamu)** | `/pengaduan`, `/pengaduan/buat`, `/pengaduan/cek`, `/pengaduan/lengkapi` | Akses publik tanpa login. Pelengkapan data tambahan menggunakan tautan ber-token aman yang dikirimkan petugas. |
| **Crew Shuttle** | `/crew`, `/crew/trips/[tripId]`, `/crew/trips/[tripId]/manifest`, `/crew/trips/[tripId]/scan` | Khusus kru aktif; hanya dapat melihat jadwal perjalanan yang ditugaskan (*assigned trips*), validasi QR boarding, dan penyerahan snack. |
| **Petugas Helpdesk** | `/helpdesk`, `/helpdesk/[id]`, `/helpdesk/pengaduan` | Khusus staf helpdesk; penanganan tiket komplain, eskalasi prioritas, catatan investigasi, dan permintaan dokumen tambahan. |
| **Admin Operasional PO** | `/admin`, `/admin/companies/[companyId]/*` | Khusus pengelola PO; manajemen rute, halte, tarif segmen, template kursi armada, rilis jadwal perjalanan, manifest, dan resolusi konflik pembayaran. |
| **Super Admin** | `/super-admin`, `/super-admin/companies` | Khusus pengelola sistem internal; direktori dan manajemen staf satu perusahaan (`+ Tambah petugas`, ubah role, toggle aktif/nonaktif), serta kontrol status perusahaan. |

### 4.2 Akun Pengujian Dev Quick-Login

Jika `DEV_QUICK_LOGIN=true` aktif di `.env.local` pada environment pengembangan lokal (`localhost`), halaman `/login` menampilkan tombol cepat masuk otomatis untuk pengujian skenario:

| Role Testing | Email Akun Preset | Rute Pengalihan Langsung |
| --- | --- | --- |
| **Customer (Pelanggan)** | `johancocthird@gmail.com` | `/trips` (atau halaman yang diminta) |
| **Admin Operasional PO** | `johancocthird+admina@gmail.com` | `/admin` |
| **Petugas Helpdesk** | `johancocthird+helpdesk@gmail.com` | `/helpdesk` |
| **Crew Lapangan** | `johancocthird+crewa@gmail.com` | `/crew` |
| **Super Admin** | `johancocthird+super@gmail.com` | `/super-admin` |

*(Catatan: Kredensial produksi tetap menggunakan otentikasi aman Supabase Email OTP).*

---

## 5. Panduan Langkah-demi-Langkah Demo Ujikom (End-to-End Walkthrough)

Berikut adalah panduan lengkap untuk mendemonstrasikan seluruh alur kerja sistem Seatpax dari awal hingga akhir pada sesi pengujian atau uji kompetensi (Ujikom):

### Langkah 1: Pencarian Perjalanan & Kunci Kursi 10 Menit (Passenger Flow)
1. Buka peramban di [http://localhost:3001](http://localhost:3001) atau langsung menuju `/trips`.
2. Pilih titik asal (misal: *Jakarta*) dan tujuan (misal: *Bandung*), tentukan tanggal keberangkatan, lalu klik tombol **Cari Jadwal**.
3. Sistem menampilkan daftar perjalanan berstatus `OPEN_FOR_SALE` beserta informasi armada, kelas layanan, estimasi waktu, dan sisa kursi tersedia.
4. Klik **Pilih Kursi** pada salah satu jadwal perjalanan untuk membuka denah kursi interaktif. Kursi yang telah dipesan atau ditahan penumpang lain pada segmen bersinggungan berstatus tidak tersedia secara real-time.
5. Klik nomor kursi yang diinginkan (status *Tersedia*, misal: Kursi `02` atau `03`).
6. Klik tombol **Tahan kursi 10 menit**:
   - Jika pengguna belum masuk, sistem mengarahkan ke tombol **Masuk untuk menahan kursi** (`/login`).
   - Setelah masuk, sistem secara atomik mengunci kursi di basis data dengan batas waktu reservasi **10 menit** (*hold reservation*).
   - Pengguna langsung diarahkan ke halaman `/checkout/[holdId]`.
7. Pada halaman checkout di bagian *"Untuk siapa tiket ini?"*, pilih opsi radio:
   - **Saya sendiri (`SELF`)**: Nama dan nomor telepon otomatis diisi dari profil akun pemesan.
   - **Orang lain (`OTHER`)**: Masukkan *Nama penumpang* dan *Nomor HP penumpang* sebenarnya tanpa mengubah profil akun pemesan.
8. Klik tombol **Lanjutkan ke pembayaran →**.

### Langkah 2: Pembayaran Midtrans Sandbox & Penerbitan Boarding Pass (Payment & Ticket Flow)
1. Periksa rincian pesanan, rute segmen halte, nomor kursi, dan total tarif pada ringkasan pembayaran di `/checkout/[holdId]`.
2. Klik tombol **Lanjutkan ke pembayaran →**. Jendela popup **Midtrans Snap Sandbox** akan terbuka secara otomatis.
3. Pilih metode pembayaran uji coba (misal: *BCA Virtual Account*, *Mandiri Bill*, *QRIS*, atau *Credit Card Sandbox*).
4. Selesaikan pembayaran pada simulator Midtrans Sandbox.
5. Sistem menerima konfirmasi status melalui webhook tersertifikasi dan sinkronisasi otomatis (`PAID` / `CONFIRMED`):
   - Status kursi beralih dari *HOLD* menjadi *CONFIRMED*.
   - Booking resmi diterbitkan dan pengguna dialihkan ke halaman status di `/bookings/[bookingId]`.
6. Klik tombol **Buka tiket dan QR →** untuk membuka e-tiket resmi dan Split Boarding Pass di `/tickets/[ticketId]`:
   - Halaman **Split Boarding Pass** menyajikan detail tiket berdesain elegan yang mencantumkan nama penumpang, rute halte, waktu keberangkatan, nomor armada bus, serta **QR Code terenkripsi**.
   - Tiket ini juga dapat diakses kapan saja oleh pelanggan melalui menu navigasi atas **Pesanan saya** (`/tickets`).

### Langkah 3: Operasional Kru — Manifest, Verifikasi QR, Boarding, & Snack (Crew Flow)
1. Buka tab peramban baru dan akses `/login`.
2. Gunakan quick-login **Crew** (`johancocthird+crewa@gmail.com`) untuk langsung diarahkan ke `/crew`.
3. Kru melihat kartu daftar perjalanan yang ditugaskan (*Assigned Trips*) pada hari berjalan.
4. Klik perjalanan aktif untuk masuk ke ringkasan trip `/crew/trips/[tripId]`.
5. Klik menu **Manifest** (`/crew/trips/[tripId]/manifest`) untuk melihat daftar seluruh penumpang pada trip tersebut, nomor kursi, halte naik/turun, status boarding (`Belum naik` / `Sudah naik`), dan status snack (`Snack belum diserahkan` / `Snack sudah diserahkan`).
6. Untuk memvalidasi tiket penumpang yang hendak naik:
   - Buka menu **Scan QR** (`/crew/trips/[tripId]/scan`) dan arahkan kamera ke QR Code pada tiket penumpang (atau klik nama penumpang pada daftar manifest).
   - Halaman profil tiket penumpang akan terbuka di `/crew/trips/[tripId]/passengers/[ticketId]`.
7. **Proses Boarding:**
   - Pada form *Konfirmasi boarding*, periksa stop keberangkatan lalu klik tombol **Tandai sudah naik**.
   - Status tiket penumpang berubah menjadi `Sudah naik` dengan stempel waktu real-time. Aksi ini bersifat idempoten (tiket yang sudah naik tidak dapat digunakan ulang).
8. **Proses Penyerahan Snack:**
   - Pada form *Handover snack*, klik tombol **Serahkan snack**. Status snack berubah menjadi `Snack sudah diserahkan`.

### Langkah 4: Layanan Pengaduan Publik & Triage Helpdesk Staf (Helpdesk Flow)
1. Buka `/pengaduan` sebagai tamu/pelanggan yang mengalami kendala layanan.
2. Klik **Buat Pengaduan** di `/pengaduan/buat`.
3. Isi formulir pengaduan publik:
   - **Data pelapor:** Masukkan *Nama* dan *Email* aktif.
   - **Detail kendala:** Pilih *Kategori* (`Pembayaran`, `Pelayanan perjalanan`, `Bug aplikasi`, atau `Lainnya`), masukkan *Judul*, dan isi *Uraian* kendala secara rinci.
   - **Informasi pendukung:** Masukkan *Nomor pesanan* (opsional) dan unggah *Lampiran* bukti pendukung (opsional).
   - Klik tombol **Kirim pengaduan**.
4. Sistem menerbitkan kode tiket pengaduan unik (contoh: `SPX-ADU-202611-0001`).
5. Pelapor dapat memantau status secara berkala di `/pengaduan/cek` dengan memasukkan kode tiket pada kolom *Nomor tiket pengaduan* lalu mengklik tombol **Cek pengaduan**.
6. **Penanganan oleh Petugas Helpdesk:**
   - Login sebagai **Petugas Helpdesk** (`johancocthird+helpdesk@gmail.com`) melalui `/login`.
   - Masuk ke dashboard `/helpdesk` (*Ruang kerja Helpdesk - Pengaduan pelanggan*):
     - Memfilter antrean pengaduan berdasarkan *Status* (`Menunggu`, `Diproses`, `Perlu Dilengkapi`, `Selesai`) atau *Prioritas* (`Rendah`, `Sedang`, `Tinggi`), lalu klik **Terapkan filter**.
     - Klik judul pengaduan untuk membuka detail kasus di `/helpdesk/[id]`.
   - Pada panel *Tindakan petugas*:
     - Tentukan prioritas tiket lalu klik **Simpan prioritas**.
     - Pilih tindakan penanganan:
       - **Mulai proses** (`DIPROSES`) untuk memulai investigasi internal.
       - **Minta kelengkapan** (`PERLU_DILENGKAPI`) dengan mengisi *Keterangan* instruksi data yang dibutuhkan dari pelapor.
       - **Selesaikan laporan** (`SELESAI`) untuk menuntaskan kasus setelah investigasi selesai.
     - Klik tombol **Simpan tindakan**.
7. **Pelengkapan Dokumen Tambahan (Supplementation):**
   - Ketika petugas memilih *Minta kelengkapan*, status pengaduan menjadi `PERLU_DILENGKAPI`.
   - Pelapor membuka tautan email khusus menuju `/pengaduan/lengkapi` (membawa token `#grant=...`).
   - Pelapor membaca rincian *Permintaan petugas*, mengisi formulir *Informasi tambahan* beserta lampiran baru, lalu mengklik tombol **Kirim kelengkapan**.
   - Petugas Helpdesk meninjau data pelengkap di `/helpdesk/[id]` dan memilih tindakan *Selesaikan laporan* (`SELESAI`) hingga status laporan tuntas.

### Langkah 5: Administrasi Operasional PO & Manajemen Staf Super Admin (Admin & Super Admin Flow)
1. **Admin Operasional PO (`/admin`):**
   - Login sebagai **Admin Operasional** (`johancocthird+admina@gmail.com`).
   - Masuk ke portal manajemen `/admin`:
     - **Halte (`stops`):** Mengelola titik lokasi keberangkatan dan perhentian armada.
     - **Rute (`routes`):** Mengatur jalur multi-stop berurutan dan transit.
     - **Tarif (`service-classes`):** Menentukan struktur harga per segmen perjalanan.
     - **Armada (`vehicles`):** Mendaftarkan armada fisik bus/shuttle.
     - **Layout Kursi (`seat-templates`):** Mendesain tata letak kursi armada secara visual (*click-cell builder* 8 kursi).
     - **Jadwal & Rilis Trip (`trips`):** Menjadwalkan perjalanan baru, menentukan supir/kru yang bertugas, dan mempublikasikan jadwal ke status `OPEN_FOR_SALE`.
     - **Resolusi Konflik Pembayaran (`payment-conflicts`):** Memeriksa dan menyelesaikan transaksi yang terlambat dibayar (*late payment*).
2. **Super Admin Internal (`/super-admin`):**
   - Login sebagai **Super Admin** (`johancocthird+super@gmail.com`).
   - Buka dashboard di `/super-admin`:
     - Menampilkan metrik direktori staf operasional perusahaan (Demo PO A) yang terbagi dalam ringkasan: Operasional PO, Petugas Helpdesk, dan Kru Lapangan.
     - **Tambah Petugas Baru (`+ Tambah petugas`):** Mendaftarkan staf baru dengan memasukkan nama lengkap, email, dan peran awal (`ADMIN_PO`, `HELPDESK`, atau `CREW`).
     - **Kontrol Akses Inline:** Mengubah peran staf secara langsung atau mengubah status staf menjadi `ACTIVE` / `DISABLED`.
     - **Manajemen Status PO:** Akses `/super-admin/companies` (*Perusahaan PO*) untuk memantau status operasional entitas perusahaan shuttle (status `ACTIVE` atau `SUSPENDED`).

---

## 6. Referensi Dokumentasi Spesifikasi

Spesifikasi modular dan catatan teknis proyek tersimpan di dalam folder `docs/`:

- [00_INDEX.md](docs/seatpax/00_INDEX.md) — Indeks utama dan peta spesifikasi modular
- [02_MVP_SCOPE.md](docs/seatpax/02_MVP_SCOPE.md) — Batasan lingkup rilis MVP satu perusahaan shuttle
- [11_API_PROJECT_STRUCTURE.md](docs/seatpax/11_API_PROJECT_STRUCTURE.md) — Arsitektur domain modules & struktur API
- [13_UI_UX_DESIGN.md](docs/seatpax/13_UI_UX_DESIGN.md) — Prinsip desain antarmuka & panduan visual
- [19_DECISION_LEDGER.md](docs/seatpax/19_DECISION_LEDGER.md) — Buku catatan keputusan arsitektur dan produk resmi
- [DEMO_CHECKLIST_2026_10_29.md](docs/setup/DEMO_CHECKLIST_2026_10_29.md) — Panduan demo dan daftar verifikasi
