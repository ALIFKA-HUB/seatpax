# Seatpax Customer Booking UI Redesign (`UI-CUSTOMER-01`)

Date: 2026-11-23
Branch: `feat/autonomous-overhaul`
Approved by user: Yes (`A1` Clean Travel Light, 7 customer booking & ticket pages + `"lanjut"`)

## 1. Problem & Goal
Commit `1de2b72` turned `/trips` into an Admin-PO dashboard clone with 4 KPI stat cards, a hero date pill + duplicate `Pesanan saya` CTA, a boxed search card with repetitive helper copy, and a 2-column Bento sidebar (`Kalender keberangkatan`, `Keberangkatan terdekat`, `Alur kunci kursi`, `Direktori titik`). Consumers booking a shuttle need a clean, calm travel booking experience focused immediately on searching routes, scanning departures, picking a seat, completing checkout, and opening their QR boarding pass.

This redesign overhauls all 7 customer booking/ticket routes and shared passenger chrome under a cohesive **Clean Travel Light** system while keeping `/` (landing) and `/pengaduan` (public complaint portal) untouched.

## 2. Scope (7 Customer Pages + Shared Chrome)
- **Shared Chrome:** `PassengerShell`, `PassengerHeader`, `PassengerFooter`, `BookingStepper`, `JourneySummary`, `TripCard`, `TicketCard`, `app/passenger.css`, `app/components/passenger-navigation.css`, `app/components/passenger-flow.css`
- **`/trips` & `/trips/loading.tsx`:** Clean consumer search bar + scannable departure list (`app/trips/page.tsx`, `app/trips/loading.tsx`, `app/trips/trips.css`, `app/trips/components/search-form.tsx`, `app/trips/components/trip-discovery.tsx`)
- **`/trips/[tripId]`:** Tactile cabin seat map, stop timeline, and sticky summary (`app/trips/[tripId]/page.tsx`, `app/trips/components/seat-selection.tsx`)
- **`/checkout/[holdId]`:** Passenger form + sticky 10-minute hold countdown (`app/checkout/[holdId]/page.tsx`, `app/checkout/components/checkout-form.tsx`, `app/checkout/components/hold-sidebar.tsx`)
- **`/holds/[holdId]`:** Focused active seat-hold review (`app/holds/[holdId]/page.tsx`, `app/holds/components/hold-detail.tsx`)
- **`/bookings/[bookingId]`:** Payment status & confirmation (`app/bookings/[bookingId]/page.tsx`, `app/bookings/components/booking-status.tsx`)
- **`/tickets`:** My Orders / Ticket Center (`app/tickets/page.tsx`, `app/tickets/tickets.css`, `app/tickets/components/ticket-center.tsx`)
- **`/tickets/[ticketId]`:** Digital Boarding Pass & QR (`app/tickets/[ticketId]/page.tsx`)

## 3. Design System Tokens & Guardrails (Hallmark + design-taste-frontend)
- **Dials:** `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 4`.
- **Palette (Light Mode, Seatpax Brand Tokens):**
  - Canvas: `--sp-canvas: #f6f8fb`
  - Surface: `--sp-surface: #ffffff`, Subtle tint: `--sp-surface-soft: #f8fafd`
  - Hairline borders: `--sp-border: #e2e8f0`, Control border: `--sp-control: #cbd5e1`
  - Ink: `--sp-ink: #0a2144`, Muted: `--sp-muted: #52627a` (WCAG AA > 4.5:1)
  - Brand Blue: `--sp-primary: #005bd1`, hover `#0049aa`, soft `#edf4ff`
  - Conversion CTA Accent: `--sp-cta: #bd4b12`, hover `#9f3d0d` (reserved for primary funnel CTAs: `Cari jadwal`, `Pilih kursi`, `Tahan kursi 10 menit`, `Lanjutkan ke pembayaran`)
  - Semantic states: Success `#166534` / `#eefaf3`, Warning `#92400e` / `#fffbeb`, Danger `#b91c1c` / `#fef2f2`
- **Typography & Radius Lock:**
  - `Plus Jakarta Sans` (`--font-passenger-jakarta`) with `font-variant-numeric: tabular-nums` on times, fares, seat numbers, and countdowns.
  - Radii: `16px` major cards/pass, `12px` inner controls/frames, `10px` buttons, `999px` badges/back chips.
- **Hard Bans (Hallmark Floor & Taste-Skill):**
  - Zero Admin KPI cards, zero Bento sidebar calendar/directory on `/trips`.
  - Zero tracked uppercase eyebrows, zero em-dashes (`—`/`–`), zero middle-dot (`·`) text joiners, zero decorative status dots, zero cards-inside-cards, zero `transition: all`, zero `"Langkah 1/2/3"` step prefixes.
  - Strict `:focus-visible`, `prefers-reduced-motion: reduce` fallback, `overflow-x: clip` on `html, body`.

## 4. Page-by-Page Specification
1. **Navbar & Stepper:** Sticky single-line `68px` topbar (`max-width: 1120px`, `1px solid #e2e8f0` hairline) with `Seatpax` wordmark, centered `Perjalanan` & `Pesanan saya` links, and `Akun`/`Masuk` pill; mobile `< 640px` fixed 2-column bottom nav. `BookingStepper` renders clean step circles + direct step labels (`Pilih Kursi`, `Data & Bayar`, `Tiket Siap`).
2. **`/trips`:** Single centered column (`max-width: 1040px`). Compact heading (`Cari jadwal shuttle` + 1 concise sentence) -> Unified horizontal elevated search bar (`Dari mana?` `<AdminSelect>`, swap button `⇄`, `Mau ke mana?` `<AdminSelect>`, `Tanggal (opsional)`, burnt-orange `Cari jadwal` CTA; `Reset pencarian` link only when filters active) -> optional compact date chips + single-line result count / segmented sort (`Berangkat awal`, `Harga terendah`) / `Filter` button -> direct list of ticket-stub `TripCard` items (clean left schedule/route with `HH:MM WIB`, duration, direct/via; right separated fare stub with tabular IDR, honest seat availability without decorative dot, burnt-orange `Pilih kursi` CTA). `TripsLoading` skeletons only the compact header, horizontal search bar, and 3 trip rows.
3. **`/trips/[tripId]`:** Compact topbar (`← Semua jadwal` + `BookingStepper`), clean title + hairline fact tags, 2-column grid (`minmax(0, 1fr) 340px`). Left: tactile cabin seat map + open stop timeline separated by hairline border (no nested cards). Right sticky: `Ringkasan perjalanan` + burnt-orange `Tahan kursi 10 menit` CTA + calm info list.
4. **`/checkout/[holdId]` & `/holds/[holdId]`:** Checkout uses matching 2-column grid (`Data penumpang` with `Saya sendiri` / `Orang lain` segmented cards, `48px` inputs, email chip, burnt-orange `Lanjutkan ke pembayaran` CTA; sticky `HoldSidebar` with `JourneySummary`, crisp tabular countdown box, `Lepaskan & ganti kursi`). Hold detail uses single centered column (`max-width: 720px`).
5. **`/bookings/[bookingId]`:** Single centered column (`max-width: 720px`) with `BookingStepper`, `JourneySummary`, accessible `BookingOutcome` (controls kept strictly outside `role="status"`), and clear payment/refresh/ticket actions.
6. **`/tickets` & `/tickets/[ticketId]`:** `/tickets` drops the 3-card `.tk-stats` mini-dashboard header; shows clean title + subtitle, `Perlu diselesaikan sekarang` resume strip only when active holds or pending payments exist, clean filter tabs (`Semua`, `Siap dipakai`, `Riwayat dan refund`) with integrated counts + search + sort, and boarding-pass `TicketCard` list. `/tickets/[ticketId]` renders a 2-column perforated digital boarding pass with clean fact grid (left) and framed `210px` QR stub + print button (right), keeping server QR lifecycle (`CONFIRMED` only) untouched.

## 5. Preserved Contracts & Test Alignment
- All existing routes, form field names (`from`, `to`, `date`, `mode`, `passenger-name`, `passenger-phone`), `<AdminSelect>` attributes, server actions, polling/countdown logic, and a11y hooks stay intact.
- `tests/unit/passenger-discovery.test.ts` replaces the 4 commit-`1de2b72` Bento/KPI assertions with assertions verifying the de-dashboarded consumer `/trips` layout while retaining all 11 core discovery, `SearchForm`, `TripCard`, and CSS selector tests.
- All other unit test files (`passenger-seat-view`, `passenger-ticket-view`, `passenger-payment-view`, `passenger-components`, `passenger-account-menu`, `passenger-entry`, `landing-redesign`) remain unchanged and must pass 100%.
