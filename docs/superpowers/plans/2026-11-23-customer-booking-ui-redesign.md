# Customer Booking & Ticket UI Redesign Implementation Plan (`UI-CUSTOMER-01`)

**Spec:** `docs/superpowers/specs/2026-11-23-customer-booking-ui-redesign-design.md`
**Branch:** `feat/autonomous-overhaul`

## Step 1: Shared Passenger Chrome & Tokens
- Refine `app/passenger.css` and `app/components/passenger-navigation.css` to lock the Clean Travel Light token set (`#f6f8fb` canvas, `#ffffff` surface, `#e2e8f0` hairlines, `#0a2144` ink, `#52627a` muted, `#005bd1` brand blue, `#bd4b12` conversion CTA), unify container alignment (`max-width: 1120px` for customer booking pages without touching `.sp-landing`), preserve `.sp-journey-tags`, `.sp-journey-tag`, `.seat-cell { overflow-wrap:anywhere }`, and polish floating navbar + mobile bottom bar.
- Simplify `app/components/booking-stepper.tsx` to drop generic `"Langkah 1/2/3"` prefixes and render clean progress step nodes (`Pilih Kursi`, `Data & Bayar`, `Tiket Siap`).
- Refine `app/components/journey-summary.tsx` styling inside `passenger-flow.css` / `passenger.css` cleanly without removing `sp-journey-tags` / `sp-journey-tag`.

## Step 2: De-Dashboard `/trips`, `SearchForm`, `TripDiscovery`, `TripCard` & `TripsLoading`
- Rewrite `app/trips/page.tsx` to remove `tp-dash-hero` date/orders pills, remove the 4-card `tp-kpi-grid`, and remove `weekCalendar` / Bento dashboard coupling. Render a calm consumer heading (`Cari jadwal shuttle` + 1 concise sentence), `SearchForm`, validation/error states, and `TripDiscovery`.
- Redesign `app/trips/components/search-form.tsx` as a sleek unified horizontal search bar (no panel title header, no `N titik aktif` pill, no repetitive per-field subtitles; keeps `<AdminSelect>` for `from`/`to`, swap button `⇄`, `date` input, burnt-orange `Cari jadwal` CTA, inline `Reset pencarian` only when active, and exact validation/error messages).
- Redesign `app/trips/components/trip-discovery.tsx` into a single-column consumer listing (`max-width: 1040px`) removing the Bento sidebar (`Kalender keberangkatan`, `Keberangkatan terdekat`, `Alur kunci kursi`, `Bantuan & status pesanan`, `#direktori-titik`). Retain compact horizontal date chips, fallback banner, single-line result count + segmented sort (`Berangkat awal` / `Harga terendah`) + `Filter` modal, direct `TripCard` list (no nested wrapper card), and clean empty state with active stop chips.
- Refine `app/components/trip-card.tsx` to remove decorative `.tp-seat-dot`, drop `"Berangkat tepat waktu (WIB)"` filler, trim competing pills into a crisp boarding-pass split card (schedule/route left, tabular fare + seat availability + burnt-orange `Pilih kursi` CTA right) while preserving all enriched optional metadata (`vehicleName`, `seatCapacity`, `intermediateStops`, `Langsung`, `originCity`, `destinationCity`, `cutoff`).
- Rewrite `app/trips/loading.tsx` to skeleton only the compact heading, unified search bar, and 3 trip cards.
- Rewrite `app/trips/trips.css` cleanly under the Hallmark + Clean Travel Light token system (retaining `.passenger-shell .tp-field-label`, `.passenger-shell .tp-field > span`, `button.admin-select-trigger:hover:not(:disabled):not([aria-expanded='true'])`, `<AdminSelect>` styles, and responsive breakpoints down to `320px`).
- Update `tests/unit/passenger-discovery.test.ts` to replace the 4 `1de2b72` Admin-Bento assertions with clean consumer `/trips` assertions while keeping all 11 core discovery/card/search/CSS tests intact.

## Step 3: Seat Selection, Checkout, Hold Detail & Booking Status
- Overhaul `app/components/passenger-flow.css` under the Clean Travel Light token system (preserving Hallmark stamp, `:focus-visible`, `prefers-reduced-motion`, cabin seat frame, timeline hairline separation, sticky summary card, countdown urgency states, and crisp form inputs).
- Apply burnt-orange conversion CTA styling (`pf-cta-primary`) to primary funnel actions in `app/trips/components/seat-selection.tsx` (`Tahan kursi 10 menit`, `Lanjutkan checkout`) and `app/checkout/components/checkout-form.tsx` (`Lanjutkan ke pembayaran`), and refine `app/checkout/components/hold-sidebar.tsx`, `app/holds/components/hold-detail.tsx`, and `app/bookings/components/booking-status.tsx` without changing any server action, polling logic, or `role="status"` a11y boundary.

## Step 4: `/tickets` Center & `/tickets/[ticketId]` Digital Boarding Pass
- Update `app/tickets/components/ticket-center.tsx`: remove `.tk-stats` 3-box KPI mini-dashboard in header, keep `Perlu diselesaikan sekarang` resume strip when active holds/pending bookings exist, streamline tab + search + sort toolbar, and keep all filter/search/sort functionality.
- Refine `app/components/ticket-card.tsx`, `app/tickets/[ticketId]/page.tsx`, and `app/tickets/tickets.css` into a cohesive boarding-pass system with subtle perforated stub dividers, clean tabular seat/fare hierarchy, crisp QR frame, and print-safe styles (keeping server QR generation & `CONFIRMED` boundary untouched).

## Step 5: Full Verification, Live Browser QA, Docs & Push
- Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `git diff --check`.
- Start dev server and inspect `/trips`, `/trips/[tripId]`, `/tickets`, `/tickets/[ticketId]` (plus `/` & `/pengaduan` regression check) live in Chromium (`1280x800` desktop + `390x844` mobile) via `browser` subagent, visually inspect screenshots, and fix any layout/spacing/contrast issues found.
- Record decision `D2026-11-23-02` in `docs/seatpax/19_DECISION_LEDGER.md` and update `docs/seatpax/13_UI_UX_DESIGN.md`.
- Re-run all checks after final edit, commit cleanly, push to `origin/feat/autonomous-overhaul`, and verify remote ref.
