# Seatpax — Decision Ledger & Historical Direction

## D2026-10-07-01 — Approve tenant access foundation

**Status: APPROVED DESIGN.** User approved [tenant access spec](../superpowers/specs/2026-10-07-tenant-access-design.md) with “spec oke” and its [implementation plan](../superpowers/plans/2026-10-07-tenant-access.md) with “Plan oke, lanjut eksekusi”. This refines D2026-10-06-02 without expanding release scope.

- Three initial application tables: users, companies, memberships; profile FK to Auth and membership FKs use RESTRICT.
- Tenant memberships require company; SUPER_ADMIN requires NULL company. Separate partial unique indexes enforce tenant and global uniqueness, replacing the earlier NULL-sensitive single UNIQUE proposal.
- Fresh database membership authorization at server boundary; no privilege from user metadata or Super Admin fallback into tenant operations.
- RLS enabled and anon/authenticated privileges revoked on these tables; browser direct policies remain absent on this slice.
- Two-company seed uses explicit existing Auth IDs, dry-run default and immutable mappings; reruns preserve disabled/suspended state.

Implementation/verification evidence belongs in [tenant setup](../setup/TENANT_ACCESS_SETUP.md); approval alone does not imply hosted seed completed.

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

## D2026-10-07-02 — Route/pricing template slice (FINAL)

Approved spec and plan: active ADMIN_PO manages stops, service classes, ordered route templates and adjacent IDR fares; quote preview only. Adopt 2–50 unique stops (no loops), bounded nullable monotonic offsets, revision conflicts, soft deactivation, exact decimal-string/bigint price, missing fare distinct from zero, and clearing all fares before structural changes. Template management remains allowed when the company is suspended; global Super Admin alone grants no tenant template editing. Conflict keeps the draft and requires reviewing latest data or explicitly confirming overwrite. Trip snapshot/inventory/payment remain subsequent work. See ../superpowers/specs/2026-10-07-route-pricing-design.md.

## D2026-10-07-03 — Fleet and seat-template source slice (FINAL)

Approved spec and plan: active ADMIN_PO manages reusable rectangular seat templates and company vehicles. Templates have six explicit cell types, validated complete grids, normalized unique seat codes, derived capacity, soft archive/reactivation and version conflicts. Vehicles use normalized company-unique plates, status/revision, and same-company template/default service-class references. New/changed source references must be active; unchanged archived/inactive references remain available for metadata/status updates. Verified actor plus active Admin PO membership is enforced inside guarded transactions; browser table grants are revoked. Resize and renumber replacement are confirmed in the UI. See ../superpowers/specs/2026-10-07-fleet-seat-template-design.md and ../setup/FLEET_SETUP.md.

## D2026-10-07-04 — Approve and implement Trip Engine preparation slice

**Status: FINAL; IMPLEMENTED AND VERIFIED LOCALLY.** The user approved the Trip Engine spec and plan on 7 October 2026. This slice implements revisioned trip drafts, atomic first publication into independent stop/time/fare/full-layout snapshots, one inventory anchor per snapshotted seat × adjacent segment, and tenant-scoped crew assignment/revocation with assigned published-trip reads. Published snapshot data is immutable through the available services; publication retry is idempotent.

Trip input/display uses WIB while persisted values are instants. Publishing validates current active sources, route offsets/fares and the complete seat grid; a nonzero first-stop departure offset blocks publication. Company suspension blocks new publication. Crew access requires both active same-company CREW membership and active assignment. Drafts remain editable under expected-revision checks.

Availability/search, seat holds, booking, payment, passenger data, manifest/QR/boarding, cancellation/completion and operational vehicle/crew conflict scheduling remain outside this slice. Inventory rows are lock anchors, not evidence of availability or sales. See ../superpowers/specs/2026-10-07-trip-engine-design.md and ../setup/TRIP_ENGINE_SETUP.md for current implementation evidence and remaining verification.

## D2026-10-07-05 — Availability and seat hold (FINAL)

The user approved the written spec and plan. Adopt public published-snapshot search using origin WIB date; known-trip closed detail; exact IDR interval quote; logged-in owner-only single-seat ten-minute hold; adjacent reuse and overlap protection; owner/request UUID retries without extension; effective expiry independent of cleanup; release before payment initiation; maintenance batches at most 100. Locks follow company SHARE → trip SHARE → ordered anchors UPDATE → hold, with DB clock after waits. No one-hold/user limit, Redis, payment/grace/conversion writer, confirmed booking, ticket or guest flow is added. See [approved design](../superpowers/specs/2026-10-07-availability-hold-design.md) and [implementation evidence](../setup/AVAILABILITY_HOLD_SETUP.md).
