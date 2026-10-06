# Seatpax — Product Vision & Positioning


> Modular documentation extracted from the Seatpax master specification.


# 1. Executive Summary

## 1.1 Apa itu Seatpax?

**Seatpax** adalah platform ticketing dan passenger operations untuk bus antarkota dengan perjalanan **multi-stop**. Sistem menyatukan proses:

```text
Route & Trip Setup
        ↓
Search & Seat Availability
        ↓
Seat Hold
        ↓
Booking & Payment
        ↓
Ticket QR
        ↓
Trip Manifest
        ↓
Boarding
        ↓
Passenger Facility Claim
```

Seatpax bukan sekadar aplikasi "beli tiket bus online". Nilai utamanya adalah sinkronisasi antara **inventory kursi per segmen perjalanan** dan **operasional penumpang di bus**.

## 1.2 Problem utama

Pada rute:

```text
Bandung → Cianjur → Sukabumi → Bogor
```

Seat 07 bisa digunakan oleh:

```text
Budi : Bandung → Cianjur
Andi : Cianjur → Bogor
```

Karena segmen mereka tidak overlap, kursi yang sama seharusnya bisa dijual dua kali pada bagian perjalanan berbeda.

Sistem booking sederhana yang hanya mengenal:

```text
Seat 07 = AVAILABLE / BOOKED
```

akan menganggap kursi penuh sepanjang trip dan mengurangi utilisasi kursi.

Seatpax menyelesaikannya dengan **segment-based seat inventory**.

## 1.3 Problem turunan yang diselesaikan

1. **Seat inventory tidak optimal** pada perjalanan multi-stop.
2. **Double booking / race condition** ketika banyak pengguna memilih kursi yang sama.
3. **Booking dan operasional kru terpisah**, sehingga manifest penumpang tidak selalu sinkron.
4. **Sulit mengetahui siapa yang sudah benar-benar masuk bus.**
5. **Klaim fasilitas** seperti snack dapat terduplikasi jika tidak dicatat.
6. **Layout armada berbeda-beda**, termasuk kendaraan yang dimodifikasi karoseri.
7. **Penjualan bisa datang dari channel berbeda**, misalnya online dan cash oleh crew.
8. **Multi-PO membutuhkan isolasi data**, supaya satu PO tidak dapat melihat data PO lain.

---


# 2. Product Positioning

## 2.1 Positioning utama

> **Seatpax adalah platform ticketing dan passenger operations untuk bus antarkota multi-stop, dengan seat inventory per segment, dynamic seat layout, QR passenger manifest, dan tenant isolation antar-PO.**

Bukan:

> "Traveloka versi bus."

Lebih tepat:

```text
Seat Inventory Engine
        +
Ticketing
        +
Passenger Manifest
        +
Boarding Operations
```

## 2.2 Target pengguna

- Penumpang bus antarkota.
- Perusahaan Otobus / operator bus.
- Kru operasional bus atau gate.
- Platform operator Seatpax.

## 2.3 Model platform

**FINAL — MVP v1:** Multi-tenant platform dengan beberapa PO.

Setiap PO memiliki:

- rute sendiri,
- stop / titik perjalanan,
- armada,
- seat template,
- service class,
- trip,
- booking,
- crew,
- manifest.

Data dipisahkan menggunakan `company_id` dan tenant isolation.

## 2.4 Marketplace penuh

**DEFERRED:** Marketplace dengan rating kompleks, leaderboard, escrow, payout, komisi, withdraw, dan verified reviews pernah dibahas tetapi tidak menjadi fokus MVP.

Alasannya:

- membuat financial domain jauh lebih besar,
- membutuhkan payout / escrow realistis,
- memperbesar role dan permission,
- tidak memperkuat core engineering Seatpax sebanyak seat-per-segment dan manifest.

Struktur multi-tenant tetap dipertahankan agar arah marketplace masih memungkinkan di masa depan.

---


# 3. Product Principles

1. **PostgreSQL adalah source of truth.**
2. **Seat availability diputuskan backend/database, bukan frontend.**
3. **Realtime hanya meningkatkan UX, bukan menentukan kebenaran inventory.**
4. **Trip adalah konteks utama operasional.**
5. **Manifest milik trip, bukan kendaraan secara permanen.**
6. **Seat assignment dapat berubah; ticket identity tidak bergantung permanen pada satu seat.**
7. **Satu QR passenger dapat digunakan untuk beberapa entitlement dengan state terpisah.**
8. **Guest booking diperbolehkan; cross-device access membutuhkan verified identity.**
9. **MVP lebih penting selesai dan konsisten daripada mempunyai semua fitur production.**
10. **Third-party provider dibungkus abstraction agar mudah diganti.**

---


# 47. README Short Version

## Seatpax

Seatpax adalah platform ticketing dan passenger operations untuk bus antarkota multi-stop. Sistem mengelola ketersediaan kursi berdasarkan segment perjalanan, sehingga seat yang telah kosong setelah passenger turun dapat dijual kembali pada segment berikutnya tanpa menyebabkan double booking.

Fitur inti:

- multi-tenant PO,
- multi-stop route,
- seat inventory per segment,
- dynamic seat layout,
- PostgreSQL transaction-based seat hold,
- Midtrans Sandbox payment,
- QR ticket per passenger,
- trip manifest,
- boarding + snack claim,
- static RBAC + tenant isolation.

Stack utama:

```text
Next.js + TypeScript
PostgreSQL / Supabase
Supabase Auth + RLS + Realtime
Drizzle ORM
Midtrans Sandbox
Tailwind + shadcn/ui
Playwright + Vitest + k6
```

---


# 48. One-Liner untuk Presentasi

> **Seatpax menyinkronkan ticketing, ketersediaan kursi per segmen, pembayaran, manifest penumpang, dan boarding bus multi-stop dalam satu platform.**

Versi teknis:

> **Seatpax is a multi-tenant bus ticketing and passenger-operations platform with segment-aware seat inventory, concurrency-safe booking, QR-based manifest operations, and tenant-isolated operator management.**

---
