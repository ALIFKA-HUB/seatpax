# Seatpax — MVP Scope & Product Boundary


> Modular documentation extracted from the Seatpax master specification.


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
