# Passenger Discovery Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the approved responsive passenger discovery UI without the bus illustration, using actual availability and sensible post-login destinations.

**Architecture:** Keep database reads and availability calculations in `modules/inventory`; render their public DTOs through a server page and a small client component for filtering/dialog state. Reuse verified identity and active memberships for entry routing, retaining existing authorization guards and explicit safe checkout return paths.

**Tech Stack:** Existing Next.js 16 / React 19 / TypeScript, Postgres repository, Zod, CSS, Phosphor icons and Vitest. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-20-passenger-discovery-design.md`, plus the latest direction in `docs/seatpax/13_UI_UX_DESIGN.md`.

## Global Constraints

- Remove the decorative bus illustration; retain the actual Seatpax logo.
- Navigation labels: **Perjalanan**, **Pesanan saya**, **Akun**; `/trips`, `/tickets`, `/account` respectively.
- Use the exact palette in the spec and Plus Jakarta Sans scoped to passenger screens, reusing the existing next/font approach in Admin.
- Desktop/tablet navigation remains at the top; below 640px it moves to the bottom. No duplicate accessible navigation landmarks on phones.
- Preserve route interval pricing, effective holds, sales cutoffs, suspended-company denial and server authorization. No schema migrations or seed writes.
- Existing focused checkout/login shells stay focused. Never add bottom navigation over payment or seat-selection actions.
- Do not expose credentials or copy preview fixture data. Do not modify the user's `next-env.d.ts` or attachment directory.
- Tests below define acceptance; execute targeted tests only when testing/verification is authorized. Do not run database tests against hosted data implicitly.

## Review Focus

1. Sold, held, closed or suspended trips must not be advertised with invented availability (Task 1).
2. Missing arrival and malformed/partial location/date input must render honest states without crashing (Tasks 1–2).
3. A filter change must preserve route-specific seat-selection IDs and exact integer fares (Task 2).
4. Narrow screens and keyboard dialog use must retain reachable actions and restore focus (Task 2).
5. Invalid return URLs, revoked memberships and multiple work roles must never bypass authorization or cause redirect loops (Task 3).

Status: approved by the user on 20 October 2026; implemented locally. Browser checks are limited to actual available empty data and simulated viewport sizes; physical/populated/authenticated acceptance remains pending in the setup evidence.

## Execution preparation

- [x] Read the spec and `superpowers:executing-plans`; use `superpowers:using-git-worktrees` before edits. Inspect attached worktrees and reuse `C:/Users/ASUS/.codex/worktrees/day3-email-otp/SeatPax` only if its status/base are suitable. Preserve ignored environment files.
- [x] Read `design-taste-frontend`, the applicable frontend engineering skill, and Supabase guidance before changing identity routing. Follow the repository's domain boundaries.
- [x] Record baseline status and identify the running server before a build. Stop/restart the production server around `.next` replacement; retain `NODE_EXTRA_CA_CERTS` for database TLS.

### Task 1: Real daily discovery

**Files:** Modify `modules/inventory/types.ts`, `validation.ts`, `repository.ts`, `availability-service.ts`; create `tests/unit/inventory-discovery.test.ts`.

**Interfaces:**
- Add `DiscoveryInput = {dateWib:string}`.
- Add `discover(input:DiscoveryInput):Promise<{trips:SearchResult[];candidateLimitReached:boolean}>` to `createAvailabilityService`.
- Add `discoveryCandidates(start:string,end:string,limit:number):Promise<{tripId:string;fromStopId:string;toStopId:string}[]>` to the inventory repository.
- Extend `SearchResult` with `arrivalAt?:string|null`; existing producers/fixtures remain compatible.

- [x] Write focused cases for discovery: only `OPEN_FOR_SALE` / active-company candidates; ordered first-to-last snapshot interval; selected WIB date bounds; DB-clock cutoff; fetch 51 candidates and process at most 50, setting `candidateLimitReached` when the extra row exists.
- [x] Add service assertions: `expect(result.trips[0]).toMatchObject({fare:'60000',availableCount:1,fromStopId:origin.id,toStopId:destination.id})` for a fixture with one available and one held seat; closed/suspended snapshots produce `[]`; unknown destination arrival stays `null`; invalid calendar dates reject with a sanitized validation error.
- [x] When verification is authorized, run `npm test -- tests/unit/inventory-discovery.test.ts`; confirm the new contract fails before implementation.
- [x] Implement the read query using published first/last stops and deterministic departure/trip-ID ordering. Reuse `wibDayBounds` and `availability()` for full-route fare, inventory and cutoff. Share the DTO mapping with existing interval search; do not duplicate occupancy logic or alter hold transactions.
- [x] Run the focused test when authorized; expected all assertions pass. Commit only Task 1 files: `feat: add real passenger trip discovery`.

### Task 2: Responsive discovery page and passenger navigation

**Files:** Modify `app/trips/page.tsx`, `app/trips/components/search-form.tsx`, `app/components/trip-card.tsx`, `app/components/passenger-shell.tsx`, `app/passenger.css`; create `app/trips/components/trip-discovery.tsx`, `modules/inventory/discovery-presentation.ts`, `tests/unit/passenger-discovery.test.ts`; update `tests/unit/passenger-entry.test.ts` and `passenger-components.test.ts` for changed copy.

**Interfaces:**
- `filterAndSortTrips(trips:SearchResult[], filters:{classNames:string[];maxFare:string;sort:'departure'|'price'}):SearchResult[]` in `discovery-presentation.ts`, returning a new array and comparing fare strings as integer amounts.
- `TripDiscovery({trips,candidateLimitReached}:{trips:SearchResult[];candidateLimitReached:boolean})` renders local filters, sorting, result count and cards.
- `SearchForm` retains GET `/trips` with source-stop query names `from`, `to`, `date`; blank location options are selectable.

- [x] Add presentation assertions: price sort puts `'9000'` before `'10000'`; class/max-fare filtering is inclusive; reset restores input records; source arrays are not mutated. Check unknown arrival renders neither a fabricated time nor duration.
- [x] Update card assertions to expect **Pilih kursi** and preserve `href="/trips/a?from=origin&amp;to=end"`. Add shell assertions for all three approved labels, current-page state and focused-shell omission of navigation.
- [x] Run those focused tests when authorized and confirm expected failures before changing presentation.
- [x] Implement server data selection: date defaults to today WIB; both locations blank calls `discover`; both present calls existing interval `search`; partial pair shows “Pilih asal dan tujuan untuk mencari rute.” and retains daily discovery. Invalid date/location values produce a recoverable validation state; database errors display retry guidance, never a misleading no-trips state.
- [x] Build the compact blue-tinted header with exact spec copy and white search surface. Use a real stored profile name only if already available through a safe server read; otherwise use **Halo!**. No email-derived names, bus assets, empty illustration columns or decorative counters.
- [x] Implement class/max-fare filter dialog using native `<dialog>`, draft values committed only by **Terapkan**, reset, Escape/backdrop dismissal and focus restoration. Style the same dialog as a bottom sheet below 640px. Use existing Phosphor icons with accessible labels; no new modal dependency.
- [x] Implement sort, filtered-empty reset, loading/submission feedback and date-labelled result count. When capped, state “Daftar dibatasi 50 jadwal terdekat pada tanggal ini. Gunakan pencarian rute untuk mempersempit pilihan.” Count only actual displayed results, not a claimed total inventory.
- [x] Scope passenger typography and CSS. At widths 360, 768 and 1440px, avoid horizontal page overflow; phone bottom navigation clears safe areas and content. Filter controls and tap targets are at least 44px; long city/operator names wrap without hiding price/CTA.
- [x] Run focused tests when authorized; commit Task 2 files: `feat: refresh responsive passenger discovery`.

### Task 3: Role-aware entry without the account detour

**Files:** Create `modules/auth/entry-destination.ts`, `app/workspaces/page.tsx`, `tests/unit/auth-entry-destination.test.ts`; modify `modules/auth/return-path.ts`, `app/login/actions.ts`, `app/login/page.tsx`, `app/login/login-form.tsx`; update `tests/unit/auth-actions.test.ts`.

**Interfaces:**
- `validatedReturnPath(raw:unknown):string|null` extracts existing safe-path validation. Keep `safeReturnPath(raw)` as a compatible wrapper for other callers.
- `resolveEntryDestination(userId:string,rawNext:unknown):Promise<string>` uses verified user ID and active membership repository reads; invoked only after verified identity.
- Destination contract: no active work membership → `/trips`; Admin only → `/admin`; Crew only → `/crew`; Super Admin only → `/super-admin/companies`; multiple work-role destinations → `/workspaces`. Multiple Admin companies stay within existing `/admin` company selection.

- [x] Add assertions for the four single-role destinations, revoked memberships ignored, multiple active work roles → `/workspaces`, and an explicit valid `/holds/<id>` taking precedence. Assert `https://evil.test`, `//evil.test`, backslashes and CR/LF never become destinations.
- [x] Update OTP action mocks to return a verified user ID, then assert ordinary passenger success redirects `/trips`, provider failures never resolve memberships or redirect, and an access-read failure produces a sanitized retry error rather than misclassifying the account.
- [x] Run targeted auth tests when authorized and confirm expected failures before implementation.
- [x] Implement active-membership destination selection through the existing access repository. Do not trust email suffixes, client role flags or user metadata. Avoid turning a computed `/account` fallback into an explicit requested return path.
- [x] Use the same resolver for already-authenticated visits to `/login` and successful OTP completion. Preserve redirect exceptions and cookie-write behavior. Keep protected destination guards intact; workspace selection lists only authorized destinations and offers a passenger link.
- [x] Run targeted tests when authorized; commit Task 3 files: `feat: route verified users to their workspace`.

### Task 4: Integration and handoff evidence

**Files:** Update `docs/seatpax/13_UI_UX_DESIGN.md`, `19_DECISION_LEDGER.md`, `00_INDEX.md`; create `docs/setup/PASSENGER_DISCOVERY_REFRESH_SETUP.md`.

- [x] Record what actually shipped, including date/candidate defaults, supported screens and the limited meaning of the new **Pesanan saya** label. Keep separate account/orders redesign and native Crew delivery outstanding.
- [x] Run `npm run typecheck`, `npm run lint` and `npm run build` for fresh build evidence. Record command results and any environment limitation; do not report passing based on old evidence.
- [x] If testing is authorized, run the focused tests from Tasks 1–3 plus existing passenger/auth unit suites. Record exactly which ran. Keep hosted database integration tests and fixture writes opt-in.
- [x] Inspect actual browser layouts at 360×800, 768×1024 and 1440×900 when browser verification is authorized. Exercise filter open/apply/reset/Escape, keyboard focus restoration, long route labels, no results and seat-selection links. Record synthetic viewport inspection separately from physical phone acceptance.
- [x] Request a final code review covering the five Review Focus items; fix findings before claiming completion. Preserve the user's actual model restrictions if delegating.
- [x] Commit documentation and report the preview URL, implemented scope, verification evidence and remaining manual acceptance. Do not claim live payment or physical-phone testing happened in this slice.

## Plan self-review

Checked spec coverage, interface/type consistency, failure-mode ownership and scope. Tasks 1–3 cover the five Review Focus classes; Task 4 records evidence. This plan changes public discovery reads and navigation, not payment/hold authorization or the independent Admin/mobile subsystems. Technical date/limit defaults are explicit proposals for this review. No implementation or verification result is claimed by this document.
