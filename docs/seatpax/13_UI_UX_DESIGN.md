# Seatpax — UI/UX & Visual Design

> **Active release — 6 Oktober 2026:** Untuk release aktif, login Email OTP sebelum checkout dan satu passenger/seat per booking. Tombol guest claim, cash sale, reschedule/reseat dan workflow refund umum ditunda. Pertahankan latest visual direction, tetapi render screen sesuai scope aktif; daftar 23 layar adalah cakupan desain awal, bukan kewajiban release semuanya. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


# 27. UI / UX Information Architecture

## 27.1 Passenger — Mobile First

Tujuan: proses pencarian sampai ticket sependek mungkin.

### Public navigation

```text
Home
Search Result
Trip Detail
Seat Selection
Passenger Data
Checkout
Payment
Booking Success
My Tickets
Ticket Detail
Account
```

### Home / Search

Komponen:

```text
SeatpaxLogo
FromStopPicker
ToStopPicker
DatePicker
PassengerCount
SearchButton
RecentSearch(optional)
```

Prioritas UX:

- asal dan tujuan mudah ditukar,
- stop yang sama tidak boleh dipilih sebagai from/to,
- tanggal lampau disabled,
- loading state jelas.

### Search Result

Setiap trip card minimal menunjukkan:

```text
PO / Company
Departure time
Arrival estimate
Service class
Vehicle type optional
From → To
Available seats
Calculated fare
```

Rating marketplace tidak wajib MVP.

### Seat Selection

Komponen:

```text
TripSummary
SeatLegend
DynamicSeatGrid
HoldTimer
SelectedSeatSummary
FareBreakdown
ContinueButton
```

Seat visual states:

```text
AVAILABLE
SELECTED
HELD_BY_OTHER
BOOKED_ON_OVERLAPPING_SEGMENT
UNAVAILABLE / DISABLED
```

Hindari hanya mengandalkan warna; gunakan icon/border/label agar accessible.

### Checkout

Sections:

```text
Trip Summary
Passenger Forms
Seat Summary
Fare Breakdown
Payment Method / Midtrans
Terms
Pay Button
```

### Ticket Detail

```text
Company
Route
Departure
Passenger
Seat
Booking Code
Ticket QR
Boarding Status
Snack Status
Reschedule Action
```

Jika guest:

```text
[ Simpan tiket ke akun ]
```

---


# 28. Admin PO UI — Desktop Productivity

Admin dirancang desktop-first karena data padat dan seat builder lebih nyaman memakai mouse.

## 28.1 Navigation

```text
Dashboard
Trips
Routes & Stops
Fleet
Seat Templates
Bookings
Manifest
Reschedule Requests
Refunds
Reports
Settings
```

## 28.2 Dashboard

MVP cards:

- Trip hari ini.
- Total booking hari ini.
- Occupancy sederhana.
- Payment conflict count.
- Pending reschedule.
- Upcoming departure.

Hindari dashboard penuh vanity metrics yang tidak dipakai.

## 28.3 Route Builder

Layout:

```text
Route Name

Stop 1  [Bandung]   ↑ ↓ Remove
Stop 2  [Cianjur]   ↑ ↓ Remove
Stop 3  [Sukabumi]  ↑ ↓ Remove
Stop 4  [Bogor]     ↑ ↓ Remove

[ Add Stop ]
```

Di bawahnya fare matrix sederhana per adjacent segment + service class.

## 28.4 Seat Template Builder

Desktop split layout:

```text
┌────────────────────┬──────────────────────────────┐
│ Component Palette  │ Cabin Grid                  │
│                    │                              │
│ Seat               │ [DRIVER][    ][01]          │
│ Driver             │ [DOOR  ][    ][02]          │
│ Door               │ [03    ][04  ][05]          │
│ Aisle              │                              │
│ Facility           │                              │
└────────────────────┴──────────────────────────────┘
```

Actions:

- add/move cell,
- duplicate template,
- auto-number seat,
- rename seat,
- archive template.

## 28.5 Trip Management

Trip form:

```text
Route
Date
Departure Time
Service Class
Vehicle
Sales Open/Close optional
```

Preview harus menunjukkan:

```text
number of segments
seat capacity
fare summary
vehicle layout
```

## 28.6 Booking detail

Admin melihat:

```text
Booking code
Passenger list
Payment
Seats
Ticket status
Reschedule history
Refund history
Audit trail summary
```

## 28.7 Manifest

Filter:

```text
All
Not Boarded
Boarded
Snack Unclaimed
Needs Reseat
```

Table/card fields:

```text
Seat
Passenger
From
To
Payment
Boarding
Snack
```

---


# 29. Crew PWA Design

Crew bekerja di HP, mungkin sambil berdiri atau di bus. UI harus cepat, besar, dan minim typing.

## 29.1 Main screen

```text
Today's Trips
Active Trip

[ Open Manifest ]
[ Scan QR ]
[ Cash Sale ]
```

## 29.2 Active Trip Header

Tampilkan selalu:

```text
Route
Departure
Vehicle / Plate
Current status
Passenger count
Boarded count
```

## 29.3 Scanner

Full-screen camera dengan feedback besar.

Valid:

```text
✓ VALID
Budi Santoso
Seat 07
```

Invalid:

```text
✕ INVALID
Wrong trip / cancelled / unknown ticket
```

Jangan membuat crew membaca error teknis.

## 29.4 Passenger Trip Profile

Ini halaman pusat operasional.

```text
BUDI SANTOSO
Seat 07
Bandung → Bogor

Boarding
[ Mark Boarded ] / ✓ 07:53

Snack
[ Claim Snack ] / ✓ 08:02

Booking
PAID
```

## 29.5 Manifest mobile

Gunakan row card, bukan desktop table penuh.

```text
[07] Budi Santoso
Bandung → Bogor
Boarded ✓   Snack —
```

Tap membuka Passenger Trip Profile.

## 29.6 Cash Sale

Harus sangat pendek:

```text
From
To
Seat
Name
Phone/Email optional
Fare
[ Terima Cash ]
```

Tidak ada printer requirement pada MVP.

---


# 30. Super Admin UI

Minimal pages:

```text
Platform Overview
Companies
Company Detail
```

Company card/detail:

```text
Name
Status
Admin count
Trips count optional
[ Suspend ] / [ Activate ]
```

Tidak perlu financial marketplace dashboard pada MVP.

---


# 31. Visual Design Direction

## 31.1 Brand name

**Seatpax** = Seat + Pax (passenger).

## 31.2 Brand direction lama

Brainstorming awal menyarankan:

```text
Midnight Navy #0F172A
Amber         #F59E0B
Tangerine     #F97316
```

**Status:** Suggested, **belum wajib/final**. Jangan hard-code keputusan desain hanya karena pernah dibahas.

## 31.3 Visual principles

- Passenger: clean, travel-oriented, mobile-first.
- Admin: dense but readable, desktop productivity.
- Crew: high contrast, large touch targets, one-hand friendly.
- Status tidak hanya menggunakan warna.
- Critical action mempunyai confirmation dan destructive styling yang jelas.
- QR scanner feedback harus bisa dikenali dalam <1 detik.

## 31.4 Typography

Gunakan font web system / open-source yang tersedia tanpa dependency aneh. Prioritas:

- legibility,
- tabular number support untuk fare/time jika memungkinkan,
- hierarchy yang jelas.

## 31.5 Spacing & touch target

Crew/passenger touch target minimal sekitar 44px.

Admin boleh lebih padat tetapi tetap konsisten dengan 4/8px spacing system.

---


# 32. UX States yang Wajib Dirancang

Setiap page penting minimal mempunyai:

```text
Loading
Empty
Success
Error
Disabled
Permission denied
Network failure
```

Khusus seat map:

```text
No seats available
Hold expired
Seat taken while selecting
Payment still pending
Payment conflict
```

Khusus scanner:

```text
Camera permission denied
Unknown QR
Wrong trip
Cancelled ticket
Already boarded
Snack already claimed
```

Khusus manifest:

```text
No passengers
Passenger needs reseat
Trip cancelled
```

---


---

# Latest Design Direction — Concrete Screen System

> Status: **CURRENT DESIGN DIRECTION**. This section supplements the earlier UI/UX specification with the latest concrete screen decisions.

## Design philosophy

Seatpax uses **one design system with different interaction density per role**:

| Role | Primary device | UI character |
|---|---|---|
| Passenger | Mobile web | Clean, spacious, consumer-first |
| Crew | Android/PWA | Fast, high-contrast, one-hand operation |
| Admin PO | Desktop | Dense, data-oriented productivity UI |
| Super Admin | Desktop | Minimal SaaS administration |

The product should feel like **modern transport + operational SaaS**, not a promotional travel marketplace and not a generic CRUD dashboard.

## Brand visual direction

- Core feeling: **fast, safe, clear, operational**.
- Primary palette direction: deep navy / dark blue.
- Accent: bright blue or cyan.
- Semantic colors: green success, amber warning, red danger.
- Background: off-white / very light gray.
- Typography: **Inter** or **Geist**.
- Medium corner radius, not overly pill-shaped.
- Avoid excessive gradients, glassmorphism, and decorative motion.

## Passenger navigation

```text
Home
Tickets
Account
```

The core passenger funnel is intentionally short:

```text
Search → Trip → Seat → Checkout → Ticket
```

### Passenger Home

Primary content:
- origin selector;
- destination selector;
- travel date;
- search CTA;
- active/upcoming trip card;
- minimal bottom navigation.

Do not expose internal multi-segment complexity to passengers unless needed.

### Search Result Card

Each card should prioritize:
- PO name;
- service class;
- departure and arrival time;
- origin and destination;
- remaining seats;
- fare;
- single clear `Pilih` CTA.

### Seat Selection

This is a **hero screen** of Seatpax.

Must show:
- vehicle orientation/front;
- dynamic seat map generated from `SeatTemplate`;
- seat legend;
- selected seat;
- price;
- 10-minute seat-hold countdown;
- checkout CTA.

The same rendering system must support layouts such as 2-2, 2-1, HiAce, and sleeper configurations without hardcoded screens.

### Checkout

Keep sections limited to:
1. Journey summary
2. Passenger
3. Payment
4. Total

Guest checkout remains allowed. Account claim/login can happen after successful booking.

### Passenger Ticket

Ticket screen should prominently show:
- origin/destination;
- departure date and time;
- passenger name;
- seat;
- QR;
- boarding status;
- snack claim status;
- booking/ticket identifier.

This screen is another **hero screen** of the portfolio.

## Crew PWA

Crew is **not** a desktop dashboard shrunk to mobile.

The active-trip home should expose only the most important actions:

```text
Active Trip
├── Scan QR        ← primary CTA
├── Manifest
└── Cash Sale
```

Use large touch targets, strong contrast, minimal text, and one-hand ergonomics.

### QR result / Passenger Trip Profile

Scanning QR does not open a generic ticket page. It resolves the QR into the passenger's **Trip Passenger Profile**.

Display:
- passenger name;
- seat;
- origin → destination;
- trip;
- boarding state + timestamp;
- snack claim state + timestamp;
- contextual actions such as `Mark as Boarded` or `Claim Snack`.

The QR itself is reusable. The state is stored per entitlement/action.

### Crew Manifest

Manifest is grouped by **trip**, not permanently by physical vehicle.

Header information:
- route;
- departure time;
- assigned vehicle;
- seat count;
- booked passenger count;
- boarded count.

Useful filters:

```text
Semua | Belum Naik | Sudah Naik
```

A passenger opened from the manifest must use the same Passenger Trip Profile component as a QR scan result.

```text
QR Scan ───────► Passenger Trip Profile ◄────── Manifest
```

## Admin PO — desktop productivity

Recommended primary navigation:

```text
Dashboard
Trips
Routes
Vehicles
Seat Templates
Bookings
Reports
```

### Dashboard

Prioritize operational information rather than decorative analytics:
- today's trips;
- today's bookings;
- simple revenue summary;
- upcoming trip list;
- occupancy indicators.

### Trip Detail

One screen should give a complete operational picture:
- route/date/time;
- assigned bus;
- service class;
- occupancy;
- revenue summary;
- ordered stop timeline;
- passenger manifest;
- edit/view actions.

### Seat Template Builder

Use a **smart grid**, never arbitrary pixel X/Y positioning.

Supported cells may include:
- seat;
- driver;
- door;
- aisle;
- empty/facility.

MVP can use click-cell → choose type. Drag-and-drop and swap are enhancements, not required to prove the architecture.

## Super Admin

Keep intentionally small:

```text
Overview
Companies
```

Company list needs only core status and platform-level controls such as add, activate, and suspend.

## Component priorities

General reusable components:
- `TripCard`
- `StatusBadge`
- `PaymentStatusBadge`
- `TripStatusBadge`
- `StopTimeline`
- `FareBreakdown`
- `DataTable`
- `ConfirmDialog`
- `EmptyState`

Seatpax-defining components that deserve the most polish:
- `SeatMap`
- `SeatTemplateBuilder`
- `TicketQR`
- `PassengerTripProfile`
- `PassengerManifest`

## Semantic state colors

Seat inventory:
- Available → neutral
- Selected → primary blue
- Held → amber
- Booked → gray/dark

Operations:
- Waiting → amber
- Boarded → green
- No-show → red

Payment:
- Pending → amber
- Paid → green
- Failed → red
- Refunded → gray

Never rely on color alone; pair semantic color with labels/icons.

## Motion

Motion is functional, not decorative. Appropriate motion includes:
- seat selection feedback;
- bottom drawer/dialog transitions;
- success toast/state;
- scanner valid/invalid feedback.

Scanner feedback may use:
- valid → green flash + beep/vibration;
- invalid → red flash + warning vibration.

## Recommended Figma coverage

The list below contains **23 high-value screen entries**: Passenger 9, Crew 6, Admin PO 7, Super Admin 1. Payment and login states may share layouts; the list is design coverage, not a fixed implementation page count.

Passenger:
- Home
- Search Result
- Trip Detail
- Seat Selection
- Checkout
- Payment State
- Ticket
- My Tickets
- Login/Account

Crew:
- Login
- Active Trip
- Scanner
- Passenger Trip Profile
- Manifest
- Cash Sale

Admin PO:
- Dashboard
- Trips
- Trip Detail
- Routes
- Vehicles
- Seat Template Builder
- Bookings

Super Admin:
- Companies

## Product visual identity

A screenshot should communicate Seatpax even without the logo. The three strongest visual identifiers are:

```text
Dynamic Seat Map
Passenger Manifest
QR Passenger Trip Profile
```

Those components should receive the highest design polish.

## Adopted visual delivery order — 9 October 2026

The user approved a shared navy/blue visual foundation using the supplied Seatpax logo, then the passenger journey, then separate Crew and Admin/Super Admin redesigns. The [passenger visual specification](../superpowers/specs/2026-10-09-passenger-visual-design.md), including its concrete tokens and screen direction, is approved; the plan is approved and passenger presentation is implemented locally. See [visual setup evidence](../setup/PASSENGER_VISUAL_SETUP.md) for automated results and deferred authenticated/phone acceptance. This order does not activate older deferred examples such as guest/group checkout, cash sale, real refund or analytics screens. Manual user testing remains deferred. The supplied raster board has been prepared into inspected horizontal/symbol PNG assets; original vector assets remain unavailable.

## Crew visual phase — 9 October 2026

The written Crew spec and plan are approved. Dedicated responsive Crew presentation is implemented locally with the supplied Seatpax identity, 48px main controls, clear manifest/profile states and separate explicit boarding/snack actions. Domain contracts remain unchanged. See ../setup/CREW_VISUAL_SETUP.md for automated evidence, synthetic layout measurements and pending actual authenticated/phone/zoom/reduced-motion acceptance. Admin/Super Admin redesign remains a separate phase.

## Admin and Super Admin visual phase — 9 October 2026

Approved spec and plan implemented locally: branded role scopes, current Admin section, readable source/fleet/trip/payment screens and independent Super Admin company rows. Existing operational behavior remains authoritative. See ../setup/ADMIN_VISUAL_SETUP.md for fresh automated results, measured synthetic layouts and deferred authenticated/physical-phone/zoom/reduced-motion acceptance.

## Admin location directory refinement — 15 October 2026

The user selected the interactive Admin PO concept and requested its implementation before Crew mobile work. Apply its white sidebar, navy/bright-blue identity, Plus Jakarta Sans scoped to Admin, compact navigation and table-first **Titik naik & turun** page. Search by location/city and filter status; open Add/Edit in a native modal rather than displaying an edit form for every record. Use the supplied logo and actual authenticated-company data. Omit the concept's location-type column until a persisted type contract is separately agreed; city/terminal catalogue integration is separate work. Existing stop validation, authorization and status confirmation remain authoritative. See [delivery evidence](../setup/ADMIN_DIRECTORY_REFRESH_SETUP.md). This slice does not implement the separate passenger concept.

## Latest Design Direction — passenger discovery, 20 October 2026

Adopt the approved passenger preview with **no decorative bus illustration**. Keep the actual Seatpax logo, navy/blue palette, compact light-blue greeting/search header and real trip list visible before searching. Passenger navigation is **Perjalanan**, **Pesanan saya**, **Akun**, at the top on desktop/tablet and bottom on phones. Search narrows actual trips; a Filter button opens an accessible dialog/bottom sheet. Ordinary login should lead to the user's authorized destination rather than a mandatory account-link hub. Preserve explicit safe journey/hold return paths and existing authorization. Detailed orders/account contents remain separate work. See the [recorded design](../superpowers/specs/2026-10-20-passenger-discovery-design.md) and [approved implementation plan](../superpowers/plans/2026-10-20-passenger-discovery-refresh.md); presentation and routing are implemented locally; see [verification and pending acceptance](../setup/PASSENGER_DISCOVERY_REFRESH_SETUP.md).


## Regional stop selection — 20 October 2026

Admin Add/Edit point uses province selection and searchable exact city/regency names with codes. Kota and Kabupaten stay distinct. New points require an active catalogue reference; legacy points show **Wilayah belum dipetakan** and keep existing city text until deliberately mapped. Retired mappings permit unrelated edits and require an active replacement to change region. Missing catalogue explains retry/synchronization without removing the directory. Passenger search offers configured snapshot points participating in sale-open intervals, never every reference city. See [delivery and pending device acceptance](../setup/REGION_REFERENCE_SETUP.md).

## Adopted tenant booking portal — 20 October 2026

Each shuttle company should have its own passenger booking page within Seatpax, using a path such as `/po/{company-slug}` with PO identity, company-bound search/journeys, booking and payment context. Free simulation is excluded from live public discovery. Custom company domains are deferred. This is approved design direction, not delivered UI or tenant-routing implementation.

## Adopted SaaS platform Admin navigation — 20 October 2026

Admin Seatpax/Super Admin: **Ringkasan**, **Perusahaan**, **Paket & benefit**, **Langganan & tagihan**, **Riwayat perubahan**. These cover platform/company summaries, service state, versioned plan configuration, subscription/invoice lifecycle and audited platform changes. Routes, schedules, fleet, Crew and passenger orders remain company-operational screens for Admin PO. This is approved navigation scope; the existing minimal Super Admin implementation does not deliver all these pages.

## Adopted customer complaint entry points — 20 October 2026

Admin PO uses **Pesanan > Daftar pesanan / Pengaduan pelanggan**, with a count of unhandled complaints on Orders. Do not add another top-level menu for this feature. Customers submit **Laporkan masalah** and reopen report history from the same booking detail. Reports link to the relevant booking/payment examination. This is approved navigation direction; complaint service, state workflow, private evidence and escalation implementation remain pending design/plan.


## Latest landing direction — 21 October 2026

The user approved the concrete Seatpax single-company passenger landing direction and then requested implementation. Preserve actual brand assets and Perjalanan/Pesanan saya/Akun navigation. Compact split hero “Antarkota, lebih nyaman.”, no bus illustration, and above-fold origin/destination/date search feed the existing `/trips` contract. Use blue/navy, restrained shapes, mobile stacked controls and existing phone bottom navigation. Show configured available stop data, honest empty/unavailable states, digital booking/ticket explanations and FAQ. No invented fares, fleet amenities, reviews, customer counts, contact details or live routes. Existing backend single-company scoping remains the separate unresolved audit item; UI delivery does not claim to resolve it. [Landing delivery](../setup/SINGLE_COMPANY_LANDING_SETUP.md).

### Approved white photo revision

The user's two supplied travel references supersede the split-hero composition above: white background locked independently of system dark mode, matching the actual logo; navy text and Seatpax blue actions. Use a larger rounded photographic hero with readable overlay copy, a white search panel slightly overlapping its lower edge on desktop, varied image/content layouts, a concise booking flow and FAQ. Phone search is single-column and does not overlap the photo. Retain existing passenger navigation and query contracts. The landing route showcase remains intentionally empty for now, including no Cianjur-Bandung example or other dummy routes/fares; this is presentation only, not inventory deletion or a claim that the database contains no trips. Existing search options may still use actual eligible locations. No community, app-download, subscription pricing, fabricated testimonials or amenities. Reuse licensed illustrative road photographs; do not imply they show actual Seatpax fleet. Design dials 7/3/4. Testing remains deferred by the user.

### Approved passenger navbar

The user accepted the interactive white floating navbar preview and then specifically removed colored active-tab backgrounds. Desktop: actual logo left, Perjalanan/Pesanan saya centered, account action right; white 72px surface with 20px corners, subtle shadow and 16px sticky top offset. Active/hovered main items change text color to blue only, including phone bottom navigation; no colored fills, underline, selection box or bottom stroke. Phone retains compact top brand/account and three-item bottom navigation. Focused authentication/checkout presentation stays simple. Before login offer Masuk; signed-in account uses an accessible disclosure for Profil saya (existing /account) and existing logout. Unknown identity keeps the guarded /account link. Client auth state is presentation only; server authorization stays authoritative. This bounded implementation follows the accepted preview; no profile editing, route or authorization expansion.

Scroll refinement approved: at the top, the desktop/tablet navbar blends with the white page without the floating shadow/outline. After passing a marker 32px from the page top, reveal the existing floating surface over 300ms, reversing on return. Preserve geometry to avoid content jumps; animate opacity/transform only, observe a threshold rather than every scroll event, and respect reduced motion. Phone static top/bottom navigation and focused flows stay unchanged.

Latest refinement after the user found the transition too subtle: use 450ms, stronger floating shadow/outline, and a small desktop/tablet header transform to 98% scale with a 4px downward shift. Reverse at the top. This transform does not move the document's layout; phone and reduced-motion modes retain their static geometry.

Latest navigation indicator revision: user requested an underline. Main links now use blue text plus a 2px underline directly below the label for the current page, with the same underline on hover for hover-capable devices. No colored active background. Underline reveal uses180ms transform only and is instant under reduced motion. This supersedes the previous no-underline requirement; desktop and phone labels share the indicator.

### Approved booking route motion — 21 October 2026

Apply the accepted interactive preview to the landing booking explanation: a dashed blue route with distinct upward/downward curves, a travelling point, and four sequential icon activations. Preserve the existing labels and copy. Play once for 4.2 seconds when the section becomes visible; stop with all steps readable. Desktop is horizontal; tablet and phone use one vertical route for continuous reading order. Reduced motion shows a static completed route, and server-rendered content/fallback connectors remain usable without JavaScript. This explains the process and never indicates the state of an actual booking. Use the existing Phosphor icons and brand colors; no animation dependency.

### Booking composition refinement

The user approved centering each desktop step's icon, title and description within equal-width columns, balancing both outer icon margins. Keep tablet/phone vertical content left aligned. Shorten the third title to **Bayar pesanan** and descriptions to concise text; reduce the icon halo from 6px to 3px and heading-to-route spacing from 52px to 44px. Desktop section spacing becomes 80px; existing tablet/phone spacing remains. Soften navbar shadow to 0 8px 24px with lower blue-tinted opacity while preserving its 450ms scroll transition and underline.

### Route arrival and breathing refinement — 22 October 2026

The user requested more space above/below the animation, a visible arrival response on each circle, and local icon motion. Increase route padding and desktop icon-to-title spacing; increase vertical step gaps on smaller screens. An expanding ring runs for 800ms at each measured route arrival. Each activated glyph then makes two restrained 1.8-second in-place motions and settles, keeping the circle/path anchors stable. All motion remains disabled under reduced-motion preference. The main route still plays once for 4.2 seconds.

Clarification (22 October): local movement applies to the entire circle and its icon together, gently translating 1-3px in all four directions after arrival, for two cycles. The glyph has no separate animation. Layout-coordinate path measurement excludes this translation so responsive/font remeasurement keeps route anchors stable. This supersedes the glyph-only motion above.

### Continuous circle and glyph motion — 22 October 2026

The user clarified that each circle should rise/settle on route arrival and then float vertically forever with small displacement, with a separate subtle icon response and continuing icon motion. Use a 700ms arrival lift (5px) and icon scale response, then a smooth 3.6s circle loop (3px vertical range) and 4.8s icon loop (2-degree rotation). Each starts only at its measured arrival delay. This supersedes the two-cycle settlement. Provide a small Jeda animasi/Lanjutkan animasi control that pauses/resumes all route, ring, circle and glyph animation in place. Reduced motion stays static and hides the control.

### Booking spacing and controls refinement — 22 October 2026

At the user's explicit request, remove the visible Jeda animasi/Lanjutkan animasi control and its reserved row. Retain the requested continuous circle/icon motion and system reduced-motion fallback. Compact the section: desktop route top margin 40px, route padding 8px top/bottom, icon-to-title gap 26px, desktop page section gap 72px; phone route margin 28px and vertical step gap 32px; tablet margin 32px and step gap 34px. Keep balanced desktop outer margins and existing content. This supersedes previous pause-control and larger-spacing directions.
