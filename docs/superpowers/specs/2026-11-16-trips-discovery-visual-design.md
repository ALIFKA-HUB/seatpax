# Passenger `/trips` Discovery Visual Redesign (`UI-TRIPS-01`)

**Status:** Preview visual disetujui pengguna pada 16 November 2026 (`"ACC"` terhadap `trips-redesign-preview.html`). Dokumen ini merekam spesifikasi desain sebelum implementasi ke kode sumber.

## Goal

Mengubah halaman publik `/trips` agar tidak lagi terasa datar (*plain*) sambil mempertahankan struktur layout yang sudah aman (hero + search bar di atas, quick date strip + toolbar di tengah, daftar kartu trip 2-kolom di bawah) dan tanpa mengubah perilaku bisnis, query URL, maupun kontrak data pencarian.

## Visual Direction & Color System (60–30–10)

Menggunakan sistem 2 warna selaras Seatpax + 1 warna aksen hangat khusus penarik aksi (*Model A*):

1. **60% — Pondasi Netral & Teks:**
   - Canvas `#f4f7fb` (`--tp-canvas`), permukaan kartu & panel `#ffffff` (`--tp-surface`), stub tiket `#f8fbff` (`--tp-stub`), teks utama `#0a2144` (`--sp-ink`), teks sekunder `#526078` (`--sp-muted`).
2. **30% — Warna Selaras (Identitas Seatpax):**
   - Biru Seatpax `#005bd1` (`--sp-primary`), tint lembut `#edf4ff` (`--tp-primary-soft`), border `#d5e2f2` (`--tp-border`), plus blok hero **Deep Navy** (`#071936` → `#0a2144` → `#0e2d5c`).
   - Dipakai untuk tab navigasi aktif, focus ring input, badge kelas layanan, timeline rute, chip tanggal aktif, *segmented sort*, dan tombol/chip Filter.
3. **10% — Aksen Perhatian (CTA Konversi):**
   - Burnt-Orange Seatpax `#bd4b12` (`--tp-accent`, hover `#9c3b0b`, kontras teks putih ≥ 4.5:1) yang sudah menjadi token oranye internal Seatpax.
   - **Hanya dipakai pada 2 titik aksi konversi utama:** tombol `Cari jadwal` di search card dan tombol `Pilih kursi` di setiap kartu trip.

## Component Specifications

1. **Compact Deep Navy Hero + Floating Search Card (`app/trips/page.tsx`, `app/trips/components/search-form.tsx`, `app/trips/trips.css`):**
   - Hero berlatar gradasi Deep Navy dengan radial highlight biru-oranye sangat tipis, pola titik geometris halus, dan lengkung rute vektor dekoratif minimal (tetap **tanpa ilustrasi bus** sesuai `13_UI_UX_DESIGN.md`).
   - Tinggi hero ringkas agar daftar kartu trip tetap langsung terlihat *above the fold* pada desktop dan ponsel.
   - Panel `SearchForm` putih mengambang memotong tepi bawah hero (`margin-top: -42px` desktop, `-34px` ponsel).
   - Tombol tukar asal–tujuan (`tp-swap`) berotasi 180° saat diklik (`prefers-reduced-motion: reduce` menonaktifkan transisi).
   - Tombol `Cari jadwal` memakai kelas aksen oranye (`tp-cta-accent tp-search-submit`).

2. **Quick Date Strip & Toolbar (`app/trips/components/trip-discovery.tsx`):**
   - Chip tanggal dua baris: label hari di atas (mis. `SEL`) dan tanggal di bawah (`17 Nov`), tetap memakai prop `quickDates: { dateWib: string; label: string }[]` agar kompatibel dengan pemanggil dan unit test yang sudah ada. Chip aktif memakai biru solid `#005bd1` + teks putih.
   - Kontrol urutkan di toolbar memakai *segmented pill* (`Berangkat awal` | `Harga terendah`) dengan `aria-pressed` dan label aksesibel.
   - Dialog filter (`<dialog>`) menampilkan pilihan kelas layanan sebagai *toggle chip* aksesibel (tetap memakai `<input type="checkbox">` di dalam `<label>` agar semantik keyboard & form native terjaga) dan tombol preset harga maksimum cepat (`≤ Rp 80 rb`, `≤ Rp 120 rb`, `≤ Rp 150 rb`) di atas input numerik manual.

3. **Boarding-Pass Trip Card (`app/components/trip-card.tsx`):**
   - Mempertahankan struktur 2-kolom (`minmax(0, 1fr) 244px` desktop, bertumpuk di ponsel `≤ 639px`).
   - Kolom kiri menampilkan header rute + kelas + PO, timeline titik asal (`tp-dot-origin`) → garis putus-putus → pill durasi (`tp-duration-pill`) → panah tujuan, serta footer tanggal keberangkatan (menghapus pengulangan `{originName} → {destinationName}` di `.tp-card-meta`).
   - Mempertahankan fallback jujur `Waktu tiba belum tersedia` saat `arrivalAt` kosong dan mempertahankan `Pilih kursi` dengan tautan `/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`.
   - Kolom kanan (`.tp-card-purchase`) tampil sebagai *ticket stub* bernuansa `#f8fbff` dengan garis potong vertikal *dashed* dan lekukan setengah lingkaran (*ticket notch*) di ujung garis pemisah, tarif `tabular-nums`, badge status kursi berindikator titik, dan CTA oranye `Pilih kursi`.

## Scope & Constraints

- **In Scope:** `app/trips/page.tsx`, `app/trips/trips.css`, `app/trips/components/search-form.tsx`, `app/trips/components/trip-discovery.tsx`, `app/components/trip-card.tsx`, serta unit test terkait di `tests/unit/passenger-discovery.test.ts`.
- **Out of Scope:** Tidak mengubah query Supabase/inventory (`src/modules/inventory`), parameter URL (`from`, `to`, `date`), halaman detail kursi `/trips/[tripId]`, checkout, maupun halaman lain.
- **Verification:** `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, dan `npm.cmd run build` lulus tanpa error, serta tidak ada overflow horizontal di desktop (`1280px`) dan ponsel (`375px` / `390px`).
