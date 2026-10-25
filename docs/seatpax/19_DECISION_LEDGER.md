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

Permanent Free plan refinement: the user chose a permanent simulation-only Free plan, superseding the previously agreed 14-day trial duration. They require limits on setup data such as routes, vehicles, schedules and related records to control database usage. Exact quotas, simulation transaction/history retention, reset behavior, upload limits and abuse/rate controls remain design proposals, not adopted numbers. Paid live operation remains separate and needs reviewed design/implementation.

Free quota approval: the user approved the proposed per-PO-workspace stored-data limits: 2 routes, 2 vehicles, 2 seat templates, 2 Crew accounts, 3 simulation departures and 30 simulation bookings. Archived records still count toward storage quotas. At quota exhaustion, offer a user-requested/confirmed simulation reset or upgrade. Also bound stop/seat counts, upload sizes and action frequency; exact values for those secondary limits remain unresolved. Quotas must be enforced server-side, including concurrent requests. No Free/quota implementation has been delivered.

Paid-plan approval: the user agreed to the proposed initial Free and Pro packages, with Pro on monthly invoices paid manually by the PO and automated invoice/reminder handling. Autodebit/recurring charge is deferred. Pro live sales require ready per-PO payment configuration. Price, paid quotas, monthly period/renewal calculation, grace duration and expiry/recovery details still require design decisions. This supersedes the unresolved manual-versus-autodebit question above; implementation remains pending written spec/plan approval.

Pro grace approval: the user agreed to a seven-day grace period after monthly subscription expiry. During grace, service continues with payment reminders. After grace, stop new ticket sales while retaining stored data and honoring paid tickets and ongoing passenger service. Restore otherwise eligible access after verified renewal payment. Expired Pro workspaces retain their data/history without automatically trimming them to Free quotas. This approval does not authorize modifying existing suspension semantics without the reviewed SaaS design/plan. Price, paid quotas, period arithmetic, precise pending-payment cutover and recovery implementation remain to be specified.

Pro price approval: the user agreed to IDR 299,000 per PO workspace per month and requested greater vehicle capacity than the earlier 1–5-vehicle pricing assumption. The exact Pro vehicle cap is not yet approved. Other Pro quotas, tax treatment, price-change policy for existing subscriptions and exact monthly period/invoice calculations remain unresolved. This is an adopted commercial direction pending written design/plan and implementation; no production pricing or payment configuration was changed.

Target-market refinement: the user narrowed the intended SaaS customers to intercity shuttle operators (e.g. van/Hiace-style fleets), with each company's ticket bookings handled exclusively through Seatpax rather than distributed to other booking platforms. Preserve company-specific workspaces and inventory isolation; OTA/channel synchronization is outside the requested scope. They consider the proposed 10-vehicle Pro cap too small and request a more realistic recommendation. No replacement Pro vehicle quota is approved yet; retain the adopted Rp299,000/month price as product direction pending capacity/cost validation. This market refinement does not authorize an implementation or existing-data migration.

Plan administration/change-policy direction: the user wants subscription benefit/quantity limits configurable by platform Admin, and prefers delayed monthly application rather than immediate changes to paid customers (example: Pro vehicle quota reduced from 30 to 20). Exact version publication rules, customer notification lead time, renewal-period applicability, grandfathering versus mandatory migration, and over-quota behavior require design approval. Preserve historical purchases/data and do not silently rewrite an already-paid period. The example does not by itself approve 30 as the initial Pro vehicle cap.

Mandatory plan-migration clarification: the user explicitly rejected grandfathering old Pro subscribers when Admin reduces benefits. All Pro subscribers must adopt the new benefit version after the agreed delayed application policy; the exact notice/renewal mechanics remain under design. Their 30-to-20-vehicle example requires an explicit over-quota adjustment workflow for existing vehicles. Do not assume old subscribers retain 30 indefinitely. Selection of permitted vehicles, operational-versus-stored quota semantics, sales restrictions during adjustment and preservation of existing passenger obligations are design proposals still requiring review. No actual quota change or vehicle deactivation was executed.

Over-quota vehicle adjustment approval: the user approved mandatory adjustment when a published Pro benefit reduces vehicle allowance (e.g. 30 to 20). Before its application, PO Admin selects up to the new limit. At application, selected vehicles retain new-sale/new-departure eligibility; excess vehicles lose that eligibility without record deletion or random automatic selection. If no valid selection has been made, restrict new sales until PO Admin completes adjustment. Preserve existing sold-ticket travel, assigned Crew manifest/boarding and valid already-initiated payment fulfillment. Vehicle eligibility may later be swapped within the limit, subject to preserving passenger obligations.

Quota meaning refinement: approved Pro vehicle allowance concerns vehicles eligible for new operations/sales; historical vehicle records remain stored. This supersedes the earlier proposed Pro stored-vehicle interpretation. Approved Free quotas remain stored-data limits with archives counted. Exact swap/over-quota transaction semantics, storage caps and notice/renewal cutoffs require the written design before implementation. No vehicle or plan configuration was changed.

Tenant booking portal approval: the user approved a dedicated passenger booking page for each PO under a Seatpax path such as `/po/{company-slug}`. It displays that PO's identity and eligible journeys; passenger search, booking and payment remain bound to the selected company. Free simulation departures must not enter live public discovery. Custom PO domains are deferred. Current shared passenger routes/search have not been migrated; this architectural direction requires the written design/plan before implementation.

Platform Admin navigation approval: the user approved five Admin Seatpax sections: Overview (company counts, plan usage and billing attention), Companies (registered companies/service state), Plans & Benefits (prices, quotas, scheduled version changes), Subscriptions & Invoices (periods, payments, due dates and grace), and Change History (plan changes and platform-admin actions). Tenant routes/schedules/fleet/Crew/orders remain the respective Admin PO's operational responsibility. This expands the intended SaaS Admin design beyond the delivered minimal company-control screen; implementation is pending reviewed spec/plan.

Customer complaints request: the user requested a customer-facing complaint/help flow, specifically for last-second payment cases where bank/wallet debit appears successful but Seatpax shows failure/no ticket, and for other customer complaints. Add this to the SaaS design scope; complaint handling must connect to the user's own booking and verified provider status, with tenant isolation. Do not treat a screenshot or the browser callback alone as payment authority, promise automatic ticket issuance after a lost hold, or imply that real provider refunds are implemented. Current payment reconciliation/late PAYMENT_CONFLICT and Sandbox MOCK_REFUND remain the existing implementation. Complaint routing, evidence access, lifecycle, deadlines and refund escalation are not yet approved in detail.

Complaint navigation approval: the user agreed that Admin PO complaints belong under the existing Orders menu as `Pesanan > Pengaduan pelanggan`, alongside `Daftar pesanan`, rather than adding another top-level menu. Show an unresolved-complaint count on Orders. Customers open `Laporkan masalah` and view complaint history from the same owned booking detail. This approves navigation/entry points; complaint lifecycle, evidence access, escalation and financial resolution still need the written design before implementation.

Initial Pro vehicle quota approval: the user explicitly approved 30 vehicles eligible for new operations/sales per Pro workspace at Rp299,000/month. This resolves the initial-cap question above; 30-to-20 remains only the example of a future policy reduction. Other Pro quotas and infrastructure/cost validation remain unresolved. See the [consolidated SaaS draft](../superpowers/specs/2026-10-20-shuttle-saas-design.md) for adopted decisions, proposals and remaining design gates. The written draft awaits review; no SaaS implementation is claimed.

Admin PO account scope approval: one Admin PO account is linked as Admin PO to only one company for the initial SaaS. The user rejected the proposed cross-company Admin invitation need. When an entered email already belongs to an Admin PO of another company, reject the attempted addition/registration with title “Email sudah digunakan oleh Admin PO”, message “Email ini sudah terdaftar sebagai Admin PO di perusahaan lain. Gunakan email berbeda untuk melanjutkan.” and action “Ganti email”. Server enforcement is required in the eventual implementation; this approval does not authorize automatic existing-membership removal, decide Crew cross-company membership or inactive-membership/ownership-transfer policies, or authorize implementation yet.

Initial PO registration form approval: the user approved company/shuttle name, responsible person's name, WhatsApp number, and city/regency selected from the existing reference catalogue; email comes from the logged-in account. Successful registration leads to the Free simulation dashboard with a setup guide: service points → route → fleet → schedule. Live-sales verification is a separate Pro-upgrade design; submitting this form does not establish a verified operator or authorize real ticket charging. Field validation, contact privacy, atomic workspace creation/retries and upgrade verification details remain for the technical spec. No implementation is delivered by this approval.
Free simulation reset approval: the user approved deleting simulation bookings, simulation payments and simulation departures while preserving the PO profile, service points, routes, fleet, seat templates and Crew accounts. Show a deletion summary and require user confirmation before the future reset action. Retained master records continue counting toward their quotas. This approves the product behavior only, not a deletion operation now. Dependent simulation records, in-flight concurrency, reset audit and technical retention need a reviewed reset specification; real transactions and other tenants must remain outside the reset boundary.

Customer simulation entry approval: the user approved a “Coba sebagai pelanggan” button on the PO dashboard, allowing Admin to try journey selection → seat selection → simulated payment → ticket with a clear SIMULASI label. This remains within the company's simulation scope and does not authorize real charging, cross-tenant access or implementation. Preview-session details and the simulator mechanism remain to be designed.

Built-in Free payment simulator approval: the user approved a Seatpax simulator requiring no Midtrans account or keys. Offer successful payment (issue a simulated ticket), waiting payment (booking remains pending), and failed/expired payment scenarios (show failure handling). These choices apply only to authorized workspace simulation records and never establish real payment success. Exact state transitions, separate failure/expiry semantics, idempotency and preview-session authorization remain technical design work. This resolves the simulator-provider choice above; no simulator implementation or real provider-adapter change is claimed.

Technical design drafting: after the user agreed to proceed with the first technical specification, [PO onboarding and Free simulation](../superpowers/specs/2026-10-20-po-onboarding-free-simulation-design.md) was written for review. It proposes separate simulation storage, atomic registration/quota/reset protocols, Admin-only preview and bounded secondary limits. Those proposals are awaiting written-spec review; no implementation plan, migration, simulator or new onboarding code is approved by the drafting request alone.
Reset cooldown clarification approval: after clarification, the user accepted a 60-second minimum interval between successful simulation resets per workspace. Starting a new simulation is available immediately after reset; only the next reset is delayed. This approves the cooldown policy, not all remaining technical proposals or implementation of the draft specification.
Written Free technical-spec approval: after being explicitly asked to review the complete PO onboarding + Free simulation spec, the user answered “cocok”. This adopts the recommended separate simulation schema/shared master approach, DISABLED Admin reservation, secondary limits (20 service points, 2 classes, existing 50-stop/240-cell bounds, one active hold/actor/run, 20 reset receipts), simulator state behavior and no initial manual conflict/refund resolver. The 60-second reset cooldown was already approved separately. The [implementation plan](../superpowers/plans/2026-10-20-po-onboarding-free-simulation.md) is now written for review and execution-method selection. No implementation or database operation has started; testing remains deferred unless requested.
Pro calendar-month approval: the user agreed to a subscription month following the original start date (example: 20 October to 20 November), using the last day of the following month when that date is unavailable, rather than a fixed 30-day duration. Exact clock/timezone boundaries, preserving the original anchor after a short month, early renewal, grace-period renewal and reactivation after grace remain to be designed. This approval is a billing product decision, not permission to implement billing before its technical spec and plan are reviewed.
Fixed-duration Pro period supersedes calendar-month approval: after clarification, the user requested and approved exactly 30 days (720 hours) per subscription period. Example: 20 January 10:00 → 19 February 10:00. Renewal paid within the seven-day grace extends from the previous period end by 30 days; grace days already used are included, not added again. Calendar-date anchoring and end-of-month clamping are superseded. Early renewal, post-grace reactivation, invoice timing and display timezone still need design decisions. No billing implementation is authorized by this product discussion alone.
Post-grace reactivation approval: the user agreed that payment verified after the seven-day subscription grace has ended starts a new fixed 30-day period from verified payment time, rather than charging a past interval while new sales were disabled. Within-grace renewal still extends from the prior expiry. Handling stale invoices, in-flight payments at the grace boundary, verified-time source and paid benefit-version selection must be defined in the technical billing specification. Existing passenger obligations remain protected. Early renewal and invoice/reminder timing are not decided by this approval.
Renewal invoice/reminder approval: the user approved automatic renewal invoice issuance seven days before expiry, and early payment adding 30 days after the current period ends without losing remaining time. Dashboard/email reminders are scheduled at H-7, H-3, H-1, expiry, grace day 3 and grace day 6. Reminder delivery idempotency/retries, verified invoice settlement and scheduled benefit application remain technical design work; do not send reminders for an already-settled obligation. This is approval of future product behavior, not authorization to send actual email now or to implement billing before reviewed spec/plan.
Plan change notice approval: the user approved at least 30 days of notice before price/benefit changes take effect. Paid periods retain purchased price/benefits. After the notice interval, subsequent renewals use the new version, with all Pro companies eventually adopting it and the approved over-quota fleet-selection workflow retained. Unpaid already-issued invoices, prepaid future periods and provider payments in flight at policy cutover need explicit technical contracts; no retroactive rewrite of paid entitlements is authorized. This resolves the previously open minimum-notice duration.
Sandbox billing-slice approval: the user approved initial Pro billing through Midtrans Sandbox, covering invoice creation, test payment, 30-day periods, renewal/grace/expiry and accelerated test-time progression without real charging. The [technical billing draft](../superpowers/specs/2026-10-20-pro-sandbox-billing-design.md) is written for review. Separate Sandbox subscription overlay, captured rather than sent email, private versioned quotes, recognition-time semantics, one-hour/20-attempt limits and guarded clock-advance limits are proposals in that draft, not independently approved by the scope agreement. No billing implementation has started; Free implementation/testing and branch integration remain separate.


## D2026-10-21-01 — Seatpax untuk satu perusahaan shuttle

Pengguna menegaskan: “oke fix berarti ya ini di gunakan hanya untuk satu perusahaan saja”. Lingkup proyek adalah aplikasi operasional dan pemesanan tiket bagi satu perusahaan shuttle, bukan peluncuran SaaS banyak perusahaan. Ini merupakan keputusan arah proyek saat ini; pengembangan SaaS di masa depan bukan pekerjaan aktif atau target yang otomatis dijanjikan. Keputusan ini menggantikan arah SaaS pada D2026-10-20-03 dan kontrak billing/Free terkait untuk prioritas serta lingkup rilis sekarang.

Dipertahankan: data perusahaan dan pengamanan akses yang sudah ada; operasional Admin PO, Crew dan pelanggan; lokasi, rute/tarif, armada/layout kursi, jadwal, booking kursi, pembayaran tiket Midtrans, tiket/QR dan boarding. Pembayaran tiket tidak bergantung pada pembelian paket SaaS.

Ditunda dari produk aktif: pendaftaran PO mandiri, onboarding tenant publik, paket Free/Pro, kuota benefit langganan, simulasi Free sebagai paket produk, invoice/pembayaran langganan dan pengelolaan perusahaan pelanggan SaaS. Kode Free/billing pada branch terpisah tetap disimpan dan tidak digabung/diaktifkan untuk aplikasi satu perusahaan. Tidak ada penghapusan schema, data, riwayat pembayaran atau membership yang diizinkan/diperlukan oleh perubahan arah ini.

Berikutnya audit alur inti satu perusahaan dan susun pengujian, lalu perbaiki hambatan yang ditemukan. Belum diputuskan: identitas perusahaan nyata/data operasional awal dan apakah role teknis SUPER_ADMIN perlu digabung dengan Admin perusahaan. Jangan mengubah role/otorisasi atau menghapus kontrol keamanan tanpa rancangan lanjutan. Catatan ini bukan bukti alur sudah lolos pengujian atau perubahan UI/kode operasional sudah diterapkan.


## D2026-10-21-02 — Passenger landing adaptation approved

The user selected Seatpax itself as the shuttle brand, requested internet/Dribbble references, accepted the concrete adaptation and said “oke mantap. lanjut”. This authorizes the bounded homepage implementation from main, separate from SaaS. Preserve logo/nav; use compact hero, prominent existing-query search, available points and information about booking/tickets. Unsupported fleet/contact/testimonial claims are not invented. Generated mockup did not finish; use locally stored freely licensed Unsplash landscape photographs clearly labelled illustrative, with sources/photographer credits. No schema, SaaS enablement, primary-company selection, role change or backend sales-policy change is included. Verification remains deferred except source review and serving the requested preview; see delivery notes.

## D2026-10-21-03 - White photographic landing revision approved

The user supplied two travel landing references and accepted their concrete Seatpax adaptation with “cocok”. Use a white background matching the actual logo, including when the device requests dark mode. Navy remains text; blue remains the action accent. A wide photographic hero and lightly overlapping desktop white search panel replace the split composition. Phone search stays in normal flow without overlap. Add visual booking-flow explanation, varied supporting photo/benefit composition and retain FAQ. Route showcase content stays intentionally empty for now; no example Cianjur-Bandung route, fares or dummy cards. This display choice does not delete inventory, disable search or authorize backend company scoping changes. Existing query contract, passenger navigation and actual search options remain. Existing licensed illustrative road images can be reused with credits. No SaaS pricing, app downloads, community or fabricated testimonials. Testing remains deferred.

## D2026-10-21-04 - Floating passenger navigation approved

The user approved the white floating desktop/navbar phone preview with the final correction that Perjalanan and Pesanan saya use blue active text only, no colored selection background. Apply this to shared passenger navigation. Preserve logo/destinations and phone bottom navigation. Offer guest Masuk and signed-in account disclosure with existing profile/account destination and logout, using existing auth/session services for presentation only. No role/profile feature changes, schema changes or new auth endpoint. Verification may continue for this UI slice under the user's ongoing plan/execute/verify instruction; physical-device and real authenticated-session acceptance must be stated separately.

## D2026-10-21-05 - Navbar scroll transition approved

The user requested a navbar that merges into the page at the top and animates to the current floating presentation on scroll, then accepted the proposed 250-300ms and 24-40px range. Implementation uses a 32px marker and 300ms reveal/reverse of shadow/outline, with stable layout geometry. Text-only active navigation, white brand surface, phone navigation and focused flows remain. Reduced-motion preference uses an immediate state change. No business/auth/database change.

Visual feedback refinement: the user found the initial transition insufficiently visible. Increase to 450ms with a stronger shadow and desktop/tablet 0.98 scale / 4px downward transform while floating. Keep the 32px threshold, inverse top transition, reduced-motion behavior and phone layout. This supersedes the initial duration for the current visual implementation.

Navbar indicator refinement: the user requested an underline. Adopt a short blue 2px line directly below current-page labels and on pointer hover, retaining transparent backgrounds. This supersedes the earlier no-underline requirement, without changing links, permissions or header scroll behavior. Phone labels use the same current-page indicator.

## D2026-10-21-06 - Booking explanation as animated route

The user accepted a dashed path with different upward/downward curves between the four booking steps, reviewed an interactive desktop/phone preview, and accepted applying it to the actual page. Single 4.2-second viewport-triggered playback, sequential icon activation, static reduced-motion fallback and readable no-JavaScript content are presentation requirements. Tablet uses a vertical path to preserve reading order. Booking/payment state and authorization are unchanged.

Composition refinement: the user approved balanced desktop columns, concise descriptions, **Bayar pesanan**, thinner icon halos and a softer navbar shadow. Preserve the animated route, phone/tablet vertical alignment, navigation and existing booking behavior.

Arrival refinement (22 October): the user requested extra vertical breathing room, a circle arrival effect synchronized to the travelling point, and local motion per icon. Adopt a single arrival ring and two subtle glyph motion cycles, then settle; preserve reduced-motion and route/reading order.

Circle-motion clarification: the user meant the whole circle plus icon, with small up/down/left/right movement. Replace glyph-only motion with 1-3px circle translation, retaining arrival feedback and reduced-motion behavior.

Continuous-motion clarification: the user requested arrival lift/settle followed by ongoing, smooth, subtle vertical circle motion plus separate arrival/idle glyph animation. Replace the finite two-cycle behavior with continuous small loops, with a local pause/resume control and reduced-motion static fallback.

Spacing/control refinement: the user explicitly removed the pause button and requested tighter, more consistent spacing. Remove the control row/state, reduce route/label/section gaps and preserve continuous subtle motion plus reduced-motion preference. This supersedes the visible pause control adopted in the previous refinement.

## Passenger footer approval — 22 October 2026

The user approved the interactive desktop/phone footer preview and authorized implementation. Shared non-focused passenger pages receive actual branding, Jelajahi and Panduan groups with existing destinations, and a copyright strip. Focused authentication/checkout retains its minimal footer. No changes to navigation authority, booking flows or company identity.

## D2026-10-22-01 - Separate marketing landing from passenger booking

The user agreed to distinct responsibilities: `/` introduces Seatpax and may feature a small set of actual available trips; `/trips` is the public journey search/catalogue and entry to seat selection. Browsing and inspecting seats do not require login. Verified login is required when continuing a booking/creating an owned hold, before payment/ticket access. Retain the existing unified Email OTP entry for existing/new passenger accounts; no separate registration form is introduced by this decision.

A featured-trip action must preserve its relevant trip/interval context; authentication returns to the valid booking intent instead of forcing a fresh search. Remembered seat intent is not a reservation: availability, price, sales cutoff and hold ownership remain revalidated by the server. Do not auto-create a hold solely because authentication succeeded. Existing safe return-path validation and internal staff destinations stay authoritative.

This is approved product direction, not a claim that the landing has already been reorganized or that seat intent survives login today. The current `/trips` and trip detail are already public, and the existing seat screen gates hold creation with login. Separating landing composition, optional real featured journeys and preservation of selected-seat intent remain follow-up design/implementation work. No fictitious route/fare inventory is authorized; exact featured selection and empty treatment remain to be specified.

## D2026-10-23-01 - Two landing booking illustrations

The user approved the first two interactive studies and requested implementation with "oke. sikat". Add the accepted continuous blue-seat/white-ticket morph and two-click, side-arc card choreography to the actual landing. Preserve the hero and existing route animation. The third study is expressly excluded. A static preparation section separates the new visual sections; responsive final cards spread horizontally where readable and vertically on narrow screens. Reduced motion, no-JavaScript content, keyboard/touch operation and visibility-aware playback are required. This is decorative marketing content, not booking, payment, inventory, authentication or real journey data. Scope and evidence are recorded in the related design/plan/setup documents.

## D2026-10-23-02 - Temporary demo trips in landing showcase

The user asked "buatin dummy trip dulu buat ngisi temukan perjalanan anda". This authorizes clearly labelled static demo cards in the landing showcase, replacing its previous empty treatment for presentation. Local illustrative routes, times and fares do not represent actual inventory and expose no booking/checkout action. The actual catalogue remains available through `/trips`. No database fixture restoration, live sales publication, real trip creation or payment change is part of this bounded request.

## D2026-10-25-01 - Seat illustration automatic one-time playback

The user supplied a screenshot of the seat/ticket illustration and requested no replay option, one playback and activation when at its section. Remove all manual playback controls for this illustration and start once at 35% field visibility per mounted page visit. Preserve progress when offscreen/hidden and after geometry changes; completed playback stays settled on return. Keep reduced-motion/static fallbacks. This supersedes the first illustration's pause/replay controls only; the second illustration's two-click interaction and controls remain.

Caption refinement: the user removed **Tiket siap di Pesanan saya.** and **Ilustrasi pemesanan, bukan pesanan aktif.** below the first illustration. Remove that entire caption block; the existing in-card subtitle reveals with the ticket stub. No extra external subtitle is introduced, and the accessible illustration description remains.
