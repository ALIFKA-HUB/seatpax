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

**Foundation:** Subsequently adopted separately as D2026-10-06-02 below.

## D2026-10-06-02 — Adopt retained-flow technical foundation

**Status: ADOPTED.** On 6 October 2026 the user approved the written design with “fondasi oke, lanjut”. Authority: [reviewed foundation](../superpowers/specs/2026-10-06-foundation-design.md), sections 1–7, refining F01–F11. This approves the design, not a claim of implemented behavior.

- Active membership and assigned-trip authorization; admin manages crew assignments within its PO. Privileged server authorization and exposed-table RLS are distinct safeguards.
- Atomic immutable stop/time/fare/layout snapshots at first publish; stop-origin cutoff and explicit crew boarding context.
- Pre-created seat×segment anchors, deterministic inventory locks, post-lock actual DB time, logical expiry independent of cleanup. Sales company guard `FOR SHARE` serializes against suspension `FOR UPDATE`.
- Login-only owner hold, one hold/booking/passenger, fixed 10-minute base deadline, one +60-second grace on persisted valid server initiation before cutoff/base deadline. Provider calls outside transaction; same-order retry; manual release only before initiation.
- Confirmation deadline uses processing time after lock. Verified late payment records PAID plus PAYMENT_CONFLICT without ticket. Admin confirms only after eligibility/availability recheck or records terminal MOCK refund with audit; original financial success retained.
- Stable random QR token with unique hash and encrypted ciphertext; authenticated owner/tenant admin/assigned crew resolve. Boarding/snack uniquely recorded, scan read-only, snack after boarding.
- Suspension denies publish/new hold/new initiation; valid initiated flow and existing tickets continue. Reactivation restores eligible sale-ready trips without resurrecting expired/terminal resources.

**Superseded proposal:** Initial F06 receipt-time recommendation and F07 unspecified server-only token storage are replaced by processing-time confirmation and encrypted stable token in the adopted design. Deferred features retain D2026-10-06-01 boundaries.

**Implementation boundary:** Day 2 is app/configuration/connection; Day 3 auth flow; Day 4 tenant schema/RLS/seed; remaining domain contracts follow their calendar tasks. Midtrans exact event key/status mapping still requires official-provider integration review on the payment slice. The user selected `executing-plans` for inline execution; the concrete setup plan requires its written review before implementation.


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
