# Crew Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve the established inline execution method, with one focused final reviewer.

**Goal:** Give assigned Crew a coherent Seatpax interface that is comfortable on a phone for reviewing trips, scanning tickets, boarding passengers and handing over snacks.

**Architecture:** A dedicated Crew shell and scoped stylesheet replace the shared Admin shell. Presentation components consume existing trip and manifest/profile data, retaining current routes, guards, scanner controller, submission gates and action contracts. Admin and passenger presentation remain outside this phase.

**Tech Stack:** Existing Next.js/React, TypeScript, CSS, native forms, qr-scanner and Vitest; installed Seatpax PNG assets and Geist. No new dependencies or migration.

**Spec:** `../specs/2026-10-09-crew-visual-design.md`, approved by the user on 9 October 2026. This plan awaits review and execution authorization.

## Global Constraints

- Read `docs/seatpax/00_INDEX.md` first; active scope and final decisions override historical cash/PWA examples.
- Dedicated responsive Crew web shell; no native app, offline queue, new metrics/projection, permissions or lifecycle actions.
- Preserve guarded reads, current destinations, form fields, server validation, mutation handlers and recorded event times. QR resolves only; boarding is explicit; snack is explicit and requires boarding.
- Use installed `public/brand/seatpax-horizontal.png` and `seatpax-icon.png` without edits. Geist, navy `#0A2144`, blue `#005BD1`, white surfaces and canvas `#F5F7FA`; reuse adopted semantic palette.
- Main controls minimum 48px height; 16px body type; 16px phone gutters; main content approximately 960px maximum. At 320px and 390px no page overflow; wide snapshot content scrolls only inside a labelled region.
- Scoped `.crew-shell` styles; no global Admin/passenger selectors. Named navigation, skip link, connected labels, visible focus, text status and narrow live regions. Optional transitions respect reduced motion.
- Reuse a suitable attached managed worktree after inspection through using-git-worktrees. Preserve the user's `next-env.d.ts` change and attachment directory; never commit environment secrets or temporary visual fixtures.
- Local integration only, preserving existing authorization. No deployment or external publication. User phone/camera/authenticated acceptance remains deferred.
- Requested primary setting: GPT-6.1 Sol medium; report runtime limitations rather than claiming a switch. Reviewers use explicit GPT-6 Luna medium with focused context.

## Review Focus

1. Long passenger names, seat codes and routes at 320px: wrap text without clipping actions (Tasks 2, 3, 5).
2. Admin rendering the shared manifest: remain read-only with no Crew profile actions (Task 3).
3. A delayed scan/result after close or a new ticket: retain controller and profile identity guards (Task 4).
4. A network error or repeated submit: no invented event; explicit retry preserves submission gates and immutable event semantics (Task 4).
5. Empty data versus filtered results and unavailable authorization: truthful states, preserving guarded reads (Tasks 2, 3, 5).

## File Map and Interfaces

- Create `app/crew/crew.css`: Crew-only layout/component styling; provide scoped styles for existing `.seat-grid-region`, `.seat-grid` and `.seat-cell` markup.
- Create `app/crew/components/crew-shell.tsx`: `CrewShell({children}:{children:ReactNode})`; presentational named navigation and skip target `crew-main`.
- Create `app/crew/components/trip-summary.tsx`: `CrewTripSummary({detail}:{detail:TripDetail})`; route/vehicle/departure/class, stop schedule and expandable snapshot fare/layout details.
- Modify `app/crew/layout.tsx`: keep `await crewData()` and compose `CrewShell`; import `crew.css`, remove Admin stylesheet import.
- Modify `app/crew/page.tsx` and the four existing trip subroutes: Crew headers/sections, existing service calls and destinations.
- Modify `app/crew/components/manifest-list.tsx`: retain `ManifestList({view,readOnly=false}:{view:ManifestView;readOnly?:boolean})`; improve semantic structure and empty copy, preserve filters and read-only contract.
- Modify `passenger-profile.tsx`, `boarding-form.tsx`, `snack-form.tsx`, `qr-scanner.tsx` within `app/crew/components`: presentation only, existing props and callbacks retained. `wibTime` export remains available.
- Reuse `app/components/brand.tsx`, `app/admin/components/seat-grid.tsx` and existing data shapes from `modules/trip/types.ts` / `modules/boarding/types.ts`; no service changes.
- Create tests `tests/unit/crew-shell.test.ts`, `crew-trip-view.test.ts`, `crew-manifest-view.test.ts`, `crew-profile-view.test.ts`, `crew-visual-contract.test.ts` using existing Vitest and React server-render patterns.
- Create `docs/setup/CREW_VISUAL_SETUP.md`; update this plan, spec status, index and UI design implementation references when supported by evidence.

## Task 1: Dedicated Crew shell

**Files:** Create shell/CSS and `tests/unit/crew-shell.test.ts`; modify `app/crew/layout.tsx`.

**Interfaces:** Consumes `Brand({compact?:boolean,href?:string})`. Produces `CrewShell({children:ReactNode})` and `.crew-shell` scope for all later tasks. The server layout retains the existing guard.

- [ ] Write tests named `renders Crew navigation and a skip destination` and `isolates Crew layout from Admin CSS`. Use `renderToStaticMarkup(createElement(CrewShell,{children:'Crew content'}))`; assert named Seatpax link, `/crew`, `/account`, `href="#crew-main"`, `id="crew-main"` and child text. A source-boundary assertion verifies `await crewData()` remains and Admin CSS is not imported by the Crew layout.
- [ ] Run `npm test -- tests/unit/crew-shell.test.ts`; expect missing-component failure before implementation.
- [ ] Implement shell/header and scoped foundation styles. Set Brand width explicitly within Crew scope; its existing passenger styling must not be required. Add wrapping navigation, max-width 960px, 16px phone gutters, 16px type, focus treatment and 48px controls. Preserve account navigation rather than adding logout logic.
- [ ] Run the targeted test and `npm run typecheck`; expect both exit 0.
- [ ] Commit only Task 1 files: `feat: add dedicated Crew visual shell`.

## Task 2: Assigned trip cards and summary

**Files:** Modify `app/crew/page.tsx`, `app/crew/trips/[tripId]/page.tsx`, Crew CSS; create trip summary and `tests/unit/crew-trip-view.test.ts`.

**Interfaces:** Consumes `TripRecord[]` from `crew.listMine(actorId)` and `TripDetail` from `crew.detailMine(actorId,tripId)`. Produces `CrewTripSummary({detail:TripDetail})`; no new data fetch.

- [ ] Write tests `renders snapshot trip identity and explicit destinations`, `preserves schedule fare and layout in expandable details`, and `renders missing optional identity safely`. Build typed fixtures from existing TripDetail tests/types; assert route, vehicle/plate, WIB departure, `/scan`, `/manifest`, `<details`, schedule names, fare and labelled seat region. Use long escaped names/seat codes and `identity:null` / `layout:null` fixtures; assert no fabricated identity, malformed links or internal inventory count copy. Pin list guard/order and empty assignment copy through source assertions where server route rendering is impractical.
- [ ] Run `npm test -- tests/unit/crew-trip-view.test.ts`; expect new presentation tests to fail.
- [ ] Implement trip cards and CrewTripSummary. Keep list ordering and not-found handling. Schedule stays visible; Rincian perjalanan expands fare/layout snapshot details. The shared Admin TripDetail remains unchanged. Use a scroll-contained layout region with current SeatGrid markup.
- [ ] Run the targeted tests and `npm run typecheck`; expect exit 0.
- [ ] Commit Task 2 files: `feat: redesign Crew trip list and summary`.

## Task 3: Manifest and passenger profile hierarchy

**Files:** Modify manifest route, profile route, manifest-list/profile components and Crew CSS; create `crew-manifest-view.test.ts` / `crew-profile-view.test.ts`.

**Interfaces:** Existing `ManifestView`, `PassengerProfile`, `filterPassengers` and `manifestCounters`; profile props and `wibTime` export are unchanged.

- [ ] Write render tests `shows existing counters and operational passenger fields`, `keeps Admin manifest read-only`, `distinguishes empty manifest copy`, and `renders boarding and snack labels with original WIB times`. Assert counter values match fixture capacity/passengerCount/boardedCount; normal rows have exact Crew profile link while `readOnly:true` has no such link. Assert long text is escaped, seat and route exist, and no contact/payment fields are introduced. Preserve existing pure search/status tests; add a no-match input case if absent, asserting an empty result instead of an empty underlying manifest.
- [ ] Run `npm test -- tests/unit/crew-manifest-view.test.ts tests/unit/crew-profile-view.test.ts`; expect new visual assertions to fail.
- [ ] Implement semantic manifest cards/controls and strong name/seat profile hierarchy. Use existing filters and counters; distinguish underlying empty manifest from no matches. Shared markup retains readOnly semantics and neutral existing classes so Admin styling remains usable; Crew-specific treatment is scoped. Result count uses a narrow status region, never the interactive list.
- [ ] Run targeted tests plus `tests/unit/boarding-minimum.test.ts` and typecheck; expect exit 0.
- [ ] Commit Task 3 files: `feat: clarify Crew manifest and passenger profiles`.

## Task 4: Scanner, boarding and snack presentation

**Files:** Modify scanner route, qr-scanner, boarding-form, snack-form and Crew CSS; extend `crew-profile-view.test.ts`, existing `boarding-scanner.test.ts` and `snack-ui.test.ts` only where coverage is missing.

**Interfaces:** Keep existing form props, source `QR|MANIFEST`, scanner controller, action calls, `onBoarded` / `onClaimed`, submission gates, mounted/current-controller checks and router refresh behavior.

- [ ] Add failing render assertions for labelled camera and visible manifest fallback; unboarded profile has explicit boarding control and disabled snack; boarded profile has original time and enabled snack; claimed profile has original handover time and no second snack button. Mock existing actions/router as in snack-ui tests. Add scanner-controller/state tests only for uncovered late-result-after-close/new-profile cases; assert no resolver result triggers a mutation and late ticket IDs cannot overwrite the current profile. Existing gate error/retry and duplicate tests must remain green.
- [ ] Run `npm test -- tests/unit/crew-profile-view.test.ts tests/unit/boarding-scanner.test.ts tests/unit/snack-ui.test.ts`; expect new presentation assertions to fail before markup changes.
- [ ] Implement bounded camera frame, actual-state text, explicit start/close controls and inline profile sections. Style busy/recorded/error states and stop selection. Keep boarding and snack actions separate, current safe error messages, explicit user gestures and camera cleanup. Never manufacture success on scan/network failure; do not add automatic focus, scrolling, modal confirmation or new state-machine logic.
- [ ] Run targeted tests plus `tests/unit/boarding-actions.test.ts`, `tests/unit/snack-actions.test.ts` and typecheck; expect exit 0. Inspect diff for unchanged service/action/controller contracts.
- [ ] Commit Task 4 files: `feat: refine Crew scanner and operational actions`.

## Task 5: Cross-screen review, evidence and local integration

**Files:** Add `tests/unit/crew-visual-contract.test.ts`; amend presentation files only for demonstrated findings; create setup evidence and update documentation.

**Interfaces:** Completed Crew shell and all four task deliverables; existing Admin readOnly manifest and passenger shell are regression boundaries.

- [ ] Write structural regression assertions for `.crew-shell` scoping, wrapping long text, 48px main controls, contained snapshot scrolling, visible focus and reduced-motion conditional rules. Run `npm test -- tests/unit/crew-visual-contract.test.ts`; any assertion for missing required styling must fail before its fix. These checks prove source contracts, not measured visual behavior.
- [ ] Inspect routes at 320px, 390px, 1280px and 1440px; measure page overflow and control sizes, inspect keyboard navigation, 200% zoom and reduced motion. Use actual authenticated routes when accessible without requesting the user's time. Otherwise use clearly labelled temporary presentation fixtures outside tracked files and record actual authenticated acceptance as pending. Check Admin readOnly rendering separately for shared manifest changes. Physical phone/camera and real boarding/snack acceptance remain deferred.
- [ ] Request one focused whole-diff reviewer using explicit `gpt-6-luna`, medium, `fork_turns:"none"`. Provide approved spec/plan, base/head and changed files; ask for state/permission regressions, shared Admin impact and accessibility findings. Resolve actionable findings and rerun their owning checks. Report a runtime limitation if that requested reviewer setting cannot be applied.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` sequentially; require exit 0 and record actual counts/output. No database suite/migration is needed for this presentation-only diff. Never substitute previous passenger verification for these results.
- [ ] Write `CREW_VISUAL_SETUP.md` with commit/check evidence, real-route versus fixture results, access limitations and each deferred acceptance item. Update plan checkboxes only for work actually done; update spec/index/UI references without claiming user acceptance.
- [ ] Commit reviewed changes and evidence with explicit file paths. Integrate locally using the established development-branch workflow, preserving user files; if merged code differs, repeat automated verification on the merged result. Refresh the existing preview only after verifying which process/worktree owns it; do not stop unrelated services.
- [ ] Report implementation outcome, local preview, automated evidence and deferred manual checks. Admin/Super Admin redesign remains the next separate phase.

## Plan self-review

Coverage: shell/brand/accessibility → Task 1; assignment list and snapshot details → Task 2; manifest/shared read-only/profile → Task 3; camera/operational state → Task 4; responsive measurements, regression review, evidence and integration → Task 5. No new domain policy or data projection is required. Exact interfaces match current types; named tests use the existing server-render and pure-state patterns. Behavioral controller tests that already prove a preserved requirement stay unchanged; new RED tests target missing presentation. Source CSS assertions do not replace browser measurements.
