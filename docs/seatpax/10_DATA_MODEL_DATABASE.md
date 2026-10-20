# Seatpax — Data Model, Database Schema & Indexing

> **Implementation update — 9 October 2026:** Manifest and explicit once-only boarding are implemented for assigned active crew, with same-tenant Admin read-only access, minimum passenger data, origin-stop validation and immutable event retries. QR resolves only; snack and offline operations remain subsequent work. See `../setup/MANIFEST_BOARDING_SETUP.md` for evidence and pending physical-camera acceptance.


> **Implementation update — 8 October 2026:** Implemented checkout tables: bookings, booking_passengers, payments, payment_events, seat_assignments, confirmed_occupancy, tickets, payment_resolutions and booking_audit_events. Migration0006 binds hold/booker/passenger mode and occupancy anchors;0007 binds each ticket to the same passenger as its assignment. PostgreSQL constraints, RLS and revoked browser grants protect persistence; declarative Drizzle metadata mirrors the safeguards. See `../setup/CHECKOUT_PAYMENT_SETUP.md`.

> **Tenant slice — D2026-10-07-01:** users/companies/memberships now follow the [approved tenant design](../superpowers/specs/2026-10-07-tenant-access-design.md): RESTRICT FKs; CHECK ties role to company nullability; partial unique tenant/global indexes replace the single UNIQUE below; default-deny browser grants/RLS. Implementation evidence: [tenant setup](../setup/TENANT_ACCESS_SETUP.md). Other domain tables below remain proposals.

> **Fondasi diadopsi — D2026-10-06-02:** Schema v1 di bawah adalah referensi sebelum fondasi, belum migration. Migration retained flow wajib menambahkan trip_crew_assignments; immutable trip_stops/trip_seats/layout snapshot; hold owner/base/effective/payment initiation timestamps dan RELEASED state; unique bookings.seat_hold_id dan booking_passengers.booking_id; hash+ciphertext ticket; uniqueness operasi; cross-trip/company constraints; event replay dan mock refund audit. Detail authoritative bagian 1–7 fondasi; jangan mengimplementasikan schema lama tanpa delta ini. Acuan: [rancangan fondasi](../superpowers/specs/2026-10-06-foundation-design.md) dan [ledger](19_DECISION_LEDGER.md). Kontrak ini mendahului uraian lama yang berbeda; implementasi belum dibuat.


> Modular documentation extracted from the Seatpax master specification.

## Implemented fleet schema delta — 7 October 2026

Sections 20.9–20.11 above are conceptual history; the development database uses implemented migrations [`0002_fleet_seat_templates.sql`](../../drizzle/0002_fleet_seat_templates.sql) and the Trip Engine migration, with Drizzle definitions in `lib/db/schema.ts`. These replace the older `metadata_json` proposal with explicit fields and company-scoped composite references. Trip schema and current verification limits are summarized in [Trip Engine setup evidence](../setup/TRIP_ENGINE_SETUP.md).

- `seat_templates`: company, trimmed name, dimensions, `ACTIVE|ARCHIVED`, positive version and timestamps.
- `seat_template_cells`: company/template FK, unique grid coordinate, bounded coordinate, type, optional label and seat code. SEAT codes are uppercase ASCII `[A-Z0-9-]{1,8}`; non-SEAT codes are null. The service validates the complete rectangle and at least one seat before an atomic replacement.
- `vehicles`: company, name, normalized plate, optional fleet number, same-company seat-template/service-class references, `ACTIVE|MAINTENANCE|INACTIVE`, positive revision and timestamps. Plate is unique per company.
- All three tables enable RLS and revoke all table grants from `anon` and `authenticated`; browser access goes through the guarded server domain.
- Fleet integration tests verify tenant FK failures, malformed cell checks, browser grant denial and cleanup of unique fixtures. Migration 0002 contains fleet sources; the additive Trip Engine migration supplies draft/publication snapshots, inventory anchors and crew assignments. The anchors do not encode occupancy or hold status.


# 19. Recommended Data Model — Conceptual ERD

```text
User
 │
 ├── Membership ─────────── Company
 │                           │
 │                           ├── Route
 │                           │    └── RouteStop ─── Stop
 │                           │
 │                           ├── ServiceClass
 │                           │
 │                           ├── SeatTemplate
 │                           │    └── SeatTemplateCell
 │                           │
 │                           ├── Vehicle
 │                           │
 │                           └── Trip
 │                                ├── TripSegment
 │                                ├── TripSeatInventory
 │                                ├── SeatHold
 │                                └── Booking
 │                                     ├── BookingPassenger
 │                                     │     ├── SeatAssignment
 │                                     │     └── Ticket
 │                                     │           ├── BoardingEvent
 │                                     │           └── SnackClaim
 │                                     ├── Payment
 │                                     │     └── PaymentEvent
 │                                     └── Refund
 │
 └── Passenger-owned Tickets / Bookings
```

---


# 20. Database Schema Proposal v1

> Catatan: Ini adalah schema direction. Nama final dapat berubah ketika migration pertama dibuat, tetapi relasi dan constraint utama sebaiknya dipertahankan.

## 20.1 `users`

```text
id                  uuid PK
email               text nullable unique
name                text nullable
avatar_url          text nullable
created_at          timestamptz
updated_at          timestamptz
```

Identity provider detail utama berasal dari Supabase Auth; tabel app profile dapat memakai `auth.users.id` sebagai FK.

## 20.2 `companies`

```text
id                  uuid PK
name                text
slug                text unique
logo_url            text nullable
status              enum ACTIVE | SUSPENDED
refund_cutoff_minutes int nullable
created_at          timestamptz
updated_at          timestamptz
```

## 20.3 `memberships`

```text
id                  uuid PK
user_id             uuid FK users
company_id          uuid FK companies nullable
role                enum ADMIN_PO | CREW | SUPER_ADMIN
status              enum ACTIVE | DISABLED
created_at          timestamptz
```

Passenger tidak harus mempunyai membership company.

Constraints:

```text
UNIQUE(user_id, company_id, role)
```

## 20.4 `stops`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
city                text
address             text nullable
latitude            numeric nullable  -- future/maps
longitude           numeric nullable  -- future/maps
status              enum ACTIVE | INACTIVE
```

MVP tidak wajib memakai latitude/longitude.

## 20.5 `routes`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
code                text nullable
status              enum ACTIVE | INACTIVE
created_at          timestamptz
```

## 20.6 `route_stops`

```text
id                  uuid PK
route_id            uuid FK routes
stop_id             uuid FK stops
sequence            int
arrival_offset_min  int nullable
departure_offset_min int nullable
```

Constraint penting:

```text
UNIQUE(route_id, sequence)
UNIQUE(route_id, stop_id) -- jika route tidak boleh melewati stop sama dua kali
CHECK(sequence >= 1)
```

## 20.7 `service_classes`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
code                text
amenities_json      jsonb nullable
status              enum ACTIVE | INACTIVE
```

Contoh:

```text
Economy
Executive
Sleeper
```

## 20.8 `segment_fares`

```text
id                  uuid PK
route_id            uuid FK routes
from_route_stop_id  uuid FK route_stops
to_route_stop_id    uuid FK route_stops
service_class_id    uuid FK service_classes
price               bigint -- simpan rupiah sebagai integer
currency            text default 'IDR'
```

Untuk keputusan pricing MVP, idealnya row mewakili adjacent segment. Harga multi-segment dijumlahkan.

Constraint:

```text
UNIQUE(route_id, from_route_stop_id, to_route_stop_id, service_class_id)
CHECK(price >= 0)
```

## 20.9 `seat_templates`

```text
id                  uuid PK
company_id          uuid FK companies
name                text
rows                int
cols                int
version              int default 1
status              enum ACTIVE | ARCHIVED
created_at          timestamptz
```

## 20.10 `seat_template_cells`

```text
id                  uuid PK
seat_template_id    uuid FK seat_templates
row_index           int
col_index           int
type                enum SEAT | DRIVER | AISLE | DOOR | EMPTY | FACILITY
label               text nullable
seat_code            text nullable
metadata_json       jsonb nullable
```

Constraint:

```text
UNIQUE(seat_template_id, row_index, col_index)
UNIQUE(seat_template_id, seat_code) WHERE type = 'SEAT'
```

`metadata_json` dapat menyimpan `is_window`, `extra_legroom`, atau atribut minor tanpa mengubah schema.

## 20.11 `vehicles`

```text
id                  uuid PK
company_id          uuid FK companies
seat_template_id    uuid FK seat_templates
plate_number        text
fleet_number        text nullable
name                text nullable
status              enum ACTIVE | MAINTENANCE | INACTIVE
```

Constraint:

```text
UNIQUE(company_id, plate_number)
```

## 20.12 `trips`

```text
id                  uuid PK
company_id          uuid FK companies
route_id            uuid FK routes
vehicle_id          uuid FK vehicles
service_class_id    uuid FK service_classes
scheduled_departure timestamptz
scheduled_arrival   timestamptz nullable
status              enum
sales_open_at       timestamptz nullable
sales_close_at      timestamptz nullable
created_by          uuid FK users
created_at          timestamptz
```

## 20.13 `trip_segments`

Snapshot segment trip agar trip tidak rusak jika route template kemudian diedit.

```text
id                  uuid PK
trip_id             uuid FK trips
sequence            int
from_stop_id        uuid FK stops
to_stop_id          uuid FK stops
fare_amount         bigint
```

Jika pricing berbeda per trip di future, fare snapshot sudah tersedia.

Constraint:

```text
UNIQUE(trip_id, sequence)
```

## 20.14 `trip_seats`

Snapshot seat yang benar-benar tersedia di trip.

```text
id                  uuid PK
trip_id             uuid FK trips
seat_code           text
source_template_cell_id uuid nullable
metadata_json       jsonb nullable
```

Constraint:

```text
UNIQUE(trip_id, seat_code)
```

## 20.15 `trip_seat_inventory`

Materialized inventory per segment.

```text
id                  uuid PK
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
trip_segment_id     uuid FK trip_segments
```

Record ini mewakili unit inventory. Kepemilikan dapat ditentukan melalui hold/assignment table daripada field mutable besar.

Constraint:

```text
UNIQUE(trip_seat_id, trip_segment_id)
```

## 20.16 `seat_holds`

```text
id                  uuid PK
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
from_segment_seq    int
to_segment_seq_excl int
booking_session_id  uuid
held_by_user_id     uuid nullable
expires_at          timestamptz
status              enum ACTIVE | CONVERTED | EXPIRED
created_at          timestamptz
```

Active hold harus diperiksa di transaction yang sama dengan inventory conflict check.

## 20.17 `bookings`

```text
id                  uuid PK
company_id          uuid FK companies
trip_id             uuid FK trips
booker_user_id      uuid FK users nullable
booking_code        text unique
status              enum PENDING_PAYMENT | CONFIRMED | EXPIRED | PAYMENT_CONFLICT | CANCELLED | REFUNDED | RESCHEDULED | MISSED_TRIP
contact_name        text
contact_email       text nullable
contact_phone       text nullable
subtotal_amount     bigint
reschedule_fee      bigint default 0
total_amount        bigint
created_at          timestamptz
confirmed_at        timestamptz nullable
```

## 20.18 `booking_passengers`

```text
id                  uuid PK
booking_id          uuid FK bookings
account_id          uuid FK users nullable
name                text
email               text nullable
phone               text nullable
from_stop_id        uuid FK stops
to_stop_id          uuid FK stops
status              enum ACTIVE | CANCELLED | MISSED_TRIP | NEEDS_RESEAT
claim_status        enum UNCLAIMED | CLAIMED
claimed_at          timestamptz nullable
```

## 20.19 `seat_assignments`

```text
id                  uuid PK
booking_passenger_id uuid FK booking_passengers
trip_id             uuid FK trips
trip_seat_id        uuid FK trip_seats
from_segment_seq    int
to_segment_seq_excl int
status              enum ACTIVE | REPLACED | CANCELLED
assigned_at         timestamptz
assigned_by         uuid nullable
replacement_reason  text nullable
```

Historical record dipertahankan ketika reseat; jangan overwrite tanpa audit.

## 20.20 `payments`

```text
id                  uuid PK
booking_id          uuid FK bookings
provider            enum MIDTRANS | CASH | MOCK
provider_order_id   text nullable unique
method              text nullable
amount              bigint
status              enum PENDING | PAID | FAILED | EXPIRED | REFUNDED | CONFLICT
paid_at             timestamptz nullable
created_at          timestamptz
```

## 20.21 `payment_events`

```text
id                  uuid PK
payment_id          uuid FK payments
provider_event_key  text unique
payload_json        jsonb
received_at         timestamptz
processed_at        timestamptz nullable
processing_status   enum RECEIVED | PROCESSED | IGNORED | FAILED
```

Ini menjadi dasar webhook idempotency dan debugging.

## 20.22 `refunds`

```text
id                  uuid PK
booking_id          uuid FK bookings
payment_id          uuid FK payments nullable
amount              bigint
reason              text
method              enum PROVIDER | CASH_MANUAL | MOCK
status              enum REQUESTED | APPROVED | COMPLETED | REJECTED
requested_by        uuid nullable
processed_by        uuid nullable
created_at          timestamptz
completed_at        timestamptz nullable
```

## 20.23 `tickets`

```text
id                  uuid PK
booking_passenger_id uuid FK booking_passengers
trip_id             uuid FK trips
public_token_hash   text unique
status              enum VALID | CANCELLED | REFUNDED
issued_at           timestamptz
```

Token asli tidak wajib disimpan plaintext jika server cukup menyimpan hash.

## 20.24 `boarding_events`

Untuk MVP dapat cukup satu `boarded_at` pada passenger trip state, tetapi event table lebih audit-friendly.

```text
id                  uuid PK
ticket_id           uuid FK tickets
trip_id             uuid FK trips
scanned_by          uuid FK users
scanned_at          timestamptz
source              enum QR | MANUAL
```

Constraint opsional:

```text
UNIQUE(ticket_id, trip_id)
```

untuk satu boarding sukses per trip.

## 20.25 `snack_claims`

```text
id                  uuid PK
ticket_id           uuid FK tickets
trip_id             uuid FK trips
claimed_by          uuid FK users
claimed_at          timestamptz
```

Constraint:

```text
UNIQUE(ticket_id, trip_id)
```

mencegah double claim.

## 20.26 `reschedule_requests`

```text
id                  uuid PK
booking_id          uuid FK bookings
requested_trip_id   uuid FK trips
status              enum REQUESTED | APPROVED | REJECTED | CANCELLED_BY_PASSENGER
fare_difference     bigint
fee_amount          bigint
reason              text nullable
requested_at        timestamptz
reviewed_by         uuid nullable
reviewed_at         timestamptz nullable
```

## 20.27 `audit_logs`

Minimal audit untuk mutation penting:

```text
id                  uuid PK
company_id          uuid nullable
actor_user_id       uuid nullable
actor_role          text
action              text
entity_type         text
entity_id           uuid nullable
before_json         jsonb nullable
after_json          jsonb nullable
metadata_json       jsonb nullable
created_at          timestamptz
```

Target event:

- trip cancelled,
- reseat,
- refund,
- reschedule approval,
- manual booking,
- company suspension.

---


# 21. Indexing Strategy

Index yang layak disiapkan sejak awal:

```text
trips(company_id, scheduled_departure)
trips(route_id, scheduled_departure)
route_stops(route_id, sequence)
trip_segments(trip_id, sequence)
trip_seats(trip_id, seat_code)
bookings(trip_id, status)
bookings(company_id, created_at)
booking_passengers(booking_id)
seat_assignments(trip_id, trip_seat_id, status)
seat_holds(trip_id, trip_seat_id, status, expires_at)
payments(provider_order_id)
tickets(public_token_hash)
boarding_events(trip_id, scanned_at)
```

Jangan membuat puluhan index tanpa query nyata. Index final harus diverifikasi dengan query plan ketika fitur sudah berjalan.

---

## Adopted route template slice — 7 October 2026

The user approved the route/pricing design and implementation plan. Five template tables (stops, routes, route_stops, service_classes, segment_fares), exact IDR bigint adjacent fares, 2–50 unique ordered stops, soft status, tenant composite FKs and revision conflict checks are implemented. Reorder/add/remove requires clearing all route fares first. Preview creates no inventory or trip. See ../superpowers/specs/2026-10-07-route-pricing-design.md and ../setup/ROUTE_PRICING_SETUP.md for contracts and verification limits.

## Implemented Trip Engine schema — 7 October 2026

Migration [0003_trip_engine.sql](../../drizzle/0003_trip_engine.sql) adds `trips`, `trip_stops`, `trip_segments`, `trip_seats`, `trip_seat_inventory`, `trip_crew_assignments`, and `trip_audit_events`. Trips retain source references for drafts and independent JSON identity/full-grid snapshots after publication. Stops, segments, seats and anchors carry same-company/same-trip composite constraints. Crew assignments reference the same-company CREW membership and record active/revoked transitions. Every new table enables RLS and revokes browser-role grants; access is through guarded server services. Completeness and atomic publication are domain invariants, supported by database state/uniqueness/foreign-key checks.

## Adopted availability and hold slice — 7 October 2026

The approved availability/hold design and plan implement public snapshot search/quote, half-open interval availability, owner-only single-seat ten-minute holds, idempotent request keys, release and logical expiry with bounded cleanup. Company/trip guards and ordered seat×segment locks precede DB-time eligibility and occupancy checks. Snapshot inventory is now used for active holds; confirmed bookings and payment conversion remain unimplemented. RLS/browser revokes protect hold tables. See [availability design](../superpowers/specs/2026-10-07-availability-hold-design.md) and [setup evidence](../setup/AVAILABILITY_HOLD_SETUP.md).

## Adopted snack claim slice — 9 October 2026

Migration 0009_snack_claims adds DB-clock snack_claims with UNIQUE(ticket_id,trip_id), composite ticket and boarding-event foreign keys, actor users FK, RLS and revoked browser grants. Boarding events receive UNIQUE(ticket_id,trip_id,company_id). The audit record is immutable through the domain service; no update/reversal endpoint exists. See ../setup/SNACK_CLAIM_SETUP.md for verification and manual acceptance limits.

## Company status implementation overlay — 9 October 2026

Migration0010 adds companies.status_revision integer >=0 and company_status_events with RESTRICT company/actor references, differing enum statuses, positive revision, unique(company_id,status_revision), database changed_at, RLS and revoked anon/authenticated grants. Status UPDATE and audit INSERT commit together; matching no-op creates no event. See ../setup/SUPER_ADMIN_COMPANY_SETUP.md.


## Regional references — delivered 20 October 2026

Shared `region_import_runs`, `region_provinces` and `region_regencies` use provider/code identity, stable UUIDs, parent/run FKs, RLS and revoked browser grants. `stops.region_regency_id` is nullable and indexed with delete restriction. Complete validated imports promote atomically under a provider advisory lock; retired references remain stored but unavailable for new selection. Existing city text and published snapshots are retained. See [schema/import evidence](../setup/REGION_REFERENCE_SETUP.md).
