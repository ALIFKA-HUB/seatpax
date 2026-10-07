# Trip Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve the user's inline execution method; final independent reviewer uses GPT-6 Luna with medium effort.

**Goal:** Admin PO creates and publishes independent trip snapshots and assigns crew who can read only their assigned published trips.

**Architecture:** Thin Next.js server actions call guarded transaction services in `modules/trip`. Publication atomically copies source data into immutable snapshots and precreates seat×segment lock anchors. Crew reads and assignment writes use fresh membership/assignment checks; browser table access remains denied.

**Tech Stack:** Existing Next.js/React/TypeScript, Zod, postgres, Drizzle, Supabase Auth and Vitest; no new product dependencies.

**Spec:** `docs/superpowers/specs/2026-10-07-trip-engine-design.md` — approved 7 October 2026.
**Status:** **APPROVED PLAN — Tasks 1–5 implemented; Task 6 in progress.** Automated evidence and remaining build/browser/integration items: [`docs/setup/TRIP_ENGINE_SETUP.md`](../../setup/TRIP_ENGINE_SETUP.md).

## Global Constraints

- State slice: `DRAFT` and `OPEN_FOR_SALE`; published schedule/layout/fare immutable.
- UI input/display `Asia/Jakarta` (WIB, UTC+07:00), server stores `timestamptz`; name trimmed 1–120; revision starts 1.
- Route 2–50 unique ordered stops; offsets 0–10080 minutes; origin departure offset 0; transit departure and non-origin arrival required on publish.
- Missing fare blocks publication; fare 0 is valid; decimal-string IDR transport and bigint arithmetic.
- Grid 1–30 rows × 1–8 columns, complete explicit cells and at least one SEAT; snapshot uses the validated source projection.
- Publish requires company ACTIVE and future origin departure. Optional global cutoff > publication now and <= terminus departure.
- Membership and resource ownership are server authority; Super Admin alone has no tenant rights. Crew requires ACTIVE membership and ACTIVE assignment; DRAFT is admin-only.
- Browser anon/authenticated table grants revoked, RLS enabled; privileged SQL requires domain guards.
- No passenger search/hold/booking/payment/manifest/boarding or operational state transitions in this slice.
- Fixture cleanup is exact and limited to generated UUIDs; preserve permanent demo users and source data. Migration applies only to verified development target after inspection.
- Preserve the existing uncommitted `next-env.d.ts`; no push/deployment. Use isolated managed worktree during execution and merge locally after verification under existing authorization.

## Review Focus

1. Invalid calendar dates and browser timezone differences must not silently shift WIB instants (Task 1).
2. Route structure or vehicle-template reference changing while publish waits must produce a safe conflict, never mixed snapshots (Task 3).
3. Published retry after source archive/company suspension must return existing data without creating anchors/audit or bypassing later sale eligibility (Task 3).
4. Admin who also has CREW membership, concurrent assignment and membership disable must not form reversed membership lock order (Task 4).
5. A failed or stale publish must keep the browser draft and show the actual blocker, never claim the trip is open (Task 5).

## File map and common interfaces

Create `modules/trip/types.ts`, `validation.ts`, `time.ts`, `snapshot.ts` (pure contracts/projection), `repository.ts` (SQL reads), `transaction.ts` (guards/lock helpers), `draft-service.ts`, `publication-service.ts`, `crew-service.ts` (domain commands). Extend `lib/db/schema.ts` and generated `drizzle/0003_trip_engine.sql`/metadata. UI adapters live in `app/admin/trip-actions.ts`, `trip-data.ts`, `app/crew/data.ts`; forms in `app/admin/components/trip-form.tsx`, `trip-detail.tsx`, `crew-assignment-form.tsx`. Create admin trips list/detail and crew list/detail routes. Keep tests in `tests/unit/trip-*.test.ts` and `tests/integration/trip-*.test.ts`; shared integration fixture in `tests/integration/helpers/trip-fixture.ts`.

`Context` and `DomainTx` reuse `modules/access/transaction.ts`. Define `TripDraftInput={name,routeId,vehicleId,serviceClassId,departureWib,salesCloseWib:string|null}` (all other fields strings); `TripCommandResult={tripId:string,revision:number,status:'DRAFT'|'OPEN_FOR_SALE'}`; `TripDetail={trip:TripRecord,stops:TripStopSnapshot[],segments:TripSegmentSnapshot[],seats:TripSeatSnapshot[],layout:LayoutProjection|null,inventoryCount:number}`. `TripRecord` includes spec identity/provenance timestamps and references. `LayoutProjection` reuses the fleet validated projection without mutable cell IDs. All database-to-wire timestamps are ISO strings and prices decimal strings.

### Task 1: Pure input, time and publication projection

**Files:** Create the four pure modules and `tests/unit/trip-validation.test.ts`, `trip-time.test.ts`, `trip-snapshot.test.ts`.

**Interfaces:** `parseTripDraft(raw:unknown):TripDraftInput`; `parseWibInstant(input:string):string`; `projectSnapshot(source:PublicationSource,draft:TripDraftInput,nowIso:string):PublicationProjection`; `intervalCutoff(originDepartureIso:string,globalIso:string|null):string`. `PublicationSource` is explicit route/class/vehicle labels and revisions, ordered stop snapshots with source offsets/status and source IDs, adjacent `{fromSourceId,toSourceId,price,currency}` fares, validated fleet layout. Projection returns stop instants, adjacent segment sequence/fare, layout and seat coordinates/codes, source identity labels/revisions. Define these exported types in `types.ts`; no DB/network calls.

- [x] Write failing tests: WIB `2026-10-08T08:00` -> `2026-10-08T01:00:00.000Z`; reject `2026-02-30T08:00`, ambiguous/unzoned arbitrary formats, missing minutes and malformed time; crossing midnight remains correct.
- [x] Write projection tests: four stops and two seats -> four stop instants, three segment fares including 0, two seats and full six-type layout; missing transit departure/non-origin arrival and nonzero origin departure reject; optional origin arrival/terminal departure fallback only to same-stop required instant. Missing fare rejects, huge valid bigint fare stays an exact string.
- [x] Run `npx vitest run tests/unit/trip-validation.test.ts tests/unit/trip-time.test.ts tests/unit/trip-snapshot.test.ts`; confirm failure from missing contracts.
- [x] Implement contracts with strict calendar round-trip validation and fixed WIB conversion; use existing route/fleet validators where possible. Validate future departure/cutoff, monotonic offsets, tenant-independent projection invariants and earliest interval cutoff.
- [x] Run those tests to PASS.

### Task 2: Persist guarded draft trips and structural constraints

**Files:** Modify schema/migration metadata; create repository/transaction/draft service, fixture helper and `tests/integration/trip-drafts.test.ts`.

**Interfaces:** `createTripRepository(client:Sql):TripRepository`; repository `runAdmin<T>(ctx,work):Promise<T>`, `list(tx,ctx):Promise<TripRecord[]>`, `detail(tx,ctx,id):Promise<TripDetail>`. `createDraftService(repo)` provides `list(ctx)`, `detail(ctx,id)`, `choices(ctx)` (active routes/vehicles/classes and source preview), `save(ctx,raw,id?,expectedRevision?):Promise<TripCommandResult>`.

- [x] Write fixture/test cases for same-company draft create/edit and stale concurrent updates (one winner); foreign sources and actor denied; unchanged inactive old reference may remain but changed inactive reference rejected; missing source offsets/fare can remain draft.
- [x] Generate additive schema: trips tenant FKs; snapshot stops/segments/seats/anchors compound same-trip/company FKs and uniqueness; assignment stores target CREW membership ID plus user/company association. Add membership compound unique key needed for constrained FK, retaining current existing unique role indexes. Audit table records PUBLICATION, CREW_ASSIGNED, CREW_REVOKED plus actor/time/target and revision metadata, with tenant FK. Source route-stop/cell provenance uses nullable/unconstrained copied IDs, never FK to replaceable source rows.
- [x] Inspect generated SQL for no destructive DDL; RLS/revokes on every new table; positive revision/sequence, recognized state, timestamp order, nonnegative IDR and coordinate checks. Add schema checks ensuring DRAFT has no published metadata/layout and OPEN_FOR_SALE has published metadata/layout; completeness remains service invariant.
- [x] Confirm `DATABASE_URL` points to dev project without printing secrets, load existing TLS CA setup, run `npm run db:migrate`, then draft integration tests; initial tests fail on missing service behavior.
- [x] Implement draft guards and consistent source dependency locks; read candidate source IDs, lock dependencies then trip, recheck candidates/revision. Foreign IDs give sanitized denial. Detail queries obtain metadata plus snapshots from one SQL statement or a single repeatable read snapshot; no READ COMMITTED mixed-version metadata/layout query pair. List/read check membership freshly.
- [x] Verify FK constraints with foreign trip/seat/segment fixtures and browser roles cannot select/write new tables. Run `npm run db:test -- tests/integration/trip-drafts.test.ts`; PASS.

### Task 3: Atomic publication and immutable independent snapshots

**Files:** Create publication service and `tests/integration/trip-publication.test.ts`; extend repository/transaction.

**Interfaces:** `createPublicationService(repo).publish(ctx:Context,tripId:string,expectedRevision:number):Promise<TripCommandResult>`; `preview(ctx,tripId):Promise<{projection:PublicationProjection|null,blockers:string[]}>`. Existing published result is returned by publish retry even when supplied revision predates publication; draft requires exact revision. Preview only proposes data; publish always rereads under guards.

- [x] Write failing integration cases: four stops/two seats -> exactly four stops, three segments, two seats, six anchors and one publication audit; two concurrent publishes return one identical snapshot; repeated publish doesn't change counts/revision/IDs.
- [x] Test failure rollback (injected repository fault after snapshot insert) leaves DRAFT/no snapshot/audit; inactive source, missing fare/offset, suspended company and past departure reject. Zero fare and class override use correct selected class.
- [x] Test editing/replacing source route stops/cells, names, fare and vehicle template after publish does not change snapshot IDs/labels/grid/time/price; retry after suspension/archive returns unchanged published data.
- [x] Implement locking: actor membership -> company FOR SHARE -> source stops UUID sorted -> template -> class -> vehicle -> route -> trip FOR UPDATE. Current pricing writer locks stops -> class -> route; vehicle writer locks template -> class -> vehicle; no source writer locks trip. Candidate route revision/ordered-stop IDs and vehicle revision/template must still match after locks; mismatch returns conflict, never acquires changed dependencies later. Read complete sources after locks and use `clock_timestamp()` for time checks.
- [x] Insert all snapshots/anchors and audit, transition DRAFT to OPEN_FOR_SALE, increment revision once, set published_at. Use IDs generated within command, exact cartesian-product count verification, no provider calls and rollback on error.
- [x] Use separate DB connections and deterministic barriers to exercise route reorder vs publish, template save vs publish, vehicle reassignment vs publish, actor membership disable and company suspension vs publish. Assert coherent old-or-new snapshot or conflict, bounded completion/no deadlock and rollback safety.
- [x] Run `npm run db:test -- tests/integration/trip-publication.test.ts`; PASS.

### Task 4: Crew authorization, assignment lifecycle and audit

**Files:** Create crew service; extend transaction/repository; create `tests/integration/trip-crew.test.ts`.

**Interfaces:** `createCrewService(repo)` provides `listAssignments(ctx,tripId)`, `crewChoices(ctx)` (active same-company CREW membership choices), `setAssignment(ctx,tripId,userId,status:'ACTIVE'|'REVOKED'):Promise<{tripId,userId,status}>`, `listMine(actorId:string):Promise<TripRecord[]>`, `detailMine(actorId:string,tripId:string):Promise<TripDetail>`.

- [x] Write failing cases: same-company active crew assign/reactivate/revoke, same-state retry produces no audit duplicate; foreign/noncrew/disabled target denied; inactive target may be revoked; multiple crew supported. Assigned published read allowed during suspension; draft/unassigned/revoked/disabled/foreign reads denied.
- [x] Build assignment transaction guard separate from actor-first `withAdminTransaction`: gather actor ADMIN_PO and target CREW membership IDs, lock both UUID sorted FOR SHARE, then revalidate actor/target company/role/state, lock trip then assignment. For revoke of existing inactive target, require target membership relationship and current admin rights without requiring target active. No broad rewrite of shared route/fleet guard.
- [x] Persist unique trip/user assignment, dates/actor and one audit per transition. Reactivation clears revoked_at and updates assigned_by/assigned_at; no-op returns existing state. Crew reads freshly check active membership + assignment within one coherent guarded query and use snapshot-only detail.
- [x] Test concurrent assign/revoke/disable, including actor who also has crew role and reversed actor/target membership UUID order; bounded finish and no access after committed revoke/disable. Existing audit remains readable to admin.
- [x] Run `npm run db:test -- tests/integration/trip-crew.test.ts`; PASS.

### Task 5: Admin and crew pages with safe command adapters

**Files:** Create adapters/components and `app/admin/companies/[companyId]/trips/page.tsx`, `trips/[tripId]/page.tsx`, `app/crew/page.tsx`, `app/crew/trips/[tripId]/page.tsx`; modify company layout navigation, account navigation and existing CSS only where necessary. Test `tests/unit/trip-actions.test.ts`.

**Interfaces:** Actions `saveTripAction`, `publishTripAction`, `setTripCrewAction` verify user server-side and return `{ok:true,data}|{ok:false,code,message}` with no stack/SQL. Adapters bind company/resource IDs only as targets passed through domain authorization. Crew adapter derives actor from verified session. `TripForm` consumes saved draft/choices/preview; `TripDetail` consumes snapshot detail; `CrewAssignmentForm` consumes assignment rows/crew choices.

- [x] Write adapter tests for unauthenticated actor, malformed IDs/revision, stale/publish blocker and forged actor/company fields; assert trusted actor used and sanitized errors. Run `npx vitest run tests/unit/trip-actions.test.ts` to confirm failure.
- [x] Implement admin list/create/edit form: WIB datetime labels, explicit class override, source preview/blockers, pending states and preserved draft on server error. Add clear confirm before immutable publication; successful response navigates to snapshot detail. Conflict requires load latest and explicit review, no silent retry overwrite.
- [x] Implement published detail with complete layout, scheduled stop times, segment prices, capacity/segment/anchor counts, crew list/add/revoke. Published source IDs are not used to render mutable labels/cells. Crew list/detail contains only assigned published trip snapshots; empty state is safe and no passenger PII is introduced.
- [x] Add role-aware navigation while retaining page/service guards; adapter unit tests pass. Keyboard/focus and narrow/desktop visual checks remain part of the pending browser matrix.

### Task 6: Whole-flow verification, review and local integration

**Files:** Create `docs/setup/TRIP_ENGINE_SETUP.md`; update relevant 00_INDEX, 02_MVP_SCOPE, 03_ROLES_RBAC_AUTH, 04_DOMAIN_BUSINESS_RULES, 05_ROUTE_SEAT_INVENTORY, 06_FLEET_SEAT_TEMPLATE, 10_DATA_MODEL_DATABASE, 11_API_PROJECT_STRUCTURE and ledger with approved slice/implementation evidence. Mark spec/plan status accurately.

- [x] Run the 137-test unit suite across 24 files and full database suite (25 tests across 6 files); typecheck and lint pass. See setup evidence. Production build passed. Post-fix full DB rerun passed: 26 tests across 6 files.
- [x] Browser: Admin A draft/reopen, blocker fix/publication, crew assign/revoke/reactivate, foreign PO denial, narrow layout and keyboard revocation passed. Crew A own list/detail passed. UI class override unperformed with single-class fixture; DB override passed.
- [x] Final GPT-6 Luna medium review completed with no findings.
- [x] Record evidence/limits and update the decision ledger and related documentation. `git diff --check` passed. Commit intended changes before local integration, preserving generated files.
- [ ] Stop any worktree server if running, merge locally into main while preserving the existing `next-env.d.ts` change, and verify the integrated checkout. No push/deploy.

## Plan self-review and execution handoff

Coverage maps pure times/projection to Task 1, schema/draft/tenant invariants to Task 2, snapshot/idempotency/locks to Task 3, crew/audit to Task 4, UI/adapters to Task 5 and browser/review/docs/integration to Task 6. Review Focus entries each have a named owning test step. Actual source lock order has been inspected; no provider dependencies are needed. Crew transaction intentionally avoids actor-first membership ordering when locking two identities.

Status: **PLAN APPROVED — implementation Tasks 1–5 complete; Task 6 in progress.** Trip Engine implementation and automated suites are present locally. Build and browser checks completed with the documented single-class limitation. Local merge is pending. No push or deploy is included.
