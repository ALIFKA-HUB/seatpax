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
