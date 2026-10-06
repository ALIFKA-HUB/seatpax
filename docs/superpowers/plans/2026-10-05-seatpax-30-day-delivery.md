# Seatpax — 30-Day Delivery Plan

> **For agentic workers:** Use `superpowers:executing-plans` for approved implementation tasks. This document is a delivery calendar; define the concrete file/API/test contract for each subsystem before implementing it. Do not execute proposed scope reductions until the user adopts them and the scope/decision ledger are updated.

**Goal:** Deliver a stable, demonstrable Seatpax application within 30 days at 2–3 focused hours per day, preserving segment inventory, payment correctness, tenant isolation, QR, manifest, boarding, and snack claims.

**Architecture:** One Next.js application with domain services and PostgreSQL as the source of truth. Passenger, Admin PO, Crew, and Super Admin share domain components but have different navigation and interaction density. Use server authorization and tenant policies for protected data.

**Tech Stack:** TypeScript, Next.js, PostgreSQL/Supabase, Drizzle, Tailwind/shadcn, Midtrans Sandbox, browser QR scanner; Vitest and integration/E2E checks for critical behavior. Dependency versions and external provider setup are verified during project setup.

**Spec:** [Documentation index](../../seatpax/00_INDEX.md), [MVP scope](../../seatpax/02_MVP_SCOPE.md), [decision ledger](../../seatpax/19_DECISION_LEDGER.md), [spec review](../../analysis/SEATPAX_SPEC_REVIEW.md).

## Calendar and capacity

- Planning date: 5 October 2026, Asia/Jakarta.
- Proposed Day 1: **6 October 2026**. Day 30: **4 November 2026**. Shift the dates together if the actual start changes.
- Available time: **60–90 hours** across 30 calendar days. This assumes work every day; a missed day consumes buffer or moves work.
- Schedule against the lower bound: two hours per day. The optional third hour is for catch-up or extra verification, not an excuse to promise more features.
- Five days are explicit recovery/review buffers: D08, D16, D26, D27, D29. They are not spare feature days.
- The original roadmap covers 12 weeks. This calendar proposes a smaller demo release; it cannot honestly guarantee the full original MVP within 60–90 hours.
- Actual speed depends on implementation experience, existing accounts, provider setup, and time spent reviewing generated code. Re-estimate after D08 and D16 using completed work.

## Proposed scope for this deadline — requires a product decision

The current `02_MVP_SCOPE.md` and `19_DECISION_LEDGER.md` remain authoritative. This table is a proposal to review on D01, not a change already made.

| Area | Proposed 30-day release | Difference from current MVP |
| --- | --- | --- |
| Passenger identity | Email OTP login before checkout, My Tickets | Defer Google OAuth, guest checkout, and guest-to-account claim |
| Booking | One passenger and one seat per booking | Defer multi-passenger checkout and partial booking operations |
| PO/roles | Two demo companies, seeded internal accounts, static roles, tenant/assigned-trip checks | Keep four roles; defer user invitation and membership management UI |
| Route/pricing | Minimal route/ordered-stop/fare forms; four-stop demo route | Keep multi-stop and service-class segment fare; avoid full management polish |
| Layout/fleet | Small click-cell grid, vehicle/template association, immutable trip layout snapshot | Defer drag-and-drop, auto-number sophistication, and duplication polish |
| Trips | Minimal creation/open-for-sale and assigned crew | Keep trip/route separation and snapshot-based inventory |
| Inventory | Hold 10 minutes, conditional 1-minute grace, expiry, segment reuse, contention proof | No reduction to correctness |
| Payment | Midtrans Sandbox, verified/idempotent webhook, late conflict state, minimal admin resolution | Mock/manual refund resolution only; no production refund integration |
| Tickets/crew | QR, manifest, assigned-trip scanner, manual search, boarding/snack | Keep online mutation; PWA shell only, no offline sync |
| Admin operations | Trip/manifest/booking view and payment-conflict resolution | Defer general cash sale, reschedule, operational reseat, trip cancellation/refund workflows |
| Super Admin | Minimal company list and activate/suspend with defined policy | No analytics or full onboarding |
| Realtime | Availability refresh/polling first | Defer live subscriptions if time runs short; this is broader than cutting animations and needs approval |
| Delivery | Hosted demo, deterministic seed/reset, critical tests, README/runbook | Presentation deck and rehearsal occur after this implementation month |

Without adopting these reductions, treat this calendar as a core-flow milestone only, and extend the deadline for the remaining original MVP. Do not label a reduced release as completing every original acceptance criterion.

## Global constraints

- One seat may serve non-overlapping passenger intervals; overlapping confirmed assignments/active holds must never coexist.
- PostgreSQL decides availability. UI color, polling, and realtime cannot authorize a sale.
- Payment is confirmed server-side. Duplicate notifications must not duplicate booking confirmation or tickets.
- Preserve the final hold durations: 10 minutes plus 1 minute only when payment was initiated under the agreed rule.
- Cash/offline/printer/financial marketplace work must not slip into this calendar through scope drift.
- QR resolution reads a trip passenger profile. Boarding and snack are separate authorized mutations.
- Define each uncertain policy before its migration/service is written; record it in the relevant spec and decision ledger.
- A feature is complete only when the visible flow, server checks, failure behavior, and appropriate verification all work.

## Review focus

| Failure mode | Expected behavior | Owning days |
| --- | --- | --- |
| Two users compete for overlapping seat segments | At most one active owner; non-overlapping intervals can both succeed | D09–D11, D24 |
| Expiry races with payment initiation/confirmation | Apply persisted deadline and one transaction protocol; late success enters conflict safely | D10, D13–D14, D21 |
| Retry or changed payment status for the same order | Deduplicate the retry; permit valid later status transition; one ticket issuance | D14–D15, D24 |
| Crew/admin tries another company or unassigned trip | Server denies read/mutation even when resource IDs are known | D04, D17–D20, D24 |
| Camera denied, QR wrong trip, duplicate action | Manual manifest search works; invalid context denied; no duplicate boarding/snack | D18–D20, D24–D25 |

## Daily work pattern

Use approximately 10 minutes to read the day's contract, 80 minutes to implement one deliverable, 25 minutes to verify it, and 5 minutes to record progress/commit when Git is configured. The third hour can absorb provider setup, investigation, or verification failures.

Do not fill tomorrow's slot by starting another module before today's dependency works. Record the blocker and consume the next buffer if needed. On each active day, the planned check below is part of that day's work; it is not deferred until the final week.

## Daily checklist

| Done | Day / date | Main deliverable | Checkable result |
| --- | --- | --- | --- |
| [ ] | D01 — 6 Oct | Agree reduced release and decision list; update scope/ledger only after adoption. Decide crew assignment, immutable layout, login-only booking, inventory locks, hold release/session link, payment deadline, and token lifecycle. | No contradictory rule remains for the first implementation slice; remaining review findings mapped to their owning day. |
| [ ] | D02 — 7 Oct | Create app skeleton and database connection, scripts/env example, basic UI tokens; verify Supabase auth configuration and access to Midtrans Sandbox; establish a reachable staging webhook route early. | App boots, DB query works, secret keys remain server-side; provider/account blockers discovered now. |
| [ ] | D03 — 8 Oct | Email OTP/session flow and server auth helper. Minimal login/logout and protected layout. | Successful login/logout; anonymous users cannot access protected pages or mutations. |
| [ ] | D04 — 9 Oct | Company/membership/crew assignment foundation, tenant checks and applicable RLS, two-company seed. | Admin A denied company B; crew denied unassigned trip; deterministic seed works. |
| [ ] | D05 — 10 Oct | Minimal ordered route stops, service class, adjacent segment fare forms and calculation. | Create/select four-stop route; valid fare sum; reversed/equal endpoints rejected. |
| [ ] | D06 — 11 Oct | Minimal click-cell template and vehicle association; shared grid renderer. | Save/reload 10–12-seat grid; duplicate seat codes rejected; renderer uses persisted geometry. |
| [ ] | D07 — 12 Oct | Trip creation, immutable stop/layout/fare snapshots, inventory row generation, assign crew. | Open a trip for sale; editing its source template/route does not change its snapshot. |
| [ ] | D08 — 13 Oct | **Buffer + Gate A.** Fix foundation failures and measure actual remaining effort. | Auth, isolated PO data, route/fare, dynamic template, and sale-ready trip all work. If not, postpone optional work now. |
| [ ] | D09 — 14 Oct | Public search and interval-aware seat availability; minimal search/trip screens. | Correct origin departure time/fare; non-overlap reuse available; unavailable overlapping seat disabled. |
| [ ] | D10 — 15 Oct | Server-side hold/release/expiry with deterministic row lock order and authoritative deadlines; connect seat selection timer. | Hold blocks overlap; expiry/release frees inventory; UI cannot reserve an already-held seat. |
| [ ] | D11 — 16 Oct | Verify inventory contention on real DB transactions. Repair transaction logic before adding payments. | 50 simultaneous same-interval attempts yield one success, no duplicates; adjacent intervals can both succeed. |
| [ ] | D12 — 17 Oct | Authenticated one-passenger checkout and idempotent booking creation linked to hold. | Repeated submit does not duplicate booking; server recomputes price and validates hold owner. |
| [ ] | D13 — 18 Oct | Midtrans Sandbox transaction creation and payment initiation/grace persistence. | Sandbox token/checkout works; initiation retry does not duplicate active order; deadline rule is reproducible. |
| [ ] | D14 — 19 Oct | Verified webhook, event deduplication, transactional confirmation/assignment, conflict state. | Success confirms once; invalid notification rejected; duplicate/reordered notification safe; expired inventory is not stolen. |
| [ ] | D15 — 20 Oct | Ticket issuance, QR token lifecycle, passenger ticket page and My Tickets. | One valid ticket per passenger/trip; paid user can reopen it after login on another device; foreign ticket denied. |
| [ ] | D16 — 21 Oct | **Buffer + Gate B.** Run Passenger end-to-end and fix integration failures. | Search → seat → checkout → real sandbox success → QR works on staging. Mock payment alone does not satisfy this gate. |
| [ ] | D17 — 22 Oct | Crew assigned-trip list, trip manifest, manual passenger search/detail; Admin manifest view. | Confirmed passengers appear; pending bookings excluded; only assigned crew can inspect the trip. |
| [ ] | D18 — 23 Oct | Camera QR resolution, wrong-trip validation and manual fallback. | Phone camera opens the same profile as manifest; unknown/cancelled/wrong-trip QR denied; camera refusal recoverable. |
| [ ] | D19 — 24 Oct | Authorized, idempotent boarding action and status display. | Repeat or concurrent boarding yields one success record; scan itself does not board automatically. |
| [ ] | D20 — 25 Oct | Independent snack claim and passenger/crew status synchronization via refresh. | One snack claim; boarding state preserved; repeat claim safe; labelled status visible without relying on color. |
| [ ] | D21 — 26 Oct | Minimal payment-conflict queue/detail and safe manual resolution with audit. | Admin can confirm only after inventory recheck, or record sandbox/mock refund resolution; no manual database edit needed. |
| [ ] | D22 — 27 Oct | Minimal Super Admin company list/activate/suspend; enforce D01 suspension policy. | Super Admin has platform controls; PO roles denied; suspension behaves consistently for new sales and existing tickets. |
| [ ] | D23 — 28 Oct | Integrated demo check and usable role navigation; minimal crew PWA metadata/shell; feature freeze. | Demonstrate two passengers reusing one seat on adjacent segments, manifest, boarding, snack, and PO isolation. No new features after this day. |
| [ ] | D24 — 29 Oct | Critical integration/E2E regression: inventory, expiry/payment race, webhook retry, auth and crew actions. | Written checks and results prove core correctness. Fix release blockers before visual extras. |
| [ ] | D25 — 30 Oct | UI and error pass: mobile Passenger/Crew, desktop Admin, loading/empty/error states and actual-phone scanner test. | No broken core flow at phone width; understandable expiry/network/payment errors; seat grid and QR readable. |
| [ ] | D26 — 31 Oct | **Recovery buffer.** Close the highest-severity outstanding defect. | No known double booking, wrong payment confirmation, tenant leak, or unusable main action. |
| [ ] | D27 — 1 Nov | **Recovery buffer + deployment check.** Retest hosting/auth redirects/webhook/camera HTTPS from a clean browser. | Hosted flow works with production-like configuration using sandbox credentials; deployment failures recorded and resolved. |
| [ ] | D28 — 2 Nov | Release rehearsal for technical readiness: deterministic reset/seed, account list, runbook, screenshots, known limitations. | Another person can follow README to launch/demo; reset does not require hand-editing database rows. |
| [ ] | D29 — 3 Nov | **Final buffer.** Repeat the demo after reset; fix only release-blocking regressions. | Two consecutive clean demos; snapshot/tag of working release when Git exists. |
| [ ] | D30 — 4 Nov | Freeze deliverable and hand over evidence: URL, runbook, scope delivered/deferred, verification results and reproducible demo data. | Release can be demonstrated without coding during the presentation; residual limitations stated explicitly. |

## Gates and stopping rules

| Gate | Deadline | Required outcome | If missed |
| --- | --- | --- | --- |
| A | D08 | Sale-ready trip, isolated companies, usable layout | Consume buffer, reassess capacity; do not pretend payment can proceed without inventory foundation |
| B | D16 | Hosted Passenger purchase with Midtrans Sandbox and QR | Focus exclusively on this flow before optional admin polish; reconsider release date if the core remains blocked |
| C | D23 | Passenger → Crew operational demo, critical isolation, basic Super Admin | Freeze features; write actual delivered/deferred scope |
| Release | D30 | Stable reproducible demo and critical verification | Do not label it ready if correctness/security failures remain; report the blocking defect and revised completion estimate |

Feature deferral cannot compensate for an unproven inventory transaction or insecure tenant access. The five buffers are for uncertainty; they do not guarantee a release if setup or domain issues exceed capacity.

## Completion checklist for the proposed release

- [ ] Reduced scope adopted and reflected in scope/decision ledger, or original scope retained with an extended completion date.
- [ ] Real Sandbox payment succeeds from hosted Passenger flow.
- [ ] Adjacent segments reuse a seat; overlapping intervals cannot double-book under concurrency.
- [ ] Expiry, grace, late payment and duplicate notifications preserve inventory/ticket consistency.
- [ ] Four roles and two PO contexts are demonstrable; crew assignment and foreign-resource checks hold server-side.
- [ ] Trip layout stays stable after template edits.
- [ ] QR resolves profile, manual search works, boarding/snack are independently idempotent.
- [ ] Minimal conflict resolution uses application UI/service flow with audit.
- [ ] Phone scanner and responsive flows verified in the deployed environment.
- [ ] Seed/reset, README, limitations, and verification evidence delivered.

## How to use this with Codex

Ask for one deliverable at a time, for example:

> Read `docs/seatpax/00_INDEX.md` and the 30-day delivery plan. Work on D01: prepare the reduced-scope decision proposal and resolve only the foundational spec gaps. Show the decisions before changing any FINAL product policy. Do not start app implementation yet.

After scope decisions and the first subsystem contract are settled, each implementation session should say which day/task is being executed, produce a working slice, run its meaningful checks, and record evidence and the next dependency. Tick a day only when its result is achieved; calendar passage alone is not completion.

## Planning review

- Critical original differentiators remain in the proposal; broader original MVP omissions are explicitly listed.
- Fifteen review findings are either addressed by D01's core decisions and the matching implementation task, or deferred with the related feature. D01 must close R01–R06, R10–R11, R13–R14 for the retained paths; one-passenger scope reduces R07/R08; R09 and vehicle-replacement portions of R15 are deferred if operational reseat is deferred; R12 and retained R15 policies are covered by D19–D22/D24.
- Runtime correctness checks occur with their implementation days and again at release; no runtime result is claimed by this planning document.
- This is a calendar and scope proposal, not a substitute for code-level subsystem plans. Exact migrations/API interfaces must be written against adopted decisions before code execution.
