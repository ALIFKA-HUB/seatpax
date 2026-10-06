# Seatpax — Decision Ledger & Historical Direction

## D2026-10-06-01 — Adopt 30-day demo release

**Status: ADOPTED.** User approved the reduced scope package on 6 October 2026 with “oke” after reviewing the retained/deferred scope summary and linked proposal.

**Reason:** Available implementation time is 2–3 hours/day for 30 days. Preserve the demonstrable core inventory/payment/operations flow and explicitly defer broader MVP features.

| Decision changed | Active choice |
| --- | --- |
| Release target | End-to-end demo subset, 6 October–4 November; not the full original MVP |
| Passenger login | Email OTP before checkout; Google OAuth deferred |
| Guest access/claim | Deferred; logged-in owner uses My Tickets |
| Booking size | One passenger/seat per booking; group checkout deferred |
| Cash sale | Deferred |
| Reschedule/reseat | Deferred for this release |
| Cancellation/refund operations | General workflow deferred; late payment retains minimal admin inventory recheck/confirmation or mock/manual refund recording |
| Realtime | Polling/refresh baseline; live subscriptions can be deferred |
| Company/account setup | Two PO and internal accounts seeded; company onboarding/invitation UI deferred; Super Admin list/activate/suspend retained |
| Seat builder | Click-cell grid; drag-and-drop/polish deferred |

**Unchanged core:** Multi-stop/segment fare, one seat per passenger interval, concurrency correctness, 10-minute hold/+1-minute conditional grace, Sandbox verified/idempotent webhook, QR per passenger, manifest, boarding/snack, four roles, tenant isolation and crew assignment boundaries.

**Authority:** [Active release scope](02_MVP_SCOPE.md) and its release acceptance checklist. Earlier decisions below retain context and future behavior, but do not restore deferred features to this release.

**Pending:** Technical foundation F01–F11 in [Day 1 proposal](../superpowers/specs/2026-10-06-day1-scope-foundation-proposal.md) need separate review. This scope adoption does not approve all schema/security/deadline defaults.


> Modular documentation extracted from the Seatpax master specification.


# 45. Original MVP Decision Ledger — reference before D2026-10-06-01

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
