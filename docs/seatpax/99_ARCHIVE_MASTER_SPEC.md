# SEATPAX — Master Product, System, Design & Engineering Specification

> **Status:** Master source of truth — MVP v1 + documented future scope  
> **Project type:** Assignment + portfolio project  
> **Budget assumption:** Rp0 / free-tier / sandbox / mock-first  
> **Primary target:** Bus / PO antarkota dengan perjalanan multi-stop  
> **Architecture style:** Multi-tenant modular monolith  
> **Document purpose:** Menggabungkan hasil brainstorming produk, business rules, UX, system flow, domain model, database direction, tech stack, third-party ecosystem, security, testing, roadmap, dan backlog dalam satu dokumen.

---

## 0. Cara Membaca Dokumen Ini

Dokumen ini sengaja membedakan tiga status keputusan supaya ide lama tidak tercampur dengan scope yang sekarang.

| Status | Arti |
|---|---|
| **FINAL — MVP v1** | Sudah dikunci dan menjadi acuan implementasi pertama. |
| **DEFERRED** | Pernah dibahas dan masuk akal, tetapi sengaja dipangkas dari MVP karena kompleksitas, biaya, hardware, atau waktu. |
| **FUTURE** | Potensi pengembangan production / v2+, bukan target pengerjaan tugas saat ini. |

Prinsip utama proyek:

> **Seatpax harus terlihat production-minded, tetapi implementasinya tetap realistis untuk dikerjakan solo sebagai tugas dan portfolio tanpa budget.**

Karena itu, keputusan arsitektur dibuat agar domain model dan business rules tidak perlu dibuang jika sistem berkembang, sementara infrastruktur mahal seperti Redis cluster, Kafka, Kubernetes, SMS gateway, WhatsApp Business API, printer Bluetooth, atau microservices tidak diwajibkan pada MVP.

---

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

# 4. Scope Lock — MVP v1

## 4.1 Fitur yang masuk MVP

| Domain | MVP v1 |
|---|---|
| Multi-tenant PO | Ya |
| 4 role utama | Ya |
| Static RBAC | Ya |
| Tenant isolation | Ya |
| Google OAuth Passenger | Ya |
| Email OTP Passenger | Ya |
| Guest booking | Ya |
| Ticket claim ke account | Ya |
| Multi-stop route | Ya |
| Harga per segment | Ya |
| Service class pricing | Ya |
| Dynamic seat template | Ya |
| Vehicle assignment | Ya |
| Trip scheduling | Ya |
| Seat inventory per segment | Ya |
| Seat hold 10 menit | Ya |
| Payment grace +1 menit | Ya |
| Midtrans Sandbox | Ya |
| Late payment conflict | Ya, manual admin resolution |
| QR per passenger | Ya |
| Manifest per trip | Ya |
| Boarding scan | Ya |
| Snack claim | Ya |
| Cash booking oleh crew | Ya, **online only** |
| Basic reschedule | Ya |
| Basic refund | Ya |
| Basic reseat | Ya |
| Crew PWA | Ya |
| Realtime seat update | Ya |
| Basic Super Admin | Ya |
| Concurrency testing | Ya |

## 4.2 Fitur yang dipangkas dari MVP

**DEFERRED:**

- Bluetooth thermal printer.
- Offline cash sale dengan outbox sync.
- Offline seat quota.
- Complex conflict reconciliation.
- React Native crew app.
- Live GPS bus.
- Google Maps route calculation.
- Seatpax wallet / credits.
- Promo / voucher / surge pricing engine.
- Dynamic custom role builder.
- Escrow & payout ke PO.
- Withdrawal workflow.
- Advanced rating and review ranking.
- Multiple financial approval levels.
- Automated emergency seat swap solver.
- Complex compensation ledger.
- Kafka / microservices / Kubernetes.

## 4.3 Future scope

**FUTURE:**

- Full offline-first crew app.
- Bluetooth ESC/POS printing.
- Signed offline ticket generation by trusted device.
- Offline manifest snapshot.
- Offline boarding sync.
- PO rating / verified reviews.
- Escrow, commissions, payout, withdrawal.
- Maps and live bus location.
- Notification production providers.
- Custom permissions / role management.
- Read replicas, Redis, queue worker, dedicated API service.

---

# 5. Role Model

Seatpax menggunakan **empat role utama**.

```text
PASSENGER
ADMIN_PO
CREW
SUPER_ADMIN
```

## 5.1 PASSENGER

Kemampuan:

- mencari trip,
- memilih asal dan tujuan,
- memilih seat,
- membuat booking,
- membayar,
- melihat QR tiket,
- melihat status perjalanan,
- melihat boarding status,
- melihat snack claim status,
- request reschedule,
- mengakses histori tiket setelah login.

Guest **bukan role**. Guest adalah kondisi passenger belum terhubung account:

```text
account_id = NULL
```

## 5.2 ADMIN_PO

Role ini sengaja menggabungkan fungsi yang di production dapat dipecah menjadi Owner, Dispatcher, Cashier, Finance, dan Operations.

Kemampuan MVP:

- route & stop management,
- segment fare,
- service class,
- vehicle management,
- visual seat template,
- trip scheduling,
- assign vehicle,
- booking management,
- manifest,
- manual cash booking,
- reseat,
- refund basic,
- reschedule basic,
- payment conflict resolution,
- laporan sederhana.

## 5.3 CREW

Mewakili kondektur / gate staff / operational crew dalam satu role agar scope tidak membesar.

Kemampuan:

- melihat assigned/active trip,
- melihat manifest,
- search passenger,
- scan QR,
- melihat passenger trip profile,
- mark boarded,
- claim snack,
- membuat cash booking saat online.

## 5.4 SUPER_ADMIN

Kemampuan minimal:

- melihat daftar PO,
- membuat / menambahkan PO,
- mengaktifkan PO,
- suspend PO,
- melihat platform overview sederhana.

Tidak perlu dashboard finansial besar pada MVP.

---

# 6. RBAC + Tenant Isolation

## 6.1 Konsep

```text
RBAC            = user boleh NGAPAIN?
Tenant Isolation = user boleh melakukan itu ke DATA SIAPA?
```

Contoh:

```text
CREW punya boarding.scan ✅

Trip perusahaan sendiri ✅
Trip perusahaan lain     ❌
```

## 6.2 Static RBAC

**FINAL — MVP v1:** Role bersifat statis. Tidak ada UI untuk membuat custom role.

Contoh permission mapping konseptual:

### PASSENGER

```text
booking.create
booking.view_own
ticket.view_own
reschedule.request
```

### ADMIN_PO

```text
route.manage
vehicle.manage
seat_template.manage
trip.manage
booking.manage
refund.manage
reschedule.manage
manifest.view
report.view
```

### CREW

```text
trip.view_assigned
manifest.view_assigned
passenger.view_assigned
boarding.scan
snack.claim
cash_sale.create
```

### SUPER_ADMIN

```text
company.manage
company.suspend
platform.view
```

Implementasi awal dapat menggunakan role checks di server/service layer tanpa tabel permission yang kompleks.

## 6.3 Tenant isolation

Record milik PO harus memiliki jalur relasi ke company.

Contoh:

```text
Trip.company_id = Company.id
Vehicle.company_id = Company.id
Route.company_id = Company.id
```

`ADMIN_PO` dan `CREW` hanya boleh mengakses company yang tercantum dalam membership mereka.

Defense-in-depth:

1. Server-side authorization.
2. PostgreSQL RLS untuk tabel yang relevan.
3. UI conditional rendering hanya sebagai UX layer, bukan keamanan utama.

---

# 7. Authentication & Identity

## 7.1 Passenger auth

**FINAL:**

```text
[ Continue with Google ]
          OR
[ Continue with Email ]
          ↓
      Email OTP
          ↓
        Login
```

Password tradisional tidak wajib untuk passenger MVP.

## 7.2 Guest booking

Passenger tetap boleh booking tanpa login.

Alasan:

- checkout lebih cepat,
- cocok untuk transaksi spontan,
- crew cash sale tidak perlu memaksa account creation.

Guest record dapat menyimpan:

```text
name
email / phone
account_id = NULL
claim_status = UNCLAIMED
```

## 7.3 Claim ticket

Setelah booking sukses:

```text
Booking Success
      ↓
[ Simpan tiket ke akun ]
      ↓
Google / Email OTP
      ↓
Verify identity
      ↓
Ticket linked to account
```

## 7.4 Cross-device access

Booking di HP 1 kemudian dibuka di HP 2 membutuhkan identitas terverifikasi.

Prinsip:

> Booking boleh tanpa akun; akses lintas perangkat membutuhkan login atau claim terverifikasi.

---

# 8. Domain Glossary

## Company / PO
Tenant/operator transportasi yang mempunyai route, vehicle, crew, trip, dan booking sendiri.

## Stop
Titik fisik/logis perjalanan, misalnya Bandung, Cianjur, Sukabumi, Bogor, terminal, pool, atau pickup point resmi.

## Route
Template jalur permanen yang berisi urutan stop.

```text
Bandung → Cianjur → Sukabumi → Bogor
```

## RouteStop
Relasi Route dengan Stop dan posisi `sequence`.

```text
1 Bandung
2 Cianjur
3 Sukabumi
4 Bogor
```

## Segment
Potongan perjalanan antara dua stop berurutan.

```text
Segment 1: Bandung → Cianjur
Segment 2: Cianjur → Sukabumi
Segment 3: Sukabumi → Bogor
```

## Trip
Perjalanan nyata berdasarkan route pada waktu tertentu.

```text
Route  : Bandung → Bogor
Date   : 2026-10-10
Time   : 08:00
Vehicle: D 1234 ABC
```

## Service Class
Kategori layanan yang memengaruhi harga/fasilitas, misalnya Economy, Executive, Sleeper.

## Seat Template
Blueprint layout kabin yang dapat digunakan oleh banyak vehicle.

## Vehicle
Armada fisik yang mempunyai seat template tertentu.

## Trip Seat Inventory
Ketersediaan seat pada segment tertentu dalam satu trip.

## Seat Hold
Reservasi sementara seat selama checkout.

## Booking
Transaksi/intent pembelian satu atau lebih passenger.

## Booking Passenger
Satu penumpang individual dalam booking. Setiap passenger mendapat ticket/QR sendiri.

## Ticket
Identitas perjalanan individual passenger.

## Manifest
Kumpulan passenger confirmed dalam satu trip beserta seat dan status operasional.

## Passenger Trip Profile
Representasi passenger dalam konteks satu trip, bukan profil global user.

## Entitlement
Hak/aktivitas yang dapat dicatat dari satu ticket, misalnya boarding dan snack claim.

---

# 9. Core Business Rules

## 9.1 Route, stop, dan trip

**FINAL:** `Route` dan `Trip` dipisah.

```text
ROUTE
Bandung → Cianjur → Sukabumi → Bogor

dipakai berkali-kali oleh

TRIP 1 — 10 Okt 08:00
TRIP 2 — 10 Okt 14:00
TRIP 3 — 11 Okt 08:00
```

`Stop` juga dipisah dari `Route` melalui `RouteStop` agar stop dapat digunakan kembali pada banyak route.

## 9.2 Multi-stop penuh

**FINAL:** Seatpax menggunakan model **multi-stop penuh**.

Passenger boleh memilih pasangan asal-tujuan yang valid selama urutannya benar:

```text
from_sequence < to_sequence
```

## 9.3 Harga per segment + service class

**FINAL:** Harga disusun per segment dan service class.

Contoh:

```text
Bandung → Cianjur
Economy   = 60k
Executive = 85k
Sleeper   = 120k
```

Untuk perjalanan beberapa segment, harga dijumlahkan.

Contoh:

```text
Bandung → Cianjur   = 60k
Cianjur → Sukabumi  = 50k
Sukabumi → Bogor    = 60k

Bandung → Bogor = 170k
```

Promo engine, dynamic surge, dan fare override kompleks **DEFERRED**.

## 9.4 Satu seat sepanjang perjalanan passenger

**FINAL:** Passenger normal menggunakan satu seat dari titik naik sampai titik turun.

Seat dapat berubah hanya melalui reseat oleh `ADMIN_PO` atau `CREW` pada kondisi operasional tertentu.

## 9.5 Vehicle replacement

Jika vehicle diganti dan layout berbeda:

```text
affected passenger
      ↓
NEEDS_RESEAT
```

Admin/Crew memilih seat baru secara manual.

MVP tidak membangun auto seat-mapping solver.

## 9.6 No-show / missed trip

**FINAL:** No-show ditentukan manual oleh crew, bukan otomatis hanya berdasarkan jam.

Jika passenger benar-benar tertinggal bus:

```text
CONFIRMED
   ↓
MISSED_TRIP / NO_SHOW
```

Tiket **tidak otomatis pindah ke trip berikutnya**.

Passenger dapat request reschedule jika kebijakan PO mengizinkan dan seat trip pengganti tersedia.

## 9.7 Reschedule

Passenger dapat request sendiri, tetapi approval dilakukan oleh `ADMIN_PO`.

Flow:

```text
Passenger request
      ↓
REQUESTED
      ↓
Admin review
  ├─ APPROVED
  └─ REJECTED
```

Jika reschedule karena permintaan passenger:

```text
new_fare - old_fare
+
reschedule_fee
```

Jika jadwal baru lebih murah, selisih dikembalikan sesuai mekanisme refund yang tersedia.

Jika perubahan terjadi karena kesalahan sistem/PO:

- tidak ada reschedule fee,
- passenger tidak dipaksa membayar selisih upgrade,
- downgrade mengembalikan selisih harga.

## 9.8 Trip cancellation oleh PO

**FINAL:** Passenger diberi pilihan:

```text
TRIP_CANCELLED
      ↓
[ Pindah Jadwal ] OR [ Full Refund ]
```

Pindah jadwal akibat PO:

- tanpa fee,
- tidak membayar selisih jika lebih mahal,
- downgrade mendapat refund selisih.

## 9.9 Refund

MVP hanya menerapkan **basic refund**.

Prinsip:

- payment digital → refund mengikuti provider jika flow sandbox mendukung,
- cash payment → refund dicatat sebagai proses manual/cash refund,
- cutoff refund dapat menjadi kebijakan PO,
- kompleksitas multi-level approval dan accounting detail ditunda.

## 9.10 Refund cutoff

Kebijakan yang ingin dipertahankan secara domain:

> Cash/offline purchase dapat direfund, tetapi tidak pada menit-menit terakhir menjelang keberangkatan.

Untuk MVP, simpan parameter:

```text
refund_cutoff_minutes
```

sebagai konfigurasi PO/trip policy. Nilai final dapat ditentukan saat implementasi/seed data.

## 9.11 Cash booking oleh crew

**FINAL — MVP:** Crew dapat menjual tiket cash **hanya ketika online**.

Flow:

```text
Crew buka active trip
      ↓
Pilih boarding stop
      ↓
Pilih destination stop
      ↓
System hitung fare
      ↓
Pilih seat available
      ↓
Input nama + contact minimum
      ↓
Terima cash
      ↓
Create booking
      ↓
Payment method = CASH
Payment status = PAID
      ↓
Ticket dibuat
```

Tidak wajib account.

Offline cash sale kompleks **DEFERRED**.

---

# 10. Seat Inventory Model

## 10.1 Kenapa status seat tunggal tidak cukup

Model salah:

```text
trip_id | seat_id | status
T001    | 07      | BOOKED
```

Model ini tidak tahu bahwa seat 07 bisa kosong kembali setelah stop tertentu.

## 10.2 Model segment inventory

Untuk route:

```text
1 Bandung
2 Cianjur
3 Sukabumi
4 Bogor
```

Trip memiliki segment:

```text
S1 Bandung → Cianjur
S2 Cianjur → Sukabumi
S3 Sukabumi → Bogor
```

Seat 07 memiliki inventory per segment:

```text
trip | seat | segment
T001 | 07   | S1
T001 | 07   | S2
T001 | 07   | S3
```

Booking Bandung → Sukabumi menguasai:

```text
Seat 07 / S1
Seat 07 / S2
```

Passenger lain masih boleh membeli:

```text
Seat 07 / S3
```

## 10.3 Overlap rule

Dua perjalanan bentrok jika interval segment overlap.

Jika:

```text
A = [fromA, toA)
B = [fromB, toB)
```

maka overlap jika:

```text
fromA < toB
AND
fromB < toA
```

Penggunaan interval half-open membuat passenger yang turun di Cianjur dan passenger yang naik di Cianjur tidak dianggap bentrok.

## 10.4 Seat availability query

Seat dianggap available untuk request `from_sequence → to_sequence` jika tidak ada confirmed booking atau active hold yang menempati salah satu segment dalam range tersebut.

## 10.5 Source of truth

**FINAL:** PostgreSQL menentukan seat availability.

Realtime event hanya mengubah visual client.

```text
Frontend seat color ≠ source of truth
Database transaction = source of truth
```

---

# 11. Seat Hold & Concurrency

## 11.1 Hold duration

**FINAL:** 10 menit.

```text
AVAILABLE
   ↓
HELD (10 min)
   ↓
PAID → BOOKED
TIMEOUT → AVAILABLE
```

## 11.2 Payment grace

Jika payment sudah dimulai sebelum hold berakhir:

```text
Seat Hold = 10 menit
Payment Grace = +1 menit
```

Tujuannya memberi toleransi pendek terhadap callback provider tanpa menahan inventory terlalu lama.

## 11.3 Late successful payment

Jika payment sukses setelah hold + grace habis:

```text
PAYMENT_SUCCESS
      ↓
PAYMENT_CONFLICT
      ↓
Admin review
```

Admin dapat:

- confirm jika seat masih tersedia,
- reseat jika memungkinkan,
- refund jika seat sudah terjual.

Sistem tidak otomatis memindahkan passenger tanpa review.

## 11.4 Concurrency strategy

Pada attempt hold:

```text
BEGIN
  lock relevant inventory rows
  re-check availability
  create hold
COMMIT
```

Dua request seat yang sama:

```text
User A ─────┐
            ├── Seat 07, Segment 1/2
User B ─────┘

User A obtains lock
User B waits
User A commits hold
User B re-checks → unavailable
```

## 11.5 Redis

**DEFERRED:** Redis tidak wajib pada MVP.

Alasan:

- PostgreSQL sudah cukup menjadi source of truth,
- demo tidak memerlukan distributed cache,
- mengurangi dependency.

Redis dapat ditambahkan nanti untuk caching, rate limiting, dan high-volume ephemeral coordination.

---

# 12. Vehicle & Seat Template

## 12.1 Prinsip blueprint

Jangan membuat layout per vehicle satu-satu dari nol.

Arsitektur:

```text
SeatTemplate
    ↓
Vehicle
    ↓
Trip Snapshot / Inventory
```

Contoh:

```text
HiAce Premio 10 Seat
Bus Executive 32 Seat
Sleeper 18 Cabin
```

Vehicle cukup menunjuk template.

## 12.2 Kenapa template

- Menghindari duplikasi.
- Memudahkan puluhan vehicle memakai layout sama.
- Vehicle baru cukup assign template.
- Layout karoseri modif dapat dibuat dari duplicate template.

## 12.3 Visual Seat Builder

Pendekatan: **smart grid**, bukan koordinat pixel bebas.

Cell types minimal:

| Type | Fungsi |
|---|---|
| `SEAT` | Kursi passenger |
| `DRIVER` | Posisi driver |
| `AISLE` | Lorong |
| `DOOR` | Pintu |
| `EMPTY` | Area kosong |
| `FACILITY` | Meja/fasilitas opsional |

Contoh:

```text
┌──────┬──────┬──────┐
│DRIVER│AISLE │  01  │
├──────┼──────┼──────┤
│ DOOR │AISLE │  02  │
├──────┼──────┼──────┤
│  03  │  04  │  05  │
└──────┴──────┴──────┘
```

## 12.4 Duplicate & modify

Flow:

```text
HiAce Standard 10
      ↓ Duplicate
HiAce VIP 8
      ↓
remove / move / add cells
```

## 12.5 Seat numbering

Builder dapat mendukung auto-numbering dan manual override.

MVP tidak perlu freeform rotation/absolute positioning.

---

# 13. Booking Model

## 13.1 Booking versus passenger

Satu booking dapat mempunyai beberapa passenger.

```text
Booking #BKG-001
├── Budi  → Seat 01 → QR-A
├── Siti  → Seat 02 → QR-B
└── Andi  → Seat 03 → QR-C
```

Setiap `BookingPassenger` memiliki ticket sendiri.

## 13.2 Booking lifecycle

Konseptual:

```text
DRAFT / CREATED
      ↓
PENDING_PAYMENT
      ↓
CONFIRMED
```

Cabang:

```text
PENDING_PAYMENT → EXPIRED
CONFIRMED       → CANCELLED
CONFIRMED       → RESCHEDULED
CONFIRMED       → REFUNDED
CONFIRMED       → MISSED_TRIP
```

## 13.3 Payment tidak boleh dianggap sukses dari frontend

Frontend success callback hanya UX.

Source of truth:

```text
Midtrans Webhook
      ↓
verify
      ↓
payment = PAID
      ↓
booking = CONFIRMED
```

---

# 14. Payment Architecture

## 14.1 Provider

**FINAL:** Midtrans Sandbox untuk demo.

## 14.2 Flow

```text
Seat Hold
   ↓
Create Booking
   ↓
Create Midtrans transaction
   ↓
Receive Snap token
   ↓
Passenger pays in Sandbox
   ↓
Webhook
   ↓
Verify status/signature
   ↓
Idempotency check
   ↓
Payment PAID
   ↓
Booking CONFIRMED
   ↓
Finalize seat inventory
   ↓
Issue tickets
```

## 14.3 Idempotency

Webhook yang sama dapat datang lebih dari sekali.

Sistem harus menyimpan provider event/order identity dengan unique constraint.

```text
Webhook X
Webhook X
Webhook X
```

harus menghasilkan:

```text
1 payment transition
1 booking confirmation
1 set of tickets
```

## 14.4 Payment statuses

Minimal:

```text
PENDING
PAID
FAILED
EXPIRED
REFUNDED
CONFLICT
```

## 14.5 Payment adapter

Business domain tidak boleh bergantung langsung ke Midtrans-specific code.

```text
PaymentProvider
├── createTransaction()
├── verifyWebhook()
├── getStatus()
└── refund()
```

Implementasi MVP:

```text
MidtransPaymentProvider
```

---

# 15. Ticket, QR & Entitlement

## 15.1 Satu QR per passenger

**FINAL:** QR dimiliki `Ticket`, bukan seluruh booking.

## 15.2 QR bukan "sekali scan lalu mati"

QR berfungsi sebagai identifier/access token ke passenger trip profile.

State terpisah:

```text
Ticket QR
├── Boarding       ✅ / ❌
├── Snack Claim    ✅ / ❌
└── Future Entitlement ...
```

## 15.3 Scan behavior

```text
Scan QR
   ↓
Resolve ticket
   ↓
Verify ticket belongs to trip/context
   ↓
Load passenger trip profile
```

Tampilan:

```text
BUDI SANTOSO
Seat 07
Bandung → Bogor
Trip 08:00
Bus D 1234 ABC

Boarding
✅ Sudah masuk bus — 07:53

Snack
❌ Belum diklaim

[ Claim Snack ]
```

## 15.4 Boarding

Action:

```text
[ MARK BOARDED ]
```

Mencatat:

```text
boarded_at
boarded_by
```

## 15.5 Snack claim

Action:

```text
[ CLAIM SNACK ]
```

Mencatat:

```text
snack_claimed_at
snack_claimed_by
```

Scan ulang tidak menggandakan claim karena state sudah `claimed`.

## 15.6 QR cryptography

Untuk MVP online, QR dapat berisi opaque random ticket token yang diverifikasi server.

**FUTURE:** signed payload Ed25519 untuk offline verification.

Catatan teknis:

- Ed25519 adalah **digital signature**, bukan encrypt/decrypt.
- Private key hanya di server/signing service.
- Scanner memegang public key jika offline verification diimplementasikan.
- HMAC dan Ed25519 tidak boleh dicampur sebagai konsep yang sama.

---

# 16. Manifest & Passenger Trip Profile

## 16.1 Manifest dikelompokkan per trip

Bukan per vehicle permanen.

```text
Vehicle D 1234 ABC
├── Trip Senin 08:00 → Manifest A
├── Trip Senin 14:00 → Manifest B
└── Trip Selasa 08:00 → Manifest C
```

## 16.2 Manifest content

```text
TRIP #T001
Bandung → Bogor
08:00
D 1234 ABC

Seat | Passenger | From      | To        | Boarding | Snack
01   | Budi      | Bandung   | Bogor     | ✅       | ✅
02   | Siti      | Bandung   | Cianjur   | ✅       | ❌
03   | Andi      | Cianjur   | Bogor     | ❌       | ❌
```

## 16.3 Passenger Profile vs Passenger Trip Profile

Global user profile:

```text
Budi Santoso
email
identity/account
```

Trip context:

```text
Budi Santoso
Trip T001
Seat 07
Bandung → Bogor
Boarded ✅
Snack ❌
```

UI scan QR harus membuka **Passenger Trip Profile**.

## 16.4 Manifest sebagai query

Manifest dapat dibentuk dari confirmed booking passengers untuk `trip_id` tertentu.

Tidak wajib mempunyai entity `manifest` terpisah kecuali dibutuhkan snapshot/audit di masa depan.

---

# 17. End-to-End User Flows

## 17.1 Admin PO — setup sampai trip open

```text
Login
  ↓
Create / select Route
  ↓
Configure RouteStops
  ↓
Set Segment Fare per Service Class
  ↓
Create Seat Template
  ↓
Register Vehicle
  ↓
Assign Seat Template
  ↓
Create Trip
  ↓
Assign Vehicle + Service Class
  ↓
Generate Trip Segments + Seat Inventory
  ↓
OPEN FOR SALE
```

## 17.2 Passenger — online booking

```text
Open Seatpax
  ↓
Select From / To / Date
  ↓
Search Trip
  ↓
Select Trip
  ↓
Load seat availability for selected segments
  ↓
Select Seat
  ↓
Create 10-minute hold
  ↓
Input passenger data
  ↓
Checkout
  ↓
Midtrans Sandbox
  ↓
Webhook PAID
  ↓
Booking CONFIRMED
  ↓
Ticket QR issued
  ↓
Passenger appears in trip manifest
```

## 17.3 Guest ticket claim

```text
Guest booking confirmed
      ↓
Ticket page
      ↓
[ Simpan tiket ke akun ]
      ↓
Google OAuth OR Email OTP
      ↓
Verify
      ↓
Link ticket to account
```

## 17.4 Crew boarding

```text
Crew login
   ↓
Open Active Trip
   ↓
Manifest
   ↓
Scan QR
   ↓
Passenger Trip Profile
   ↓
Mark Boarded
   ↓
Claim Snack if delivered
```

## 17.5 Crew cash booking

```text
Open Active Trip
   ↓
New Cash Sale
   ↓
Select boarding stop
   ↓
Select destination
   ↓
Calculate fare
   ↓
Select available seat
   ↓
Input guest passenger
   ↓
Receive cash
   ↓
Confirm
   ↓
Booking CONFIRMED immediately
   ↓
Ticket QR created
   ↓
Passenger appears in manifest
```

## 17.6 Reschedule

```text
Passenger opens ticket
    ↓
Request Reschedule
    ↓
Select requested new trip
    ↓
REQUESTED
    ↓
Admin review availability + policy
    ↓
Calculate fare difference + fee
    ↓
APPROVED / REJECTED
```

## 17.7 Trip cancellation

```text
Admin cancels Trip
      ↓
Affected bookings
      ↓
Passenger option
  ┌───────────────┐
  │               │
Reschedule    Full Refund
```

---

# 18. State Machines

## 18.1 Trip

```text
DRAFT
  ↓
SCHEDULED
  ↓
OPEN_FOR_SALE
  ↓
BOARDING
  ↓
DEPARTED
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

Cabang:

```text
DRAFT / SCHEDULED / OPEN_FOR_SALE → CANCELLED
```

MVP dapat menyederhanakan beberapa state jika implementasi terlalu berat, tetapi domain sebaiknya tidak hanya boolean `is_active`.

## 18.2 Booking

```text
PENDING_PAYMENT
     ├──→ CONFIRMED
     ├──→ EXPIRED
     └──→ PAYMENT_CONFLICT

CONFIRMED
     ├──→ CANCELLED
     ├──→ RESCHEDULED
     ├──→ REFUNDED
     └──→ MISSED_TRIP
```

## 18.3 Seat Hold

```text
ACTIVE
  ├──→ CONVERTED
  └──→ EXPIRED
```

## 18.4 Ticket operational status

Jangan paksa semua operasional menjadi satu enum.

Lebih bersih:

```text
ticket.status = VALID / CANCELLED / REFUNDED
boarded_at = nullable
snack_claimed_at = nullable
```

Dengan demikian boarding dan snack tidak saling mematikan.

## 18.5 Reschedule request

```text
REQUESTED
   ├──→ APPROVED
   ├──→ REJECTED
   └──→ CANCELLED_BY_PASSENGER
```

---

# 19. Recommended Data Model — Conceptual ERD

```text
User
 │
 ├── Membership ─────────── Company
 │                           │
 │                           ├── Route
 │                           │    └── RouteStop ─── Stop
 │                           │
 │                           ├── ServiceClass
 │                           │
 │                           ├── SeatTemplate
 │                           │    └── SeatTemplateCell
 │                           │
 │                           ├── Vehicle
 │                           │
 │                           └── Trip
 │                                ├── TripSegment
 │                                ├── TripSeatInventory
 │                                ├── SeatHold
 │                                └── Booking
 │                                     ├── BookingPassenger
 │                                     │     ├── SeatAssignment
 │                                     │     └── Ticket
 │                                     │           ├── BoardingEvent
 │                                     │           └── SnackClaim
 │                                     ├── Payment
 │                                     │     └── PaymentEvent
 │                                     └── Refund
 │
 └── Passenger-owned Tickets / Bookings
```

---

# 20. Database Schema Proposal v1

> Catatan: Ini adalah schema direction. Nama final dapat berubah ketika migration pertama dibuat, tetapi relasi dan constraint utama sebaiknya dipertahankan.

## 20.1 `users`

```text
id                  uuid PK
email               text nullable unique
name                text nullable
avatar_url          text nullable
created_at          timestamptz
updated_at          timestamptz
```

Identity provider detail utama berasal dari Supabase Auth; tabel app profile dapat memakai `auth.users.id` sebagai FK.

## 20.2 `companies`

```text
id                  uuid PK
name                text
slug                text unique
logo_url            text nullable
status              enum ACTIVE | SUSPENDED
refund_cutoff_minutes int nullable
created_at          timestamptz
updated_at          timestamptz
```

## 20.3 `memberships`

```text
id                  uuid PK
user_id             uuid FK users
company_id          uuid FK companies nullable
role                enum ADMIN_PO | CREW | SUPER_ADMIN
status              enum ACTIVE | DISABLED
created_at          timestamptz
```

Passenger tidak harus mempunyai membership company.

Constraints:

```text
UNIQUE(user_id, company_id, role)
```

## 20.4 `stops`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
city                text
address             text nullable
latitude            numeric nullable  -- future/maps
longitude           numeric nullable  -- future/maps
status              enum ACTIVE | INACTIVE
```

MVP tidak wajib memakai latitude/longitude.

## 20.5 `routes`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
code                text nullable
status              enum ACTIVE | INACTIVE
created_at          timestamptz
```

## 20.6 `route_stops`

```text
id                  uuid PK
route_id            uuid FK routes
stop_id             uuid FK stops
sequence            int
arrival_offset_min  int nullable
 departure_offset_min int nullable
```

Constraint penting:

```text
UNIQUE(route_id, sequence)
UNIQUE(route_id, stop_id) -- jika route tidak boleh melewati stop sama dua kali
CHECK(sequence >= 1)
```

## 20.7 `service_classes`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
code                text
amenities_json      jsonb nullable
status              enum ACTIVE | INACTIVE
```

Contoh:

```text
Economy
Executive
Sleeper
```

## 20.8 `segment_fares`

```text
id                  uuid PK
route_id            uuid FK routes
from_route_stop_id  uuid FK route_stops
to_route_stop_id    uuid FK route_stops
service_class_id    uuid FK service_classes
price               bigint -- simpan rupiah sebagai integer
currency            text default 'IDR'
```

Untuk keputusan pricing MVP, idealnya row mewakili adjacent segment. Harga multi-segment dijumlahkan.

Constraint:

```text
UNIQUE(route_id, from_route_stop_id, to_route_stop_id, service_class_id)
CHECK(price >= 0)
```

## 20.9 `seat_templates`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
rows                int
cols                int
version              int default 1
status              enum ACTIVE | ARCHIVED
created_at          timestamptz
```

## 20.10 `seat_template_cells`

```text
id                  uuid PK
seat_template_id    uuid FK seat_templates
row_index           int
col_index           int
type                enum SEAT | DRIVER | AISLE | DOOR | EMPTY | FACILITY
label               text nullable
seat_code            text nullable
metadata_json       jsonb nullable
```

Constraint:

```text
UNIQUE(seat_template_id, row_index, col_index)
UNIQUE(seat_template_id, seat_code) WHERE type = 'SEAT'
```

`metadata_json` dapat menyimpan `is_window`, `extra_legroom`, atau atribut minor tanpa mengubah schema.

## 20.11 `vehicles`

```text
id                  uuid PK
company_id          uuid FK companies
seat_template_id    uuid FK seat_templates
plate_number        text
fleet_number        text nullable
name                text nullable
status              enum ACTIVE | MAINTENANCE | INACTIVE
```

Constraint:

```text
UNIQUE(company_id, plate_number)
```

## 20.12 `trips`

```text
id                  uuid PK
company_id          uuid FK companies
route_id            uuid FK routes
vehicle_id          uuid FK vehicles
service_class_id    uuid FK service_classes
scheduled_departure timestamptz
scheduled_arrival   timestamptz nullable
status              enum
sales_open_at       timestamptz nullable
sales_close_at      timestamptz nullable
created_by          uuid FK users
created_at          timestamptz
```

## 20.13 `trip_segments`

Snapshot segment trip agar trip tidak rusak jika route template kemudian diedit.

```text
id                  uuid PK
trip_id             uuid FK trips
sequence            int
from_stop_id        uuid FK stops
to_stop_id          uuid FK stops
fare_amount         bigint
```

Jika pricing berbeda per trip di future, fare snapshot sudah tersedia.

Constraint:

```text
UNIQUE(trip_id, sequence)
```

## 20.14 `trip_seats`

Snapshot seat yang benar-benar tersedia di trip.

```text
id                  uuid PK
trip_id             uuid FK trips
seat_code           text
source_template_cell_id uuid nullable
metadata_json       jsonb nullable
```

Constraint:

```text
UNIQUE(trip_id, seat_code)
```

## 20.15 `trip_seat_inventory`

Materialized inventory per segment.

```text
id                  uuid PK
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
trip_segment_id     uuid FK trip_segments
```

Record ini mewakili unit inventory. Kepemilikan dapat ditentukan melalui hold/assignment table daripada field mutable besar.

Constraint:

```text
UNIQUE(trip_seat_id, trip_segment_id)
```

## 20.16 `seat_holds`

```text
id                  uuid PK
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
from_segment_seq    int
to_segment_seq_excl int
booking_session_id  uuid
held_by_user_id     uuid nullable
expires_at          timestamptz
status              enum ACTIVE | CONVERTED | EXPIRED
created_at          timestamptz
```

Active hold harus diperiksa di transaction yang sama dengan inventory conflict check.

## 20.17 `bookings`

```text
id                  uuid PK
company_id          uuid FK companies
trip_id             uuid FK trips
booker_user_id      uuid FK users nullable
booking_code        text unique
status              enum PENDING_PAYMENT | CONFIRMED | EXPIRED | PAYMENT_CONFLICT | CANCELLED | REFUNDED | RESCHEDULED | MISSED_TRIP
contact_name        text
contact_email       text nullable
contact_phone       text nullable
subtotal_amount     bigint
reschedule_fee      bigint default 0
total_amount        bigint
created_at          timestamptz
confirmed_at        timestamptz nullable
```

## 20.18 `booking_passengers`

```text
id                  uuid PK
booking_id          uuid FK bookings
account_id          uuid FK users nullable
name                text
email               text nullable
phone               text nullable
from_stop_id        uuid FK stops
to_stop_id          uuid FK stops
status              enum ACTIVE | CANCELLED | MISSED_TRIP | NEEDS_RESEAT
claim_status        enum UNCLAIMED | CLAIMED
claimed_at          timestamptz nullable
```

## 20.19 `seat_assignments`

```text
id                  uuid PK
booking_passenger_id uuid FK booking_passengers
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
from_segment_seq    int
to_segment_seq_excl int
status              enum ACTIVE | REPLACED | CANCELLED
assigned_at         timestamptz
assigned_by         uuid nullable
replacement_reason  text nullable
```

Historical record dipertahankan ketika reseat; jangan overwrite tanpa audit.

## 20.20 `payments`

```text
id                  uuid PK
booking_id          uuid FK bookings
provider            enum MIDTRANS | CASH | MOCK
provider_order_id   text nullable unique
method              text nullable
amount              bigint
status              enum PENDING | PAID | FAILED | EXPIRED | REFUNDED | CONFLICT
paid_at             timestamptz nullable
created_at          timestamptz
```

## 20.21 `payment_events`

```text
id                  uuid PK
payment_id          uuid FK payments
provider_event_key  text unique
payload_json        jsonb
received_at         timestamptz
processed_at        timestamptz nullable
processing_status   enum RECEIVED | PROCESSED | IGNORED | FAILED
```

Ini menjadi dasar webhook idempotency dan debugging.

## 20.22 `refunds`

```text
id                  uuid PK
booking_id          uuid FK bookings
payment_id          uuid FK payments nullable
amount              bigint
reason              text
method              enum PROVIDER | CASH_MANUAL | MOCK
status              enum REQUESTED | APPROVED | COMPLETED | REJECTED
requested_by        uuid nullable
processed_by        uuid nullable
created_at          timestamptz
completed_at        timestamptz nullable
```

## 20.23 `tickets`

```text
id                  uuid PK
booking_passenger_id uuid FK booking_passengers
trip_id             uuid FK trips
public_token_hash   text unique
status              enum VALID | CANCELLED | REFUNDED
issued_at           timestamptz
```

Token asli tidak wajib disimpan plaintext jika server cukup menyimpan hash.

## 20.24 `boarding_events`

Untuk MVP dapat cukup satu `boarded_at` pada passenger trip state, tetapi event table lebih audit-friendly.

```text
id                  uuid PK
ticket_id           uuid FK tickets
trip_id             uuid FK trips
scanned_by          uuid FK users
scanned_at          timestamptz
source              enum QR | MANUAL
```

Constraint opsional:

```text
UNIQUE(ticket_id, trip_id)
```

untuk satu boarding sukses per trip.

## 20.25 `snack_claims`

```text
id                  uuid PK
ticket_id           uuid FK tickets
trip_id             uuid FK trips
claimed_by          uuid FK users
claimed_at          timestamptz
```

Constraint:

```text
UNIQUE(ticket_id, trip_id)
```

mencegah double claim.

## 20.26 `reschedule_requests`

```text
id                  uuid PK
booking_id          uuid FK bookings
requested_trip_id   uuid FK trips
status              enum REQUESTED | APPROVED | REJECTED | CANCELLED_BY_PASSENGER
fare_difference     bigint
fee_amount          bigint
reason              text nullable
requested_at        timestamptz
reviewed_by         uuid nullable
reviewed_at         timestamptz nullable
```

## 20.27 `audit_logs`

Minimal audit untuk mutation penting:

```text
id                  uuid PK
company_id          uuid nullable
actor_user_id       uuid nullable
actor_role          text
action              text
entity_type         text
entity_id           uuid nullable
before_json         jsonb nullable
after_json          jsonb nullable
metadata_json       jsonb nullable
created_at          timestamptz
```

Target event:

- trip cancelled,
- reseat,
- refund,
- reschedule approval,
- manual booking,
- company suspension.

---

# 21. Indexing Strategy

Index yang layak disiapkan sejak awal:

```text
trips(company_id, scheduled_departure)
trips(route_id, scheduled_departure)
route_stops(route_id, sequence)
trip_segments(trip_id, sequence)
trip_seats(trip_id, seat_code)
bookings(trip_id, status)
bookings(company_id, created_at)
booking_passengers(booking_id)
seat_assignments(trip_id, trip_seat_id, status)
seat_holds(trip_id, trip_seat_id, status, expires_at)
payments(provider_order_id)
tickets(public_token_hash)
boarding_events(trip_id, scanned_at)
```

Jangan membuat puluhan index tanpa query nyata. Index final harus diverifikasi dengan query plan ketika fitur sudah berjalan.

---

# 22. API / Server Boundary

MVP menggunakan Next.js server layer, tetapi endpoint tetap dipisahkan menurut domain.

## 22.1 Public / passenger

```text
GET  /api/trips/search
GET  /api/trips/:tripId/seats
POST /api/seat-holds
DELETE /api/seat-holds/:id
POST /api/bookings
POST /api/bookings/:id/payment
GET  /api/bookings/:id
GET  /api/tickets/:token
POST /api/tickets/:id/claim
POST /api/reschedule-requests
```

## 22.2 Payment webhook

```text
POST /api/webhooks/midtrans
```

Requirements:

- raw/provider payload retained as needed,
- signature/status verification,
- idempotency,
- transaction boundary,
- always safe on retry.

## 22.3 Admin PO

```text
GET/POST/PATCH /api/admin/routes
GET/POST/PATCH /api/admin/stops
GET/POST/PATCH /api/admin/seat-templates
GET/POST/PATCH /api/admin/vehicles
GET/POST/PATCH /api/admin/trips
GET            /api/admin/trips/:id/manifest
POST           /api/admin/passengers/:id/reseat
POST           /api/admin/bookings/:id/refund
POST           /api/admin/reschedule-requests/:id/approve
POST           /api/admin/reschedule-requests/:id/reject
```

## 22.4 Crew

```text
GET  /api/crew/trips
GET  /api/crew/trips/:id/manifest
POST /api/crew/scan
POST /api/crew/tickets/:id/board
POST /api/crew/tickets/:id/claim-snack
POST /api/crew/cash-bookings
```

## 22.5 Super Admin

```text
GET  /api/super/companies
POST /api/super/companies
POST /api/super/companies/:id/suspend
POST /api/super/companies/:id/activate
```

---

# 23. Recommended Project Structure

```text
seatpax/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── search/
│   │   ├── trips/[tripId]/
│   │   ├── checkout/
│   │   └── tickets/
│   │
│   ├── admin/
│   ├── crew/
│   ├── superadmin/
│   └── api/
│
├── modules/
│   ├── auth/
│   ├── company/
│   ├── route/
│   ├── fleet/
│   ├── trip/
│   ├── inventory/
│   ├── booking/
│   ├── payment/
│   ├── ticket/
│   ├── manifest/
│   └── operations/
│
├── components/
│   ├── ui/
│   ├── seat-map/
│   ├── ticket/
│   └── manifest/
│
├── lib/
│   ├── db/
│   ├── supabase/
│   ├── authz/
│   ├── crypto/
│   └── providers/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── seed/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
│
└── docs/
```

Business logic harus berada di module/service, bukan tersebar di React component atau route handler.

---

# 24. Final Tech Stack Recommendation

## 24.1 Core

| Layer | Stack |
|---|---|
| Language | TypeScript |
| Full-stack framework | Next.js |
| UI | React |
| Styling | Tailwind CSS |
| Component primitives | shadcn/ui |
| Icons | Lucide |
| Validation | Zod |
| ORM / SQL layer | Drizzle ORM + PostgreSQL driver |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Tenant enforcement | Server authorization + Supabase RLS |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage bila perlu |
| Payment | Midtrans Sandbox |
| Seat Builder | dnd-kit |
| QR generation | Local JS library |
| QR scanning | Browser camera + QR scanner library |
| Crew client | Responsive PWA |
| Hosting | Vercel Hobby untuk portfolio |
| Unit/integration testing | Vitest |
| E2E | Playwright |
| Load test | k6 |
| Error monitoring | Sentry optional |

## 24.2 Kenapa Next.js satu aplikasi

Karena MVP tidak lagi membutuhkan native Bluetooth printing atau offline cash-sale kompleks.

Satu codebase dapat menangani:

```text
Passenger Web
Admin PO Web
Crew PWA
Super Admin Web
```

Routes:

```text
/search
/trips/[id]
/checkout
/tickets/[id]
/admin/*
/crew/*
/superadmin/*
```

## 24.3 Modular monolith

**FINAL:** Jangan microservices dulu.

```text
Next.js Modular Monolith
        ↓
PostgreSQL
```

Modul dipisah secara code boundary supaya jika suatu hari perlu:

```text
Next.js Frontend
      ↓
NestJS API
```

domain tidak perlu ditulis ulang.

---

# 25. Third-Party Ecosystem

## 25.1 Supabase

Dipakai sebagai satu provider untuk:

- PostgreSQL,
- Auth,
- RLS,
- Realtime,
- Storage optional.

Tujuan: mengurangi jumlah vendor pada demo.

## 25.2 Midtrans Sandbox

Dipakai untuk payment demo end-to-end.

Jangan menggunakan uang real.

## 25.3 Notification

Production concept:

```text
WhatsApp → fallback SMS
```

MVP:

```text
MockNotificationProvider
```

Interface:

```text
sendTicket()
sendClaimLink()
sendTripReminder()
```

Future adapters:

```text
WhatsAppProvider
SmsProvider
EmailProvider
```

## 25.4 QR

Tidak perlu external QR SaaS.

Generate sendiri dari application code.

## 25.5 Maps

**DEFERRED:** Tidak perlu Google Maps pada MVP.

Stop cukup memiliki nama, kota, dan alamat.

## 25.6 Monitoring

Sentry optional di fase polish.

---

# 26. Scalability Strategy

## 26.1 Yang harus dibedakan

```text
1 juta booking tersimpan
```

berbeda dari:

```text
5.000 user berebut seat yang sama dalam waktu bersamaan
```

Problem kedua lebih kritis untuk correctness.

## 26.2 Scale level 0 — Portfolio Rp0

```text
Next.js
Vercel Hobby
Supabase Free
Midtrans Sandbox
Mock Notification
```

## 26.3 Scale level 1 — Real users kecil

```text
Vercel paid / equivalent
Supabase paid compute
Connection pooling
Monitoring
```

Tidak perlu ubah domain.

## 26.4 Scale level 2 — Traffic meningkat

Tambahkan bila bottleneck nyata muncul:

```text
Redis
Queue Worker
Background jobs
Caching
Rate limiting
```

Gunakan queue untuk:

- notification,
- ticket PDF,
- reports,
- non-critical webhook side effects.

## 26.5 Scale level 3 — API separation

```text
Next.js frontend
      ↓
Dedicated NestJS API
      ↓
PostgreSQL
Redis
Workers
```

## 26.6 Scale level 4 — Very large system

Baru pertimbangkan:

```text
API Gateway
Inventory Service
Booking Service
Payment Service
Notification Service
Message Broker
Read Replicas
Redis Cluster
CDN/Object Storage
```

Kafka, Kubernetes, dan sharding bukan requirement awal.

---

# 27. UI / UX Information Architecture

## 27.1 Passenger — Mobile First

Tujuan: proses pencarian sampai ticket sependek mungkin.

### Public navigation

```text
Home
Search Result
Trip Detail
Seat Selection
Passenger Data
Checkout
Payment
Booking Success
My Tickets
Ticket Detail
Account
```

### Home / Search

Komponen:

```text
SeatpaxLogo
FromStopPicker
ToStopPicker
DatePicker
PassengerCount
SearchButton
RecentSearch(optional)
```

Prioritas UX:

- asal dan tujuan mudah ditukar,
- stop yang sama tidak boleh dipilih sebagai from/to,
- tanggal lampau disabled,
- loading state jelas.

### Search Result

Setiap trip card minimal menunjukkan:

```text
PO / Company
Departure time
Arrival estimate
Service class
Vehicle type optional
From → To
Available seats
Calculated fare
```

Rating marketplace tidak wajib MVP.

### Seat Selection

Komponen:

```text
TripSummary
SeatLegend
DynamicSeatGrid
HoldTimer
SelectedSeatSummary
FareBreakdown
ContinueButton
```

Seat visual states:

```text
AVAILABLE
SELECTED
HELD_BY_OTHER
BOOKED_ON_OVERLAPPING_SEGMENT
UNAVAILABLE / DISABLED
```

Hindari hanya mengandalkan warna; gunakan icon/border/label agar accessible.

### Checkout

Sections:

```text
Trip Summary
Passenger Forms
Seat Summary
Fare Breakdown
Payment Method / Midtrans
Terms
Pay Button
```

### Ticket Detail

```text
Company
Route
Departure
Passenger
Seat
Booking Code
Ticket QR
Boarding Status
Snack Status
Reschedule Action
```

Jika guest:

```text
[ Simpan tiket ke akun ]
```

---

# 28. Admin PO UI — Desktop Productivity

Admin dirancang desktop-first karena data padat dan seat builder lebih nyaman memakai mouse.

## 28.1 Navigation

```text
Dashboard
Trips
Routes & Stops
Fleet
Seat Templates
Bookings
Manifest
Reschedule Requests
Refunds
Reports
Settings
```

## 28.2 Dashboard

MVP cards:

- Trip hari ini.
- Total booking hari ini.
- Occupancy sederhana.
- Payment conflict count.
- Pending reschedule.
- Upcoming departure.

Hindari dashboard penuh vanity metrics yang tidak dipakai.

## 28.3 Route Builder

Layout:

```text
Route Name

Stop 1  [Bandung]   ↑ ↓ Remove
Stop 2  [Cianjur]   ↑ ↓ Remove
Stop 3  [Sukabumi]  ↑ ↓ Remove
Stop 4  [Bogor]     ↑ ↓ Remove

[ Add Stop ]
```

Di bawahnya fare matrix sederhana per adjacent segment + service class.

## 28.4 Seat Template Builder

Desktop split layout:

```text
┌────────────────────┬──────────────────────────────┐
│ Component Palette  │ Cabin Grid                  │
│                    │                              │
│ Seat               │ [DRIVER][    ][01]          │
│ Driver             │ [DOOR  ][    ][02]          │
│ Door               │ [03    ][04  ][05]          │
│ Aisle              │                              │
│ Facility           │                              │
└────────────────────┴──────────────────────────────┘
```

Actions:

- add/move cell,
- duplicate template,
- auto-number seat,
- rename seat,
- archive template.

## 28.5 Trip Management

Trip form:

```text
Route
Date
Departure Time
Service Class
Vehicle
Sales Open/Close optional
```

Preview harus menunjukkan:

```text
number of segments
seat capacity
fare summary
vehicle layout
```

## 28.6 Booking detail

Admin melihat:

```text
Booking code
Passenger list
Payment
Seats
Ticket status
Reschedule history
Refund history
Audit trail summary
```

## 28.7 Manifest

Filter:

```text
All
Not Boarded
Boarded
Snack Unclaimed
Needs Reseat
```

Table/card fields:

```text
Seat
Passenger
From
To
Payment
Boarding
Snack
```

---

# 29. Crew PWA Design

Crew bekerja di HP, mungkin sambil berdiri atau di bus. UI harus cepat, besar, dan minim typing.

## 29.1 Main screen

```text
Today's Trips
Active Trip

[ Open Manifest ]
[ Scan QR ]
[ Cash Sale ]
```

## 29.2 Active Trip Header

Tampilkan selalu:

```text
Route
Departure
Vehicle / Plate
Current status
Passenger count
Boarded count
```

## 29.3 Scanner

Full-screen camera dengan feedback besar.

Valid:

```text
✓ VALID
Budi Santoso
Seat 07
```

Invalid:

```text
✕ INVALID
Wrong trip / cancelled / unknown ticket
```

Jangan membuat crew membaca error teknis.

## 29.4 Passenger Trip Profile

Ini halaman pusat operasional.

```text
BUDI SANTOSO
Seat 07
Bandung → Bogor

Boarding
[ Mark Boarded ] / ✓ 07:53

Snack
[ Claim Snack ] / ✓ 08:02

Booking
PAID
```

## 29.5 Manifest mobile

Gunakan row card, bukan desktop table penuh.

```text
[07] Budi Santoso
Bandung → Bogor
Boarded ✓   Snack —
```

Tap membuka Passenger Trip Profile.

## 29.6 Cash Sale

Harus sangat pendek:

```text
From
To
Seat
Name
Phone/Email optional
Fare
[ Terima Cash ]
```

Tidak ada printer requirement pada MVP.

---

# 30. Super Admin UI

Minimal pages:

```text
Platform Overview
Companies
Company Detail
```

Company card/detail:

```text
Name
Status
Admin count
Trips count optional
[ Suspend ] / [ Activate ]
```

Tidak perlu financial marketplace dashboard pada MVP.

---

# 31. Visual Design Direction

## 31.1 Brand name

**Seatpax** = Seat + Pax (passenger).

## 31.2 Brand direction lama

Brainstorming awal menyarankan:

```text
Midnight Navy #0F172A
Amber         #F59E0B
Tangerine     #F97316
```

**Status:** Suggested, **belum wajib/final**. Jangan hard-code keputusan desain hanya karena pernah dibahas.

## 31.3 Visual principles

- Passenger: clean, travel-oriented, mobile-first.
- Admin: dense but readable, desktop productivity.
- Crew: high contrast, large touch targets, one-hand friendly.
- Status tidak hanya menggunakan warna.
- Critical action mempunyai confirmation dan destructive styling yang jelas.
- QR scanner feedback harus bisa dikenali dalam <1 detik.

## 31.4 Typography

Gunakan font web system / open-source yang tersedia tanpa dependency aneh. Prioritas:

- legibility,
- tabular number support untuk fare/time jika memungkinkan,
- hierarchy yang jelas.

## 31.5 Spacing & touch target

Crew/passenger touch target minimal sekitar 44px.

Admin boleh lebih padat tetapi tetap konsisten dengan 4/8px spacing system.

---

# 32. UX States yang Wajib Dirancang

Setiap page penting minimal mempunyai:

```text
Loading
Empty
Success
Error
Disabled
Permission denied
Network failure
```

Khusus seat map:

```text
No seats available
Hold expired
Seat taken while selecting
Payment still pending
Payment conflict
```

Khusus scanner:

```text
Camera permission denied
Unknown QR
Wrong trip
Cancelled ticket
Already boarded
Snack already claimed
```

Khusus manifest:

```text
No passengers
Passenger needs reseat
Trip cancelled
```

---

# 33. Security Model

## 33.1 Authentication

- Supabase Auth.
- Google OAuth / Email OTP untuk passenger.
- Internal authenticated account untuk Admin/Crew/Super Admin.

## 33.2 Authorization

Setiap mutation server harus mengecek:

```text
authenticated?
role allowed?
company allowed?
resource belongs to company?
state transition valid?
```

Jangan hanya hide button di frontend.

## 33.3 RLS

RLS dipakai sebagai defense-in-depth untuk data tenant.

Contoh konseptual:

```text
ADMIN_PO can SELECT trip
IF membership.company_id = trip.company_id
```

Service role key tidak boleh dikirim ke browser.

## 33.4 Input validation

Semua request penting melalui Zod / schema validation.

Jangan percaya:

- price dari frontend,
- company_id dari frontend,
- seat availability dari frontend,
- role dari frontend,
- payment status dari frontend.

## 33.5 Price calculation

Harga dihitung server berdasarkan:

```text
route
from/to segment
service class
```

Frontend hanya menampilkan quote.

## 33.6 QR token

QR gunakan random high-entropy token / opaque identifier.

Server menyimpan hash jika memungkinkan.

Jangan isi QR hanya dengan sequential ticket ID seperti `1234`.

## 33.7 Webhook

- Verify provider authenticity.
- Idempotency.
- Store relevant raw payload for audit/debug.
- Never trust client callback.

## 33.8 Audit trail

Mutation sensitif dicatat:

```text
who
role
what
entity
when
before/after
```

---

# 34. Reliability & Failure Handling

## 34.1 Seat conflict

Jika hold gagal:

```text
409 CONFLICT
Seat no longer available
```

Client reload availability.

## 34.2 Hold expiry

Saat timer selesai:

```text
Checkout disabled
Seat released
User kembali ke seat selection
```

## 34.3 Payment provider timeout

Jangan langsung menyatakan gagal permanen.

Status:

```text
PENDING
```

Sediakan status polling/recheck bila perlu.

## 34.4 Late payment

Masuk `PAYMENT_CONFLICT`, tidak otomatis issue ticket pada inventory yang sudah mungkin dijual.

## 34.5 Realtime down

Booking tetap aman.

Client dapat fallback ke refresh/polling karena database adalah source of truth.

## 34.6 QR scanner failure

Crew dapat search passenger secara manual dari manifest.

Ini penting sebagai operational fallback.

---

# 35. Offline Strategy

## 35.1 MVP

Crew membutuhkan internet untuk:

- cash sale,
- mutation boarding/snack jika implementation belum mempunyai offline cache.

QR ticket milik passenger tetap dapat discreenshot karena gambar QR statis.

## 35.2 Optional MVP bonus

Jika waktu cukup, boarding scan dapat memakai pre-cached manifest atau PWA cache sederhana.

Namun jangan memasukkan full bidirectional offline sync tanpa waktu testing yang cukup.

## 35.3 Future offline-first

Design yang pernah dibahas dan dapat menjadi roadmap:

```text
Trip Snapshot
SQLite/local DB
Outbox Events
Signed QR (Ed25519)
Offline boarding
Offline cash sale
Reserved offline inventory
Conflict reconciliation
```

Status: **FUTURE**, bukan janji MVP.

---

# 36. Testing Strategy

## 36.1 Unit tests

Target utama:

- segment overlap function,
- fare calculation,
- role checks,
- booking state transition,
- reschedule amount calculation,
- QR entitlement rules.

Contoh segment test:

```text
A Bandung→Cianjur
B Cianjur→Bogor
Expected: no overlap
```

```text
A Bandung→Sukabumi
B Cianjur→Bogor
Expected: overlap
```

## 36.2 Integration tests

Test database transaction:

- hold seat,
- hold overlapping segment,
- non-overlap reuse,
- hold expiry,
- confirm booking,
- webhook duplicate,
- boarding double action,
- snack double claim,
- tenant isolation.

## 36.3 Concurrency test — wajib

Ini salah satu nilai portfolio terbesar.

Scenario:

```text
50 concurrent requests
same trip
same seat
same segment
```

Expected:

```text
1 success
49 conflict/failure
0 double booking
```

Scenario kedua:

```text
25 request Bandung→Cianjur
25 request Cianjur→Bogor
same seat
```

Karena segment tidak overlap, secara teori dua booking berbeda dapat menggunakan seat yang sama pada interval yang tidak overlap, tetapi tiap interval tetap hanya boleh dimiliki satu passenger.

## 36.4 E2E Playwright

Minimal journey:

```text
Admin creates trip
Passenger searches
Passenger selects seat
Booking created
Mock/Sandbox payment success
Ticket appears
Crew scans/opens ticket
Boarding marked
Snack claimed
```

## 36.5 RLS tests

- Admin PO A membaca trip A → allowed.
- Admin PO A membaca trip B → denied.
- Crew A update boarding trip B → denied.
- Passenger melihat ticket milik user lain → denied.

## 36.6 Load test

Gunakan k6 untuk:

- search endpoint,
- seat availability,
- seat hold contention,
- webhook burst simulation.

Tujuan demo bukan mengklaim "mampu jutaan request", tetapi menunjukkan bottleneck dan consistency diuji.

---

# 37. Non-Functional Requirements

## Correctness

- Tidak boleh double-book overlapping segment.
- Payment webhook retry tidak boleh duplicate ticket.
- Snack claim tidak boleh double.
- Tenant data tidak boleh bocor.

## Performance target demo

Target lokal/free-tier yang realistis, bukan SLA production:

- Search terasa responsif.
- Seat selection feedback cepat.
- QR passenger profile muncul cepat setelah scan.
- Manifest mampu menangani puluhan passenger tanpa masalah.

## Maintainability

- Domain logic tidak berada di component UI.
- Provider external dibungkus adapter.
- Migration versioned.
- Seed deterministic.

## Observability

Minimum:

- structured server log,
- payment event log,
- audit log untuk mutation penting.

Optional:

- Sentry.

---

# 38. Demo Data Strategy

Gunakan minimal dua PO untuk menunjukkan tenant isolation tanpa harus membuat onboarding PO.

Contoh:

```text
PO Nusantara
PO Maju Jaya
```

## 38.1 Route demo utama

```text
Bandung
  ↓
Cianjur
  ↓
Sukabumi
  ↓
Bogor
```

Kenapa route ini cocok untuk demo:

- 4 stop,
- 3 segment,
- gampang menunjukkan seat reuse,
- mudah menjelaskan overlap.

## 38.2 Seat demo

Gunakan seat template kecil 10–12 seat supaya visual jelas.

Demo skenario:

```text
Seat 07
Budi: Bandung → Cianjur
Andi: Cianjur → Bogor
```

Kemudian tunjukkan user lain gagal membeli:

```text
Seat 07
Bandung → Sukabumi
```

jika segment overlap dengan booking yang aktif.

## 38.3 Demo role accounts

Seed:

```text
superadmin@demo
admin.po.a@demo
crew.po.a@demo
passenger@demo
```

Gunakan credential demo yang aman hanya di environment lokal/demo, jangan production secrets.

---

# 39. Demo Script untuk Presentasi

## Scene 1 — Masalah

Jelaskan:

```text
Bandung → Cianjur → Sukabumi → Bogor
```

"Kursi tidak bisa dianggap booked sepanjang perjalanan."

## Scene 2 — Admin PO

- buka route,
- tunjukkan stop sequence,
- tunjukkan seat template,
- buka trip.

## Scene 3 — Passenger A

- search Bandung → Cianjur,
- pilih Seat 07,
- bayar sandbox,
- dapat QR.

## Scene 4 — Passenger B

- search Cianjur → Bogor,
- Seat 07 masih available,
- booking seat yang sama.

Ini adalah **wow moment utama**.

## Scene 5 — Concurrency proof

Tunjukkan test output 50 parallel requests dan hanya satu hold pada overlapping segment berhasil.

## Scene 6 — Crew

- buka manifest,
- scan QR,
- passenger profile muncul,
- mark boarded,
- claim snack.

## Scene 7 — Tenant isolation

Login sebagai Admin PO lain dan tunjukkan data PO A tidak dapat diakses.

---

# 40. Development Roadmap — 12 Weeks

> Roadmap ini dibuat untuk solo developer dan sengaja memberi prioritas pada correctness sebelum polish.

## Week 1 — Foundation

- project setup,
- Supabase project,
- Drizzle schema skeleton,
- auth,
- 4 role mapping,
- membership + company,
- basic RLS,
- seed dua PO.

**Gate:** Login + tenant isolation dasar bekerja.

## Week 2 — Route & Pricing

- Stop CRUD,
- Route CRUD,
- RouteStop ordering,
- Service Class,
- Segment Fare,
- fare calculation tests.

**Gate:** Admin dapat membentuk route multi-stop dan sistem menghitung fare.

## Week 3 — Fleet & Seat Template

- Seat Template CRUD,
- grid builder,
- duplicate template,
- vehicle registration,
- assign template.

**Gate:** Admin dapat membuat vehicle dengan layout dinamis.

## Week 4 — Trip Engine

- Trip CRUD,
- route/vehicle/service-class assignment,
- trip segment snapshot,
- trip seat snapshot,
- generate seat inventory.

**Gate:** Trip siap dijual.

## Week 5 — Seat Availability & Hold

- segment overlap,
- availability endpoint,
- seat map,
- 10-minute hold,
- hold expiry,
- database locking.

**Gate:** Tidak ada double hold pada overlapping segment.

## Week 6 — Concurrency & Booking

- booking creation,
- booking passengers,
- seat assignment,
- guest booking,
- concurrency integration test,
- k6 contention test.

**Gate:** 50 concurrent overlapping attempts tidak double-book.

## Week 7 — Midtrans Sandbox

- payment adapter,
- Snap transaction,
- webhook,
- payment events,
- idempotency,
- payment grace,
- `PAYMENT_CONFLICT`.

**Gate:** Search → payment → confirmed booking end-to-end bekerja.

## Week 8 — Ticket & Account Claim

- QR ticket,
- ticket page,
- Google auth,
- Email OTP,
- guest ticket claim,
- My Tickets.

**Gate:** Booking guest dapat di-claim dan dibuka cross-device setelah login.

## Week 9 — Manifest & Crew

- Crew PWA layout,
- active trip,
- manifest,
- manual passenger search,
- QR scanning,
- passenger trip profile,
- boarding event,
- snack claim.

**Gate:** Ticket confirmed muncul di manifest dan dapat di-board.

## Week 10 — Admin Operations

- reseat,
- reschedule request basic,
- refund basic/mock,
- trip cancel flow,
- basic audit log.

**Gate:** Edge case MVP utama bisa ditangani tanpa edit database manual.

## Week 11 — Super Admin + Polish

- companies list,
- activate/suspend,
- dashboard minimal,
- empty/error states,
- accessibility basics,
- responsive polish,
- Sentry optional.

## Week 12 — Testing, Docs & Presentation

- E2E,
- RLS tests,
- load test report,
- demo seed/reset,
- README,
- screenshots,
- architecture diagram,
- rehearsal.

---

# 41. Cut Line jika Waktu Habis

Urutan fitur yang boleh dipotong jika deadline mendekat:

1. Sentry.
2. Dashboard analytics tambahan.
3. Refund provider real; gunakan mock/manual state.
4. Reschedule UI kompleks; pertahankan basic admin flow.
5. Duplicate seat template polish.
6. Realtime fancy animation; fallback refresh masih boleh.
7. Super Admin overview analytics; pertahankan company management saja.

Yang **jangan dipotong**:

1. Multi-stop route.
2. Seat per segment.
3. Concurrency correctness.
4. Payment webhook idempotency.
5. QR → passenger trip profile.
6. Manifest.
7. Boarding + snack claim.
8. Tenant isolation.

---

# 42. Acceptance Criteria — MVP Definition of Done

Seatpax MVP dianggap selesai jika skenario berikut dapat didemokan tanpa edit database manual.

## 42.1 Tenant

- [ ] Super Admin dapat membuat/mengaktifkan PO.
- [ ] Admin PO A tidak dapat melihat data PO B.
- [ ] Crew PO A tidak dapat mutate trip PO B.

## 42.2 Route

- [ ] Admin dapat membuat route dengan ≥4 stop.
- [ ] Urutan stop tersimpan benar.
- [ ] Fare multi-segment dihitung dari segment fare.

## 42.3 Fleet

- [ ] Admin dapat membuat seat template grid.
- [ ] Vehicle memakai template.
- [ ] Trip menghasilkan snapshot seat.

## 42.4 Seat inventory

- [ ] Seat yang booked Bandung→Cianjur dapat dijual Cianjur→Bogor.
- [ ] Seat yang booked Bandung→Sukabumi tidak dapat dijual Cianjur→Bogor.
- [ ] Active hold memblokir overlapping purchase.
- [ ] Expired hold melepaskan inventory.

## 42.5 Concurrency

- [ ] 50 request pada seat/segment yang sama tidak menghasilkan double booking.
- [ ] Database tetap konsisten setelah test.

## 42.6 Payment

- [ ] Midtrans Sandbox transaction dapat dibuat.
- [ ] Webhook sukses meng-confirm booking.
- [ ] Duplicate webhook tidak duplicate ticket.
- [ ] Late success dapat masuk `PAYMENT_CONFLICT`.

## 42.7 Ticket

- [ ] Setiap booking passenger mempunyai QR sendiri.
- [ ] Guest dapat melihat ticket setelah booking.
- [ ] Ticket dapat di-claim via authenticated account.

## 42.8 Manifest

- [ ] Confirmed passenger muncul pada manifest trip.
- [ ] Crew dapat search passenger.
- [ ] Scan QR membuka passenger trip profile.

## 42.9 Operations

- [ ] Crew dapat mark boarded.
- [ ] Boarding tidak duplicate.
- [ ] Crew dapat claim snack.
- [ ] Snack claim tidak duplicate.

---

# 43. Key Risks

## 43.1 Scope creep

Risiko terbesar proyek.

Mitigasi:

- gunakan scope lock,
- semua ide baru masuk backlog,
- jangan implement future scope sebelum MVP gate selesai.

## 43.2 Seat inventory correctness

Bug dapat menyebabkan double booking.

Mitigasi:

- DB transaction,
- row/advisory locking sesuai implementasi,
- integration test,
- concurrency test.

## 43.3 Payment inconsistency

Mitigasi:

- webhook source of truth,
- event idempotency,
- state transition validation,
- payment event audit.

## 43.4 RLS misconfiguration

Mitigasi:

- server-side authorization tetap ada,
- dedicated RLS tests,
- jangan expose service role key.

## 43.5 Seat template mutation

Jika template lama diedit setelah banyak trip dibuat, trip historis dapat berubah jika tidak snapshot.

Mitigasi:

- trip memiliki seat snapshot,
- version/archive template,
- perubahan template tidak retroaktif ke trip lama.

## 43.6 Free-tier limitations

Mitigasi:

- deterministic seed/reset,
- jangan klaim capacity production berdasarkan free-tier,
- dokumentasikan scaling path.

---

# 44. Deferred / Future Backlog Detail

## 44.1 Full Offline Crew App

Potential architecture:

```text
Server
  ↓ pre-trip snapshot
Local SQLite
  ↓
Crew operations
  ↓
Outbox
  ↓ reconnect
Server sync
```

Butuh:

- idempotent client events,
- device identity,
- conflict strategy,
- manifest versioning,
- offline authorization,
- security review.

## 44.2 Offline Cash Sale

Masalah utama: server dan offline device dapat menjual seat sama.

Potential strategies yang pernah dibahas:

- reserved offline seat quota,
- local serial ticket,
- sync reconciliation,
- `NEEDS_RESEAT`,
- `OVERBOOKED_CONFLICT`.

Status: **DEFERRED karena kompleksitas sangat tinggi.**

## 44.3 Bluetooth Printer

Future:

- Android native/hybrid,
- BLE connection,
- ESC/POS,
- print retry,
- paper-out handling,
- duplicate print tracking.

MVP tidak membutuhkan hardware.

## 44.4 Marketplace Rating

Future verified reviews hanya dari completed trip.

Potential dimensions:

- kebersihan,
- punctuality,
- keramahan kru,
- fasilitas.

Jangan implement ranking algorithm di MVP.

## 44.5 Escrow & Payout

Future financial domain:

```text
Passenger Payment
      ↓
Platform Balance
      ↓
Trip Completion
      ↓
Commission
      ↓
PO Available Balance
      ↓
Withdrawal
```

Membutuhkan ledger yang matang; tidak masuk MVP.

## 44.6 Live Tracking

Future:

- GPS crew/vehicle,
- location stream,
- passenger ETA,
- geofence.

Tidak masuk MVP.

---

# 45. Decision Ledger — Final MVP

| Decision | Final Choice |
|---|---|
| Product | Multi-PO Seatpax platform |
| Main differentiator | Seat inventory per segment + passenger operations |
| Route model | Multi-stop penuh |
| Route vs Trip | Dipisah |
| Stops | `Stop` + `RouteStop.sequence` |
| Segment | Derived from route structure, snapshot on Trip |
| Pricing | Per segment + service class |
| Normal passenger seat | Satu seat dari origin ke destination |
| Reseat | Admin PO + Crew |
| Missed bus | Tidak otomatis pindah trip |
| Reschedule | Passenger request, Admin approve |
| Reschedule charge | Fare difference + configurable fee |
| PO/system fault | No passenger fee; downgrade refunds difference |
| PO trip cancellation | Reschedule or full refund |
| Seat hold | 10 menit |
| Payment grace | +1 menit if payment initiated |
| Late payment | `PAYMENT_CONFLICT` manual review |
| QR | 1 QR per passenger |
| QR use | Boarding + snack/entitlements |
| Manifest | Per Trip |
| Passenger scan target | Passenger Trip Profile |
| Boarding scanner | Crew / gate represented by CREW role |
| Roles | PASSENGER, ADMIN_PO, CREW, SUPER_ADMIN |
| RBAC | Static RBAC |
| Tenant isolation | Yes |
| Passenger login | Google OAuth + Email OTP |
| Guest booking | Yes |
| Cross-device | Verified account/claim required |
| Cash booking | Crew, online only |
| Offline cash | Deferred |
| Bluetooth printer | Deferred |
| Crew client | PWA |
| Database | PostgreSQL / Supabase |
| Realtime | Supabase Realtime |
| Payment | Midtrans Sandbox |
| Notification | Mock provider for demo |
| Architecture | Next.js modular monolith |
| Redis | Not required MVP |
| Microservices | Not MVP |

---

# 46. Historical Ideas vs Current Direction

Bagian ini menjaga konteks brainstorming agar ide lama tidak hilang.

## Pernah dibahas dan masih memengaruhi desain

- Visual Seat Builder.
- Seat template berbasis grid.
- Karoseri modifikasi.
- On-board cash sale.
- QR sebagai boarding + facility claim.
- Passenger manifest.
- Multi-tenant PO.
- RBAC.
- Offline reliability.
- Thermal printer.
- marketplace rating.
- payout/ledger.

## Yang tetap masuk MVP setelah pemangkasan

- visual seat builder,
- dynamic seat template,
- online cash sale,
- QR boarding/facility claim,
- manifest,
- multi-tenant,
- RBAC,
- segment seat inventory.

## Yang dipindah ke future

- printer,
- offline cash,
- deep offline sync,
- marketplace financial layer,
- rating algorithm,
- GPS tracking,
- microservices.

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

# 49. Pertanyaan Penguji yang Harus Bisa Dijawab

## "Kenapa tidak pakai status seat BOOKED saja?"

Karena satu seat dapat dipakai kembali pada segment yang tidak overlap.

## "Bagaimana mencegah double booking?"

Seat hold dilakukan server-side dengan PostgreSQL transaction/locking dan availability selalu dicek ulang sebelum commit.

## "Kalau realtime telat?"

Realtime hanya UX. Database tetap source of truth.

## "Kalau webhook Midtrans dikirim dua kali?"

Payment event idempotency + unique provider event/order identity.

## "Bagaimana kalau Admin PO A mencoba akses data PO B?"

Server authorization + company membership + RLS.

## "Kenapa tidak microservices?"

Traffic demo tidak membutuhkannya. Modular monolith lebih sederhana, lebih mudah dites, dan domain module masih bisa diekstrak jika scaling benar-benar menuntut.

## "Apakah bisa handle jutaan booking?"

Jumlah booking tersimpan bukan satu-satunya problem. Correctness pada concurrent seat purchase lebih penting. Arsitektur memakai PostgreSQL sebagai source of truth dan memiliki scaling path melalui compute upgrade, pooling, cache, queue, read replica, lalu service separation jika dibutuhkan.

## "Kenapa WhatsApp/SMS tidak real?"

Project tidak memiliki budget. Notification menggunakan provider abstraction + mock adapter pada demo, sehingga production provider dapat ditambahkan tanpa mengubah domain flow.

## "Kenapa crew bukan React Native?"

Setelah Bluetooth printer dan offline cash kompleks dipangkas, kebutuhan crew MVP dapat dipenuhi PWA: camera scan, manifest, boarding, snack, dan online cash booking.

---

# 50. Final Product Boundary

Jika sebuah ide baru muncul, tanyakan empat hal:

1. Apakah memperkuat **segment seat inventory**?
2. Apakah memperkuat **booking correctness**?
3. Apakah memperkuat **passenger operations / manifest**?
4. Apakah wajib agar demo end-to-end bekerja?

Jika semua jawabannya "tidak", fitur tersebut masuk backlog terlebih dahulu.

Core Seatpax tetap:

```text
MULTI-STOP ROUTE
      +
SEGMENT SEAT INVENTORY
      +
CONCURRENCY-SAFE BOOKING
      +
PAYMENT
      +
QR TICKET
      +
TRIP MANIFEST
      +
BOARDING / FACILITY CLAIM
      +
MULTI-TENANT OPERATOR MANAGEMENT
```

---

# 51. Master Source-of-Truth Rule

Mulai setelah dokumen ini dibuat:

- Ide baru tidak otomatis mengubah MVP.
- Perubahan MVP harus memperbarui **Decision Ledger**.
- Schema berubah hanya jika business rule berubah atau implementasi membuktikan model tidak cukup.
- Future feature tidak boleh diam-diam masuk sprint MVP.
- Dokumen ini harus diperbarui bersama migration/API contract ketika keputusan teknis besar berubah.

Dengan aturan ini, Seatpax tidak lagi menjadi kumpulan brainstorming lepas, tetapi menjadi spesifikasi produk dan engineering yang bisa dipakai sebagai dasar desain Figma, implementasi, testing, README, dan presentasi.
