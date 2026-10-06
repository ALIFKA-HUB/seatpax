# Seatpax — Development Roadmap


> Modular documentation extracted from the Seatpax master specification.


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
