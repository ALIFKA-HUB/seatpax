# Seatpax — Route, Segment, Seat Inventory & Concurrency


> Modular documentation extracted from the Seatpax master specification.


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
