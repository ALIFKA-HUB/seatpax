# Seatpax — Risks, Deferred Scope & Future Backlog

> **Active release — 6 Oktober 2026:** Backlog release aktif sekarang juga mencakup guest/Google login, booking grup, cash sale, reschedule, reseat dan general cancellation/refund workflows. Risiko correctness/tenant isolation tetap wajib ditangani dalam core release. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


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
