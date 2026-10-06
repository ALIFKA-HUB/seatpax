# Seatpax — Domain Glossary & Core Business Rules

> **Active release — 6 Oktober 2026:** Cash sale, reschedule, operational reseat, vehicle replacement pada trip terjual, dan cancellation/refund workflow umum ditunda dari release aktif. Aturan historisnya di bawah dipertahankan sebagai referensi. Inventory, fare, hold/grace, dan payment conflict tetap masuk; detail fondasi belum seluruhnya diadopsi. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


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
