# UI-LANDING-02: Revisi Visual `/anatomy` QR Boarding Gate, Side-by-Side Seat Showcase & Sticky Header Offset

**Goal:** Merombak figur `/anatomy` menjadi objek kontras **Podium Scanner QR Deep Navy + Smartphone Layar QR Besar**, mengubah `#pilih-kursi` menjadi **side-by-side live** (denah kursi selalu terlihat & kartu tiket update real-time tanpa card-in-card dan tanpa notch pecah), serta memperbaiki `--lp-nav-offset` agar heading section tidak terpotong floating header.

**Dependencies:** Melanjutkan `UI-LANDING-01` ([spec](../specs/2026-11-22-landing-redesign-design.md)) sesuai pilihan eksplisit pengguna pada 23 November 2026.

**Files in Scope:**
- Modify: `app/landing/iso/iso.css` (tambah material `.iso-solid--navy`, `.iso-solid--blue`, `.iso-solid--screen`, `.iso-solid--glass` ter-tokenisasi untuk kontras tinggi)
- Modify: `app/landing/iso/boarding-stand-geometry.ts` (rombak geometri menjadi QR Boarding Podium Deep Navy + Smartphone layar QR 5×5 + 3 finder corner, `partCount >= 45`, `staticSolids.length > 25`, 0 floating line ends)
- Modify: `app/landing/iso/boarding-stand-figure.tsx` (update judul kartu `QR Boarding Gate`, readout step, pencahayaan scan glass + LED pada Step 2)
- Modify: `app/landing/booking-motion.tsx` & `app/landing/booking-motion.css` (hapus wrapper kotak bertumpuk `.lpm-seat-stage`, tampilkan `SeatMapCard` + konektor + `BoardingPassCard` berdampingan selalu terlihat, perbaiki `.lpm-ticket-shell` notch dengan `overflow: hidden`)
- Modify: `app/page.tsx` & `app/landing/landing.css` (hapus `.lp-seat-stage` agar tidak card-in-card, rapikan `.lp-pass-card` notch dengan `overflow: hidden`, naikkan `--lp-nav-offset` ke `124px` agar anchor scroll bersih di bawah sticky header)
- Modify: `tests/unit/landing-redesign.test.ts` & `tests/unit/passenger-entry.test.ts` (sesuaikan ekspektasi label `QR Boarding Gate` & verifikasi side-by-side seat + ticket)

**Checkable Completion Criteria:**
1. `#persiapan` menampilkan `Fig 01 · QR Boarding Gate` dengan podium Deep Navy kontras dan smartphone berlayar putih + QR Code gelap yang langsung terbaca, 0 line-end failures pada audit `/anatomy` `lines.mjs`.
2. `#pilih-kursi` menampilkan denah 9 kursi (`01`–`09`) dan kartu tiket digital secara berdampingan sekaligus tanpa pembungkus card-in-card-in-card, serta notch tiket terpotong bersih.
3. Scroll ke `#persiapan` / `#cara-memesan` / `#bantuan` menyisakan ruang aman di bawah sticky header.
4. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` lulus (exit 0), serta verifikasi visual screenshot headless Chrome pada desktop (`1280×800`) dan mobile (`390×844`) dicek langsung.
