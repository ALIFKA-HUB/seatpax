# Seatpax — Decision Ledger & Historical Direction

## D2026-10-08-01 — Purchase for self or another passenger

**Status: ADOPTED PRODUCT DECISION; implementation pending.** The user proposed self checkout using profile data and a separate form when purchasing for a friend, then accepted the described ownership model with “oke sikat, selanjut nya apa”.

- One logged-in booker, one passenger and one seat per booking remain the release boundary.
- SELF uses reviewed account profile data; OTHER collects the actual passenger name/phone without changing the booker's profile.
- The booker owns booking/ticket access through My Tickets. OTHER passenger identity is a snapshot without an account association or automatic claim. Manifest/crew operations use the actual passenger identity.
- Payment verification precedes ticket issuance in both modes. Snap popup was separately accepted for Sandbox checkout.

This supersedes the account-equality restriction in foundation §1/§4 and the corresponding login-only ownership wording where it conflates booker and passenger. Guest checkout, group purchases and traveler claim remain deferred. The user separately approved the detailed [checkout/payment design](../superpowers/specs/2026-10-08-checkout-payment-design.md) with “spec oke”. Its [implementation plan](../superpowers/plans/2026-10-08-checkout-payment.md) awaits written review; design approval does not imply implementation or Sandbox verification.

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


### D2026-10-08-01 — Execution record

The user approved the written spec and plan, then authorized execution. Checkout/payment code now implements that decision; final automated evidence and the remaining real Sandbox/browser checks are recorded in `../setup/CHECKOUT_PAYMENT_SETUP.md`. Provider unknown/challenge/refund and exhausted retries remain visible for review; MOCK_REFUND records an internal simulation, with PAID retained as financial history. No real refund or traveler claim policy is added.

## D2026-10-08-02 — Manifest and boarding slice (FINAL)

The user approved the written spec and implementation plan and authorized local execution/integration. Active assigned CREW can resolve confirmed-ticket profiles and explicitly board at the origin trip-stop snapshot; same-tenant active ADMIN_PO has manifest read access only. Fresh membership and assignment are checked on every request, including retries. Company suspension permits these existing-ticket operations. The event is the immutable service audit, unique per ticket/trip; concurrent writes and retries retain the original actor, database timestamp and source. QR decoding is local, opaque-token-only, and does not automatically board or navigate. No snack, offline, cash, reversal, no-show, reseat or GPS policy is introduced. See `../setup/MANIFEST_BOARDING_SETUP.md` and the approved `../superpowers/specs/2026-10-08-manifest-boarding-design.md`.

## D2026-10-09-02 — Explicit snack handover after boarding (FINAL)

User approved the snack spec and execution plan. Assigned active CREW records one handover per boarded ticket/trip, with confirmed booking and fresh membership/assignment checks on every attempt. Database uniqueness and composite boarding/ticket identity support immutable retries with original actor/time. Suspended-company existing-ticket operations remain allowed. Admin PO reads only; scan never mutates. No package, quantity, stock, reversal or offline feature is added. See ../superpowers/specs/2026-10-09-snack-claim-design.md and ../setup/SNACK_CLAIM_SETUP.md.

## D2026-10-09-03 — Minimal Super Admin company control (FINAL)

The user approved the written specification and implementation plan on9October2026. Active global SUPER_ADMIN with company_id NULL may list minimum company summaries and explicitly change ACTIVE/SUSPENDED with expected status revision. Fresh membership SHARE → company UPDATE protects revocation and sale ordering; atomic database-clock audit records each actual transition, while matching no-op preserves revision/time. Stale/ABA writes require refreshed state and a new decision. Suspension retains the adopted foundation semantics: no new publication/hold/initiation, valid initiated fulfillment and existing ticket/boarding/snack remain usable. Reactivation restores only otherwise eligible sales. No tenant operational fallback, onboarding/invite/role editing, deletion, audit-list UI or financial policy is introduced. Manual acceptance and visual polish remain separate. See ../setup/SUPER_ADMIN_COMPANY_SETUP.md.

## D2026-10-09-04 — Visual foundation, passenger design and supplied logo (FINAL; passenger implementation local)

The user approved a shared navy/blue visual foundation using their previously supplied generated Seatpax logo, followed by the passenger journey, then separate Crew and Admin/Super Admin visual phases. They approved the written specification and concrete tokens/composition on 9 October 2026: ../superpowers/specs/2026-10-09-passenger-visual-design.md. The implementation plan is approved and passenger presentation is implemented locally, with evidence in ../setup/PASSENGER_VISUAL_SETUP.md. The supplied raster identity board was prepared into inspected horizontal/symbol PNG assets with identity preserved. Active release scope and existing domain behavior remain authoritative. Manual user acceptance remains deferred. The earlier six-digit OTP request remains separate from this visual phase; the implemented provider contract currently uses eight digits.

Crew visual refinement under D2026-10-09-04: written Crew spec and implementation plan approved; presentation implemented locally, preserving the adopted operational contracts. Evidence and deferred real acceptance: ../setup/CREW_VISUAL_SETUP.md.

Admin/Super Admin visual refinement under D2026-10-09-04: written spec and plan approved; presentation implemented locally without operational-policy changes. Evidence and deferred actual acceptance: ../setup/ADMIN_VISUAL_SETUP.md.

## D2026-10-15-01 — Dedicated Crew mobile client (platform decision adopted)

The user approved a dedicated Crew application and explicitly requested **Android and iPhone**. Passenger, Admin PO and Super Admin remain web clients. Adopt Flutter with native camera scanning and an authenticated API adapter to existing assigned-trip, manifest, explicit boarding and separate snack services. Existing authorization, transaction and idempotency rules remain authoritative; offline synchronization and additional operational features remain deferred. Existing Crew web pages remain available during transition.

Platform intent is approved; the [written technical specification](../superpowers/specs/2026-10-15-crew-mobile-design.md) awaits review, followed by an implementation plan. No mobile implementation, signed binary or physical-device acceptance is claimed. Android SDK licenses remain outstanding locally; iOS build/signing/device verification requires macOS/Xcode access. Passenger/Admin redesign feedback and city/terminal catalogue work remain separate requests.

## D2026-10-15-02 — Prioritize the approved Admin location concept

The user asked to implement the Admin PO UI shown in their screenshot first. Adopt the white Admin shell and table-first location directory from the previously presented interactive concept, with local search/status filtering and modal Add/Edit connected to the existing server action. Keep the original logo and actual company data; do not fabricate location types or replace records with concept fixtures. National city/terminal data and the passenger concept remain separate work. This is a bounded revision of existing web screens; it does not approve the pending Crew mobile technical specification. See ../setup/ADMIN_DIRECTORY_REFRESH_SETUP.md for delivery evidence and pending authenticated acceptance.

## D2026-10-20-01 — Passenger discovery and role entry refinement

The user approved the passenger visual preview, requested a fuller compact header, then rejected the bus illustration and requested implementation. Adopt the three navigation labels **Perjalanan**, **Pesanan saya**, **Akun**, responsive top/bottom navigation, immediate real trip discovery, search and popup filters using the existing Seatpax palette/logo. Adopt role-aware login destinations with preserved safe journey returns; multiple work roles require a choice. Detailed orders/account contents, mobile Crew delivery and city/terminal catalogue remain separate. The [design record](../superpowers/specs/2026-10-20-passenger-discovery-design.md) captures approved direction; the [implementation plan](../superpowers/plans/2026-10-20-passenger-discovery-refresh.md) and its explicit daily-discovery/candidate-limit defaults were approved on 20 October 2026. Implemented locally; see [verification and pending acceptance](../setup/PASSENGER_DISCOVERY_REFRESH_SETUP.md).

## D2026-10-20-02 — PO SaaS direction and real regional references

The user adopted a PO-facing SaaS direction with an initial one-company pilot and four role categories: Seatpax Super Admin, Admin PO, Crew and passenger. Multi-company technical isolation remains useful; a cross-PO marketplace and external distribution integrations are deferred. Ticket payment and PO subscription billing are distinct proposed flows; SaaS billing implementation has not been approved or delivered by this conversation.

The user approved real city/regency reference data with a server-side cached copy, separate from actual PO service points, and requested database tidying. They confirmed no real pilot PO or verified service locations exist yet. Do not invent those details or relabel test data as verified operational locations. The [read-only audit](../analysis/2026-10-20-region-data-audit.md) found fixture data with existing transactions; the [written catalogue and reversible cleanup design](../superpowers/specs/2026-10-20-region-reference-cleanup-design.md) awaits review. This decision does not authorize deleting histories, guessing ambiguous city mappings, or applying unreviewed company status changes.

Planning update: the user requested plans after the written design and sequence were presented. [Package A](../superpowers/plans/2026-10-20-region-reference.md) covers the catalogue, stop selection and passenger location reads; [Package B](../superpowers/plans/2026-10-20-fixture-cleanup.md) covers a separate reviewed, reversible suspension operation. Both await implementation-plan review. The final fixture apply gate remains after a concrete fresh dry-run/backup; no migration, import or status transition has been applied.


Implementation update — 20 October 2026: the user approved execution. Regional catalogue, reference-aware stops and eligible passenger location reads are implemented on `codex/region-reference-cleanup`. Development migration/import succeeded with 38 provinces and 514 regencies; all 32 protected operational table digests/counts remain unchanged. Legacy mappings remain NULL. See [delivery evidence](../setup/REGION_REFERENCE_SETUP.md). Fixture maintenance code and bound backup/manifest are prepared, but the seven suspension transitions still require the adopted concrete operation approval. See [exact targets and rollback](../setup/FIXTURE_CLEANUP_SETUP.md). Tests remain deferred; no cleanup apply is claimed.


Fixture application update — 20 October 2026: after the user approved continuation of the concrete operation, the reviewed seven fixture companies were suspended atomically. Fresh preflight matched the approved manifest and backup; seven exact status audit events and preserved protected data were verified. The previously suspended fixture and Demo PO A/B remain unchanged. Global totals remain 5 bookings / 5 payments / 1 ticket. See [operation evidence and authorized rollback](../setup/FIXTURE_CLEANUP_SETUP.md). No test suite, retry or rollback was run.

## D2026-10-20-03 — Self-service PO SaaS and direct PO ticket proceeds

The user explicitly chose self-service registration and subscription payment by each PO, then approved ticket payments going directly to the respective PO's payment account. Seatpax receives its SaaS subscription fees separately. This is an adopted product direction; it does not authorize platform collection followed by payout to POs.

Platform Super Admin and tenant Admin PO remain separate responsibilities. The company-scoped Admin page shown during the discussion was Demo PO A's operational workspace, not the platform administrator. Existing multi-tenant data isolation and role guards remain relevant.

Implementation is not yet approved or delivered for self-service onboarding, subscription billing or per-PO payment configuration. Current ticket payment integration uses one development Sandbox merchant configuration. A written SaaS design and implementation plan must resolve onboarding/activation, expiry entitlement, payment-account connection and migration before code changes.

Still unresolved: paid-first versus trial onboarding; manual renewal versus recurring/autodebit (manual was recommended but not selected); package/price/period rules; grace duration and recovery; precise restrictions for expired subscriptions; per-PO provider-account setup. Discussion recommends retaining data and protecting already-paid tickets/assigned Crew operations, with initiated valid payment fulfillment, rather than cancelling passenger obligations when SaaS access expires. Those expiry details need the written-design review.

The user also wants the selected base route to be adjustable for an individual departure. Editing limits before/after publication and sold tickets, and recurring-day schedule behavior, remain design work; no implemented per-trip route override or recurring scheduler is claimed.

Self-service onboarding refinement: the user chose a free trial for newly registered POs. Trial duration, start trigger, feature/usage limits and eligibility/abuse controls are not yet decided. This supersedes the paid-first-versus-trial open question above; trial and billing implementation still require the written SaaS design/plan.

Trial duration refinement: the user agreed to the recommended 14-day free trial. Start trigger, trial feature/usage limits, live ticket-sale eligibility, renewal mode and grace duration remain unresolved; no billing/trial code has been implemented.

Free simulation refinement: the user explicitly rejected live ticket sales during the free experience and proposed a Free plan limited to simulation, with paid categories for later use. Do not enable real ticket charging/public sale for Free/trial workspaces. Whether Free is permanent or retains the previously agreed 14-day duration, paid package boundaries, usage limits and upgrade handling remain under discussion. Plans should be distinguished from existing user roles; the proposed workspace-level plan model still needs design review. No implementation action is authorized by this discussion alone.
