# UI-TRIPS-01: Redesign Visual Halaman `/trips` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan redesign visual `/trips` (Compact Deep Navy Hero + Floating Search Card + 60–30–10 Burnt-Orange CTA + Ticket-Stub Trip Cards + Segmented Sort & Toggle-Chip Filter) sesuai preview yang sudah di-ACC tanpa mengubah kontrak data maupun alur pencarian.

**Architecture:** Seluruh token warna/radius/permukaan diletakkan secara ter-scope pada `.passenger-shell` di `app/trips/trips.css`. Komponen `TripsPage`, `SearchForm`, `TripDiscovery`, dan `TripCard` mempertahankan seluruh props, URL search params (`from`, `to`, `date`), serta kontrak render yang diuji di `tests/unit/passenger-discovery.test.ts`, sembari memperkaya struktur visual (hero arc, 2-line date chips, segmented sort buttons, filter chip toggles, dan ticket stub).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vanilla Scoped CSS (`app/trips/trips.css`), `@phosphor-icons/react`, Vitest.

## Task Approval & Dependencies

- **Task ID:** `UI-TRIPS-01`
- **Depends on:** Preview `trips-redesign-preview.html` (ACC pada 2026-11-16) dan spec [2026-11-16-trips-discovery-visual-design.md](../specs/2026-11-16-trips-discovery-visual-design.md).
- **Completion Criteria:**
  1. `app/trips/page.tsx` merender `.tp-hero-block` dengan hero Deep Navy ringkas (tanpa ilustrasi bus) dan `SearchForm` mengambang di bawahnya.
  2. `SearchForm` mendukung rotasi tombol swap dan tombol submit memakai aksen oranye `--tp-accent` (`#bd4b12`).
  3. `TripCard` menampilkan timeline origin-dot → durasi → tujuan, ticket-stub kanan dengan CTA oranye `Pilih kursi`, menghapus duplikasi rute di `.tp-card-meta`, dan tetap lulus kontrak `Waktu tiba belum tersedia` + link `/trips/[id]?from=...&to=...`.
  4. `TripDiscovery` menampilkan chip tanggal 2-baris, tombol urutkan segmented (`Berangkat awal` | `Harga terendah`), filter chip kelas & preset harga di dialog, serta state kosong yang rapi.
  5. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, dan `npm.cmd run build` semuanya lulus.

---

### Task 1: Tambah Unit Test Kontrak Visual Baru di `tests/unit/passenger-discovery.test.ts`

**Files:**
- Modify: `tests/unit/passenger-discovery.test.ts:1-26`

**Interfaces:**
- Consumes: `TripCard` from `@/app/components/trip-card`, `TripDiscovery` from `@/app/trips/components/trip-discovery`, `SearchForm` from `@/app/trips/components/search-form`

- [ ] **Step 1: Tambahkan test untuk struktur visual baru tanpa merusak test yang ada**

Edit `tests/unit/passenger-discovery.test.ts` dengan menambahkan import `SearchForm` dan tiga test baru di bagian akhir file:

```ts
import SearchForm from '@/app/trips/components/search-form';

it('renders ticket-stub trip card without duplicated route text in footer meta',()=>{
 const withArrival:SearchResult={...base,arrivalAt:'2026-10-20T03:30:00Z'};
 const html=render(h(TripCard,{trip:withArrival}));
 expect(html).toContain('tp-card-purchase');
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('tp-duration-pill');
 expect(html).toContain('2j 30m');
 expect(html).not.toContain('Bandung → Bogor');
});

it('renders two-line date chips and segmented sort controls in discovery toolbar',()=>{
 const html=render(h(TripDiscovery,{trips,fallbackTrips:[],locations:[],quickDates:[{dateWib:'2026-10-20',label:'Sel, 20 Okt'}],candidateLimitReached:false,dateWib:'2026-10-20',hasExplicitDate:false}));
 expect(html).toContain('tp-date-day');
 expect(html).toContain('Sel');
 expect(html).toContain('20 Okt');
 expect(html).toContain('tp-segmented');
 expect(html).toContain('Berangkat awal');
 expect(html).toContain('Harga terendah');
});

it('renders orange accent submit button in search form',()=>{
 const html=render(h(SearchForm,{locations:[{id:'a',name:'Pool Pasteur',city:'Bandung'}],initial:{}}));
 expect(html).toContain('tp-cta-accent');
 expect(html).toContain('Cari jadwal');
});
```

- [ ] **Step 2: Jalankan unit test untuk memastikan test baru gagal sebelum implementasi**

Run: `npx vitest run tests/unit/passenger-discovery.test.ts`
Expected: FAIL pada 3 test baru (`tp-card-purchase` / `tp-segmented` / `tp-cta-accent` belum ada).

---

### Task 2: Update `TripCard` (`app/components/trip-card.tsx`)

**Files:**
- Modify: `app/components/trip-card.tsx:1-54`

**Interfaces:**
- Preserves: `export default function TripCard({trip}:{trip:SearchResult})`

- [ ] **Step 1: Perbarui markup `TripCard` dengan gaya ticket stub, timeline dot-to-arrow, dan penghapusan duplikasi rute di meta**

Ganti isi `app/components/trip-card.tsx` menjadi:

```tsx
import Link from 'next/link';
import {ArrowRight,CalendarBlank} from '@phosphor-icons/react/ssr';
import type {SearchResult} from '@/modules/inventory/types';
import {formatDepartureWib,formatIdr} from '../presentation';

const time=(value:string)=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(value));
const dayLabel=(value:string)=>new Intl.DateTimeFormat('id-ID',{weekday:'long',timeZone:'Asia/Jakarta'}).format(new Date(value));

export default function TripCard({trip}:{trip:SearchResult}){
 const duration=trip.arrivalAt?(Date.parse(trip.arrivalAt)-Date.parse(trip.departureAt))/60000:null;
 const validArrival=duration!==null&&Number.isFinite(duration)&&duration>=0;
 const hours=validArrival?Math.floor(duration/60):0;
 const mins=validArrival?Math.floor(duration%60):0;
 const durationText=validArrival?(hours>0&&mins>0?`${hours}j ${mins}m`:hours>0?`${hours} jam`:`${mins} menit`):'Estimasi rute';
 const seatTone=trip.availableCount===0?'is-full':trip.availableCount<=3?'is-low':'is-open';
 const seatLabel=trip.availableCount>0&&trip.availableCount<=3?`Sisa ${trip.availableCount} kursi`:`${trip.availableCount} kursi tersedia`;

 return <article className="passenger-card sp-trip-card tp-card">
  <div className="tp-card-main">
   <div className="tp-card-top">
    <div className="tp-card-title-group">
     <h3 className="tp-card-title">{trip.name}</h3>
     <span className="tp-pill-class">{trip.className}</span>
    </div>
    {trip.companyName&&<span className="tp-pill-operator">{trip.companyName}</span>}
   </div>
   <div className="tp-card-route">
    <div className="tp-point">
     <span className="tp-time-row"><strong className="tp-time sp-numbers">{time(trip.departureAt)}</strong><span className="tp-wib">WIB</span></span>
     <span className="tp-stop-name">{trip.originName}</span>
    </div>
    <div className="tp-connector">
     <span className="tp-duration-pill">{durationText}</span>
     <div className="tp-connector-track" aria-hidden="true">
      <span className="tp-dot-origin"/>
      <span className="tp-track-line"/>
      <span className="tp-dot-dest"><ArrowRight size={15}/></span>
     </div>
    </div>
    <div className="tp-point is-end">
     {validArrival
      ?<span className="tp-time-row"><strong className="tp-time sp-numbers">{time(trip.arrivalAt!)}</strong><span className="tp-wib">WIB</span></span>
      :<strong className="tp-time-unknown">Waktu tiba belum tersedia</strong>}
     <span className="tp-stop-name">{trip.destinationName}</span>
    </div>
   </div>
   <p className="tp-card-meta">
    <span className="tp-card-meta-item"><CalendarBlank size={14} aria-hidden="true"/>{dayLabel(trip.departureAt)}, {formatDepartureWib(trip.departureAt)}</span>
    <span className="tp-card-meta-item">Berangkat tepat waktu (WIB)</span>
   </p>
  </div>
  <div className="tp-card-purchase">
   <span className="tp-fare-label">Tarif per penumpang</span>
   <strong className="sp-fare sp-numbers">{formatIdr(trip.fare)}</strong>
   <span className={`tp-seat-pill ${seatTone}`}><span className="tp-seat-dot" aria-hidden="true"/>{seatLabel}</span>
   <Link className="tp-cta-accent tp-card-cta" href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}>Pilih kursi<ArrowRight size={17} aria-hidden="true"/></Link>
  </div>
 </article>;
}
```

- [ ] **Step 2: Jalankan test `TripCard`**

Run: `npx vitest run tests/unit/passenger-discovery.test.ts`
Expected: Test `TripCard` PASS.

---

### Task 3: Update `SearchForm` & `TripsPage` (`app/trips/components/search-form.tsx`, `app/trips/page.tsx`)

**Files:**
- Modify: `app/trips/components/search-form.tsx:1-78`
- Modify: `app/trips/page.tsx:102-122`

- [ ] **Step 1: Perbarui `SearchForm` dengan state rotasi swap dan kelas tombol CTA oranye**

Di `app/trips/components/search-form.tsx`:
- Tambah `const [swapped,setSwapped]=useState(false);`
- Pada tombol swap: `className={`tp-swap${swapped?' is-rotated':''}`}` dan `onClick={()=>{setFrom(to);setTo(from);setSwapped(v=>!v);setError('');}}`
- Pada tombol submit: `className="tp-cta-accent tp-search-submit"`

- [ ] **Step 2: Perbarui wrapper hero di `app/trips/page.tsx`**

Di `app/trips/page.tsx` baris 104–121, bungkus hero navy & `SearchForm` di dalam `<div className="tp-hero-block">`:
- Di dalam `<section className="tp-hero" aria-labelledby="discovery-title">`, tambahkan dekorasi garis rute SVG ringan (`aria-hidden="true"`, class `tp-hero-arc`, tanpa gambar bus) sebelum `.tp-hero-top`.
- Pindahkan `<SearchForm ... />` tepat di bawah `</section>` (masih di dalam `.tp-hero-block`) agar dapat mengambang memotong tepi bawah hero navy secara bersih pada desktop maupun ponsel.

- [ ] **Step 3: Jalankan test `SearchForm`**

Run: `npx vitest run tests/unit/passenger-discovery.test.ts`
Expected: Test `SearchForm` PASS.

---

### Task 4: Update `TripDiscovery` (`app/trips/components/trip-discovery.tsx`)

**Files:**
- Modify: `app/trips/components/trip-discovery.tsx:1-127`

**Interfaces:**
- Preserves: `TripDiscovery` props signature (`trips`, `fallbackTrips`, `locations`, `quickDates`, `candidateLimitReached`, `dateWib`, `hasExplicitDate`, `from`, `to`)

- [ ] **Step 1: Tambah helper split label tanggal, segmented sort control, toggle chip filter kelas, preset harga cepat, dan ikon empty state**

Perubahan pada `app/trips/components/trip-discovery.tsx`:
1. Helper split label chip tanggal:
```tsx
function splitDateLabel(label:string):{day:string;date:string}{
 const parts=label.split(', ');
 if(parts.length>=2)return {day:parts[0],date:parts.slice(1).join(', ')};
 return {day:'Tanggal',date:label};
}
```
2. Render `.tp-date-bar`:
   - Chip `"Semua"` / `"Jadwal mendatang"` memakai `.tp-date-day` dan `.tp-date-val`.
   - Setiap `quickDates` item memecah `option.label` dengan `splitDateLabel(option.label)`.
3. Render `.tp-tools` di `.tp-toolbar`:
   - Ganti `<select>` dengan segmented control:
```tsx
<div className="tp-segmented" role="group" aria-label="Urutkan perjalanan">
 <button type="button" className={sort==='departure'?'is-active':undefined} aria-pressed={sort==='departure'} onClick={()=>setSort('departure')}>Berangkat awal</button>
 <button type="button" className={sort==='price'?'is-active':undefined} aria-pressed={sort==='price'} onClick={()=>setSort('price')}>Harga terendah</button>
</div>
```
   - Tambah class kondisional `has-active` pada `.tp-filter-btn` ketika `count > 0`.
4. Render `.sp-applied-filters` dengan pill biru per filter terpilih + tombol `Hapus filter`.
5. Di dalam `<dialog ref={dialog} className="sp-filter-dialog">`:
   - Kelas layanan dirender sebagai `<label className={`sp-toggle-chip${draftClasses.includes(name)?' is-selected':''}`} key={name}><input className="sp-sr" type="checkbox" .../>{name}</label>` agar keyboard/a11y checkbox tetap native.
   - Tambah shortcut batas harga (`80000`, `120000`, `150000`) sebagai `<button type="button" className={`sp-toggle-chip${draftFare===preset?' is-selected':''}`}>` di atas `<input type="text" .../>`.
6. Bungkus `<MapTrifold .../>` pada `.tp-empty-card` dengan `<div className="tp-empty-icon" aria-hidden="true">...</div>`.

- [ ] **Step 2: Jalankan unit test `passenger-discovery.test.ts`**

Run: `npx vitest run tests/unit/passenger-discovery.test.ts`
Expected: PASS semua test.

---

### Task 5: Perbarui Scoped Styles `app/trips/trips.css`

**Files:**
- Modify: `app/trips/trips.css:1-618`

- [ ] **Step 1: Terapkan palet 60–30–10 ter-tokenisasi, Deep Navy Hero, Floating Search Card, Ticket-Stub Notches, dan Responsive Rules**

Perbarui `app/trips/trips.css` dengan struktur dari preview yang di-ACC:
- Token di `.passenger-shell .tp-page`: `--tp-navy: #0a2144`, `--tp-navy-deep: #071936`, `--tp-primary: #005bd1`, `--tp-primary-hover: #0049aa`, `--tp-primary-soft: #edf4ff`, `--tp-accent: #bd4b12`, `--tp-accent-hover: #9c3b0b`, `--tp-stub: #f8fbff`, `--tp-border: #d5e2f2`, `--tp-canvas: #f5f7fa`.
- `.tp-hero-block`, `.tp-hero` (Deep Navy gradasi + pola titik halus + `.tp-hero-arc`), `.tp-stat-chip` gelap transparan.
- `.tp-search-card` dengan `margin: -42px 24px 0` (desktop) dan `-34px 8px 0` (mobile ≤ 639px), `.tp-swap.is-rotated`, `.tp-cta-accent` (`background: var(--tp-accent)`, hover `var(--tp-accent-hover)`).
- `.tp-date-chip` 2 baris (`.tp-date-day`, `.tp-date-val`, `.is-active` biru solid), `.tp-segmented`, `.tp-applied-pill`.
- `.tp-card` boarding-pass: `.tp-card-purchase` dengan latar `var(--tp-stub)`, border kiri `1.5px dashed #cbd9ec`, pseudo-elemen `::before`/`::after` sebagai *ticket notch* melingkar sewarna `var(--sp-canvas, #f5f7fa)`, timeline `.tp-dot-origin` + `.tp-track-line` + `.tp-duration-pill`, serta animasi hover halus (`translateY(-2px)` + panah geser `3px`), lengkap dengan `@media (prefers-reduced-motion: reduce)`.
- Gaya `.sp-toggle-chip` dan `.sp-chip-grid` untuk dialog filter, termasuk `overflow-x: clip` pada `html, body` untuk mencegah scroll horizontal.

---

### Task 6: Verifikasi Menyeluruh & Sinkronisasi Dokumentasi

**Files:**
- Modify: `docs/seatpax/00_INDEX.md` (catat ringkasan singkat setelah selesai jika diperlukan sesuai aturan docs)
- Modify: `docs/seatpax/13_UI_UX_DESIGN.md` (tambahkan entri `Latest Design Direction — /trips visual refresh, 16 November 2026` setelah verifikasi lulus)

- [ ] **Step 1: Jalankan seluruh check kode dan build**

Run:
1. `npm.cmd run typecheck`
2. `npm.cmd run lint`
3. `npm.cmd test`
4. `npm.cmd run build`

Expected: Semua command exit code 0 tanpa error.

- [ ] **Step 2: Verifikasi visual browser lokal (opsional / bila server dev tersedia)**

Cek `/trips` pada viewport desktop (`1280×800`) dan ponsel (`390×844`) memastikan tidak ada horizontal overflow (`scrollWidth <= clientWidth`), kontras teks & tombol oranye `#bd4b12` terbaca jelas, serta dialog filter dan sort berfungsi penuh.
