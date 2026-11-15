# Seatpax — Architecture, End-to-End Flows & Visual Elevation Blueprint

> Generated on `feat/autonomous-overhaul` as shared execution memory for Waves 1–3.
>
> **Runtime Model Note (`AGENTS.md` Compliance):** `AGENTS.md` records user model preferences (`gpt-6.1-sol` / `gpt-6-luna`), and the autonomous prompt specifies `gemini-4-hydrogen` / `gemini-flash-3.8-high`. In this Antigravity execution runtime, `invoke_subagent` only accepts enum values `['inherit', 'flash_lite', 'flash', 'pro']` and the primary session runs on its active model. Per `AGENTS.md`, this runtime limitation is explicitly documented rather than silently substituting an undisclosed setting.

---

## 1. Product Direction & Architectural Blueprint (True North)

### Core Product Identity
Per `docs/seatpax/02_MVP_SCOPE.md` and `docs/seatpax/19_DECISION_LEDGER.md` (`D2026-10-21-01`, `D2026-10-25-01`, `D2026-11-02-02`, `D2026-11-10-01`), Seatpax is a **single-company shuttle ticketing, operations, and customer care platform** built with Next.js App Router, Drizzle/Postgres (`pg`/`postgres`), Supabase Auth, and Midtrans Sandbox:

1. **Passenger Booking & Ticket Portal** (`/`, `/trips`, `/trips/[tripId]`, `/holds/[holdId]`, `/checkout/[holdId]`, `/bookings/[bookingId]`, `/tickets`, `/tickets/[ticketId]`, `/account`):
   - Segment-aware seat inventory across multi-stop routes.
   - 10-minute transactional seat hold (`+1` minute payment webhook grace window).
   - Single-seat booking (`SELF` or `OTHER`) via Midtrans Sandbox Snap & verified webhook notifications.
   - Encrypted QR ticket issuance (`AES-256-GCM` server-side token decryption rendered via `qrcode`).
2. **Public Customer Complaint & Tracking Portal** (`/pengaduan`, `/pengaduan/buat`, `/pengaduan/cek`, `/pengaduan/lengkapi`):
   - Zero-login complaint submission with opaque tracking codes (`SPX-YYYYMMDD-XXXXXX`), local browser history convenience, email receipt/request notifications, status lookup, and hash-fragment grant verification on `/pengaduan/lengkapi`.
3. **Helpdesk Operations Workspace** (`/helpdesk`, `/helpdesk/pengaduan`, `/helpdesk/[id]`):
   - Dedicated `HELPDESK` workspace with dashboard metrics, SLA filters, status transitions (`MENUNGGU -> DIPROSES / PERLU_DILENGKAPI -> SELESAI`), priority assignment, email retry triggers, and private attachment streaming (`/api/helpdesk/attachments/[id]`).
4. **Admin PO Operations Workspace** (`/admin`, `/admin/companies/[companyId]/*`):
   - Master operations (Stops, Routes, Fare Matrix, Fleet/Vehicles, Seat Layouts, Service Classes), Trips + Crew assignment, Manifest lookup, Payment Conflict (`PAYMENT_CONFLICT`) manual refund logging, read-only Helpdesk monitoring (`/admin/companies/[companyId]/helpdesk`, `/admin/companies/[companyId]/helpdesk/[id]`), and Helpdesk staff provisioning (`/admin/companies/[companyId]/helpdesk-staff`).
5. **Crew Field Operations & Super Admin Governance** (`/crew`, `/crew/trips/[tripId]/*`, `/super-admin`, `/super-admin/companies`):
   - Crew QR camera scanner + manual ticket lookup + atomic idempotent boarding & snack claims.
   - Super Admin internal staff directory (`/super-admin`) with role management and PO sales activation controls (`/super-admin/companies`).

### Mid-Project Drift & Disconnected Flows Identified
1. **Account -> Super Admin Destination Mismatch (`app/account/page.tsx`):**
   - Links Super Admin users solely to `/super-admin/companies`, whereas `modules/auth/entry-destination.ts` and `D2026-11-02-02` establish `/super-admin` as the Super Admin landing dashboard.
   - **Fix:** Point `Super Admin →` in `/account` to `/super-admin` and add `Perusahaan PO →` linking to `/super-admin/companies`.
2. **Bolted-On Admin Helpdesk & Helpdesk-Staff Screens (`app/admin/companies/[companyId]/helpdesk*`):**
   - `/admin/companies/[companyId]/helpdesk` renders an unframed bare `<Link>` above `<CaseList>`, lacking `.admin-panel` context framing; `/admin/companies/[companyId]/helpdesk/[id]` lacks direct CSS imports (`pengaduan.css` / `helpdesk.css`) and sibling link to `helpdesk-staff`; `/admin/companies/[companyId]/helpdesk-staff` renders raw `<p>` elements instead of a structured `.admin-table-wrap` table, lacks return navigation back to `/admin/companies/[companyId]/helpdesk`, and uses bare `<p>` on error state.
   - **Fix:** Wrap with cohesive `.hd` / `.hd-panel` + `.hd-admin-header` bar, import required Helpdesk stylesheets on the detail page, provide bidirectional links between Helpdesk monitoring and Helpdesk staff provisioning, and structure staff rows into `.hd-staff-table` with semantic badges.
3. **Unframed Complaint Supplement Page (`app/pengaduan/lengkapi/page.tsx`):**
   - Uses `.hd-heading` alone without importing `../complaint-workspace.css` or wrapping in `.hd-workspace`, leaving the page visually detached from `/pengaduan/buat` and `/pengaduan/cek` and lacking a return link to `/pengaduan` and `/pengaduan/cek`.
   - **Fix:** Wrap in `.hd-workspace` + `.hd-workspace-heading` with `.hd-return` links to `/pengaduan` and `/pengaduan/cek`, matching `/pengaduan/buat` and `/pengaduan/cek`.
4. **Inconsistent Dynamic Passenger Error States & Missing Ticket Support Entry (`app/trips/[tripId]/page.tsx`, `app/holds/[holdId]/page.tsx`, `app/tickets/[ticketId]/page.tsx`):**
   - `/trips/[tripId]` and `/holds/[holdId]` use plain unstyled `<h1>`/`<p>` on unavailable states instead of `<StatePanel>`, and lack `className="sp-back"` on return links and `.sp-page-heading` on headings.
   - `/tickets/[ticketId]` omits a complaint CTA linking to `/pengaduan/buat`, forcing passengers with issued tickets to backtrack to `/bookings/[bookingId]` or `/pengaduan`.
   - **Fix:** Standardize `<StatePanel>` and `.sp-back` / `.sp-page-heading`, and add a `<Link className="sp-secondary" href="/pengaduan/buat">Laporkan masalah</Link>` action on `/tickets/[ticketId]` while preserving all strings checked by `tests/unit/passenger-ticket-view.test.ts`.
5. **Super Admin Companies Page Heading & Error Recovery (`app/super-admin/companies/page.tsx`):**
   - Missing `.super-page-heading` wrapper and `Coba lagi` retry link on error state (present in `/super-admin/page.tsx`).
6. **Documentation Drift (`README.md`):**
   - Role matrix omits `/super-admin` (internal staff directory) and `/pengaduan/lengkapi`, and omits Admin PO Helpdesk staff management route.

---

## 2. End-to-End Flow Map & White-Box Audit

| # | Flow | Entry -> Completion Path | White-Box Guardrails & Verified Invariants |
| --- | --- | --- | --- |
| F1 | **Authentication & Role Routing** | `/login` (OTP or dev quick login) -> `modules/auth/entry-destination.ts` -> `/account`, `/admin`, `/crew`, `/helpdesk`, or `/super-admin` | Next-path sanitization (`safeRedirectPath`), active membership lookup via `requireAccess`, Supabase HTTP-only session cookies. |
| F2 | **Trip Discovery & Seat Hold** | `/` or `/trips` (`from`, `to`, `date`) -> `/trips/[tripId]` -> `createHoldAction` -> `/holds/[holdId]` | Segment interval overlap query, DB advisory/row locks preventing double holds, 10-min TTL checked against DB server clock (`cutoff` & `saleOpen`). |
| F3 | **Checkout & Payment Settlement** | `/holds/[holdId]` -> `/checkout/[holdId]` -> Midtrans Snap -> `/api/payments/midtrans/notification` -> `/bookings/[bookingId]` -> `/tickets/[ticketId]` | `SELF`/`OTHER` passenger snapshot immutability, +1 min payment webhook grace, `PAYMENT_CONFLICT` isolation, HMAC webhook signature check. |
| F4 | **QR Ticket Presentation** | `/tickets` -> `/tickets/[ticketId]` | Owner authorization (`booker_user_id`), AES-GCM decryption only on confirmed/refunded tickets, QR rendered exclusively for `CONFIRMED` bookings. |
| F5 | **Public Complaint Lifecycle** | `/pengaduan` -> `/pengaduan/buat` -> opaque code -> `/pengaduan/cek` -> (if `PERLU_DILENGKAPI`) `/pengaduan/lengkapi#grant=...` | File type/size limits (3 files, 5MB), idempotent `requestKey`, hash fragment grant stripped from URL via `history.replaceState`, PII redaction on public lookup. |
| F6 | **Helpdesk Case Triage & Email** | `/helpdesk` -> `/helpdesk/pengaduan` -> `/helpdesk/[id]` -> status/priority transition + retry email | Optimistic concurrency (`revision`), status transition FSM validation, idempotent outbox jobs, private attachment signed/streamed access (`HELPDESK` / `ADMIN_PO`). |
| F7 | **Admin PO & Helpdesk Oversight** | `/admin` -> `/admin/companies/[companyId]/*` (Stops, Routes, Fares, Fleet, Layouts, Trips, Conflicts, Helpdesk, Staff) | Tenant isolation via `requireAccess('tenant.admin', companyId)` + RLS transaction helper `withAdminTransaction`. |
| F8 | **Crew Boarding & Super Admin** | `/crew/trips/[tripId]` (Manifest / Scan QR) -> `boardAction` / `snackAction`; `/super-admin` -> staff & `/super-admin/companies` | Assignment-scoped `CREW` access check, one-time boarding/snack idempotency (`ALREADY_BOARDED` / `ALREADY_CLAIMED`), `SUPER_ADMIN` null-company guard. |

---

## 3. Black-Box Action & Edge-Case Matrix

| Workspace | Action | Happy Path | Negative / Edge Cases | Expected Recovery / UI Feedback |
| --- | --- | --- | --- | --- |
| Passenger | Trip search (`/trips`) | Valid `from`, `to`, `date` lists matching trips + fares | Same origin/destination, past date, no trips | Validation note or `.sp-discovery-empty` / `<StatePanel>` with reset link |
| Passenger | Seat selection (`/trips/[tripId]`) | Select available seat -> 10m hold -> `/holds/[holdId]` | Invalid stop pair, closed sales (`saleOpen: false`), race conflict | `<StatePanel>` with `/trips` link (Wave 1 fix); disabled hold button & conflict error message |
| Passenger | Hold (`/holds/[holdId]`) | Displays remaining hold timer & checkout link | Invalid hold ID or non-owner access | `<StatePanel>` with `/trips` CTA (Wave 1 fix) |
| Passenger | Ticket detail (`/tickets/[ticketId]`) | Confirmed booking shows QR + trip summary + complaint link | `REFUNDED` / `PAYMENT_CONFLICT` / foreign ticket | QR hidden with clear message; support link to `/pengaduan/buat` (Wave 1 fix) |
| Public Pengaduan | Supplement (`/pengaduan/lengkapi`) | Hash fragment `#grant=...` loads officer note & form | Missing/expired grant or already submitted | Clear alert message + `.hd-return` links to `/pengaduan` and `/pengaduan/cek` (Wave 1 fix) |
| Admin Helpdesk | Monitor & Staff (`/admin/companies/[id]/helpdesk*`) | Admin monitors cases in read-only mode & toggles `HELPDESK` users | Wrong `companyId`, unverified email added, empty staff list | Framed `.hd-panel` error alert with return link + structured table/empty state (Wave 1 fix) |
| Super Admin | Companies (`/super-admin/companies`) | Activate or suspend PO sales | DB error or `forbidden` | Consistent `.super-page-heading` + retry action `Coba lagi` (Wave 1 fix) |
| Account | Workspace switcher (`/account`) | Direct links to all active role workspaces | Super Admin enters `/account` | Links to both `/super-admin` (Dashboard) and `/super-admin/companies` (Wave 1 fix) |

---

## 4. Color System & Surface Elevation Specification (Wave 2 Guardrails)

### Strict Design Invariants
1. **Zero Layout/Spacing/Typography Mutation:** Never alter `display`, `grid-*`, `flex*`, `padding`, `margin`, `gap`, `width`, `height`, `min-height`, `max-width`, `font-size`, `font-weight`, `line-height`, or `letter-spacing`.
2. **Test Contract Preservations:**
   - `tests/unit/admin-visual-contract.test.ts`: Every non-`@` rule in `app/admin/admin.css` MUST start with `.admin-shell` or `.admin-entry`; every non-`@` rule in `app/super-admin/super-admin.css` MUST start with `.super-admin-shell`; preserve all tested literal declarations (`min-height:44px`, `font-size:14px`, `font-size:16px`, `max-width:900px`, `max-width:960px`, `var(--font-internal-inter)`, `prefers-reduced-motion:no-preference`, `150ms`, `:focus-visible`, `.admin-shell .admin-account{display:flex!important`, `.admin-shell .admin-table-wrap{overflow:auto`, `.admin-shell .seat-grid-region{overflow:auto`, `.admin-shell .admin-header a{font-size:16px}`, `.admin-shell .admin-quote-result p{font-size:14px}`).
   - `tests/unit/crew-visual-contract.test.ts`: Every non-`@` rule in `app/crew/crew.css` MUST include `.crew-shell`; preserve `:focus-visible`, `.seat-grid-region` `overflow-x:auto`, `overflow-wrap:anywhere`, `minmax(0,1fr)`, `.crew-shell .manifest-controls input`, `.crew-shell .boarding-form select`, `min-height:48px`, `@media (prefers-reduced-motion:no-preference)`.
   - `tests/unit/passenger-seat-view.test.ts`: Preserve `.passenger-shell .seat-cell{...overflow-wrap:anywhere...}`.

### Upgraded Token Palette ("Maritime Cobalt & Layered Slate")
- **Canvas & Atmospheric Depth:** Cool-slate tinted canvas (`#f1f5fb` / `#eff4fb`) with subtle radial top cobalt glow (`rgba(0, 91, 209, 0.06)`) separating background plane from cards.
- **4-Tier Surface Elevation:**
  - **Sunken Wells** (table headers, seat grid regions, form field wells): `#e9eff8` / `#eef3fa` with crisp inner border `#cedaec`.
  - **Elevated Cards** (`.passenger-card`, `.sp-discovery-card`, `.admin-panel`, `.hd-panel`, `.crew-panel`, `.super-directory`, `.lg-card`): Pure white top-lit surface (`linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)`), refined cool slate border (`#cedaea`), and layered key + ambient shadow (`0 1px 2px rgba(7, 25, 54, 0.04), 0 10px 26px -8px rgba(10, 33, 68, 0.07)`).
  - **Interactive Hover & Focus Elevation:** Crisp cobalt border accent (`#6ea3eb` / `#0055c4`), soft interactive focus ring (`0 0 0 3px rgba(0, 85, 196, 0.14)`), and lifted shadow on clickable trip/choice cards.
  - **Primary Controls & Semantic Badges:** Top-lit cobalt gradient (`linear-gradient(180deg, #0b66db 0%, #004eb8 100%)`) with crisp active/hover depth (`#003f99`), plus high-contrast WCAG AA+ tinted semantic badges (`Success #0f6835 / #eafbf0 / #b6ebc9`, `Warning #8e3b09 / #fff8e6 / #fbd38d`, `Danger #b41c1c / #fef1f2 / #fec7c7`, `Info #004eb8 / #eaf2ff / #bfd8fe`).
