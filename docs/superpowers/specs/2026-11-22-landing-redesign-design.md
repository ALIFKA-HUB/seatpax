# Passenger Landing Page Visual & Motion Redesign (`UI-LANDING-01`)

**Status:** Desain disetujui pengguna pada 22 November 2026 (`"sudah sesuai"`). Dokumen ini merekam spesifikasi desain lengkap sebelum implementasi ke kode sumber.

## Goal

Meredesign halaman publik landing Seatpax (`/`) agar selaras secara visual dengan sistem warna 60–30–10 halaman `/trips` (`UI-TRIPS-01`), menghilangkan foto jalan hutan generik & pengulangan layout split, **mempertahankan penuh animasi track line (`BookingRoute`)**, **meng-upgrade animasi motion (`BookingMotion`)** menggunakan fisika spring nyata (`motion/react`) dengan interaktivitas ringan, serta menyertakan satu **figur SVG isometrik `/anatomy` tema terang** di section Persiapan — tanpa mengubah perilaku pencarian, query Supabase, maupun kontrak test `JourneyPlanner`.

## Design Read & Calibration

> **Design Read:** Consumer-first modern transport landing page for intercity shuttle passengers, with a crisp architectural & operational-trust language (60–30–10 aligned with `/trips`), leaning toward Tailwind v4 + Seatpax CSS tokens + `motion/react` spring choreography + one light-theme `/anatomy` isometric instrument.

- **Dials (`design-taste-frontend`):** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 7` · `VISUAL_DENSITY: 4`
- **Page Theme Lock:** Light theme (`color-scheme: light`) secara keseluruhan, dengan 2 blok kontras **Deep Navy** (`#beranda` Hero dan `#alur-pemesanan` contrast band) sebagai identitas arsitektural Seatpax.

## Color System (60–30–10) & Tokens

Seluruh warna dan font dideklarasikan melalui CSS custom properties pada `.passenger-shell.sp-landing` di `app/landing/landing.css` (tidak ada literal warna di luar blok token):

1. **60% — Pondasi Netral & Permukaan:**
   - Canvas halaman: `#f4f7fb` (`--lp-canvas`)
   - Permukaan kartu & panel: `#ffffff` (`--lp-surface`)
   - Ticket stub & tint lembut: `#f8fbff` (`--lp-stub`), `#edf4ff` (`--lp-tint`)
   - Teks utama: `#0a2144` (`--sp-ink`), teks sekunder: `#526078` (`--sp-muted`)
   - Garis & border: `#d5e2f2` (`--lp-border`), border kontrol: `#7d8fa8` (`--sp-control`)
2. **30% — Identitas Seatpax:**
   - Deep Navy surface: `#071936` (`--lp-navy-deep`), `#0a2144` (`--lp-navy`), `#0e2d5c` (`--lp-navy-soft`)
   - Seatpax Blue: `#005bd1` (`--sp-primary`), hover `#0049aa` (`--sp-hover`)
   - Dipakai untuk Hero, contrast band `#alur-pemesanan`, fokus input, jalur aktif `BookingRoute`, kursi terpilih, dan status interaktif.
3. **10% — Aksen Konversi:**
   - Burnt-Orange: `#bd4b12` (`--lp-accent`), hover `#9c3b0b` (`--lp-accent-hover`), kontras teks putih ≥ 4.5:1.
   - Dipakai secara disiplin untuk CTA utama konversi (`Cari perjalanan` pada `JourneyPlanner`, CTA utama `Buka pesanan saya` pada `#persiapan`, dan indikator aktif *traveller dot* pada `BookingRoute`).

## Hallmark Floor & Typography Discipline

- **Font:** `Plus Jakarta Sans` (`--font-passenger-jakarta`) untuk display & body, `Geist` (`--font-geist`) dengan `font-variant-numeric: tabular-nums` untuk jam, durasi, tarif, nomor kursi, dan *live readout* figur `/anatomy`.
- **Tanpa *tracked-uppercase eyebrow*:** Menghapus seluruh label kapital berjarak lebar (`SHUTTLE ANTARKOTA`, `PILIHAN DI TANGAN ANDA`, `DARI PESAN HINGGA BERANGKAT`) — mematuhi Hallmark Floor #9.
- **Tanpa italic/warna-belang di dalam heading:** Heading `#persiapan` menjadi roman seragam (`Sebelum berangkat, semua sudah siap.`) — mematuhi Hallmark Floor #3.
- **Performa & Aksesibilitas:**
  - `overflow-x: clip` pada wrapper landing (`html` dan `body` tidak boleh overflow horizontal).
  - Tidak ada `transition: all`; hanya menganimasikan `transform` dan `opacity`.
  - `:focus-visible` instan (`outline: 3px solid var(--sp-primary); outline-offset: 3px`) pada setiap kontrol interaktif.
  - Semua animasi (`BookingRoute`, `BookingMotion`, `/anatomy` figure, scroll-reveal) mematuhi `prefers-reduced-motion: reduce` dan konten tetap terbaca utuh tanpa JavaScript.
- **Aset Foto Lama Dihapus dari Halaman:** Tidak lagi merender `/landing/forest-road.jpg`, `/landing/morning-road.jpg`, maupun blok `.lp-photo-credits` Unsplash.

## Section-by-Section Architecture (7 Sections, Distinct Layout Families)

ID section (`beranda`, `pilihan-perjalanan`, `pilih-kursi`, `cara-memesan`, `persiapan`, `alur-pemesanan`, `bantuan`) dan atribut `data-landing-section` dipertahankan agar `SectionNavigation` tetap bekerja tanpa perubahan perilaku navigasi.

### 1. `#beranda` — Deep Navy Architectural Hero + Floating `JourneyPlanner`
- **Layout Family:** Full-width Deep Navy Hero block + overlapping white search card.
- **Hero:** Latar gradasi Deep Navy (`--lp-navy-deep` → `--lp-navy` → `--lp-navy-soft`) dengan pola titik koordinat halus dan lengkung lintasan rute SVG ringan (`aria-hidden="true"`, tanpa ilustrasi bus).
- **Copy:** Headline `<h1>` maksimal 2 baris (`Antarkota, lebih nyaman.`) + 1 kalimat intro (`Cari jadwal, pilih kursi, dan pesan perjalanan Anda bersama Seatpax.`).
- **Above-the-fold Gate:** Headline, intro, dan seluruh kartu `JourneyPlanner` (beserta tombol `Cari perjalanan` beraksen `--lp-accent`) terlihat utuh pada `1280×800` tanpa perlu scroll.
- **`JourneyPlanner` (`app/landing/search.tsx`):** Mempertahankan `action="/trips"`, field `from`, `to`, `date`, validasi asal≠tujuan, dan seluruh kontrak `tests/unit/landing-planner.test.ts`. Tombol swap asal–tujuan berotasi 180° saat diklik.

### 2. `#pilihan-perjalanan` — Boarding-Pass `FeaturedTrips`
- **Layout Family:** 3-column horizontal boarding-pass ticket grid (2-col tablet, 1-col mobile).
- **Kejujuran Data:** Tetap menyertakan catatan jujur `Contoh tampilan. Rute, jadwal, dan tarif di bawah belum bisa dipesan.` (tanpa klaim data live).
- **Visual:** Kartu direstyle menyerupai *boarding pass* `/trips` — bagian atas menampilkan asal → tujuan + timeline jam & durasi pill, dipisahkan garis putus-putus + *ticket notch* dari bagian bawah/stub berlatar `--lp-stub` yang menampilkan tarif `tabular-nums`.

### 3. `#pilih-kursi` — Open Side-by-Side Showcase + `BookingMotion kind="seat"` (Revisi `UI-LANDING-02`)
- **Layout Family:** Asymmetric open showcase (copy ringkas di kiri, *side-by-side* interaktif di kanan langsung di atas canvas `--lp-canvas`, **tanpa pembungkus card-in-card**).
- **Motion Upgrade (`motion/react`):**
  - **Denah 9 kursi (`01`–`09`, layout 2-1 dengan lorong) SELALU tampil** dan interaktif di sisi kiri komponen, dipasangkan langsung dengan **Kartu Tiket Digital (`BoardingPassCard`)** di sisi kanan (bertumpuk rapi di mobile) dan konektor visual di tengah.
  - Memilih kursi mana pun (`01`–`09`) menggerakkan highlight biru (`layoutId`) dengan spring physics (`type: 'spring', stiffness: 260, damping: 24`) dan langsung memperbarui nomor kursi + konfirmasi pada tiket di sebelahnya dengan transisi spring halus.
  - Saat masuk viewport (`useInView`) dan sebelum disentuh pengguna (serta `prefers-reduced-motion: reduce` nonaktif), kursi aktif bergilir secara tenang untuk menunjukkan keterkaitan langsung antara pilihan kursi dan tiket.
  - **Ticket Notch Bersih:** Potongan setengah lingkaran (*ticket notch*) pada `.lpm-ticket-shell` dan `.lp-pass-card` diklip dengan `overflow: hidden` sehingga membentuk coakan inward yang presisi tanpa lingkaran abu-abu menonjol di tepi kartu.

### 4. `#cara-memesan` — Full-Width Track Line Band (`BookingRoute` — KEPT)
- **Layout Family:** Full-width 4-step horizontal journey track (vertikal di tablet/mobile).
- **Track Line (`app/landing/booking-route.tsx`):** **Dipertahankan penuh** — SVG kurva Bézier dinamis dengan `ResizeObserver`, `IntersectionObserver`, mask reveal `.lp-route-reveal`, dan `.lp-route-traveller` via `offsetPath`.
- **Visual Polish:** Jalur dasar menggunakan `--lp-border`, garis aktif `--sp-primary`, dan titik *traveller* menggunakan `--lp-accent` (`#bd4b12`) berbingkai putih agar menonjol sebagai penanda progres perjalanan. Ikon langkah menyala biru solid dengan *ripple* saat dilewati.

### 5. `#persiapan` — Asymmetric Technical Panel + `/anatomy` Isometric Figure (`Fig 01` — Revisi `UI-LANDING-02`)
- **Layout Family:** Interactive 2-column technical showcase (kiri: 3 kontrol langkah + CTA; kanan: framed isometric instrument card).
- **Objek Fisik `/anatomy` (Ukuran: Figure, 50+ part solid, High-Contrast Light Theme):**
  - **Seatpax QR Boarding Gate & Smartphone (`Fig 01 · QR Boarding Gate`)** — menggantikan meja rel mekanik dengan objek perjalanan yang langsung terbaca dalam 1 detik:
    1. **Podium / Terminal Boarding Deep Navy** (`.iso-solid--navy` + aksen `.iso-solid--blue`): alas dasar berbevel dengan kaki karet & jalur 3 posisi langkah, tiang podium belakang dengan menara indikator status & lampu beacon (`lit` Burnt-Orange pada Step 2), serta dek pembaca QR rendah dengan jendela kaca optik biru muda (`.iso-solid--glass`).
    2. **Smartphone Penumpang dengan Layar QR Besar** (`.iso-solid--navy` rangka HP + `.iso-solid--screen` layar putih terang): menampilkan header biru Seatpax dan **matriks QR Code Navy kontras tinggi lengkap dengan 3 kotak finder sudut** agar langsung dikenali sebagai tiket QR digital.
  - **Model & Interaksi Terpadu:** Memilih salah satu dari 3 item panduan di kiri atau mengklik figur akan menggerakkan smartphone secara mulus (`requestAnimationFrame`) dari posisi bersiap (`Step 01 · SIAPKAN TIKET`), mendekat sejajar terminal (`Step 02 · CEK JADWAL`), hingga tepat melayang di atas kaca pemindai QR (`Step 03 · PINDAI QR`) dan menyalakan indikator status `lit`.
  - **Kepatuhan `/anatomy`:** Dibangun dengan `app/landing/iso/iso-kit.ts`, 4-tone shading per material (`.iso-solid--navy`, `.iso-solid--blue`, `.iso-solid--screen`, `.iso-solid--glass`), painter's order konstan tanpa clipping di seluruh lintasan gerak, garis kabel selalu berakhir pada dot/tepi (`lines.mjs` 0 error), berhenti saat offscreen, dan statis saat `prefers-reduced-motion: reduce`.

### 6. `#alur-pemesanan` — Deep Navy Contrast Band + `BookingMotion kind="deck"` (Upgraded)
- **Layout Family:** Full-bleed rounded Deep Navy contrast container (memecah ritme visual halaman terang) dengan deck 3 kartu di kiri & copy + kontrol langkah di kanan.
- **Motion Upgrade (`motion/react`):**
  - 3 kartu langkah (`01 Kursi` → `02 Pembayaran` → `03 Tiket`) tersusun dalam 3D spring deck dengan kedalaman, sudut, dan bayangan halus yang merespons transisi.
  - Berputar otomatis secara tenang saat di dalam viewport (`pause` saat offscreen / tab tidak aktif), dan pengguna dapat **mengklik kartu** atau **memilih pill langkah (1 / 2 / 3)** untuk melompat langsung dengan animasi spring yang responsif.
  - Under `prefers-reduced-motion: reduce`, ketiga kartu tampil sejajar rapi dalam grid 3 kolom statis.

### 7. `#bantuan` — 2-Column Editorial FAQ + Akses Pengaduan
- **Layout Family:** 2-column sticky-title + accordion list.
- Mempertahankan 4 pertanyaan FAQ dan 2 tautan layanan (`Buat pengaduan` → `/pengaduan/buat`, `Pengaduan saya` → `/pengaduan/cek#riwayat`) dengan tipografi bersih dan garis pemisah `--lp-border`.

## Scope & Constraints

- **In Scope:**
  - `package.json` & `package-lock.json` (menambahkan dependency `motion`).
  - `app/page.tsx`
  - `app/landing/landing.css`
  - `app/landing/search.tsx`
  - `app/landing/featured-trips.tsx`
  - `app/landing/booking-route.tsx` (hanya visual polish token/styling; logika track line dipertahankan)
  - `app/landing/booking-motion.tsx` & `app/landing/booking-motion.css` (upgrade ke `motion/react` + interaktivitas ringan; menghapus `app/landing/booking-motion-timeline.ts` yang digantikan `motion/react`)
  - `app/landing/preparation-showcase.tsx` (wrapper interaktif yang menghubungkan 3 item panduan `#persiapan` dengan figur `/anatomy`)
  - `app/landing/iso/iso-kit.ts`, `app/landing/iso/boarding-stand-geometry.ts`, `app/landing/iso/boarding-stand-figure.tsx`, `app/landing/iso/iso.css`
  - Unit tests di `tests/unit/landing-redesign.test.ts` (kontrak komponen baru) & pemeliharaan `tests/unit/landing-planner.test.ts`.
- **Out of Scope:**
  - Tidak mengubah query Supabase/inventory (`src/modules/inventory`), server actions, parameter URL `/trips`, halaman `/trips`, `/tickets`, `/pengaduan`, maupun `PassengerShell` global untuk halaman non-landing.
- **Verification:**
  - `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, dan `npm.cmd run build` lulus tanpa error.
  - Pemeriksaan visual desktop (`1280×800`, `1440×900`) dan mobile (`390×844`): tanpa horizontal overflow, hero + planner *above the fold*, `BookingRoute` track line aktif, `BookingMotion` interaktif, dan figur `/anatomy` tajam di 1× maupun close-up.
