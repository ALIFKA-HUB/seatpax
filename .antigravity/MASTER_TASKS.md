# Seatpax — Autonomous Overhaul Master Task Checklist

---

## STEP 0: Git Safety Checkpoint & Memory Initialization
- [x] **S0-01:** Revert incidental `next-env.d.ts` modification (`git checkout -- next-env.d.ts`).
- [x] **S0-02:** Create and switch to `feat/autonomous-overhaul` branch without committing untracked workspace `.docx`/`.xlsx`/`scripts` files.
- [x] **S0-03:** Initialize `.antigravity/ARCHITECTURE_AND_FLOWS.md` and `.antigravity/MASTER_TASKS.md`.

---

## WAVE 1: Logic, Architecture & Flow Unification (No Color-Only Edits)

### Batch 1A — Account, Super Admin & Documentation Alignment
- [x] **W1-01:** Fix `app/account/page.tsx` Super Admin link from `/super-admin/companies` to `/super-admin` (matching `D2026-11-02-02` & `entry-destination.ts`).
- [x] **W1-02:** Add direct secondary link to `/super-admin/companies` (`Perusahaan PO →`) in `app/account/page.tsx` for Super Admin actors.
- [x] **W1-03:** Wrap `app/super-admin/companies/page.tsx` heading in `.super-page-heading` matching `app/super-admin/page.tsx`.
- [x] **W1-04:** Add retry link (`Coba lagi`) in `app/super-admin/companies/page.tsx` when data loading fails with non-forbidden `DomainError`.
- [x] **W1-05:** Update `README.md` role table to accurately document `/super-admin`, `/super-admin/companies`, `/pengaduan/lengkapi`, and Admin PO Helpdesk oversight/staff provisioning routes.

### Batch 1B — Admin Helpdesk & Helpdesk-Staff Flow Unification
- [x] **W1-06:** Upgrade `app/admin/companies/[companyId]/helpdesk/page.tsx` to wrap the header & staff provisioning CTA in a structured `.hd-panel` monitoring banner and present structured unavailable alert state with return link to `/admin/companies/${companyId}`.
- [x] **W1-07:** Upgrade `app/admin/companies/[companyId]/helpdesk/[id]/page.tsx` to import `pengaduan.css` & `helpdesk.css` directly (fixing direct deep-link unstyled render) and include a link to `/admin/companies/${companyId}/helpdesk-staff`.
- [x] **W1-08:** Add top breadcrumb link (`← Kembali ke pengaduan pelanggan`) in `app/admin/companies/[companyId]/helpdesk-staff/page.tsx`.
- [x] **W1-09:** Replace raw `<p>` error/staff lines in `app/admin/companies/[companyId]/helpdesk-staff/page.tsx` with structured `.hd-panel` error alert + `.hd-staff-table` showing staff email and status badge (`.hd-badge`) + clean empty state `.hd-empty`.

### Batch 1C — Public Complaint Supplement & Passenger Flow Unification
- [x] **W1-10:** Import `../complaint-workspace.css` and `Link` in `app/pengaduan/lengkapi/page.tsx`.
- [x] **W1-11:** Wrap `app/pengaduan/lengkapi/page.tsx` in `.hd-workspace` + `.hd-workspace-heading` with `.hd-return` link to `/pengaduan` and secondary aside link to `/pengaduan/cek`.
- [x] **W1-12:** Upgrade `app/trips/[tripId]/page.tsx` unavailable fallback from raw `<h1>`/`<p>` to `<StatePanel>` with CTA back to `/trips`.
- [x] **W1-13:** Add `className="sp-back"` on `← Cari perjalanan` and `.sp-page-heading` wrapper on `app/trips/[tripId]/page.tsx`.
- [x] **W1-14:** Upgrade `app/holds/[holdId]/page.tsx` unavailable fallback from raw `<h1>`/`<p>` to `<StatePanel>` with CTA back to `/trips`.
- [x] **W1-15:** Add `className="sp-back"` on `← Cari perjalanan` in `app/holds/[holdId]/page.tsx`.
- [x] **W1-16:** Add post-ticket support CTA (`<Link className="sp-secondary" href="/pengaduan/buat">Laporkan masalah</Link>`) on `app/tickets/[ticketId]/page.tsx` while preserving all contract assertions in `passenger-ticket-view.test.ts`.
- [x] **W1-17:** Verify `tests/unit` regressions on Wave 1 changes (`admin-visual-contract`, `passenger-ticket-view`, `super-admin-view`, `passenger-components`).
- [x] **W1-18:** Add/update focused unit tests covering unified links and fallback panels where appropriate without mocking domain rules.
- [x] **W1-19:** Run `npm.cmd run typecheck` and `npm.cmd run lint` after Wave 1 edits.
- [x] **W1-20:** Run full `npx.cmd vitest run tests/unit` after Wave 1 edits.
- [x] **W1-21:** Check off Wave 1 items in `.antigravity/MASTER_TASKS.md`.
- [x] **W1-22:** Commit Wave 1 selectively (`feat(wave-1): unify product architecture, flows, and logic`).

---

## WAVE 2: UI Color Tokens & Visual Depth (Zero Layout, Grid, Spacing, or Typography Edits)

### Batch 2A — Global & Passenger Core Stylesheets
- [x] **W2-01:** Upgrade `:root`, body canvas depth, `.auth-card`, and button color depth tokens in `app/globals.css`.
- [x] **W2-02:** Upgrade `--sp-*` palette tokens in `app/passenger.css` (deep maritime ink, vibrant top-lit cobalt primary, cool-slate atmospheric canvas).
- [x] **W2-03:** Upgrade `.passenger-card`, `.sp-state`, `.sp-discovery-card`, `.passenger-form`, `.sp-seat-summary`, and `.sp-qr-frame` surface elevation, subtle top-lit gradients, and tinted borders in `app/passenger.css`.
- [x] **W2-04:** Upgrade `.seat-cell`, `.seat-legend`, `.sp-badge-*`, and `.sp-hold-clock` semantic palette and tactile state transitions in `app/passenger.css` (preserving `.passenger-shell .seat-cell{...overflow-wrap:anywhere...}`).
- [x] **W2-05:** Upgrade `app/components/passenger-navigation.css` translucent bar backdrop, floating shadow depth, pill contrast, and account popover elevation.
- [x] **W2-06:** Upgrade `app/components/passenger-footer.css` surface contrast, subtle top highlight border, and link hover states.
- [x] **W2-07:** Upgrade `app/components/complaint-entry.css` floating button gradient sheen, border definition, and interactive glow shadow.

### Batch 2B — Landing & Login Color Elevation
- [x] **W2-08:** Upgrade `app/landing/landing.css` palette tokens (`--sp-*`, `--lp-*`), `.lp-search-panel` elevation depth, `.lp-featured-trip` card shadows & hover border transitions, `.lp-flow-icon` depth, and `.lp-button` tactile cobalt gradient.
- [x] **W2-09:** Upgrade `app/landing/booking-motion.css` card, stub, seat rail, and confirmation badge color depth & layered shadow hierarchy.
- [x] **W2-10:** Upgrade `app/login/login.css` palette tokens, `.lg-visual` depth scrim, `.lg-card` mobile elevation, `.lg-input-box` focus glow, `.lg-dropdown-menu` shadow, and `.lg-primary` top-lit gradient.

### Batch 2C — Public Pengaduan & Staff Helpdesk Color Elevation
- [x] **W2-11:** Upgrade `app/pengaduan/pengaduan.css` surface tint, `.hd-choice-shell` layered frame & card shadows, `.hd-panel` depth, `.hd-badge` / `.hd-notice` / `.hd-primary` color hierarchy.
- [x] **W2-12:** Upgrade `app/pengaduan/complaint-workspace.css` `--hd-*` color tokens, elevated panel shadow depth, form field focus depth, upload dropzone tint, and guide card polish.
- [x] **W2-13:** Upgrade `app/helpdesk/helpdesk.css` workspace canvas, sidebar & mobile bar depth, `.hd-stat` card hierarchy, table hover contrast, active status colors, and elevated panel shadows.

### Batch 2D — Admin PO, Super Admin & Crew Operational Surface Elevation
- [x] **W2-14:** Upgrade `app/admin/admin.css` color & contrast tokens while preserving 100% of `.admin-shell`/`.admin-entry` selector prefixes and all `admin-visual-contract.test.ts` literal substrings.
- [x] **W2-15:** Upgrade `app/admin/admin-refresh.css` `--admin-*` palette tokens, sidebar surface separation, `.admin-breadcrumb` elevation, `.admin-panel` & `.stop-panel` layered shadows, table row hover tint, and modal backdrop/shadow.
- [x] **W2-16:** Upgrade `app/super-admin/super-admin.css` `--super-*` palette tokens, surface elevation, `.company-list` card depth, button & badge contrast while preserving 100% `.super-admin-shell` selector scoping and all `admin-visual-contract.test.ts` substrings.
- [x] **W2-17:** Upgrade `app/super-admin/dashboard.css` metric card depth gradients, directory/context panel shadows, staff tab active state depth, status badge contrast, and pagination depth.
- [x] **W2-18:** Upgrade `app/crew/crew.css` surface depth, `.crew-topbar` elevation, `.crew-panel` & `.crew-trip-card` layered shadows, `.crew-state-*` / `.crew-seat` / `.crew-primary` high-contrast operational colors while keeping every selector scoped to `.crew-shell` and preserving all `crew-visual-contract.test.ts` assertions.

### Batch 2E — Wave 2 Verification & Commit
- [x] **W2-19:** Verify zero layout/grid/spacing/typography diffs across all CSS files using `git diff -- app/**/*.css`.
- [x] **W2-20:** Run visual & shell contract tests (`admin-visual-contract`, `crew-visual-contract`, `passenger-seat-view`, `admin-shell`, `crew-shell`, `super-admin-view`).
- [x] **W2-21:** Run `npm.cmd run typecheck` and `npm.cmd run lint`.
- [x] **W2-22:** Run full `npx.cmd vitest run tests/unit`.
- [x] **W2-23:** Check off Wave 2 items in `.antigravity/MASTER_TASKS.md`.
- [x] **W2-24:** Commit Wave 2 selectively (`style(wave-2): upgrade color palette and surface elevation system`).

---

## WAVE 3: Build Verification, QA Re-Testing & Deployment Polish
- [x] **W3-01:** Run `npm.cmd run typecheck` (`tsc --noEmit`) with zero errors.
- [x] **W3-02:** Run `npm.cmd run lint` (`eslint .`) with zero errors/warnings.
- [x] **W3-03:** Run full unit test suite `npx.cmd vitest run tests/unit` and verify 100% pass rate.
- [x] **W3-04:** Run Next.js production build (`npm.cmd run build`, falling back to `npm.cmd run build -- --webpack` only if local Turbopack symlink check triggers — and document exact result).
- [x] **W3-05:** Audit built routes and ensure zero unresolved import, server/client boundary, or CSS syntax errors.
- [x] **W3-06:** Revert incidental `next-env.d.ts` changes if produced by `next build` (`git checkout -- next-env.d.ts`).
- [x] **W3-07:** Check `git status --short` to ensure no untracked `.docx`/`.xlsx`/scripts artifacts were staged or committed.
- [x] **W3-08:** Mark 100% of Wave 3 items `[x]` in `.antigravity/MASTER_TASKS.md`.
- [x] **W3-09:** Create final Wave 3 commit (`chore(wave-3): pass production build and final QA verification`).
- [x] **W3-10:** Verify branch log (`git log -n 5 --oneline`) and clean working tree for tracked files.
