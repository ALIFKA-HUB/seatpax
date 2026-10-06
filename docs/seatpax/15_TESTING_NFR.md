# Seatpax — Testing & Non-Functional Requirements


> Modular documentation extracted from the Seatpax master specification.


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
