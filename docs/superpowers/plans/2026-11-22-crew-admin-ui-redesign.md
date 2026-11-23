# Crew Workspace Admin-PO UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every `/crew` page (`/crew`, `/crew/trips/[tripId]`, `/crew/trips/[tripId]/manifest`, `/crew/trips/[tripId]/scan`, `/crew/trips/[tripId]/passengers/[ticketId]`, and `CrewShell`) to match the Admin PO UI/UX layout architecture (228px grouped sidebar + 60px sticky topbar + `.dash-root` hero/KPI/card/table system + Light & Obsidian Charcoal Dark Mode) while preserving all existing Crew unit/visual contract tests and 48px touch targets.

**Architecture:** Upgrade `CrewShell` (`app/crew/components/crew-shell.tsx`) into a 2-column Admin PO workspace layout (`.crew-shell` with `Plus_Jakarta_Sans` `--font-jakarta`, `228px` grouped sidebar `CrewNavigation`, `60px` sticky `CrewTopbar` with dynamic breadcrumb, `Petugas Crew` badge, `<ThemeToggle showLabel />`, mobile drawer, and `<AdminToastViewport />`). Scope all Admin PO design tokens and layout rules under `.crew-shell` inside `app/crew/crew.css` and `app/styles/ops-dark.css` (without importing `../admin/admin.css` into `app/crew/layout.tsx`) so `tests/unit/crew-shell.test.ts` and `tests/unit/crew-visual-contract.test.ts` pass 100%. Refactor all 5 Crew routes and 8 components to eliminate Hallmark Floor violations (tracked-caps eyebrows and middle-dot `·` metadata strings), replace custom inline SVGs with Phosphor Icons, and adopt Admin PO hero headers, duotone KPI stat cards, modern table/card geometry, and top-center toast feedback.

**Tech Stack:** Next.js App Router (React 19 RSC + Client Components), TypeScript, Phosphor Icons (`@phosphor-icons/react/dist/ssr/...` and `/dist/csr/...`), Scoped Vanilla CSS (`app/crew/crew.css`, `app/styles/ops-dark.css`), Vitest + Playwright.

---

## Pre-Flight & Analysis Summary

### Hallmark Pre-Flight Findings
- **Font stack:** `--font-geist` + `--font-passenger-jakarta` (`app/layout.tsx`), `--font-jakarta` (`Plus_Jakarta_Sans`) applied to `.crew-shell` to match `.admin-shell` (`app/admin/components/admin-shell.tsx:10`).
- **Palette & Dark Mode:**
  - Light Mode (`.crew-shell`): Admin PO palette (`--crew-ink: #102746`, `--crew-muted: #526078`, `--crew-line: #e4ebf5`, `--crew-blue: #005bd1`, `#f5f8fd` workspace canvas, `#ffffff` cards with `1px solid #e4ebf5` border and `16px` radius).
  - Dark Mode (`html[data-mode='dark'] .crew-shell` in `app/styles/ops-dark.css:1028-1204`): Neutral Obsidian & Charcoal tokens (`--ops-paper: #0e1015`, `--ops-paper-2: #151821`, `--ops-paper-3: #1c202a`, `--ops-accent: #4f96ff`, `--ops-primary-fill: #2563eb`).
- **Existing Test & Contract Constraints Checked:**
  1. `tests/unit/crew-shell.test.ts:6-16` asserts:
     - `CrewShell` output contains `'aria-label="Seatpax"'`, `'href="/crew"'`, `'Keluar'`, `'href="#crew-main"'`, `'id="crew-main"'`, and does NOT contain `'href="/account"'`.
     - `app/crew/layout.tsx` contains `'await crewData()'` and does NOT contain `'../admin/admin.css'`.
  2. `tests/unit/crew-visual-contract.test.ts:4-18` asserts:
     - Every non-`@` CSS selector in `app/crew/crew.css` MUST contain `.crew-shell`.
     - `app/crew/crew.css` MUST contain `:focus-visible`, `/\.seat-grid-region[^{}]*\{[^}]*overflow-x:auto/`, `overflow-wrap:anywhere`, `minmax(0,1fr)`, `.crew-shell .manifest-controls input`, `.crew-shell .boarding-form select`, `min-height:48px`, and `@media (prefers-reduced-motion:no-preference)`.
  3. `tests/unit/crew-trip-view.test.ts:15-37` asserts:
     - `CrewTripSummary` contains route name, plate `B 1234 DEM`, vehicle `Bus A`, `WIB`, class `Eksekutif`, `href="/crew/trips/trip/scan"`, `href="/crew/trips/trip/manifest"`, `<details`, `Rincian perjalanan`, `Bandung`, `Bogor`, `60.000`, `aria-label="Denah kursi"`, `01-LONG-SEAT-CODE`, and does NOT contain `unit inventori` or `undefined`.
     - `app/crew/page.tsx` empty state contains `'Belum ada perjalanan'` and `'Admin PO'`, and preserves trip order.
  4. `tests/unit/crew-manifest-view.test.ts:8-21` asserts:
     - `ManifestList` contains `'30'`, `'Total penumpang'`, `'1'`, `'Sudah naik'`, `'0'`, passenger name, seatCode, `'Bandung'`, `'Bogor'`, `'href="/crew/trips/trip/passengers/ticket"'`, and `'class="manifest-seat"'`.
     - `readOnly: true` hides `/passengers/ticket` link and contains `'hanya untuk dibaca'`.
     - Empty manifest contains `'Belum ada penumpang terkonfirmasi'`.
  5. `tests/unit/crew-profile-view.test.ts:10-35` asserts:
     - `TicketScanner` contains `'aria-label="Pratinjau kamera scanner"'`, `'href="/crew/trips/trip/manifest"'`, `'Kamera belum dinyalakan'`, and not `'Sudah naik'`.
     - `BoardingForm` contains `'Tandai sudah naik'`, `'class="crew-primary"'`, `'value="a" selected'`; once boarded, no `<button` and contains `'08.03 WIB'`.
     - `SnackForm` disabled before boarding (`'disabled'`, `'Catat boarding dahulu'`); enabled after boarding (`'Serahkan snack'`); once claimed, no `<button` and contains `'08.04 WIB'`.
     - `PassengerProfile` contains `'<strong>01-LONG-CODE</strong>'`, passenger name, `'Bandung'`, `'Bogor'`, `'B 1234 DEM'`, `'Belum naik'`, `'Snack belum diserahkan'`, and when completed `'Sudah naik'`, `'Snack sudah diserahkan'`, `'08.03 WIB'`, `'08.04 WIB'`.
  6. `tests/unit/ops-dark-mode.test.ts:155-158` asserts `CrewShell` contains `'ops-theme-toggle'` and `'Gelap'`.

- **UI/UX & Hallmark Gaps Found Across `/crew` (Before State):**
  1. **Shell (`app/crew/components/crew-shell.tsx`):** Uses a narrow single-column topbar (`max-width: 1008px`) instead of Admin PO's 2-column sidebar (`228px`) + sticky breadcrumb topbar (`60px`) + `<AdminToastViewport />`.
  2. **Eyebrow Violations (Hallmark Floor #9):**
     - `app/crew/page.tsx:15`: `<p className="crew-eyebrow">Ruang kerja Crew</p>`
     - `app/crew/components/trip-tabs.tsx:30`: `<p className="crew-eyebrow">Operasional perjalanan kru</p>`
     - `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx:31`: `<p className="crew-eyebrow">Check-in &amp; layanan penumpang</p>`
  3. **Middle-Dot (`·`) Metadata Violations (Hallmark Floor #10):**
     - `app/crew/page.tsx:49`: `{trip.identity.vehicleName} · {trip.identity.plateNumber}`
     - `app/crew/components/trip-summary.tsx:21`: `{identity.vehicleName} · {identity.plateNumber} · {identity.className}`
     - `app/crew/components/trip-summary.tsx:53`: `{stop.city}{stop.address ? ' · ' + stop.address : ''}`
     - `app/crew/components/manifest-list.tsx:110,129`: ``Sudah naik · ${wibTime(...)}`` and ``Snack sudah diserahkan · ${wibTime(...)}``
     - `app/crew/components/passenger-profile.tsx:35`: `{profile.vehicleName} · {profile.plateNumber}`
     - `app/crew/components/boarding-form.tsx:65,77`: `Langkah 1 · Konfirmasi boarding` and `Langkah 1 · Wajib terlebih dahulu`
     - `app/crew/components/snack-form.tsx:53,65`: `Langkah 2 · Layanan snack` and `Langkah 2 · Setelah penumpang naik`
  4. **Inconsistent Card/Table/Stat Geometry vs Admin PO:**
     - `/crew` lacks Admin PO's `.dash-hero` + 3-card `.admin-stat-grid` with duotone Phosphor icon badges (`is-blue`, `is-amber`, `is-green`).
     - `ManifestList` uses plain `<dl className="manifest-counters">` boxes and unframed `.manifest-passengers` list items instead of Admin PO's 3-card KPI stat grid + `.dash-card.admin-table-card` with `.admin-panel-head`, integrated search/filter toolbar, structured passenger rows, and semantic status pills.
     - `crew-icons.tsx` uses custom hand-drawn Feather-style SVGs instead of Seatpax's standardized Phosphor Icons (`/dist/ssr/...` and `/dist/csr/...`).
     - `BoardingForm` and `SnackForm` do not emit top-center `queueAdminToast` notifications when boarding or snack handover succeeds or fails.

---

## Global Constraints

- Follow `AGENTS.md`: keep server-side auth (`crewData`, `boardingData`, `CREW` membership verification), preserve all server actions (`boardPassengerAction`, `resolveBoardingAction`, `claimSnackAction`) and submission gates (`createSubmissionGate`), and never expand MVP scope.
- **Strict CSS Isolation:** Every non-`@` selector in `app/crew/crew.css` MUST include `.crew-shell` (`tests/unit/crew-visual-contract.test.ts`), and `app/crew/layout.tsx` MUST NOT import `../admin/admin.css` (`tests/unit/crew-shell.test.ts`). Port the Admin PO shell/card/stat/table tokens directly under `.crew-shell` in `app/crew/crew.css` and `app/styles/ops-dark.css`.
- **Preserve 48px Touch Targets:** Keep `min-height: 48px` on `.crew-shell .manifest-controls input`, `.crew-shell .boarding-form select`, and primary/secondary action buttons for field crew usability and `tests/unit/crew-visual-contract.test.ts`.
- **Hallmark Floor Compliance:** Zero `.crew-eyebrow` tracked-caps eyebrows, zero `·` middle-dot separators in rendered metadata, Phosphor icons throughout, `:focus-visible` outlines, `@media (prefers-reduced-motion:no-preference)` guards, and WCAG AA contrast in both Light Mode and Obsidian Charcoal Dark Mode.
- In PowerShell, never chain commands with `&&`; separate with `;` and check `$LASTEXITCODE`.

---

### Task 1: Upgrade `CrewShell`, `CrewNavigation`, and `CrewTopbar` to Admin PO 2-Column Workspace Layout

- **Goal:** Replace `/crew`'s single-column topbar shell with Admin PO's 2-column `.crew-shell` workspace (`228px` sticky sidebar with dark-aware `Brand`, workspace role card, grouped `Operasional` navigation, `Ke Seatpax` + `Keluar dari akun` footer, plus `60px` sticky `.crew-topbar` with dynamic breadcrumb, `Petugas Crew` pill, `<ThemeToggle showLabel />`, mobile drawer toggle, and `<AdminToastViewport />`).
- **Scope:** `app/crew/components/crew-navigation.tsx`, `app/crew/components/crew-topbar.tsx`, `app/crew/components/crew-shell.tsx`, `app/crew/components/crew-icons.tsx`, `app/crew/crew.css`, `app/styles/ops-dark.css`, `tests/unit/crew-redesign.test.ts`.
- **Dependencies:** None. Reuses `Brand` (`app/components/brand.tsx`), `ThemeToggle` (`app/components/theme-toggle.tsx`), `SessionLogoutButton` (`app/components/session-logout-button.tsx`), `AdminToastViewport` (`app/admin/components/admin-toast.tsx`).
- **Checkable Completion Criteria:**
  1. `CrewShell` renders `.crew-shell` with `Plus_Jakarta_Sans` (`--font-jakarta`), skip link (`href="#crew-main"`), `.crew-sidebar` (`228px` desktop width, `<Brand href="/crew" darkAware />`, `.crew-company-card` role summary, `CrewNavigation` with `Operasional` caption and `Perjalanan saya` link, `Ke Seatpax` link, and `SessionLogoutButton` containing `'Keluar'`), `.crew-workspace` (`CrewTopbar` + `<main className="crew-main" id="crew-main">` + `<AdminToastViewport />`), and mobile drawer `#crew-mobile-navigation` placed immediately after `CrewTopbar` for natural forward `Tab` focus order.
  2. `crew-icons.tsx` re-exports clean Phosphor icons (`/dist/ssr/...`) so all existing icon imports across `/crew` render crisp Phosphor iconography.
  3. `tests/unit/crew-shell.test.ts`, `tests/unit/crew-visual-contract.test.ts`, `tests/unit/ops-dark-mode.test.ts`, and `tests/unit/crew-redesign.test.ts` pass.

**Files:**
- Create: `app/crew/components/crew-navigation.tsx`
- Create: `app/crew/components/crew-topbar.tsx`
- Create: `tests/unit/crew-redesign.test.ts`
- Modify: `app/crew/components/crew-shell.tsx`
- Modify: `app/crew/components/crew-icons.tsx`
- Modify: `app/crew/crew.css`
- Modify: `app/styles/ops-dark.css`

- [ ] **Step 1: Write failing unit tests for unified `CrewShell`, `CrewNavigation`, and `CrewTopbar` in `tests/unit/crew-redesign.test.ts`**
- [ ] **Step 2: Run `npx vitest run tests/unit/crew-redesign.test.ts` and verify RED failure**
- [ ] **Step 3: Implement `crew-navigation.tsx`, `crew-topbar.tsx`, `crew-shell.tsx`, Phosphor-backed `crew-icons.tsx`, and `.crew-shell` Admin PO sidebar/topbar CSS in `crew.css` + `ops-dark.css`**
- [ ] **Step 4: Run `npx vitest run tests/unit/crew-redesign.test.ts tests/unit/crew-shell.test.ts tests/unit/crew-visual-contract.test.ts tests/unit/ops-dark-mode.test.ts` and verify GREEN**
- [ ] **Step 5: Commit Task 1 (`feat(crew): unify CrewShell with Admin PO sidebar and topbar layout`)**

---

### Task 2: Redesign `/crew` Assigned Trips Dashboard & `CrewTripTabs` Header to Admin PO Bento & Hero Geometry

- **Goal:** Redesign `/crew` (`app/crew/page.tsx`) and `CrewTripTabs` (`app/crew/components/trip-tabs.tsx`) to use Admin PO `.dash-root`, `.dash-hero` (with WIB date pill and zero eyebrows), 3-card `.crew-stat-grid` (`Jadwal ditugaskan`, `Armada bertugas`, `Rute aktif` with duotone Phosphor `.crew-icon-badge`), and `.crew-table-card` / structured trip assignment cards with `.crew-code-pill` plate badges (no `·` middle dots) and `<AdminEmptyState>`-style empty panel.
- **Scope:** `app/crew/page.tsx`, `app/crew/components/trip-tabs.tsx`, `app/crew/crew.css`, `app/styles/ops-dark.css`, `tests/unit/crew-redesign.test.ts`.
- **Dependencies:** Task 1.
- **Checkable Completion Criteria:**
  1. `app/crew/page.tsx` renders zero `.crew-eyebrow` elements and zero `·` middle-dot strings; displays `.crew-dash-root`, `.crew-hero` (`<h1>Perjalanan saya</h1>`, subtitle, WIB date pill), 3-card `.crew-stat-grid` when trips exist, and structured trip cards showing departure WIB badge, trip title, route name, vehicle name + `.crew-code-pill` plate badge, service class pill, and 3 action buttons (`Manifest & Check-in`, `Scan QR`, `Rute & Denah →`).
  2. Empty state in `app/crew/page.tsx` renders duotone icon badge + `'Belum ada perjalanan yang ditugaskan'` + `'Admin PO akan menambahkan penugasan perjalanan untuk akun Crew ini.'` (preserving `tests/unit/crew-trip-view.test.ts:31-37`).
  3. `CrewTripTabs` removes `<p className="crew-eyebrow">Operasional perjalanan kru</p>`, renders Admin PO-style back pill (`Daftar perjalanan tugas`), `.crew-hero` title + departure WIB pill, and clean 3-tab `.crew-subnav` bar.
  4. `tests/unit/crew-trip-view.test.ts` and `tests/unit/crew-redesign.test.ts` pass.

**Files:**
- Modify: `app/crew/page.tsx`
- Modify: `app/crew/components/trip-tabs.tsx`
- Modify: `app/crew/crew.css`
- Modify: `app/styles/ops-dark.css`
- Modify: `tests/unit/crew-redesign.test.ts`

- [ ] **Step 1: Append failing tests for `/crew` page and `CrewTripTabs` to `tests/unit/crew-redesign.test.ts`**
- [ ] **Step 2: Run `npx vitest run tests/unit/crew-redesign.test.ts` and verify RED failure**
- [ ] **Step 3: Refactor `app/crew/page.tsx`, `app/crew/components/trip-tabs.tsx`, and supporting `.crew-shell` styles in `crew.css` & `ops-dark.css`**
- [ ] **Step 4: Run `npx vitest run tests/unit/crew-redesign.test.ts tests/unit/crew-trip-view.test.ts tests/unit/crew-visual-contract.test.ts` and verify GREEN**
- [ ] **Step 5: Commit Task 2 (`feat(crew): redesign /crew trip dashboard and trip header tabs to Admin PO layout`)**

---

### Task 3: Redesign `/crew/trips/[tripId]` (`CrewTripSummary`) & `/crew/trips/[tripId]/manifest` (`ManifestList`) to Admin PO Card & Table Patterns

- **Goal:** Upgrade `CrewTripSummary` (`app/crew/components/trip-summary.tsx`) and `ManifestList` (`app/crew/components/manifest-list.tsx` + `app/crew/trips/[tripId]/manifest/page.tsx`) to match Admin PO's trip detail cards and `AdminManifestView` layout while preserving every selector and text contract in `tests/unit/crew-trip-view.test.ts`, `tests/unit/crew-manifest-view.test.ts`, and `tests/unit/crew-visual-contract.test.ts`.
- **Scope:** `app/crew/components/trip-summary.tsx`, `app/crew/components/manifest-list.tsx`, `app/crew/trips/[tripId]/page.tsx`, `app/crew/trips/[tripId]/manifest/page.tsx`, `app/crew/crew.css`, `app/styles/ops-dark.css`, `tests/unit/crew-redesign.test.ts`.
- **Dependencies:** Tasks 1–2.
- **Checkable Completion Criteria:**
  1. `CrewTripSummary` eliminates all `·` middle-dot joiners (`{identity.vehicleName}`, `.crew-code-pill` `{identity.plateNumber}`, and `.crew-status-pill` `{identity.className}` rendered as separate badges; stop `city` and `address` rendered in separate spans), formats the schedule timeline and expandable `<details className="crew-panel crew-details">` (preserving `<details`, `Rincian perjalanan`, `60.000`, `aria-label="Denah kursi"`, `01-LONG-SEAT-CODE`), and styles `.seat-grid-region` cleanly in Light & Dark Mode.
  2. `ManifestList` upgrades `<dl className="manifest-counters">` into a 3-card Admin PO KPI strip (with duotone Phosphor icon badges for `Kapasitas kursi`, `Total penumpang`, `Sudah naik`), wraps the filter toolbar (`.manifest-controls` keeping `input` and `select` with `min-height: 48px` + `.crew-filter-pills`) and passenger list inside an Admin PO-style `.crew-table-card` with `.crew-panel-head` (`Daftar penumpang` + count badge), removes `·` middle dots from boarding/snack badges (separating status label and WIB timestamp chip cleanly), and preserves `class="manifest-seat"` and `href="/crew/trips/${view.tripId}/passengers/${passenger.ticketId}"`.
  3. `tests/unit/crew-trip-view.test.ts`, `tests/unit/crew-manifest-view.test.ts`, `tests/unit/admin-manifest-view.test.ts`, `tests/unit/crew-visual-contract.test.ts`, and `tests/unit/crew-redesign.test.ts` pass.

**Files:**
- Modify: `app/crew/components/trip-summary.tsx`
- Modify: `app/crew/components/manifest-list.tsx`
- Modify: `app/crew/trips/[tripId]/page.tsx`
- Modify: `app/crew/trips/[tripId]/manifest/page.tsx`
- Modify: `app/crew/crew.css`
- Modify: `app/styles/ops-dark.css`
- Modify: `tests/unit/crew-redesign.test.ts`

- [ ] **Step 1: Append failing tests for `CrewTripSummary` and `ManifestList` Admin PO layout & zero middle-dot compliance to `tests/unit/crew-redesign.test.ts`**
- [ ] **Step 2: Run `npx vitest run tests/unit/crew-redesign.test.ts` and verify RED failure**
- [ ] **Step 3: Refactor `trip-summary.tsx`, `manifest-list.tsx`, `trips/[tripId]/page.tsx`, `trips/[tripId]/manifest/page.tsx`, and `.crew-shell` CSS rules**
- [ ] **Step 4: Run `npx vitest run tests/unit/crew-redesign.test.ts tests/unit/crew-trip-view.test.ts tests/unit/crew-manifest-view.test.ts tests/unit/admin-manifest-view.test.ts tests/unit/crew-visual-contract.test.ts` and verify GREEN**
- [ ] **Step 5: Commit Task 3 (`feat(crew): align CrewTripSummary and ManifestList with Admin PO card and table UI`)**

---

### Task 4: Redesign `/crew/trips/[tripId]/scan` (`TicketScanner`) & `/crew/trips/[tripId]/passengers/[ticketId]` (`PassengerProfile`, `BoardingForm`, `SnackForm`)

- **Goal:** Redesign the QR scanner view and passenger check-in profile/action cards to match Admin PO detail panels, eliminate all eyebrows and `·` middle dots, keep 48px touch controls, and trigger top-center `queueAdminToast` notifications on boarding/snack actions while keeping all assertions in `tests/unit/crew-profile-view.test.ts`, `tests/unit/boarding-ui.test.ts`, and `tests/unit/snack-ui.test.ts` passing.
- **Scope:** `app/crew/components/qr-scanner.tsx`, `app/crew/components/passenger-profile.tsx`, `app/crew/components/boarding-form.tsx`, `app/crew/components/snack-form.tsx`, `app/crew/trips/[tripId]/scan/page.tsx`, `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx`, `app/crew/crew.css`, `app/styles/ops-dark.css`, `tests/unit/crew-redesign.test.ts`.
- **Dependencies:** Tasks 1–3.
- **Checkable Completion Criteria:**
  1. `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx` removes `<p className="crew-eyebrow">`, renders Admin PO back link pill (`Kembali ke manifest penumpang`), `.crew-hero` header (`<h1>Profil penumpang</h1>` + subtitle), and structured `.crew-stack` cards.
  2. `PassengerProfile` separates `profile.vehicleName` and `.crew-code-pill` `profile.plateNumber` without `·`, preserves `<strong>{profile.seatCode}</strong>`, and renders semantic Admin PO status cards for `Boarding` and `Snack`.
  3. `BoardingForm` and `SnackForm` replace `Langkah 1 · ...` / `Langkah 2 · ...` middle-dot chips with clean step pills (`Langkah 1` + badge subtitle without `·`), preserve `.boarding-form select` `min-height: 48px` and button states (`class="crew-primary"`, `Tandai sudah naik`, `Serahkan snack`, `disabled`), and call `queueAdminToast` upon action completion/error while keeping inline `role="status"` messages.
  4. `TicketScanner` wraps the camera preview in an Admin PO `.crew-panel` card header (`Pemindai QR tiket` + live camera status pill), preserves `aria-label="Pratinjau kamera scanner"` and `'Kamera belum dinyalakan'`, and renders the scanned passenger profile + 2-column action forms cleanly below.
  5. `tests/unit/crew-profile-view.test.ts`, `tests/unit/boarding-ui.test.ts`, `tests/unit/snack-ui.test.ts`, `tests/unit/crew-visual-contract.test.ts`, and `tests/unit/crew-redesign.test.ts` pass.

**Files:**
- Modify: `app/crew/components/qr-scanner.tsx`
- Modify: `app/crew/components/passenger-profile.tsx`
- Modify: `app/crew/components/boarding-form.tsx`
- Modify: `app/crew/components/snack-form.tsx`
- Modify: `app/crew/trips/[tripId]/scan/page.tsx`
- Modify: `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx`
- Modify: `app/crew/crew.css`
- Modify: `app/styles/ops-dark.css`
- Modify: `tests/unit/crew-redesign.test.ts`

- [ ] **Step 1: Append failing tests for `TicketScanner`, `PassengerProfile`, `BoardingForm`, `SnackForm`, and `/passengers/[ticketId]` to `tests/unit/crew-redesign.test.ts`**
- [ ] **Step 2: Run `npx vitest run tests/unit/crew-redesign.test.ts` and verify RED failure**
- [ ] **Step 3: Refactor `qr-scanner.tsx`, `passenger-profile.tsx`, `boarding-form.tsx`, `snack-form.tsx`, `scan/page.tsx`, `passengers/[ticketId]/page.tsx`, and `.crew-shell` styles**
- [ ] **Step 4: Run `npx vitest run tests/unit/crew-redesign.test.ts tests/unit/crew-profile-view.test.ts tests/unit/boarding-ui.test.ts tests/unit/snack-ui.test.ts tests/unit/crew-visual-contract.test.ts` and verify GREEN**
- [ ] **Step 5: Commit Task 4 (`feat(crew): redesign QR scanner, passenger profile, and check-in forms to Admin PO UI`)**

---

### Task 5: End-to-End Browser Verification (Light & Obsidian Dark Mode, Desktop & Mobile), Decision Ledger Update, and Push

- **Goal:** Verify all 5 `/crew` screens live in Chromium (`http://localhost:3000/crew` logged in as `Crew perjalanan`) across Light Mode and Obsidian Charcoal Dark Mode at Desktop (`1280×800`) and Mobile (`390×844`), run the full test/typecheck/lint suite, update `docs/seatpax/19_DECISION_LEDGER.md`, and push `feat/autonomous-overhaul`.
- **Scope:** Live browser verification of `/crew`, `/crew/trips/[tripId]`, `/crew/trips/[tripId]/manifest`, `/crew/trips/[tripId]/scan`, `/crew/trips/[tripId]/passengers/[ticketId]`, `docs/seatpax/19_DECISION_LEDGER.md`.
- **Dependencies:** Tasks 1–4.
- **Checkable Completion Criteria:**
  1. Zero console errors, zero page errors, zero horizontal overflow (`documentWidth <= viewportWidth`), and `>= 48px` touch targets on operational controls across `/crew` routes at `1280×800` and `390×844` in both Light and Obsidian Dark Mode.
  2. Circular reveal Dark Mode transition switches `.crew-shell` cleanly to Obsidian Charcoal (`#0e1015` / `#151821`) with transparent `seatpax-horizontal-dark.png` logo and WCAG AA contrast.
  3. Record decision ledger entry in `docs/seatpax/19_DECISION_LEDGER.md`, pass `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `git diff --check`, commit, and push `origin/feat/autonomous-overhaul`.

- [ ] **Step 1: Verify live `/crew` flows & Light/Dark visual contrast at `1280×800` and `390×844` in Chromium**
- [ ] **Step 2: Fix any visual or responsive polish issue found during browser verification**
- [ ] **Step 3: Update `docs/seatpax/19_DECISION_LEDGER.md`**
- [ ] **Step 4: Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `git diff --check`**
- [ ] **Step 5: Commit and push `origin/feat/autonomous-overhaul`**

---

## Plan Self-Review

1. **Full Route Coverage:** Covers all 5 `/crew` routes (`layout.tsx` + `page.tsx` + `trips/[tripId]/page.tsx` + `trips/[tripId]/manifest/page.tsx` + `trips/[tripId]/scan/page.tsx` + `trips/[tripId]/passengers/[ticketId]/page.tsx`) and all 8 components in `app/crew/components/`.
2. **Hallmark & Design Taste Compliance:** Eliminates all 3 `.crew-eyebrow` tracked-caps eyebrows (Floor #9) and all 7 middle-dot (`·`) metadata strings (Floor #10), upgrades hand-drawn SVGs to Phosphor Icons, adds top-center `AdminToastViewport` feedback, and enforces Light + Obsidian Dark Mode parity.
3. **Zero Contract Breakage:** Preserves `.crew-shell` selector scoping (`tests/unit/crew-visual-contract.test.ts`), `layout.tsx` CSS isolation (`tests/unit/crew-shell.test.ts`), `48px` operational input/select touch heights, and all assertions in `crew-trip-view.test.ts`, `crew-manifest-view.test.ts`, `crew-profile-view.test.ts`, and `ops-dark-mode.test.ts`.
