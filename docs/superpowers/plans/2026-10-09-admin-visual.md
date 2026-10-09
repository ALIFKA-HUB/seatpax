# Admin PO and Super Admin Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Preserve this user's established inline executing-plans method, with one focused final reviewer.

**Goal:** Make the existing administrative workflows readable, recognizable as Seatpax and usable on desktop and phone while preserving their operational safeguards.

**Architecture:** Small role-specific shells and scoped CSS compose existing server pages and client forms. Presentation helpers translate known record states and expose safe existing data. Services, authorization, mutations and their interfaces remain unchanged; shared Crew components retain their read-only and layout contracts.

**Tech Stack:** Existing Next.js/React, TypeScript, native forms/CSS, Vitest, Geist and installed Seatpax PNG assets. No dependency, schema or provider changes.

**Spec:** `../specs/2026-10-09-admin-visual-design.md`, approved on 9 October 2026. The user approved this plan and authorized execution/local integration. Implementation and automated verification completed; actual acceptance remains pending. Evidence: ../../setup/ADMIN_VISUAL_SETUP.md.

## Global Constraints

- Read `docs/seatpax/00_INDEX.md` first; active release, decision ledger and approved spec govern scope.
- Retain current URLs, query/form contracts, redirect destinations, source reads, validation, version conflicts, request identity, pending guards, confirmations, server actions and authorization.
- No dashboard/metrics, sorting/filter additions, company creation/invites/role editing, financial integration, offline work or deployment.
- Use installed `public/brand/seatpax-horizontal.png` / `seatpax-icon.png`, Geist, canvas `#F5F7FA`, navy `#0A2144`, primary `#005BD1`, white surfaces and adopted semantic palette. Logo stays unchanged.
- Body/input 16px; table/helper text at least 14px; headings 32px desktop / 28px phone; main controls at least 44px high. Controls radius 8px, panels 12px; tabular numeric values.
- Desktop sidebar approximately 240px; content maximum 1200px excluding sidebar, 24–32px gutters. Below 900px use wrapping header navigation with company/account visible. At 320px only labeled table/grid regions scroll horizontally.
- Scope Admin and Super Admin CSS. Existing Passenger/Crew styling and shared components must retain their behavior. Text states, focus outlines, labels and narrow live regions are required. Approximately 150ms color/border transitions only under no-preference motion.
- Use a suitable attached managed worktree after using-git-worktrees inspection. Preserve user-owned main `next-env.d.ts` and `.codex-remote-attachments`; never commit secrets or temporary fixtures.
- Local integration only under approved plan; no push/publication. Manual user acceptance remains deferred. Certificate failures cannot be bypassed; synthetic layout evidence is labeled sample data.
- Primary requested GPT-6.1 Sol medium cannot be changed through tool calls; retain that disclosed limitation. Any reviewer uses explicit GPT-6 Luna medium with focused context.

## Review Focus

1. Nested routes and similarly prefixed route names: exactly one correct current section, never a prefix collision (Task 1).
2. Long names/unknown states/large exact IDR values: wrap safely, show unknown codes and retain decimal-string formatting without Number conversion (Tasks 2, 5, 7).
3. Draft versus published trips and inactive source references: no new publication/selection eligibility or fake occupancy; readonly snapshots remain immutable (Tasks 3, 4).
4. Shared SeatGrid/ManifestList used by Crew: Admin scope does not leak, and readOnly manifest exposes no operational links/buttons (Tasks 3, 4, 7).
5. Pending, stale/ABA or failed payment/company mutations: preserve request identity, explicit confirmations, original revision semantics and honest financial history (Tasks 5, 6).

## File Map and Interfaces

- Create `app/admin/components/admin-shell.tsx`: presentational `AdminShell({companyId,companyName,children}:{companyId:string;companyName:string;children:ReactNode})`; target `admin-main`.
- Create `app/admin/components/admin-navigation.tsx`: client `AdminNavigation({base}:{base:string})` using current pathname and seven existing destinations. Export pure `isAdminSectionActive(pathname:string,href:string):boolean` for exact route-boundary checks.
- Create `app/admin/presentation.ts`: `sourceStatusPresentation(status:string)`, `tripStatusPresentation(status:string)` and `paymentStatusPresentation(status:string)` returning `{label:string;tone:BadgeTone}`. Unknown input has neutral tone and label `Status perlu diperiksa: <original code>`. Reuse bookingPresentation/formatIdr/formatDepartureWib from `app/presentation.ts`; unknown booking codes are separately shown when not recognized.
- Modify `app/admin/admin.css`: Admin scope, source forms/tables and shared grid/manifest styles; standalone `.admin-entry` scope for `/admin`. No unscoped shared `.seat-*`/`.fleet-*` rules.
- Modify `app/admin/page.tsx`, `app/admin/companies/[companyId]/layout.tsx`, existing company pages and presentation components below. All existing exported form/grid props remain unchanged.
- Create `app/super-admin/components/super-admin-shell.tsx`: `SuperAdminShell({children}:{children:ReactNode})`, target `super-admin-main`; create `app/super-admin/super-admin.css`. Update existing companies page/list/status-control markup only.
- New tests: `admin-shell.test.ts`, `admin-source-view.test.ts`, `admin-fleet-view.test.ts`, `admin-trip-view.test.ts`, `admin-payment-view.test.ts`, `super-admin-view.test.ts`, `admin-visual-contract.test.ts` in `tests/unit/`.
- Create `docs/setup/ADMIN_VISUAL_SETUP.md`; update index, UI design, ledger visual execution note, spec/plan statuses only when supported by evidence.

Tests use existing Vitest + `createElement` / `renderToStaticMarkup` patterns. Mock Next navigation and server actions only for component rendering; use typed fixtures and existing controller/action tests for behavioral regressions. Source assertions establish boundaries, not measured visual correctness.

## Task 1: Admin shell, current navigation and company entry

**Files:** Create Admin shell/navigation and `tests/unit/admin-shell.test.ts`; modify Admin CSS, company layout and `/admin` page.

**Interfaces:** Consume `Brand({compact?:boolean,href?:string})`; produce shell/navigation interfaces listed above for remaining tasks. Company layout still calls `companyData(companyId)` and `adminCompanies()` before rendering.

- [x] Write failing tests `renders company context brand skip target and account`, `matches nested sections without prefix collision`, and `preserves single-company redirect and multi-company links`. Mock pathname/server data; assert branded `/admin` link, escaped long company name, `#admin-main`, `/account`, all seven exact company destinations and current-link attribute. Pure navigation assertions:

```ts
expect(isAdminSectionActive('/admin/companies/a/trips/t/manifest','/admin/companies/a/trips')).toBe(true);
expect(isAdminSectionActive('/admin/companies/a/trips-old','/admin/companies/a/trips')).toBe(false);
expect(isAdminSectionActive('/admin/companies/b/trips','/admin/companies/a/trips')).toBe(false);
```

- [x] Run `npm test -- tests/unit/admin-shell.test.ts`; expect new shell/navigation assertions to fail before implementation.
- [x] Implement the exact interfaces, responsive shell, safe company header and selected-section semantics. Scope Brand sizing independently of Passenger styles. `/admin` retains routes redirect/link destinations and no-access text; introduce no company switcher. Account remains visible below 900px; add skip target with keyboard focus support.
- [x] Run targeted tests and `npm run typecheck`; require exit 0. Check source guard/redirect calls remain unchanged.
- [x] Commit explicit Task 1 files: `feat: redesign Admin workspace navigation`.

## Task 2: Readable source lists, route editing and conflict presentation

**Files:** Create `app/admin/presentation.ts` and `tests/unit/admin-source-view.test.ts`; modify company routes/list/detail, stops and service-classes pages, `master-form.tsx`, `route-editor.tsx`, `fare-editor.tsx`, `quote-preview.tsx`, `conflict-panel.tsx`, Admin CSS.

**Interfaces:** Consume Task 1 scope. Produce status helpers: source ACTIVE/Aktif/success, INACTIVE/Nonaktif/neutral, ARCHIVED/Diarsipkan/neutral, MAINTENANCE/Dalam perawatan/warning; trip DRAFT/Draft/neutral, OPEN_FOR_SALE/Penjualan dibuka/success; payment PENDING/Menunggu pembayaran/warning, PAID/Dibayar/success, FAILED/Gagal/danger, EXPIRED/Kedaluwarsa/neutral. Unknowns remain neutral with original code; use own-property lookup.

- [x] Write failing tests `labels known source states and retains unknown codes`, `renders named locally scrollable route tables`, `keeps source edits before creation and distinguishes empty data`, and `keeps revision conflict choices explicit`. Assert `sourceStatusPresentation('MAINTENANCE').label === 'Dalam perawatan'`, unknown `FUTURE` label includes FUTURE and `toString` is neutral. Mock guarded data to render routes/stops/classes; assert table headings/region name/tabIndex, exact edit URLs, list/editor before create form and honest empty states. Render ConflictPanel with latest data; assert all three existing choices and retained latest-data disclosure. Use escaped long record names and exact `formatIdr('9007199254740993') === 'Rp 9.007.199.254.740.993'`.
- [x] Run `npm test -- tests/unit/admin-source-view.test.ts`; expect new presentation assertions to fail.
- [x] Implement helpers and labeled table regions. Group existing edit/list sections before creation sections for stops/classes, preserving field order and action contracts. Give save primary styling, other actions secondary and deactivation caution styling. Retain native form labels, quote behavior, missing/zero fare distinction and conflict refresh/adopt/confirmed overwrite. Keep latest-data readable in its existing disclosure.
- [x] Run targeted tests plus `tests/unit/admin-actions.test.ts`, `route-validation.test.ts`, `pricing-service.test.ts` and typecheck. Require exit 0; no test may claim mocked reads establish authorization.
- [x] Commit explicit Task 2 files: `feat: clarify Admin source lists and editors`.

## Task 3: Fleet lists and seat-template builder

**Files:** Create `tests/unit/admin-fleet-view.test.ts`; modify company seat-template/vehicle list and detail pages, `seat-template-builder.tsx`, `vehicle-form.tsx`, Admin CSS. Shared `seat-grid.tsx` may receive neutral semantic markup only if necessary; retain its props.

**Interfaces:** Consume status helpers and shell. Existing `SeatGrid({layout,selected?,onSelect?})`, `SeatTemplateBuilder({companyId,initial?})` and VehicleForm props remain unchanged. Layout and fleet types stay in `modules/fleet/types.ts`.

- [x] Write failing tests `renders Indonesian cell labels with original enum values`, `separates primary save from archive and renumber`, and `shows fleet status and immutable snapshot controls`. Render builder with a typed saved template containing all six cell types; assert option value SEAT with visible Kursi, original seat codes, selected cell identity and distinct save/secondary/caution classes. Render SeatGrid both editable and readonly, asserting pressed selection for editable and disabled cells/no pressed state for readonly. Render vehicle form with an unchanged inactive reference to ensure that option remains present. Mock router/actions only; preserve existing capacity/resize/renumber/conflict tests.
- [x] Run `npm test -- tests/unit/admin-fleet-view.test.ts`; expect new presentation checks to fail.
- [x] Implement layout/type labels and active/archive/maintenance badges without changing values. Grid retains geometry/cell types/codes, preferably 60×54px; selected editor follows grid on phone. Save is primary, resize/renumber secondary and archive/reactivation separate. Keep all existing browser confirmations, busy/conflict handling and reference selection rules. Scope every shared grid selector under Admin so Crew stays unchanged.
- [x] Run targeted tests plus `tests/unit/fleet-grid.test.ts`, `fleet-conflict.test.ts`, `fleet-actions.test.ts`, `fleet-validation.test.ts` and typecheck; require exit 0. Inspect diff for preserved event bodies.
- [x] Commit explicit Task 3 files: `feat: redesign Admin fleet and seat builder`.

## Task 4: Trips, snapshot details, assignment and read-only manifest

**Files:** Create `tests/unit/admin-trip-view.test.ts`; modify trip list/detail/manifest pages, `trip-detail.tsx`, `trip-form.tsx`, `crew-assignment-form.tsx`, Admin CSS. Shared ManifestList props/handlers stay unchanged.

**Interfaces:** Existing `TripDetail({detail,preview=false}:{detail:modules/trip/types.TripDetail;preview?:boolean})` remains. Consume Task 2 display helpers/formatters and existing ManifestList `readOnly` contract. Current TripForm/CrewAssignmentForm props remain.

- [x] Write failing tests `prioritizes published identity and separates technical snapshot details`, `distinguishes saved draft preview without fake inventory`, and `preserves read-only Admin manifest and assignment controls`. Use a typed TripDetail fixture with missing optional identity/layout and a normal published fixture; assert WIB, route/plate/class, visible schedule, native Rincian perjalanan disclosure, full fare/grid inside it, and count labeled technical rather than available seats. In preview mode assert draft marker and absence of misleading zero inventory metric. Mock current trip page dependencies to cover DRAFT versus OPEN_FOR_SALE branches, existing manifest link, retained assignment control, and no rendered publication form on published detail. Render ManifestList readOnly with confirmed passenger fixture; assert no `/crew/trips/` profile links or boarding/snack buttons.
- [x] Run `npm test -- tests/unit/admin-trip-view.test.ts`; expect new composition assertions to fail.
- [x] Implement summary/schedule/disclosure using existing data; no counts or projections for revenue/occupancy. Preserve trip list order, choices, guard/notFound handling, saved-preview semantics, dirty/blocker/revision gates and explicit publication confirmation. Style assignment separately; status labels include membership state without changing eligibility or revoke handlers. Add Admin-scoped shared manifest styles; maintain readOnly flag.
- [x] Run targeted tests plus `tests/unit/trip-actions.test.ts`, `trip-snapshot.test.ts`, `crew-manifest-view.test.ts`, `boarding-minimum.test.ts` and typecheck; require exit 0.
- [x] Commit explicit Task 4 files: `feat: clarify Admin trip preparation and manifest`.

## Task 5: Payment conflict review and resolution hierarchy

**Files:** Create `tests/unit/admin-payment-view.test.ts`; modify company payment-conflict list/detail pages, `payment-conflict-form.tsx`, Admin CSS.

**Interfaces:** Existing PaymentConflictForm props and `resolvePaymentConflictAction` contract stay unchanged. Reuse existing bookingPresentation/formatIdr/formatDepartureWib and Task 2 payment helper; unknown booking status includes original code alongside safe generic label.

- [x] Write failing tests `shows financial history separately from simulated refund`, `labels unknown payment state without asserting success`, and `keeps resolution controls gated`. Render detail with PAID/PAYMENT_CONFLICT, terminal REFUNDED and unknown review fixtures; assert paid amount/history, simulated refund explanation, unknown code and no invented provider refund. Render form combinations for company disabled, terminal and missing reason; controls remain disabled, reason maxLength 500 and required, narrow message region, primary confirmation/caution simulated-refund classes. Preserve original request-key and confirm handlers by diff review; existing action tests exercise stale/ineligible/repeated resolution outcomes.
- [x] Run `npm test -- tests/unit/admin-payment-view.test.ts`; expect new view/style assertions to fail.
- [x] Implement grouped route/passenger/seat state and financial/reference details, local long-code overflow, known display labels and explicit `Catat refund simulasi` copy. Preserve underlying MOCK_REFUND value, request keys, window.confirm, service eligibility and terminal disabling; no new redirect/refund/ticket issuance logic.
- [x] Run targeted tests plus `tests/unit/payment-admin-actions.test.ts`, `passenger-payment-view.test.ts` and typecheck; require exit 0.
- [x] Commit explicit Task 5 files: `feat: clarify Admin payment conflict review`.

## Task 6: Independent Super Admin company workspace

**Files:** Create SuperAdminShell/CSS and `tests/unit/super-admin-view.test.ts`; modify `app/super-admin/companies/page.tsx`, `components/company-list.tsx`, `components/company-status-control.tsx`.

**Interfaces:** Produce `SuperAdminShell({children:ReactNode})`; consume Brand. Keep CompanyList/CompanyStatusControl props and existing company controller/reconciliation interfaces unchanged. Super Admin cannot acquire Admin tenant navigation.

- [x] Write failing tests `renders independent brand role and account shell`, `presents company rows with explicit confirmation`, and `handles empty denied and unavailable states without company leakage`. Assert `/super-admin/companies`, `/account`, `#super-admin-main`, labeled active/suspended states and escaped long company names. Render control with pending/confirming combinations; assert confirm/cancel and both existing consequence texts, cancel autofocus and disabled pending controls. Mock companyData for DomainError paths and empty data; no add-company action or Admin links. Existing company-ui cases pin newer-result reconciliation, ABA conflict refresh, pending deduplication and network error behavior.
- [x] Run `npm test -- tests/unit/super-admin-view.test.ts`; expect new shell/row assertions to fail.
- [x] Implement readable company rows and inline confirmation in independent scope. Preserve trigger focus restoration, controller state, request/cancel/confirm callbacks, fresh revision handling, refresh and polite messages. Style Suspend as caution and Aktifkan as primary. Denied/unavailable use the safe shell without exposing rows. No metrics or company creation.
- [x] Run targeted tests plus `tests/unit/company-ui.test.ts`, `company-actions.test.ts`, `company-validation.test.ts` and typecheck; require exit 0.
- [x] Commit explicit Task 6 files: `feat: redesign Super Admin company controls`.

## Task 7: Responsive review, evidence and local integration

**Files:** Create `tests/unit/admin-visual-contract.test.ts`, `docs/setup/ADMIN_VISUAL_SETUP.md`; adjust owning presentation files only for demonstrated findings; update spec/plan, documentation index, UI design and visual ledger execution reference.

**Interfaces:** Completed Tasks 1–6, shared Passenger/Crew regression boundaries, current Next preview ownership and preserved main user changes.

- [x] Write source-boundary tests for no unscoped Admin/shared selectors, 44px controls, 14px table/helper text, 16px body/input, 900px wrapping header with visible account link, local table/grid scrolling and no-preference transitions. Run `npm test -- tests/unit/admin-visual-contract.test.ts`; missing required rules fail before their correction. These tests establish source contracts only.
- [x] Inspect representative route editor, builder, draft/published trip, readonly manifest, conflict and Super Admin rows at 320/390/1280/1440px. Measure page overflow/control sizes, long names/reference codes, scroll regions, keyboard skip/current navigation and confirmation focus. Check empty/error/pending states, 200% zoom, reduced-motion preference and actual font when tools support them. Inspect Passenger/Crew shared grid/manifest regressions. Use actual authenticated pages without asking the user to interrupt; if database trust blocks them, use clearly labeled temporary fixtures outside tracked files and record actual acceptance pending. Never weaken TLS or perform real financial actions.
- [x] Request one focused whole-branch reviewer using `gpt-6-luna`, medium, `fork_turns:"none"`, with spec/plan/base/head. Review authorization/handler preservation, shared-component/CSS effects, accessibility, confirmations and financial copy. Resolve actionable findings and rerun their owning checks; document any reviewer coverage limitation.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` sequentially; each must exit 0. Record fresh totals, errors and actual evidence. No database suite/migration for this presentation-only diff; previous Crew results do not substitute.
- [x] Write evidence distinguishing source/unit results, measured fixtures, real-route checks and deferred manual acceptance. Update statuses/checklists truthfully and add approved visual implementation references to index/UI/ledger without expanding product decisions.
- [x] Commit explicit reviewed files and integrate locally through established finishing workflow. Verify user file preservation and preview process ownership before restarting only the execution-owned preview. If merged code differs, repeat automated verification on merged result. No push/publication.
- [x] Report what changed, fresh check results, preview/evidence, rulings and limitations. Keep physical/manual/live database acceptance pending where not exercised.

## Plan self-review

Coverage: scope/brand/navigation → Task 1; tables/forms/source states/conflicts → Task 2; fleet geometry/type/value/confirmations → Task 3; published versus draft/assignment/readonly manifest → Task 4; financial history/reasons/gates → Task 5; global-only company controls/focus/reconciliation/errors → Task 6; actual measurements/shared regressions/review/evidence/integration → Task 7. All five Review Focus inputs are pinned to owning tests or retained existing behavioral suites. Exact exported interfaces match current props or are defined in this plan. No service/query or business-policy change is needed. Source CSS checks do not establish physical-device or authenticated acceptance.
