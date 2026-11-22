# UI-LANDING-01: Redesign Visual, Motion & `/anatomy` Halaman Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan redesign halaman landing Seatpax (`/`) yang selaras dengan sistem warna 60–30–10 `/trips`, mempertahankan penuh animasi track line `BookingRoute`, meng-upgrade `BookingMotion` ke fisika spring `motion/react` dengan interaktivitas ringan, dan mengganti foto statis `#persiapan` dengan satu figur SVG isometrik `/anatomy` tema terang (`Boarding & QR Verification Stand`).

**Architecture:** Seluruh token warna/permukaan di-scope pada `.passenger-shell.sp-landing` di `app/landing/landing.css`. Komponen server (`app/page.tsx`, `JourneyPlanner`, `FeaturedTrips`) menjaga payload awal tetap ringan dan mempertahankan kontrak data `/trips`. Seluruh interaktivitas motion (`BookingMotion`, `PreparationShowcase`, `BoardingStandFigure`, `BookingRoute`, `LandingSearch`) diisolasi sebagai leaf `"use client"` dengan fallback `prefers-reduced-motion: reduce`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Vanilla Scoped CSS, `motion` (`motion/react`), `@phosphor-icons/react`, `/anatomy` isometric SVG kit (`app/landing/iso/`), Vitest.

## Task Approval, Scope & Dependencies

- **Task ID:** `UI-LANDING-01`
- **Status:** Menunggu persetujuan eksplisit untuk mulai implementasi (design spec disetujui pada 2026-11-22).
- **Depends on:** Spec [2026-11-22-landing-redesign-design.md](../specs/2026-11-22-landing-redesign-design.md) dan referensi warna `UI-TRIPS-01` ([2026-11-16-trips-discovery-visual-design.md](../specs/2026-11-16-trips-discovery-visual-design.md)).
- **In Scope:** `package.json`, `app/page.tsx`, `app/landing/*`, `app/landing/iso/*`, `tests/unit/landing-redesign.test.ts`, serta pembaruan ringkas di `docs/seatpax/00_INDEX.md` & `docs/seatpax/13_UI_UX_DESIGN.md` setelah verifikasi lulus.
- **Out of Scope:** `src/modules/inventory/*`, halaman `/trips`, `/tickets`, `/pengaduan`, panel internal, serta kontrak `tests/unit/landing-planner.test.ts` (harus tetap lulus tanpa modifikasi kontrak).
- **Checkable Completion Criteria:**
  1. `motion` terpasang di `package.json` dan diimpor dari `motion/react`.
  2. Hero `#beranda` menggunakan blok Deep Navy arsitektural (tanpa `forest-road.jpg` & tanpa *tracked-uppercase eyebrow*) dengan `JourneyPlanner` putih mengambang dan tombol `Cari perjalanan` beraksen `#bd4b12`, terlihat utuh *above the fold* pada `1280×800`.
  3. `FeaturedTrips` (`#pilihan-perjalanan`) merender kartu bergaya *boarding-pass* dengan catatan jujur contoh tampilan.
  4. `BookingRoute` (`#cara-memesan`) **tetap mempertahankan animasi SVG Bézier track line + traveller dot + icon arrival** dengan palet 60–30–10.
  5. `BookingMotion` (`#pilih-kursi` & `#alur-pemesanan`) memakai `motion/react` spring physics: `kind="seat"` mendukung klik kursi `01`–`09` + auto-play morph ke tiket; `kind="deck"` berada di dalam Deep Navy contrast band dengan klik kartu + pill langkah interaktif.
  6. `#persiapan` merender figur SVG isometrik `/anatomy` tema terang (`Fig 01 · Boarding Stand`, 45–65 part solid, *live readout*) yang sinkron dengan 3 item panduan persiapan (tanpa `morning-road.jpg` dan tanpa `<em>` di heading).
  7. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, dan `npm.cmd run build` semuanya lulus (exit code 0), tanpa horizontal overflow di desktop (`1280×800`) maupun mobile (`390×844`).

## Global Constraints

- Semua warna dan font landing dideklarasikan melalui CSS custom properties di `.passenger-shell.sp-landing` (`app/landing/landing.css`).
- Dilarang memakai `transition: all`; hanya animasikan `transform` dan `opacity`.
- `overflow-x: clip` pada container landing; dilarang memakai `100vw`.
- Dilarang memakai *tracked-uppercase eyebrow* di atas heading (Hallmark Floor #9) dan dilarang memakai `<em>` italic di dalam heading roman (Hallmark Floor #3).
- Semua animasi wajib menghormati `prefers-reduced-motion: reduce` dan konten tetap terbaca tanpa JavaScript.

---

### Task 1: Install Dependency `motion` & Siapkan Unit Test Kontrak Redesign (`tests/unit/landing-redesign.test.ts`)

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `tests/unit/landing-redesign.test.ts`

**Interfaces:**
- Consumes: `FeaturedTrips` (`@/app/landing/featured-trips`), `LandingSearch` (`@/app/landing/search`), `BookingRoute` (`@/app/landing/booking-route`), `BookingMotion` (`@/app/landing/booking-motion`), `PreparationShowcase` (`@/app/landing/preparation-showcase`), `buildBoardingStandGeometry` (`@/app/landing/iso/boarding-stand-geometry`)

- [ ] **Step 1: Install paket `motion`**

Run: `npm.cmd install motion`
Expected: `motion` tercatat di `dependencies` pada `package.json` dan `npm.cmd run typecheck` masih bersih.

- [ ] **Step 2: Buat unit test kontrak visual & struktur redesign**

Create `tests/unit/landing-redesign.test.ts`:

```ts
import {createElement as h} from 'react';
import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup as render} from 'react-dom/server';
import FeaturedTrips from '@/app/landing/featured-trips';
import LandingSearch from '@/app/landing/search';
import BookingRoute from '@/app/landing/booking-route';
import BookingMotion from '@/app/landing/booking-motion';
import PreparationShowcase from '@/app/landing/preparation-showcase';
import {buildBoardingStandGeometry} from '@/app/landing/iso/boarding-stand-geometry';

describe('UI-LANDING-01 contracts', () => {
  it('renders orange accent submit CTA and swap button in LandingSearch', () => {
    const html = render(h(LandingSearch, {
      locations: [{id: 'a', name: 'Pool Pasteur', city: 'Bandung'}],
      date: '2026-11-22',
    }));
    expect(html).toContain('lp-cta-accent');
    expect(html).toContain('Cari perjalanan');
    expect(html).toContain('lp-swap');
  });

  it('renders boarding-pass demo cards with honest disclaimer in FeaturedTrips', () => {
    const html = render(h(FeaturedTrips));
    expect(html).toContain('lp-pass-card');
    expect(html).toContain('lp-pass-stub');
    expect(html).toContain('Contoh tampilan');
    expect(html).toContain('Cianjur');
  });

  it('preserves SVG track line structure in BookingRoute', () => {
    const html = render(h(BookingRoute, null, h('ol', {className: 'lp-booking-flow'}, h('li', null, 'Step 1'))));
    expect(html).toContain('lp-route-lines');
    expect(html).toContain('lp-route-track');
    expect(html).toContain('lp-route-trace');
    expect(html).toContain('lp-route-reveal');
    expect(html).toContain('lp-route-traveller');
  });

  it('renders interactive seat grid (01-09) in BookingMotion seat mode and 3-step controls in deck mode', () => {
    const seatHtml = render(h(BookingMotion, {kind: 'seat'}));
    expect(seatHtml).toContain('03');
    expect(seatHtml).toContain('09');
    expect(seatHtml).toContain('lpm-seat-btn');

    const deckHtml = render(h(BookingMotion, {kind: 'deck'}));
    expect(deckHtml).toContain('Kursi');
    expect(deckHtml).toContain('Pembayaran');
    expect(deckHtml).toContain('Tiket');
    expect(deckHtml).toContain('lpm-step-tabs');
  });

  it('builds a dense isometric Boarding Stand geometry (45+ parts) and renders Fig 01 in PreparationShowcase', () => {
    const geo = buildBoardingStandGeometry();
    expect(geo.partCount).toBeGreaterThanOrEqual(45);
    expect(geo.staticSolids.length).toBeGreaterThan(25);

    const html = render(h(PreparationShowcase));
    expect(html).toContain('Fig 01');
    expect(html).toContain('Boarding Stand');
    expect(html).toContain('Tahu harus naik di mana');
    expect(html).toContain('Waktunya sudah sesuai');
    expect(html).toContain('Tiket tinggal ditunjukkan');
  });
});
```

- [ ] **Step 3: Jalankan test untuk memverifikasi kegagalan awal (TDD red)**

Run: `npx vitest run tests/unit/landing-redesign.test.ts`
Expected: FAIL karena `PreparationShowcase`, `boarding-stand-geometry`, `lp-cta-accent`, `lp-pass-card`, dan `lpm-seat-btn` belum diimplementasikan.

- [ ] **Step 4: Commit setup dependency & test scaffold**

```bash
git add package.json package-lock.json tests/unit/landing-redesign.test.ts
git commit -m "chore(landing): add motion dependency and UI-LANDING-01 contract tests"
```

---

### Task 2: Bangun Figur Isometrik `/anatomy` — `Boarding & QR Verification Stand` (`app/landing/iso/*`)

**Files:**
- Create: `app/landing/iso/iso-kit.ts` (subset minimal dari `C:\Users\ASUS\.gemini\config\skills\anatomy\kit\iso-kit.ts`: proyeksi isometrik `fitProjection`, `slabOf`, `extrude`, `cylinder`, `topTicks`, `dots`, `wire`, tipe solid & helper SVG)
- Create: `app/landing/iso/boarding-stand-geometry.ts` (model & geometri murni: ≥ 50 solid part dalam 4 grup — *base* dengan kaki karet/bevel/sekrup/label plate/ruler strip, *structure* rel pemandu & jembatan pemindai QR, *mechanism* lensa optik/LED indikator/spring stops, dan *carriage* bergerak yang membawa kartu *boarding pass* Seatpax + QR grid)
- Create: `app/landing/iso/boarding-stand-figure.tsx` (`"use client"` leaf component yang merender SVG statis + grup bergerak `carriage` dengan `requestAnimationFrame` exponential follow / spring halus, responsif terhadap prop `activeStep: 0 | 1 | 2`, pointer hover, keyboard `←/→`, berhenti saat offscreen, dan diam saat `prefers-reduced-motion: reduce`)
- Create: `app/landing/iso/iso.css` (token warna tema terang selaras Seatpax `--lp-surface`, `--sp-ink`, `--sp-primary`, `--lp-accent`, dan layout bingkai `Fig 01`)

**Interfaces:**
- Produces:
  - `export type PrepStepIndex = 0 | 1 | 2;`
  - `export function buildBoardingStandGeometry(): { viewBox: string; partCount: number; staticSolids: IsoSolid[]; staticLines: IsoLine[]; staticDots: IsoDot[]; carriageSolids: IsoSolid[]; carriageTravel: { dx: number; dy: number }; }`
  - `export default function BoardingStandFigure({ activeStep, onSelectStep }: { activeStep: PrepStepIndex; onSelectStep?: (step: PrepStepIndex) => void }): JSX.Element`

- [ ] **Step 1: Salin/adaptasi core kit isometrik ke `app/landing/iso/iso-kit.ts` dan `app/landing/iso/iso.css`**

Gunakan `C:\Users\ASUS\.gemini\config\skills\anatomy\kit\iso-kit.ts` sebagai referensi sumber (proyeksi azimuth 42°, elevation 30°, 4-tone shading `lo`/`mid`/`hi`/`lit`, painter's order back-to-front). Sesuaikan `iso.css` untuk tema terang (`data-theme="light"`) menggunakan token Seatpax (`#ffffff`, `#f4f7fb`, `#0a2144`, `#005bd1`, `#bd4b12`) tanpa warna literal di luar blok token.

- [ ] **Step 2: Implementasikan geometri `app/landing/iso/boarding-stand-geometry.ts`**

Rancang minimal 50 solid part nyata yang saling bertumpu (tanpa kotak melayang atau garis menggantung):
1. **Base (16+ parts):** pelat dasar berbevel, 4 kaki karet sudut, alur pemandu (*guide groove*), 4 sekrup sudut dengan ring, pelat label bertiga garis (*label plate*), strip penggaris dengan 16 tick minor/major.
2. **Structure (14+ parts):** 2 rel baja paralel dengan *end-stops* depan/belakang, 2 tiang penyangga jembatan pemindai, balok atas *scanner bridge* berbevel, slot lubang baca kartu.
3. **Optical QR Mechanism (12+ parts):** rumah lensa menghadap bawah, cincin optik, kaca pemindai miring, indikator status LED (`lit` accent saat step 2 aktif), konektor kabel belakang dengan terminal dot.
4. **Moving Carriage & Boarding Pass (12+ parts):** dudukan *carriage* di atas 4 *bushing*, penjepit kartu, badan kartu *boarding pass* Seatpax dengan *notch* perforasi dan pola modul QR geometris.

- [ ] **Step 3: Implementasikan `"use client"` komponen `app/landing/iso/boarding-stand-figure.tsx`**

- Menerima `activeStep: 0 | 1 | 2` dan `onSelectStep?: (step: 0 | 1 | 2) => void`.
- Posisi target *carriage* per step:
  - Step `0` (`TITIK NAIK · BANDUNG → BOGOR`): posisi awal di sisi kiri rel (`t = 0.08`).
  - Step `1` (`JADWAL · 08:00 WIB`): posisi tengah sejajar tick penggaris (`t = 0.48`).
  - Step `2` (`QR SCAN · SIAP BOARDING`): masuk tepat di bawah jembatan pemindai (`t = 0.92`, LED indikator menyala `lit`).
- Menggerakkan `<g ref={carriageRef}>` secara langsung via `transform` (tanpa React re-render per frame), berhenti saat offscreen (`IntersectionObserver`), dan langsung melompat tanpa transisi saat `prefers-reduced-motion: reduce`.
- Bingkai kartu menampilkan `Fig 01` (kiri atas), `Boarding Stand` (kanan atas), petunjuk singkat `Pilih langkah atau klik figur` (kiri bawah), dan *live readout* `tabular-nums` (kanan bawah).

- [ ] **Step 4: Jalankan test geometri & typecheck**

Run: `npx vitest run tests/unit/landing-redesign.test.ts -t "Boarding Stand"` & `npm.cmd run typecheck`
Expected: Test geometri PASS (`partCount >= 45`), typecheck exit 0.

- [ ] **Step 5: Commit modul `/anatomy` Boarding Stand**

```bash
git add app/landing/iso/
git commit -m "feat(landing): add light-theme isometric Boarding Stand anatomy figure"
```

---

### Task 3: Buat `PreparationShowcase` (`app/landing/preparation-showcase.tsx`)

**Files:**
- Create: `app/landing/preparation-showcase.tsx`

**Interfaces:**
- Consumes: `BoardingStandFigure`, `PrepStepIndex` from `./iso/boarding-stand-figure`
- Produces: `export default function PreparationShowcase(): JSX.Element`

- [ ] **Step 1: Implementasikan `app/landing/preparation-showcase.tsx` (`"use client"`)**

Menghubungkan 3 item panduan persiapan (`Tahu harus naik di mana`, `Waktunya sudah sesuai`, `Tiket tinggal ditunjukkan`) dengan state `activeStep: PrepStepIndex` (default `0`):
- Heading `<h2>` bersih tanpa `<em>`: `Sebelum berangkat, semua sudah siap.`
- 3 tombol/accordion aksesibel (`aria-expanded`, `aria-controls`) dengan ikon `@phosphor-icons/react` (`MapPin`, `Clock`, `Ticket`) yang mengubah `activeStep` saat diklik atau dipilih dengan keyboard.
- CTA `Buka pesanan saya` (`/tickets`) dengan kelas `.lp-button.lp-cta-accent`.
- Sisi kanan merender `<BoardingStandFigure activeStep={activeStep} onSelectStep={setActiveStep} />`.

- [ ] **Step 2: Verifikasi test `PreparationShowcase`**

Run: `npx vitest run tests/unit/landing-redesign.test.ts -t "PreparationShowcase"`
Expected: PASS.

- [ ] **Step 3: Commit `PreparationShowcase`**

```bash
git add app/landing/preparation-showcase.tsx
git commit -m "feat(landing): connect preparation guide steps to isometric Boarding Stand"
```

---

### Task 4: Upgrade `BookingMotion` ke `motion/react` Spring Physics (`app/landing/booking-motion.tsx` & `booking-motion.css`)

**Files:**
- Modify: `app/landing/booking-motion.tsx`
- Modify: `app/landing/booking-motion.css`
- Delete: `app/landing/booking-motion-timeline.ts` (digantikan deklaratif `motion/react` + state machine ringkas)

**Interfaces:**
- Preserves: `export default function BookingMotion({ kind }: { kind: 'seat' | 'deck' }): JSX.Element`

- [ ] **Step 1: Tulis ulang `app/landing/booking-motion.tsx` memakai `motion/react`**

- Import `{ AnimatePresence, motion, useInView, useReducedMotion }` from `'motion/react'`.
- **Mode `kind="seat"`:**
  - State `selectedSeat: string` (default `'03'`) dan `phase: 'select' | 'ticket'` (auto-play saat `isInView && !shouldReduceMotion`: tampilkan denah 9 kursi `01`–`09` → sorot kursi `selectedSeat` → morph dengan `layoutId="seat-chip"` & spring `{ type: 'spring', stiffness: 260, damping: 24 }` menjadi kartu *boarding pass* Seatpax bergaya `/trips` dengan *ticket notch*, nomor kursi besar, cap konfirmasi, dan stub QR).
  - Setiap kursi di denah adalah `<button type="button" className="lpm-seat-btn">` sehingga pengguna bisa **klik kursi `01`–`09`** kapan saja untuk memicu morph ke tiket dengan nomor kursi tersebut, serta tombol ringkas `Pilih kursi lain` di fase tiket.
  - Saat `shouldReduceMotion` aktif, tampilkan denah kursi dan tiket hasil konfirmasi secara statis berdampingan/tersusun rapi.
- **Mode `kind="deck"`:**
  - State `activeIndex: 0 | 1 | 2` (`0: Kursi`, `1: Pembayaran`, `2: Tiket`), auto-advance setiap 3.6 detik saat `isInView && !paused && !shouldReduceMotion`.
  - 3 kartu dirender dengan `<motion.div animate={...} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>` membentuk tumpukan 3D bertingkat (`x`, `y`, `scale`, `rotate`, `zIndex`) di atas latar Deep Navy.
  - Sediakan `.lpm-step-tabs` (3 tombol pill `01 Kursi`, `02 Pembayaran`, `03 Tiket` dengan `aria-pressed`) dan klik langsung pada kartu untuk berpindah langkah seketika.
  - Saat `shouldReduceMotion` aktif, 3 kartu tampil sejajar statis.

- [ ] **Step 2: Perbarui `app/landing/booking-motion.css` dan hapus `app/landing/booking-motion-timeline.ts`**

- Pastikan seluruh warna memakai CSS custom properties (`--sp-primary`, `--lp-accent`, `--lp-border`, `--lp-stub`, `--lp-navy`), *ticket notch* konsisten dengan `/trips`, `:focus-visible` instan pada `.lpm-seat-btn` dan `.lpm-step-tabs button`, serta layout aman pada viewport `390px` (tanpa overflow).
- Hapus `app/landing/booking-motion-timeline.ts`.

- [ ] **Step 3: Verifikasi test `BookingMotion` & typecheck**

Run: `npx vitest run tests/unit/landing-redesign.test.ts -t "BookingMotion"` & `npm.cmd run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit upgrade `BookingMotion`**

```bash
git add app/landing/booking-motion.tsx app/landing/booking-motion.css
git rm app/landing/booking-motion-timeline.ts
git commit -m "feat(landing): upgrade BookingMotion to interactive motion/react spring physics"
```

---

### Task 5: Perbarui `LandingSearch`, `FeaturedTrips`, dan Visual Polish `BookingRoute`

**Files:**
- Modify: `app/landing/search.tsx`
- Modify: `app/landing/featured-trips.tsx`
- Modify: `app/landing/booking-route.tsx` (hanya pastikan tidak ada regresi struktur; seluruh perubahan visual track line cukup di CSS)

**Interfaces:**
- Preserves: `LandingSearch({ locations, date })` (tetap `action="/trips"`, `from`, `to`, `date`, validasi sama)
- Preserves: `FeaturedTrips()`
- Preserves: `BookingRoute({ children })`

- [ ] **Step 1: Perbarui `app/landing/search.tsx`**

- Tambah state `const [swapped, setSwapped] = useState(false);`.
- Tombol swap: `className={`lp-swap${swapped ? ' is-rotated' : ''}`}` dan toggle `setSwapped(v => !v)` saat diklik.
- Tombol submit: `className="lp-button lp-cta-accent"`.

- [ ] **Step 2: Perbarui `app/landing/featured-trips.tsx` ke gaya Boarding Pass**

- Tetap pertahankan 3 item `demoTrips` dan catatan jujur `Contoh tampilan. Rute, jadwal, dan tarif di bawah belum bisa dipesan.`.
- Restyle markup kartu dengan `.lp-pass-card` (bagian utama rute + timeline dot-to-arrow + durasi pill) dan `.lp-pass-stub` (area tarif `tabular-nums` dipisahkan garis putus-putus + *ticket notch*).

- [ ] **Step 3: Verifikasi test `landing-planner.test.ts` dan `landing-redesign.test.ts`**

Run: `npx vitest run tests/unit/landing-planner.test.ts tests/unit/landing-redesign.test.ts`
Expected: PASS semua test!

- [ ] **Step 4: Commit `LandingSearch` & `FeaturedTrips`**

```bash
git add app/landing/search.tsx app/landing/featured-trips.tsx
git commit -m "style(landing): align search CTA accent and boarding-pass featured cards"
```

---

### Task 6: Rakit Halaman `app/page.tsx` & Terapkan Sistem CSS 60–30–10 (`app/landing/landing.css`)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/landing/landing.css`

**Interfaces:**
- Preserves: Semua section ID (`beranda`, `pilihan-perjalanan`, `pilih-kursi`, `cara-memesan`, `persiapan`, `alur-pemesanan`, `bantuan`) dan atribut `data-landing-section` untuk `SectionNavigation`.

- [ ] **Step 1: Perbarui `app/page.tsx`**

1. **Hero (`#beranda`):** Hapus `<Image src="/landing/forest-road.jpg" .../>` dan `<p className="lp-eyebrow">SHUTTLE ANTARKOTA</p>`. Tambahkan elemen dekoratif SVG lengkung rute tipis (`className="lp-hero-arc"`, `aria-hidden="true"`, tanpa bus) di dalam `<section className="lp-hero">`. Pertahankan `JourneyPlanner` mengambang di `.lp-hero-planner`.
2. **`#pilih-kursi`:** Hapus `<p className="lp-feature-eyebrow">PILIHAN DI TANGAN ANDA</p>`, bungkus dalam layout stage asimetris.
3. **`#cara-memesan`:** Pertahankan `<BookingRoute>` dan 4 langkah `bookingFlow` utuh.
4. **`#persiapan`:** Ganti seluruh markup lama (beserta `morning-road.jpg`) dengan `<PreparationShowcase />`.
5. **`#alur-pemesanan`:** Hapus `<p className="lp-feature-eyebrow">DARI PESAN HINGGA BERANGKAT</p>`, bungkus dengan kelas `.lp-checkout-band` (Deep Navy contrast container).
6. **`#bantuan`:** Pertahankan 4 FAQ dan 2 tautan pengaduan.
7. Hapus blok `.lp-photo-credits` Unsplash karena tidak ada lagi foto Unsplash yang dipakai di landing.

- [ ] **Step 2: Perbarui `app/landing/landing.css` dengan sistem 60–30–10 & Hallmark Floor**

- Deklarasikan blok token lengkap di `.passenger-shell.sp-landing`:
  `--lp-canvas: #f4f7fb; --lp-surface: #ffffff; --lp-stub: #f8fbff; --lp-tint: #edf4ff; --lp-border: #d5e2f2; --lp-navy-deep: #071936; --lp-navy: #0a2144; --lp-navy-soft: #0e2d5c; --lp-accent: #bd4b12; --lp-accent-hover: #9c3b0b;`
- Pastikan `html:has(.sp-landing), body:has(.sp-landing) { overflow-x: clip; }`.
- Atur `.lp-hero` Deep Navy dengan tinggi proporsional agar headline + intro + floating `JourneyPlanner` muat penuh di `1280×800` tanpa scroll.
- Pertahankan seluruh aturan animasi `@keyframes lp-route-*` untuk `BookingRoute`, dengan warna `.lp-route-track` (`var(--lp-border)`), `.lp-route-trace` (`var(--sp-primary)`), dan `.lp-route-traveller` (`var(--lp-accent)` dengan border putih `3px`).
- Style `.lp-pass-card` / `.lp-pass-stub` (ticket notches), `.lp-seat-stage`, `.lp-checkout-band` (Deep Navy container dengan teks terang kontras tinggi), dan responsive breakpoints (`1024px`, `768px`, `639px`).
- Audit CSS: pastikan **nol** `transition: all`, **nol** animasi `width`/`height`/`top`/`left`, dan setiap kontrol memiliki `:focus-visible`.

- [ ] **Step 3: Jalankan seluruh test unit & typecheck**

Run: `npm.cmd run typecheck` & `npx vitest run tests/unit/landing-planner.test.ts tests/unit/landing-redesign.test.ts`
Expected: PASS tanpa error.

- [ ] **Step 4: Commit `app/page.tsx` dan `app/landing/landing.css`**

```bash
git add app/page.tsx app/landing/landing.css
git commit -m "feat(landing): assemble 60-30-10 landing redesign with preserved track line"
```

---

### Task 7: Verifikasi Menyeluruh, Audit Visual Browser & Sinkronisasi Dokumentasi

**Files:**
- Modify: `docs/seatpax/00_INDEX.md` (catat ringkasan `UI-LANDING-01` setelah verifikasi lulus)
- Modify: `docs/seatpax/13_UI_UX_DESIGN.md` (catat arah visual landing terbaru setelah verifikasi lulus)

- [ ] **Step 1: Jalankan seluruh automated checks**

Run:
1. `npm.cmd run typecheck`
2. `npm.cmd run lint`
3. `npm.cmd test`
4. `npm.cmd run build`

Expected: Semua command exit code 0 tanpa error.

- [ ] **Step 2: Verifikasi visual & interaktif di browser lokal (desktop & mobile)**

Buka `/` pada server dev lokal dan periksa:
- **Desktop `1280×800`:** Hero Deep Navy + floating `JourneyPlanner` terlihat penuh *above the fold*; `scrollWidth <= clientWidth`.
- **Track line (`#cara-memesan`):** Animasi garis putus-putus SVG + titik oranye *traveller* + ripple ikon berjalan mulus saat di-scroll masuk.
- **Motion (`#pilih-kursi` & `#alur-pemesanan`):** Klik kursi berbeda (`01`–`09`) memicu morph spring ke nomor kursi yang sesuai; deck 3 kartu di band Deep Navy merespons klik kartu & pill langkah.
- **`/anatomy` (`#persiapan`):** Klik 3 item panduan menggerakkan *carriage* Boarding Stand & memperbarui readout `Fig 01`; tidak ada garis menggantung atau teks terpotong.
- **Mobile `390×844`:** Semua section bertumpuk rapi, tidak ada horizontal overflow, dan `BookingRoute` beralih ke kurva vertikal.
- **Reduced Motion (`prefers-reduced-motion: reduce`):** Semua konten dan figur tampil lengkap dalam posisi statis yang rapi.

- [ ] **Step 3: Perbarui dokumentasi & commit final**

Setelah semua check & verifikasi visual lulus, perbarui ringkasan `UI-LANDING-01` di `docs/seatpax/00_INDEX.md` dan `docs/seatpax/13_UI_UX_DESIGN.md`, lalu commit.
