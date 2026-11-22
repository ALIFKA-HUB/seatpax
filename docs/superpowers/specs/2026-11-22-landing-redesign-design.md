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

### 3. `#pilih-kursi` — Elevated Stage Showcase + `BookingMotion kind="seat"` (Upgraded)
- **Layout Family:** Asymmetric stage (copy ringkas di kiri, panggung interaktif lebar berbingkai terang di kanan).
- **Motion Upgrade (`motion/react`):**
  - Mengganti keyframe WAAPI 361-sample dengan komponen `motion/react` berbasis **spring physics** (`type: "spring", stiffness: 260, damping: 24`).
  - Menampilkan denah kabin 9 kursi (`01`–`09`, layout 2-1 dengan lorong) yang **auto-play** saat masuk viewport (`useInView`): memilih kursi `03`, lalu melakukan transisi *morph* mulus menjadi kartu *boarding pass* Seatpax dengan nomor kursi besar, cap konfirmasi, dan stub QR.
  - **Interaktivitas Ringan:** Pengguna dapat **mengklik kursi mana pun (`01`–`09`)** untuk memicu ulang animasi morph dengan nomor kursi pilihan tersebut, atau menekan tombol `Pilih ulang` untuk kembali ke denah kursi.
  - **Reduced Motion / No-JS:** Menampilkan denah kursi + kartu tiket hasil konfirmasi secara statis berdampingan/tersusun rapi.

### 4. `#cara-memesan` — Full-Width Track Line Band (`BookingRoute` — KEPT)
- **Layout Family:** Full-width 4-step horizontal journey track (vertikal di tablet/mobile).
- **Track Line (`app/landing/booking-route.tsx`):** **Dipertahankan penuh** — SVG kurva Bézier dinamis dengan `ResizeObserver`, `IntersectionObserver`, mask reveal `.lp-route-reveal`, dan `.lp-route-traveller` via `offsetPath`.
- **Visual Polish:** Jalur dasar menggunakan `--lp-border`, garis aktif `--sp-primary`, dan titik *traveller* menggunakan `--lp-accent` (`#bd4b12`) berbingkai putih agar menonjol sebagai penanda progres perjalanan. Ikon langkah menyala biru solid dengan *ripple* saat dilewati.

### 5. `#persiapan` — Asymmetric Technical Panel + `/anatomy` Isometric Figure (`Fig 01`)
- **Layout Family:** Interactive 2-column technical showcase (kiri: 3 kontrol panduan + CTA; kanan: framed isometric instrument card).
- **Objek Fisik `/anatomy` (Ukuran: Figure, 45–65 part solid, Light Theme):**
  - **Seatpax Boarding & QR Verification Stand (`Fig 01 · Boarding Stand`)** — instrumen fisik di atas meja: alas berbevel dengan 4 kaki karet & sekrup sudut, rel penggaris bertick (`ruler strip`), jembatan pemindai QR optik dengan celah lensa & indikator LED (`lit` accent), serta kartu *boarding pass* fisik di atas *carriage* yang meluncur masuk ke area pindai.
  - **Model & Interaksi Terpadu:** Memilih salah satu dari 3 item panduan di kiri (`Tahu harus naik di mana` / `Waktunya sudah sesuai` / `Tiket tinggal ditunjukkan`) atau mengklik/hover pada kartu figur akan menggerakkan *carriage* & menyorot bagian mekanisme yang relevan dengan easing tenang (`follow`/spring), serta memperbarui *live readout* monospace di pojok kanan bawah kartu (`STEP 01 · TITIK NAIK`, `STEP 02 · 08:00 WIB`, `STEP 03 · QR SIAP`).
  - **Kepatuhan `/anatomy`:** Dibangun dengan kit isometrik murni (`app/landing/iso/iso-kit.ts` + `boarding-stand-geometry.ts` + `"use client"` leaf `boarding-stand-figure.tsx`), 4-tone shading, painter's order benar, tidak ada garis menggantung (*line ends resolve*), berhenti animasi saat offscreen, dan diam saat `prefers-reduced-motion: reduce`.

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
