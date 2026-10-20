# Regional Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supply actual Indonesian province/city references to Admin and remove obsolete locations from passenger search choices.

**Architecture:** Synchronize a validated external dataset into shared database reference tables; application forms read the last successful local catalogue. Tenant-owned stops retain a compatible legacy city field, while new location selections use a validated reference. Published trip snapshots remain immutable.

**Tech Stack:** Existing Next.js, React, TypeScript, Postgres/Postgres.js, Drizzle, Zod, native fetch and Node crypto; no additional runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-20-region-reference-cleanup-design.md`, sections 1, 2 and 4. Background: `docs/analysis/2026-10-20-region-data-audit.md`.

## Start here

This is **Package A**, implemented first. After it is delivered, follow [Package B: fixture cleanup](2026-10-20-fixture-cleanup.md). Package B is a separate maintenance subsystem and does not need to block catalogue development.

Status: plan prepared for review; no implementation, migration, import or database cleanup has been performed. The user's request to proceed to planning is recorded; this document still requires implementation-plan review.

## Global Constraints

- Target existing development project `slbkhdsfafcxaxqdxmet`, checked by `parseMigrationEnvironment`; retain certificate validation and existing CA configuration.
- Provider identifier `emsifa-v2`; base URL `https://www.emsifa.com/api-wilayah-indonesia/v2`. Import only codes, names and parent relationships.
- No real PO or verified service location has been supplied. Do not create fictional operational data or guess Kota versus Kabupaten.
- Keep existing tenants, identities, memberships, transactions, tickets and published snapshots intact.
- Preserve source-stop IDs in search and snapshot-stop IDs in seat-selection links; no change to holds, pricing or payment policy.
- Preserve the existing Drizzle migration chain. Do not add an independent Supabase migration history or apply unmanaged hosted DDL.
- Tests listed below are an acceptance matrix: add/run them only if the user requests testing/verification. No tests are created or executed during planning. Record any deferred checks honestly.
- Reuse existing managed isolation at execution after inspecting status/base; preserve `next-env.d.ts`, local environment files, attachments and unrelated work.

## Review Focus

1. Partial upstream failures or simultaneous imports must not replace a complete usable catalogue (Task 1).
2. Similar city names, removed references and unmapped legacy rows must not acquire guessed mappings (Tasks 1–2).
3. Forged reference IDs or city labels must not bypass tenant guards or canonical names (Task 2).
4. Expired/suspended trips must not populate choices, while a still-open middle-stop interval remains discoverable (Task 3).
5. Empty catalogue and narrow-screen/keyboard form interactions must remain understandable and recoverable (Task 2).

---

### Task 1: Shared catalogue and manual synchronization

**Files:** Create `modules/regions/types.ts`, `provider.ts`, `repository.ts`, `sync-service.ts`, `scripts/sync-regions.ts`; modify `lib/db/schema.ts` and generated Drizzle migration/journal. Document in `docs/setup/REGION_REFERENCE_SETUP.md`.

**Interfaces:**
- `RegionDataset = {provider:'emsifa-v2';upstreamDate:string;retrievedAt:string;digest:string;sourceUrls:string[];provinces:{code:string;name:string}[];regencies:{code:string;name:string;provinceCode:string}[]}`.
- `fetchRegionDataset(fetcher:typeof fetch):Promise<RegionDataset>`; validate and normalize all provider data before returning.
- `createRegionRepository(client:Sql)` exposes `readOptions():Promise<RegionOptions>`, `promote(dataset:RegionDataset):Promise<{runId:string;provinces:number;regencies:number}>` and `recordFailedImport(input:{code:string;retrievedAt:string;sourceUrls:string[]}):Promise<void>`.
- `RegionOptions = {provinces:{id:string;code:string;name:string}[];regencies:{id:string;code:string;name:string;provinceId:string}[];upstreamDate:string|null}`. It contains only active references, not raw payloads or import errors.
- `syncRegions(options:{apply:boolean},repository:ReturnType<typeof createRegionRepository>,fetcher:typeof fetch):Promise<{mode:'dry-run'|'apply';digest:string;provinces:number;regencies:number}>`. CLI dry-run is default; `--apply` enables promotion. In apply mode only, fetch/validation failures call `recordFailedImport` without touching catalogue rows; failed attempts allow null digest/upstream date and zero counts. Dry-run never writes import-run records.

- [ ] Map the schema in `lib/db/schema.ts`: `region_import_runs` (UUID, provider, FETCHING/SUCCEEDED/FAILED state, source URL array, upstream date, retrieved/finished times, SHA-256 digest, counts, sanitized failure code); `region_provinces` (UUID, provider, code, name, active, last-seen successful run); `region_regencies` (same identity fields plus province UUID). Add unique `(provider,code)` constraints and indexed parent/run FKs. Composite provider/parent FK prevents a regency referencing another provider's province.
- [ ] Add nullable indexed `stops.region_regency_id` referencing regencies with `ON DELETE RESTRICT`; leave existing rows null. Enable RLS and revoke direct anon/authenticated table privileges for the three reference tables; server adapters provide display DTOs. Never add a public write policy.
- [ ] Generate a custom migration with the locally verified CLI command `npx --no-install drizzle-kit generate --custom --name=region_reference`; the current chain ends at `0010_company_status_control`, so expected new output is `drizzle/0011_region_reference.sql` plus `drizzle/meta/_journal.json`. If the chain advanced, use the generator's actual next index. Fill the generated file and maintain schema/migration consistency.
- [ ] Implement provider fetches: `/stats.json`, `/provinces.json`, then `/regencies/<province code>.json` for every returned province. Use a 15-second timeout per request and at most four requests concurrently. Validate response wrappers, nonempty codes/names, unique codes, all parent links, consistent upstream metadata dates, and counts against fetched stats. Current audit counts are examples, never permanent schema constants. Fail the entire proposed dataset on any incomplete page or invalid record.
- [ ] Implement atomic promotion under a transaction-scoped provider advisory lock. Log attempt state separately, then upsert by `(provider,code)` while preserving UUIDs; deactivate missing codes only after complete validation; mark the run successful in the same transaction. Compare upstream versions under the lock and reject an older dataset. Equal-date changed digests require a reported conflict rather than silent replacement. Roll back catalogue writes on failure and record a sanitized failed attempt.
- [ ] Implement `scripts/sync-regions.ts` using the existing migration-environment parser and TLS connection factory. Default mode fetches/validates and reports counts without catalogue writes; reject unknown arguments. No cron, automatic runtime external fetch, package install or browser credential exposure.
- [ ] If testing is authorized, create `tests/unit/region-sync.test.ts` before implementation and observe RED → GREEN: complete two-province fixture succeeds; duplicate codes/missing parent/wrong counts/rejected fetch reject; `expect(previousDigest).toBe(originalDigest)` after failed promotion; repeat upsert preserves UUID; older/equal-date-conflicting dataset cannot replace newer data. Add opt-in isolated `tests/integration/region-reference.test.ts` for FK/RLS/atomicity. Never run integration fixtures against hosted operational data by default.
- [ ] Verification when authorized: `npm test -- tests/unit/region-sync.test.ts --maxWorkers=2 --testTimeout=120000`; expected all cases pass. Commit this deliverable with `feat: add validated regional reference catalogue`.

### Task 2: Reference-aware stop editing

**Files:** Modify `modules/route/validation.ts`, `service.ts`, `repository.ts`, `app/admin/components/master-form.tsx`, `stop-directory.tsx`, `app/admin/companies/[companyId]/stops/page.tsx`, `app/admin/admin-refresh.css`; create `app/admin/components/region-fields.tsx`.

**Interfaces:**
- Extend `MasterRow` with `regionRegencyId?:string|null` and `regionProvinceId?:string|null`.
- Stop command input becomes `{name:string;regionRegencyId:string|null;address:string|null;status:'ACTIVE'|'INACTIVE'}`. Existing `city` text is not trusted input for new mapped records.
- Preserve `createRouteService(repo).saveStop(ctx,input,stopId?)`; new records require an active region; an existing unmapped record may keep `null` only while retaining its current city verbatim. This permits status/name/address maintenance without guessing a region. Explicit selection is required to change its city.
- `RegionFields({options,initialRegencyId,legacyCity}:{options:RegionOptions;initialRegencyId?:string|null;legacyCity?:string})` submits one `regionRegencyId` to the existing MasterForm action.

- [ ] Read region options on the stops server page after existing company authorization, and pass them into StopDirectory/MasterForm. If reference reads fail, retain the directory and show an unavailable state in location editing instead of converting the whole page to 404. Do not add a separate public API just to transfer server-component props.
- [ ] Add province selection and a labelled searchable city/regency field. Prefer a native datalist of exact `name [code]` values filtered by province, with a hidden UUID resolved only for an exact valid choice. Changing province clears the city choice. Preserve full Kota/Kabupaten names; do not accept a loose substring as a selected reference.
- [ ] Update tenant-scoped stop service writes to read canonical active regency/province records inside the existing authorized transaction; derive persisted `city` from the catalogue name. Reject missing/inactive/foreign-provider IDs and forged city text. On an existing mapped record whose reference was retired, show it read-only for unrelated edits; require an active replacement for changing region. Lock selected catalogue rows for share to serialize with import deactivation.
- [ ] Display **Wilayah belum dipetakan** for legacy null references. Retain old city text for context. Do not bulk-map Bandung/Bogor or rename terminal/pool labels.
- [ ] Preserve service-class form behavior and all tenant checks. Keep unavailable/empty reference guidance, validation messages, selected province/city after failed submit, labelled inputs, visible focus and reachable controls at 360px.
- [ ] If testing is authorized, add `tests/unit/region-stop.test.ts` and `region-fields.test.ts`: selected Kota Bandung and Kabupaten Bandung resolve different UUIDs; forged label cannot override canonical name; another tenant's stop is denied; legacy null leaves city unchanged; retiring a reference does not break unrelated edits; empty catalogue cannot create a fabricated city. Assert existing published snapshot/ticket content remains unchanged in an isolated integration case.
- [ ] Verification when authorized: focused region/route unit tests followed by `npm run typecheck` and `npm run lint`; expected exit 0. Commit with `feat: select real regions for PO service points`.

### Task 3: Passenger choices from sale-open intervals

**Files:** Modify `modules/inventory/repository.ts`; add acceptance cases in `tests/unit/inventory-locations.test.ts` and opt-in `tests/integration/inventory-availability.test.ts` only if testing is authorized.

**Interface:** Preserve `locations():Promise<{id:string;name:string;city:string}[]>`; `id` remains the master source-stop ID. No frontend contract or published snapshot mutation.

- [ ] Change the read query to require active company and OPEN_FOR_SALE trip. Select only endpoints participating in an ordered pair `a.sequence<b.sequence` where database time is before `least(a.departure_at, sales_close_at-or-origin-departure)`. The returned location must be either endpoint of at least one such pair. Do not use the trip's first departure as a blanket cutoff.
- [ ] Retain deterministic deduplication per source-stop ID using latest eligible trip ordering. Read displayed names/cities from eligible immutable snapshots, never the current master catalogue. Preserve terminal destinations with no later departure and exclude past origins that cannot participate in a still-open interval.
- [ ] If testing is authorized, assert suspended and fully expired trips supply no options; a departed first stop with an open middle-origin interval still supplies its valid middle/destination points; past unrelated origins are absent; source IDs remain unchanged; no catalogue row creates passenger service by itself.
- [ ] Verification when authorized: focused inventory unit cases; isolated DB interval cases only on an approved disposable target. Commit with `fix: exclude obsolete trip locations from passenger search`.

### Task 4: Development application and handoff

**Files:** Update `docs/setup/REGION_REFERENCE_SETUP.md`, `docs/seatpax/10_DATA_MODEL_DATABASE.md`, `13_UI_UX_DESIGN.md`, `19_DECISION_LEDGER.md`, `00_INDEX.md`.

- [ ] Obtain final code review before hosted application. Check Review Focus items; use a focused GPT-6 Luna / medium reviewer if delegating, as requested by AGENTS.md.
- [ ] After implementation approval, apply only the generated region migration using the existing `npm run db:migrate` development guard. Run sync dry-run; report source date/digest/counts; then run `npx tsx scripts/sync-regions.ts --apply` for that reviewed dataset. Do not run `db:seed` or a broad reset.
- [ ] Verify with explicit SELECTs: reference count and parent integrity, old stop IDs retained, all old `region_regency_id` values still null until manually selected, browser write grants absent, transaction/ticket counts and snapshot digests unchanged. These read-only operation checks establish successful application; do not describe them as a full test suite.
- [ ] When testing/verification is requested, run named tests then the full unit suite (`npm test -- --maxWorkers=2 --testTimeout=120000`), typecheck, lint and build. Record checks actually executed and physical-device/browser acceptance still pending; never run hosted mutation tests implicitly.
- [ ] Update evidence and adopted specs with actual results. Commit documentation with `docs: record regional reference delivery`; hand off Package B. A scheduled trip or real service location is not created merely to populate the screen.

## Self-review

Spec sections 1/2/4 map to Tasks 1/2/3; shared safety and evidence map to Task 4. The five Review Focus classes have explicit owning acceptance cases. Schema IDs match DTO/stop fields; existing interval IDs remain unchanged. Tests remain conditional on user testing authorization. No provider availability or database result is claimed by this plan. Fixture writes are separated into Package B and are not hidden inside region synchronization.
