# Availability and Seat Hold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Passenger search, snapshot quote/availability and ten-minute single-seat holds with atomic overlap protection.

**Architecture:** Reuse published Trip Engine snapshots and seat×segment anchors. Put SQL and guarded transitions in modules/inventory; Next.js adapters derive actor from verified Supabase identity. Availability is informative; hold transactions decide ownership.

**Tech Stack:** Existing Next.js/React/TypeScript, PostgreSQL/postgres-js, Drizzle migrations, Zod and Vitest. No new runtime dependency.

**Spec:** [Approved availability/hold design](../specs/2026-10-07-availability-hold-design.md).

## Global Constraints

- One seat per hold; interval `[from, to)`; expiry 10 minutes, exclusive deadline. No payment initiation/grace/conversion writers.
- Use DB clock_timestamp after locks; company SHARE → trip SHARE → anchors UPDATE in `(trip_id, trip_seat_id, segment_sequence)` order → hold. Full-range lock for release/cleanup.
- Sales eligibility: ACTIVE company, OPEN_FOR_SALE trip, now < minimum(origin departure, global cutoff). Middle origins remain eligible independently of first departure.
- Trusted actor only; owner-only hold read/release. Same-trip/company composite FKs, RLS enabled, browser grants revoked.
- Exact IDR bigint/decimal-string quotes; zero valid, missing snapshot/anchor is unavailable invariant error.
- UUID request key unique per owner; identical retry returns original without extending time; differing payload conflicts. No one-hold-per-user policy.
- lock_timeout 5 seconds, statement_timeout 15 seconds; at most one retry for retryable DB errors. No provider/network work inside transaction.
- Cleanup ≤100 candidates per run, one transaction per hold, no public cleanup endpoint. Correctness independent of cleanup.
- Poll every 15 seconds only while visible; countdown display only. No checkout/payment button.
- Inline execution preserved; one final GPT-6 Luna medium reviewer. Preserve existing next-env.d.ts; use isolated managed worktree, no push/deploy. Local main integration after green checks.

## Review Focus

1. DB adapter JSON serializers differ: application Drizzle client and raw-client audit payloads must both remain objects (Task 2/3).
2. DB time advances while request waits: cutoff and expiry must be rechecked after locks (Task 3).
3. Same key simultaneously used on different ranges: rollback unique conflict, then compare existing payload without extending hold (Task 3).
4. Cleanup of wide expired hold versus narrow new hold: never mutate old hold without full-range locks (Task 4).
5. Lost mutation response/hidden tab: UI retains intent key, avoids creating a second hold, pauses polling and cleans timers on unmount (Task 5).

## Execution setup

- [ ] Read spec, docs/seatpax/00_INDEX.md and task-map sources, AGENTS.md, existing inventory anchor schema and Trip Engine tests. Record current base SHA/dirty files.
- [ ] Use using-git-worktrees to create/reuse suitable managed worktree on codex/availability-hold; copy required ignored local env safely without printing credentials. Baseline npm test must pass.
- [ ] Start executing-plans ledger and read each task brief before implementation. No product changes before this plan is approved.

### Task 1: Interval, input, fare and time contracts

**Files:** Create modules/inventory/types.ts, validation.ts, interval.ts, fare.ts; tests/unit/inventory-contracts.test.ts.

**Interfaces:** `HoldInput={tripId:string;seatId:string;fromStopId:string;toStopId:string;requestKey:string}`; `SearchInput={fromSourceStopId:string;toSourceStopId:string;dateWib:string}`. `resolveInterval(stops:TripStopSnapshot[],fromStopId:string,toStopId:string):{from:number;to:number}`; `overlaps(a:{from:number;to:number},b:{from:number;to:number}):boolean`; `quoteInterval(segments:TripSegmentSnapshot[],range:{from:number;to:number}):string`; `wibDayBounds(date:string):{start:string;end:string}`; `sameHoldPayload(hold:HoldRecord,input:HoldInput):boolean`. HoldRecord carries spec persistence fields in camelCase with ISO timestamp strings; HoldView has record plus effectiveStatus and serverNow. AvailabilityView has public trip identity/stops/layout, fare/cutoff/serverNow, seats `{id,seatCode,rowIndex,colIndex,label,status:AVAILABLE|HELD}[]` and saleOpen; no owner data.

- [ ] Write failing tests: [1,2) vs [2,4) false, [1,3) vs [2,4) true; duplicate/foreign/reversed endpoints reject; fare 0+25000+35000 equals '60000'; missing/duplicate segment rejects; WIB day 2026-10-09 bounds 2026-10-08T17:00Z to 2026-10-09T17:00Z, invalid calendar rejects; changed interval/key payload comparison rejects.
- [ ] Run `npx vitest run tests/unit/inventory-contracts.test.ts`; expect missing-module RED.
- [ ] Implement signatures above using existing DomainError and Trip snapshot types; return serialized money only at boundary.
- [ ] Run same unit command and npm run typecheck; expect PASS.
- [ ] Commit `feat: define inventory interval and hold contracts`.

### Task 2: Persistence and public snapshot query boundary

**Files:** Modify lib/db/schema.ts; create next additive Drizzle migration/meta, modules/inventory/repository.ts, availability-service.ts; tests/integration/helpers/inventory-fixture.ts and inventory-availability.test.ts.

**Interfaces:** `createInventoryRepository(client:Sql)` owns SQL reads/locks, exposed client and transition methods. `createAvailabilityService(repo).locations():Promise<{id:string;name:string;city:string}[]>`, `.search(input:SearchInput):Promise<SearchResult[]>`, `.detail(tripId:string,fromStopId:string,toStopId:string):Promise<AvailabilityView>`. SearchResult includes tripId/name/public company name, snapshot origin/destination/name/departure, class, fare and available seat count. Hold repository returns HoldRecord; transactions consume DomainTx. Implement query helpers consumed by Tasks 3/4 with same snapshot DTOs, no mutable source rendering.

- [ ] Write RED integration tests using unique tenant/Auth fixtures and published snapshots: source rename/archive has no effect, same-day middle-origin search after first departure, suspended/draft/cutoff excluded from search, known-ID detail saleOpen false, zero fare correct, missing anchors fail, no hold PII in public DTO. Unknown trip unavailable; malformed interval validation.
- [ ] Run `npm run db:test -- tests/integration/inventory-availability.test.ts`; expect missing-service RED.
- [ ] Add seat_holds and seat_hold_audit_events matching spec, composite tenant/trip seat/stop/hold FKs and owner Auth profile FK, unique owner/request_key, timestamp/state/range checks. Keep snapshot endpoint/sequence correspondence validated in service. Add query indexes for trip/seat active holds and expiry; do not add one-hold/user or occupancy fields to anchors.
- [ ] Generate/inspect migration, uniqueness-before-dependent-FK ordering, additive DDL, RLS/revokes on both tables. Confirm dev URL using existing migration parser and TLS CA without printing secrets; apply via npm run db:migrate.
- [ ] Implement consistent availability statement with one DB time, snapshot price/layout and correlated overlap holds; validate full segment/anchor counts. Locations/search use snapshot identity and source-stop IDs, WIB origin day boundaries. Search/detail derive public company context from trip, not client role/company.
- [ ] Add schema tests FK/check/RLS/grants and Drizzle-backed client reads; expired ACTIVE holds ignored; held statuses expose no owner. Run integration command/typecheck to PASS.
- [ ] Commit `feat: persist holds and query public trip availability`.

### Task 3: Atomic create hold and idempotency

**Files:** Create modules/inventory/transaction.ts, hold-service.ts; tests/integration/inventory-hold.test.ts; extend repository/fixture.

**Interfaces:** `createHoldService(repo).create(actorId:string,input:HoldInput):Promise<HoldView>`, `.readMine(actorId:string,holdId:string):Promise<HoldView>`. Transaction helper runs lock/statement timeouts, bounded DB retry, and preserves DomainError versus retryable errors. Release added in Task 4. Actor/resource validation before SQL; all hold lookup owner filtered.

- [ ] Write RED: adjacent range reuse, overlap rejection including same owner/new key, same-key retry identical ID/deadline/audit, same-key different payload conflict, foreign seat/endpoints/actor rejects, readMine foreign owner denies, base/effective expiry exactly created+600 seconds, injected audit failure rolls back.
- [ ] Run `npm run db:test -- tests/integration/inventory-hold.test.ts`; expect missing-service RED.
- [ ] Implement company/trip/anchor guards and recheck DB now after waiting. Lock all requested anchors in defined order and verify exact count. Read overlap ACTIVE/nonexpired holds; insert hold+audit atomically. Explicit text-typed JSON parameter before jsonb cast for audit across both client variants.
- [ ] Handle existing same-key retry before current sale eligibility, with fresh owner/payload comparison; preserve effective expired status. Concurrent unique failure rolls back before bounded existing lookup and payload comparison. Retry DB deadlock/timeout once only; semantic conflicts never retried.
- [ ] Add actual 50 concurrent attempts distinct authenticated fixture users/keys on same interval: one created hold, 49 conflicts; client pool max10 with independent transaction connections, each transaction timeout15s, test timeout120s and assert no hanging tasks/duplicate audit. Also concurrent same-key same/different ranges tests.
- [ ] Add barriers for company suspension waiting versus create and cutoff elapsed while blocked on anchor; assert time is measured after lock. Expiry test manipulates fixture timestamps consistently, not production clock or real ten-minute sleep. Missing anchor must never create hold.
- [ ] Run integration command plus full existing db:test suite to PASS, including app Drizzle and raw-client create/read JSON-object audit assertion; no existing tenant/fleet/trip regression.
- [ ] Commit `feat: create segment-aware holds atomically`.

### Task 4: Release, logical expiry and bounded cleanup

**Files:** Extend hold-service.ts/repository.ts; create modules/inventory/cleanup-service.ts and scripts/expire-holds.ts; add package script db:expire-holds; tests/integration/inventory-release.test.ts.

**Interfaces:** `.release(actorId:string,holdId:string):Promise<HoldView>`; `createCleanupService(repo).expireBatch(limit=100):Promise<{examined:number;expired:number;failed:number}>`. Script validates dev env/TLS configuration like existing DB tools and prints counts only.

- [ ] Write RED: owner release/retry one audit, foreign ownership rejects, expired release yields EXPIRED, initiated hold release denied, terminal read/retry no mutation, suspended company/closed cutoff release allowed, cleanup bounded100 and partial failures reported without rolling back prior items.
- [ ] Run `npm run db:test -- tests/integration/inventory-release.test.ts`; expect missing-method RED.
- [ ] Implement full-range lock from immutable hold identity, then hold UPDATE and DB clock recheck. Manual release transitions only eligible owner hold; cleanup ignores changed/nonexpired/terminal candidates and writes one expiry audit. Never delete holds or change an old wide expired hold from narrow create transaction.
- [ ] Add barriers release-vs-create and wide expired cleanup-vs-narrow create; assert bounded completion, coherent availability, no overlap active holds, unique transition audit. Read effective status may differ from persisted status without claiming DB mutation.
- [ ] Run integration command and typecheck to PASS; run cleanup script on dev with safe count output (only expired eligible records; no reset/deletion).
- [ ] Commit `feat: release and expire holds with shared locking`.

### Task 5: Passenger adapters and selection UI

**Files:** Create app/trips/page.tsx, app/trips/[tripId]/page.tsx, app/trips/actions.ts, app/trips/data.ts, app/trips/components/search-form.tsx, seat-selection.tsx, app/holds/[holdId]/page.tsx, app/holds/components/hold-detail.tsx, app/passenger.css; modify app/page.tsx, app/account/page.tsx and login return-path handling only as needed. Tests tests/unit/inventory-actions.test.ts, inventory-ui-state.test.ts; pure UI intent/timer state in modules/inventory/selection-state.ts if needed by tests.

**Interfaces:** `createHoldAction(input:unknown)` and `releaseHoldAction(holdId:unknown)` verify actor and return `{ok:true,data:HoldView}|{ok:false,code,message}`. Public availability adapter returns AvailabilityView or explicit safe error; never maps error to empty seats. Data adapters call Task2/3/4 methods; no SQL in client. UI intent keeps one requestKey for uncertain response; terminal/reset selection creates a new key.

- [ ] Write RED adapter trusted-actor/forged fields/unauthenticated/ownership/invalid IDs/sanitized error tests; UI intent repeated uncertain retry same key, changed selection new key, polling visible15s/hidden pause/unmount clear, countdown zero triggers read once.
- [ ] Run targeted unit files to RED.
- [ ] Implement thin adapters and safe local return path (reject absolute/protocol-relative external destinations); ensure login route returns to trip selection without exposing credentials. Public search date reflects WIB; show closed/conflict/empty states separately.
- [ ] Implement snapshot layout with one selectable AVAILABLE seat, non-seat disabled, labels/legend/focus/selected state, server price and pending guard. Refresh conflict state; retain same key/selection on unknown outcome. Poll only visible every15s, no mutation from polling.
- [ ] Implement owner hold view/reopen/countdown/server deadlines and release; expired/released shows terminal state. No payment button or sale success claim. Navigation home/account to passenger search. Contained layout scrolling and stacked forms on narrow screens.
- [ ] Run targeted unit tests/npm test/typecheck/lint to PASS; commit `feat: add passenger availability and hold pages`.

### Task 6: Verification, review, documentation and integration

**Files:** Create docs/setup/AVAILABILITY_HOLD_SETUP.md and evidence screenshots; update relevant modular scope/domain/inventory/schema/API/ledger and spec/plan statuses.

- [ ] Run npm test, npm run typecheck, npm run lint, npm run build and verified dev npm run db:test. Record actual counts and concurrency/barrier evidence, no assertions from stale runs.
- [ ] Start isolated preview free port; use Computer Use for search, middle-origin WIB date/quote, seat selection, login/hold/reopen/release/conflict, narrow and keyboard. User supplies OTP if required. Record unperformed cross-account/browser expiry checks explicitly; no auth bypass.
- [ ] Spawn one read-only final reviewer GPT-6 Luna medium with focused spec/plan/diff: lock order/time recheck, same-key unique race, owner isolation, snapshot/invariant availability, wide-range cleanup, adapter JSON and unknown-result UI. Fix Important/Critical findings with RED/GREEN and affected verification.
- [ ] Update spec/ledger adoption and setup evidence, validate local doc links and git diff --check. Commit intended files only; keep generated/pre-existing next-env.d.ts.
- [ ] Stop worktree server, fast-forward merge locally into main only when verified, run integrated npm test/typecheck and open working main preview. Keep reused managed worktree if needed; no push/deploy. Report evidence, limitations and next checkout/payment slice.

## Self-review and handoff

Coverage: public snapshots and date/quote Task2; lifecycle/owner/idempotency/concurrency Task3; full-range release/expiry Task4; UI/login/adapters Task5; integration/review Task6. Interfaces use HoldView/AvailabilityView defined Task1; Task4 extends same hold service. Payment compatibility columns have no writer. Tests own all five Review Focus cases. Persistence source-stop correspondence stays service invariant; FKs protect tenant/trip identity. No cleanup dependency, network-in-transaction, unapproved sale writer or new dependency.

Status: **PLAN PROPOSED — awaiting user review.** Inline execution preference is preserved; spec approval authorizes planning only.
