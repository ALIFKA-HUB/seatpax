# Seatpax — API Boundary & Project Structure

> **Implementation update — 9 October 2026:** Manifest and explicit once-only boarding are implemented for assigned active crew, with same-tenant Admin read-only access, minimum passenger data, origin-stop validation and immutable event retries. QR resolves only; snack and offline operations remain subsequent work. See `../setup/MANIFEST_BOARDING_SETUP.md` for evidence and pending physical-camera acceptance.


> **Implementation update — 8 October 2026:** Checkout services live in modules/booking, provider/event/confirmation/conflict services in modules/payment and QR crypto/access in modules/ticket. Server actions obtain verified actor; POST /api/payments/midtrans persists authenticated receipts and processes best effort. Bounded db:reconcile-payments recovers failed/missing callbacks. Owner routes: /checkout/[holdId], /bookings/[bookingId], /tickets and /tickets/[ticketId]. Admin conflict/review queue remains tenant scoped. See `../setup/CHECKOUT_PAYMENT_SETUP.md`.

> **Fondasi diadopsi — D2026-10-06-02:** Tambahkan GET/POST /api/admin/trips/:id/crew-assignments, DELETE /api/admin/trips/:id/crew-assignments/:userId dan POST /api/admin/bookings/:id/payment-conflict/resolve (CONFIRM atau MOCK_REFUND, alasan wajib/idempotent). DELETE hold hanya sebelum initiation. Ticket token route wajib authorization; scan read-only, board/snack terpisah. Handler tipis memanggil domain service; transaction/authz mengikuti fondasi. Acuan: [rancangan fondasi](../superpowers/specs/2026-10-06-foundation-design.md) dan [ledger](19_DECISION_LEDGER.md). Kontrak ini mendahului uraian lama yang berbeda; implementasi belum dibuat.

> **Active release — 6 Oktober 2026:** Endpoint guest ticket claim, cash booking, reseat dan reschedule serta refund umum pada daftar lama bukan endpoint wajib release aktif. Implementasikan retained flow dan minimal payment-conflict resolution sesuai scope aktif; kontrak detailnya mengikuti fondasi diadopsi. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.

## Implemented Trip Engine boundary — 7 October 2026

Trip actions and data adapters are in `app/admin/trip-actions.ts`, `app/admin/trip-data.ts` and `app/crew/data.ts`; guarded business logic is in `modules/trip/`. Admin pages support draft list/create/edit, publication, snapshot detail and crew assignment. Crew pages list and read assigned published trips. These are server actions/data adapters, not the REST endpoint sketches below. No passenger search/availability, hold, booking or payment endpoint is part of this slice. Evidence and browser limitations: [Trip Engine setup](../setup/TRIP_ENGINE_SETUP.md).

Fleet admin server actions and tenant-scoped services are implemented in `app/admin/fleet-actions.ts` and `modules/fleet/`. They accept no client-supplied actor/company fields; the verified user and active ADMIN_PO guard establish the tenant context. See [fleet setup evidence](../setup/FLEET_SETUP.md). Older endpoint sketches below remain conceptual and are not separately exposed REST APIs.


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

## Adopted availability and hold slice — 7 October 2026

The approved availability/hold design and plan implement public snapshot search/quote, half-open interval availability, owner-only single-seat ten-minute holds, idempotent request keys, release and logical expiry with bounded cleanup. Company/trip guards and ordered seat×segment locks precede DB-time eligibility and occupancy checks. Snapshot inventory is now used for active holds; confirmed bookings and payment conversion remain unimplemented. RLS/browser revokes protect hold tables. See [availability design](../superpowers/specs/2026-10-07-availability-hold-design.md) and [setup evidence](../setup/AVAILABILITY_HOLD_SETUP.md).
