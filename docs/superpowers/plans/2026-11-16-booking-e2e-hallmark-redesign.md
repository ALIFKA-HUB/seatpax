# UI-BOOKING-E2E-01: Redesign Terpadu Alur Pemesanan Langkah 1 sampai Langkah 3

> **Status:** Approved by user on 2026-11-16 (`"untuk skrng eksekusi nya sama lu aja ga pake sub agent"`). Direct single-orchestrator execution.

## Goal
Menyatukan pengalaman visual, kejelasan informasi, dan ritme antarmuka di seluruh alur transaksi penumpang Seatpax dari **Langkah 1: Pilih Kursi** (`/trips/[tripId]`) → **Langkah 2: Data & Bayar** (`/checkout/[holdId]`, `/holds/[holdId]`, `/bookings/[bookingId]`) → **Langkah 3: Tiket Siap** (`/tickets/[ticketId]` dan `/tickets`) berdasarkan disiplin **Hallmark** (`modern-minimal` / `--scope app`) dan sistem warna/tipografi Seatpax.

## Architecture & Hallmark Rules
- Pertahankan seluruh wiring, server actions (`createHoldAction`, `releaseHoldAction`, `startCheckoutAction`, `prepareBookingPaymentAction`, `refreshBookingAction`), field `id`/`name`, helper perhitungan tarif (`quoteInterval`), enkripsi QR server (`QRCode.toDataURL`), dan seluruh unit test yang ada.
- **Hallmark Floor compliance:**
  - Deklarasi `:root` CSS tokens lengkap (`--pf-*` / `--tk-*`) dan stamp Hallmark di baris awal CSS; tidak ada literal warna atau font di luar blok token.
  - Tanpa uppercase tracked eyebrow, tanpa middle-dot (`·`) penggabung metadata, tanpa panah menempel pada teks link (`→`), tanpa card bertumpuk (*card-inside-card*).
  - Hilangkan banner hero gemuk di atas halaman transaksi sehingga judul, stepper 1–2–3, dan aksi utama langsung tampil di layar desktop `1280×800`.
  - `overflow-x: clip` pada `html, body`, `minmax(0, 1fr)` pada grid, `:focus-visible` instan, `prefers-reduced-motion: reduce`, dan hanya ikon `@phosphor-icons/react`.

## Scope & Files
1. **Langkah 1 — `/trips/[tripId]` ([page.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/trips/%5BtripId%5D/page.tsx), [seat-selection.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/trips/components/seat-selection.tsx)):**
   - Header ringkas menampilkan judul trip, rute aktif, nama armada + plat nomor, kelas layanan, dan batas tutup penjualan (`cutoff` WIB).
   - **Timeline Rute & Harga Terbuka:** Menampilkan seluruh urutan titik naik–turun (`stops`) lengkap dengan jam tiba/lanjut WIB, kota & alamat stop (bila tersedia), badge posisi aktif (`Titik naik`, `Singgah`, `Titik turun`), tarif per segmen, serta akumulasi tarif dari titik naik ke tiap titik berikutnya memakai `quoteInterval`.
   - Peta kabin kursi bersih tanpa container kartu berlapis + panel ringkasan sticky.
2. **Langkah 2 — `/checkout/[holdId]`, `/holds/[holdId]`, `/bookings/[bookingId]` ([checkout page](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/checkout/%5BholdId%5D/page.tsx), [checkout-form.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/checkout/components/checkout-form.tsx), [hold-sidebar.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/checkout/components/hold-sidebar.tsx), [holds page](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/holds/%5BholdId%5D/page.tsx), [hold-detail.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/holds/components/hold-detail.tsx), [bookings page](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/bookings/%5BbookingId%5D/page.tsx), [booking-status.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/bookings/components/booking-status.tsx)):**
   - Header ringkas menyatu dengan stepper, langsung menampilkan form penumpang & sidebar hold countdown timer + tombol langsung lepas/ganti kursi tanpa banner hero berlebih.
   - Halaman `/bookings/[bookingId]` menjadi *Transaction Status Sheet* satu bidang yang tegas dengan aksi lanjut bayar, perbarui status, lapor masalah, atau buka tiket QR.
3. **Langkah 3 — `/tickets/[ticketId]` & `/tickets` ([ticket detail](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/tickets/%5BticketId%5D/page.tsx), [tickets page](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/tickets/page.tsx), [ticket-center.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/tickets/components/ticket-center.tsx), [ticket-card.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/components/ticket-card.tsx), [tickets.css](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/tickets/tickets.css)):**
   - Detail `/tickets/[ticketId]` disusun sebagai **Split Boarding Pass** 2 kolom (kiri: detail rute, jadwal, penumpang, armada, tarif; kanan: panel QR siap pindai + tombol Cetak/PDF).
   - Daftar `/tickets` diselaraskan tanpa middle-dot dan tanpa uppercase tracked eyebrow.
4. **Shared UI & Tests ([booking-stepper.tsx](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/components/booking-stepper.tsx), [passenger-flow.css](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/app/components/passenger-flow.css), [passenger-seat-view.test.ts](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/tests/unit/passenger-seat-view.test.ts), [passenger-ticket-view.test.ts](file:///c:/Users/ASUS/Documents/ALIFKA/PROJECT/Ticketing/SeatPax/tests/unit/passenger-ticket-view.test.ts)):**
   - Menambahkan unit test untuk timeline titik naik–turun & harga di `/trips/[tripId]` serta boarding pass Langkah 3.

## Checkable Completion Criteria
- [ ] Seluruh halaman Langkah 1–3 bebas hero gemuk, bebas middle-dot metadata, bebas tracked-caps eyebrow, dan bebas card-inside-card.
- [ ] `/trips/[tripId]` menampilkan urutan titik naik–turun secara terbuka beserta jam WIB, alamat (bila ada), dan tarif dari titik naik ke tiap pemberhentian berikutnya (`quoteInterval`).
- [ ] `/checkout/[holdId]`, `/holds/[holdId]`, `/bookings/[bookingId]` rapi dan responsif di desktop & mobile dengan stepper langkah yang selaras.
- [ ] `/tickets/[ticketId]` tampil sebagai Split Boarding Pass 2 kolom yang ringkas dan siap cetak/pindai QR.
- [ ] `sloplint --tier floor` bersih (`0 FAIL`), `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- --maxWorkers=2`, dan `npm.cmd run build -- --webpack` semua lulus.
