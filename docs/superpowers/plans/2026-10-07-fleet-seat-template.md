# Fleet and Seat Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the user's preserved inline execution method. Steps use checkbox (`- [ ]`) syntax for tracking. One final reviewer must use GPT-6 Luna with medium effort.

**Goal:** Admin PO can save a reusable click-cell layout, associate it with a vehicle, and reopen it safely within their own company.

**Architecture:** Thin verified server actions call `modules/fleet` validation/services/repositories using the existing guarded PostgreSQL transaction. Layout writes replace the complete grid atomically; vehicle assignments lock their dependencies before the vehicle. Pure grid helpers support both the builder and future snapshot projection.

**Tech Stack:** Existing Next.js App Router, React, TypeScript, Zod, Drizzle/postgres-js, Vitest. No new product dependency.

**Spec:** [Approved fleet/seat template design](../specs/2026-10-07-fleet-seat-template-design.md), approved by the user on 7 October 2026.

## Global Constraints

- Template name 1–120 trimmed characters; rows 1–30, columns 1–8; exactly one cell per coordinate, at most 240 cells, at least one SEAT; front above row 0.
- Types SEAT/DRIVER/AISLE/DOOR/EMPTY/FACILITY; seat code uppercase ASCII letters/digits/hyphen 1–8, unique after normalization; non-seat code null; label at most 40, empty null.
- Capacity derived from SEAT count; no arbitrary cell metadata, pixel coordinates, rotation or spanning.
- Auto-number all SEAT cells row-major `01..N` only after confirmation. Resize preserves overlap; removal of non-EMPTY cells requires confirmation; cancel retains draft.
- Template ACTIVE/ARCHIVED and version starting 1; vehicle ACTIVE/MAINTENANCE/INACTIVE and revision starting 1; increment once per successful mutation, stale expected counter conflicts.
- Vehicle name 1–120; plate normalized uppercase/collapsed whitespace 1–24 ASCII letters/digits/spaces/hyphen, unique per company; optional fleet number at most 32. Same-company template and default service class required.
- New/changed references must be active. Unchanged inactive/archived references may remain for metadata/status edits; never silently reassign.
- Verified identity plus active ADMIN_PO membership rechecked/locked inside transactions. RLS and all browser table grants revoked. No global Super Admin fallback; suspension does not block source management.
- Conflicts retain draft and display latest state; adopting latest or explicit overwrite confirmation precedes counter advancement. Pending state prevents duplicate submits.
- No trips/publication/inventory/booking, drag/drop, duplicate polish, photos or maintenance scheduling. Layout projection is snapshot-ready source data, not proof of trip immutability implementation.
- Use isolated managed worktree at execution time; preserve main's generated next-env change and existing demo data. No GitHub push or production deployment. Stop dev before build in the same checkout.

## Review Focus

1. `a1` versus ` A1 `, duplicate coordinate, missing cells and non-seat codes: normalized input fails predictably, never partially replaces layout (Tasks 1/2).
2. Shrink or renumber after manual edits: cancellation retains draft, confirmation is explicit, codes/capacity remain valid (Tasks 1/4).
3. Template archive/class deactivate races vehicle assignment: locks serialize and eligibility rechecks; foreign IDs cannot create associations (Task 3).
4. Two tabs conflict refresh: latest counters cannot silently bless stale drafts; later concurrent updates still conflict (Tasks 2/3/4).
5. Template resize/replacement after vehicle association: derived vehicle capacity updates, reference survives, pure projection includes all non-seat cells (Tasks 2/3/5).

## File map and shared types

Create `modules/fleet/types.ts`, `validation.ts`, `grid.ts`, `repository.ts`, `template-service.ts`, `vehicle-service.ts`. Modify `lib/db/schema.ts`; generate `drizzle/0002_fleet_seat_templates.sql` and metadata (check migration sequence before generation).

Create `app/admin/fleet-actions.ts`, `fleet-data.ts`, `components/seat-template-builder.tsx`, `seat-grid.tsx`, `vehicle-form.tsx`, `conflict-panel.tsx`; pages under `app/admin/companies/[companyId]/seat-templates/{page.tsx,[templateId]/page.tsx}` and `vehicles/{page.tsx,[vehicleId]/page.tsx}`. Modify existing company layout navigation and admin CSS only for this feature.

Tests: `tests/unit/fleet-validation.test.ts`, `fleet-grid.test.ts`, `fleet-actions.test.ts`, `fleet-conflict.test.ts`, `tests/integration/fleet.test.ts`. Evidence: `docs/setup/FLEET_SETUP.md`; synchronize modular fleet/schema/ledger/index after implementation.

`Cell={rowIndex:number;colIndex:number;type:CellType;label:string|null;seatCode:string|null}`. `Layout={rows:number;cols:number;cells:Cell[]}`. `TemplateInput=Layout & {name:string}`. `TemplateDetail=TemplateInput & {id:string;version:number;status:'ACTIVE'|'ARCHIVED';capacity:number}`. `VehicleInput={name:string;plateNumber:string;fleetNumber:string|null;seatTemplateId:string;defaultServiceClassId:string;status:VehicleStatus}`. `VehicleDetail=VehicleInput & {id:string;revision:number;capacity:number;templateStatus:TemplateStatus;classStatus:'ACTIVE'|'INACTIVE'}`. Reuse existing `Context`, `DomainTx`, `DomainError` and `withAdminTransaction`.

### Task 1: Pure grid contracts and validation

**Files:** fleet types/validation/grid and unit validation/grid tests.

**Interfaces:** `parseTemplate(input:unknown):TemplateInput`, `parseVehicle(input:unknown):VehicleInput`, `projectLayout(input:TemplateInput):Layout`, `capacity(layout:Layout):number`, `emptyGrid(rows:number,cols:number):Layout`, `renumber(layout:Layout):Layout`, `resize(layout:Layout,rows:number,cols:number):{layout:Layout;removesContent:boolean}`, `setCell(layout:Layout,row:number,col:number,type:CellType,label?:string|null,seatCode?:string|null):Layout`. Helpers return new data, do not mutate inputs; SEAT suggestion chooses first unused numeric code.

- [ ] Write failing tests: full six-type grid parses; max30×8 accepted; row31/col9 rejected; missing/duplicate/out-of-range coordinates rejected; no seat rejected; normalized duplicate A1 rejected; non-seat code rejected; label41/code9 rejected; vehicle plate whitespace/case normalized and invalid characters rejected.
- [ ] Run `npx vitest run tests/unit/fleet-validation.test.ts tests/unit/fleet-grid.test.ts`; expect RED for missing helpers/contract assertions.
- [ ] Implement parsers/helpers. Assert `renumber` assigns `01`,`02` in row-major order and `100` retains digits; resize flags removed nonempty content and preserves overlap; EMPTY removals do not flag; setCell away from SEAT clears code. Assert projection contains every coordinate/type/label/code and capacity is exact.
- [ ] Run focused tests then `npm run typecheck`; expect all pass. Commit `feat: define fleet grid contracts`.

### Task 2: Template schema and atomic persistence

**Files:** schema/migration/meta, fleet repository/template-service, integration fleet tests.

**Interfaces:** `createFleetRepository(client:Sql)` exposes guarded `run<T>(ctx,work)`, tenant-scoped template/vehicle read helpers and ordered dependency locks. `createTemplateService(repo)` exposes `list(ctx):Promise<TemplateDetail[]>`, `detail(ctx,id):Promise<TemplateDetail>`, `save(ctx,input,id?,expectedVersion?):Promise<{templateId:string;version:number}>`, `setStatus(ctx,id,expectedVersion,status):Promise<{templateId:string;version:number}>`. No company/actor fields in editable input.

- [ ] Write integration tests with unique Auth/company/admin fixtures and exact cleanup: save/reopen all cells; invalid layout rolls back; same-version two writes yield one success/one conflict; foreign PO read/write denied. Use service contracts from Task 1.
- [ ] Run focused `npm run db:test -- tests/integration/fleet.test.ts`; expect RED before new schema/services. Keep this opt-in, default unit tests perform no DB writes.
- [ ] Add all three tables and required enums/compound tenant keys/FKs/checks/unique indexes. Generate migration, inspect it for additive-only changes, append REVOKE ALL on new tables for anon/authenticated; enable RLS. Database constraint tests cover cross-company association, duplicate coordinate/code/plate, malformed seat-code/type and positive counters.
- [ ] Apply inspected migration to the existing verified development session target via `npm run db:migrate` with the established CA environment; no Auth alteration or permanent demo cleanup.
- [ ] Implement guarded template transaction: lock row, compare version, validate whole layout, replace cells and metadata atomically, increment once. Archive/reactivate increments version without deleting cells or vehicles. Sanitize unique violations to actionable validation errors inside the domain boundary before generic transaction sanitization.
- [ ] Run focused DB/unit/typecheck; expect GREEN. Commit `feat: persist tenant seat templates atomically`.

### Task 3: Vehicle association and dependency locks

**Files:** fleet repository/vehicle-service, integration fleet tests.

**Interfaces:** `createVehicleService(repo)` exposes `list(ctx):Promise<VehicleDetail[]>`, `detail(ctx,id):Promise<VehicleDetail>`, `save(ctx,input:unknown,id?:string,expectedRevision?:number):Promise<{vehicleId:string;revision:number}>`. Status is included in save and must obey the same revision/lock rules. Lists/details include current template capacity and status.

- [ ] Write RED tests for normalized duplicate plates, cross-company template/class, inactive new assignment, preserved unchanged archived/inactive references, explicit reassignment, capacity after template replacement and stale vehicle revision. Both PO directions must deny foreign list/detail/write.
- [ ] Run focused integration suite; expect failures for unimplemented vehicle service assertions.
- [ ] Implement membership→old/new templates sorted UUID FOR SHARE→old/new classes sorted UUID FOR SHARE→vehicle FOR UPDATE. Compare locked vehicle revision with pre-read and expectedRevision; recheck dependencies. Map missing/foreign resource to safe forbidden and duplicate plate to validation. New vehicle starts revision1.
- [ ] Add deterministic two-connection barriers for archive versus assignment and revoke versus write; allowed outcomes follow lock ordering, next revoked operation denies, no partial association persists. Same-revision writers have exactly one winner.
- [ ] Run fleet DB tests, existing tenant/route DB regressions and unit/typecheck; expect GREEN. Commit `feat: associate tenant vehicles with seat layouts`.

### Task 4: Builder, vehicle forms and server boundary

**Files:** fleet actions/data, four page paths, grid/builder/vehicle/conflict components, navigation/CSS; fleet action/conflict unit tests.

**Interfaces:** `runFleetAction(companyId:string,raw:unknown):Promise<FleetActionResult>`. Commands: saveTemplate, templateStatus, saveVehicle, refreshTemplate, refreshVehicle. Success carries saved ID/counter or complete latest detail; failure carries DomainError code and safe message. Pure conflict helper `resolveConflict(draft,latest,choice:'adopt'|'overwrite',overwriteConfirmed:boolean)` rejects unconfirmed overwrite and returns chosen data with latest counter. Refresh alone never advances counter.

- [ ] Write RED action tests: unauthenticated makes no service call; malformed UUID/command rejected; identity comes from verified session; each command forwards only its defined domain payload (no command discriminator leaks); fixed tenant revalidation path; domain conflict preserved and SQL/error secrets hidden. Write conflict helper tests for retain/adopt/confirmed overwrite and reject unconfirmed overwrite.
- [ ] Run `npx vitest run tests/unit/fleet-actions.test.ts tests/unit/fleet-conflict.test.ts`; expect RED.
- [ ] Implement thin actions/data and guarded pages; lists show source state/capacity/counters and empty-state create action. Existing admin navigation adds Template kursi and Armada. Archived/inactive current references remain visibly selectable for existing records only.
- [ ] Build cell buttons with accessible row/column/type/code names, front marker and legend, selected-cell panel, dimensions and local capacity. Stage dimension changes behind Apply; confirm content-losing shrink before replacing draft. Confirm renumber before replacing manual codes. Save the full layout once.
- [ ] Build controlled vehicle form and reusable latest-state conflict panel. Preserve failed drafts; display latest detail, adopt or explicitly confirm overwrite before advancing counter; pending/busy prevents duplicate saves. Keep grid overflow within labelled region and stack controls on narrow screens.
- [ ] Run focused action/helper tests then full unit/typecheck/lint/build sequentially; expect GREEN. Commit `feat: add fleet admin forms and seat builder`.

### Task 5: Browser evidence, regression review and integration

**Files:** integration fleet tests, fleet evidence, modular docs/index/ledger, approved plan execution checklist.

- [ ] Extend real DB assertions to SELECT/INSERT/UPDATE/DELETE grant denial on every new table for anon/authenticated and verify complete layout projection after resize/replacement while vehicle association remains intact. Use per-run fixture IDs; never delete demo accounts/routes/seed to make tests pass.
- [ ] Run full `npm run db:test` twice with verified CA/session connection, then `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; inspect each exit/output independently. Do not run dev and build concurrently in the same checkout.
- [ ] Use authorized Computer Use/browser tooling for actual create/reopen/edit/number/resize/vehicle assignment. Check shrink/renumber cancel and confirm, keyboard cells and save, desktop/narrow layout, cross-PO URL denial and conflict preservation. User handles OTP. Record exact checked viewport/login direction and any pending phone/reverse-login limits; never treat unit mocks as UI proof.
- [ ] Request one fresh GPT-6 Luna medium whole-branch review with approved spec/plan and evidence; no per-task implementer/reviewer delegation under preserved inline method. Fix Important/Critical issues with observed RED→GREEN and repeat affected/full verification before completion claims.
- [ ] Synchronize adopted rules in fleet/schema/ledger/index and write `docs/setup/FLEET_SETUP.md` with schema/DB/UI evidence and deferred trip snapshot work. Commit verified work and integrate locally through the existing approved method after plan approval; preserve main generated files and unrelated edits.
- [ ] Verify integrated checkout, restart preview on localhost:3000 with CA, and provide working admin links. Archive isolated worktree only when no running process or pending check needs it. No push/deploy.

## Self-review and execution handoff

Coverage: grid/input/projection Task1; schema/atomic template/version Task2; vehicle/status/reference/races Task3; actions/forms/conflict/responsiveness Task4; browser/DB/grants/review/docs Task5. Review Focus1→1/2,2→1/4,3→3,4→2/3/4,5→2/3/5. All cross-task function names/types above are consistent. Vehicle default class does not introduce trip override policy. Snapshot publication remains deferred.

Spec approved; **plan awaiting user review**. Preserve inline executing-plans method and one Luna medium final review. No feature implementation starts before this written plan is approved.
