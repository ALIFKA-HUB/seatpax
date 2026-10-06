# Seatpax — API Boundary & Project Structure

> **Active release — 6 Oktober 2026:** Endpoint guest ticket claim, cash booking, reseat dan reschedule serta refund umum pada daftar lama bukan endpoint wajib release aktif. Implementasikan retained flow dan minimal payment-conflict resolution sesuai scope aktif; kontrak detailnya masih perlu ditetapkan. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


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
