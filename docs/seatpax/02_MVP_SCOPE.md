# Seatpax — MVP Scope & Product Boundary

> **Arah proyek terbaru — 21 Oktober 2026:** Seatpax digunakan hanya untuk satu perusahaan shuttle. Keputusan D2026-10-21-01 menggantikan arah SaaS untuk lingkup proyek saat ini. Pendaftaran PO mandiri, paket Free/Pro, kuota dan billing langganan serta pengelolaan banyak perusahaan ditunda. Pembayaran tiket dan operasional perusahaan tetap menjadi fokus. Fondasi company/access dan kode cabang SaaS disimpan; tidak ada penghapusan database atau perubahan akses otomatis melalui keputusan dokumentasi ini.

> **Implementation update — 8 October 2026:** Checkout/payment slice now implements SELF/OTHER (one passenger/seat), Sandbox Snap, durable verified events, segment occupancy, encrypted QR/My Tickets and tenant conflict administration. Real refunds, guest/group claims and boarding/snack UI remain deferred. See `../setup/CHECKOUT_PAYMENT_SETUP.md` for evidence and pending manual acceptance.

## Active release — 30-day demo, adopted 6 October 2026

The user approved the reduced release package on 6 October 2026. This section is the active delivery scope for 6 October–4 November at 2–3 hours/day. The original MVP sections below remain historical/reference scope where they differ from this release. Retained domain rules still apply.

| Area | Active release decision |
| --- | --- |
| Platform | Four roles, static RBAC, two demo PO contexts, server authorization and tenant isolation |
| Passenger auth | Email OTP; login before checkout; My Tickets; Google OAuth deferred |
| Booking | Logged-in booker purchases one passenger/seat for SELF or OTHER; booker owns My Tickets access; guest checkout/claim and multi-passenger checkout deferred |
| Routes/pricing | Multi-stop route, ordered stops, adjacent-segment fare per service class; minimal admin setup forms |
| Fleet | Click-cell seat template, vehicle association, trip/layout snapshot; drag-and-drop and duplication polish deferred |
| Trips | Minimal scheduling/open-for-sale, assigned crew, segment/seat inventory snapshots |
| Inventory | Segment-aware availability, 10-minute hold, conditional +1-minute grace, expiry/release, concurrency correctness |
| Payment | Midtrans Sandbox, verified/idempotent webhook, late PAYMENT_CONFLICT, minimal admin confirmation after inventory recheck or recorded mock/manual refund resolution |
| Ticket/operations | One QR per passenger, trip manifest, scanner/manual search, passenger trip profile, separate boarding/snack actions |
| Crew client | Dedicated Flutter Android/iPhone client adopted 15 October 2026; existing Crew web retained during transition; online operations, no offline sync. Mobile written spec awaits review; implementation is not yet delivered. |
| Super Admin | Company list, activate/suspend; seeded demo companies/internal accounts; onboarding and invitations UI deferred |
| Availability UX | Refresh/polling first; live subscriptions deferred if schedule demands |
| Deferred operational features | Cash sale, general reschedule/reseat, trip cancellation/refund workflows and vehicle replacement on sold trips |
| Delivery | Hosted demo, deterministic seed/reset, critical verification evidence, README/runbook; presentation preparation after implementation month |

This is a demo release subset, not completion of every original MVP acceptance criterion. Company creation UI, guest claim, and deferred operational flows are not promised by this release. Mock refund recording is not evidence of a real provider refund.

### Release acceptance checklist

- [ ] Four roles work with two PO contexts; known IDs do not allow foreign-tenant or unassigned-trip access.
- [ ] Admin can configure ordered route stops, fare, click-cell layout/vehicle and a sale-ready trip through minimal forms.
- [ ] Trip snapshots remain stable when source templates/routes are edited.
- [ ] Adjacent intervals reuse a seat; overlapping assignments/active holds cannot double-book, including 50 concurrent attempts.
- [ ] Hold expiry and conditional payment grace preserve inventory consistently.
- [ ] A logged-in passenger completes Sandbox payment and can reopen their QR ticket via My Tickets.
- [ ] Verified webhook retries do not create duplicate tickets; late payment enters an admin-resolvable conflict.
- [ ] Confirmed passenger appears in manifest; QR/manual search opens the same profile; boarding/snack are independently idempotent.
- [ ] Super Admin can activate/suspend demo companies under an explicitly agreed policy.
- [ ] Hosted phone/desktop flows, seed/reset, demo runbook and critical verification results are reproducible.

### Foundation status

Technical foundation F01–F11 was separately adopted as D2026-10-06-02: [foundation design](../superpowers/specs/2026-10-06-foundation-design.md). It governs retained-flow authorization, snapshots, locking, hold/payment deadlines, QR lifecycle and suspension. Design adoption does not imply implemented behavior.

### Trip preparation implementation status — 7 October 2026

The approved Trip Engine preparation slice is implemented locally: Admin PO draft creation/edit, atomic publication of independent schedule/fare/full-layout snapshots and seat×segment inventory anchors, plus crew assignment and assigned published-trip read access. This does not implement passenger availability/search, holds, booking or sale processing; those remain the next inventory slice. See [Trip Engine setup evidence](../setup/TRIP_ENGINE_SETUP.md).


> Modular documentation extracted from the Seatpax master specification.


# 4. Original MVP v1 — reference scope before the 30-day release decision

## 4.1 Fitur yang masuk MVP

| Domain | MVP v1 |
|---|---|
| Multi-tenant PO | Ya |
| 4 role utama | Ya |
| Static RBAC | Ya |
| Tenant isolation | Ya |
| Google OAuth Passenger | Ya |
| Email OTP Passenger | Ya |
| Guest booking | Ya |
| Ticket claim ke account | Ya |
| Multi-stop route | Ya |
| Harga per segment | Ya |
| Service class pricing | Ya |
| Dynamic seat template | Ya |
| Vehicle assignment | Ya |
| Trip scheduling | Ya |
| Seat inventory per segment | Ya |
| Seat hold 10 menit | Ya |
| Payment grace +1 menit | Ya |
| Midtrans Sandbox | Ya |
| Late payment conflict | Ya, manual admin resolution |
| QR per passenger | Ya |
| Manifest per trip | Ya |
| Boarding scan | Ya |
| Snack claim | Ya |
| Cash booking oleh crew | Ya, **online only** |
| Basic reschedule | Ya |
| Basic refund | Ya |
| Basic reseat | Ya |
| Crew PWA | Ya |
| Realtime seat update | Ya |
| Basic Super Admin | Ya |
| Concurrency testing | Ya |

## 4.2 Fitur yang dipangkas dari MVP

**DEFERRED:**

- Bluetooth thermal printer.
- Offline cash sale dengan outbox sync.
- Offline seat quota.
- Complex conflict reconciliation.
- React Native crew app.
- Live GPS bus.
- Google Maps route calculation.
- Seatpax wallet / credits.
- Promo / voucher / surge pricing engine.
- Dynamic custom role builder.
- Escrow & payout ke PO.
- Withdrawal workflow.
- Advanced rating and review ranking.
- Multiple financial approval levels.
- Automated emergency seat swap solver.
- Complex compensation ledger.
- Kafka / microservices / Kubernetes.

## 4.3 Future scope

**FUTURE:**

- Full offline-first crew app.
- Bluetooth ESC/POS printing.
- Signed offline ticket generation by trusted device.
- Offline manifest snapshot.
- Offline boarding sync.
- PO rating / verified reviews.
- Escrow, commissions, payout, withdrawal.
- Maps and live bus location.
- Notification production providers.
- Custom permissions / role management.
- Read replicas, Redis, queue worker, dedicated API service.

---


# 41. Cut Line jika Waktu Habis

Urutan fitur yang boleh dipotong jika deadline mendekat:

1. Sentry.
2. Dashboard analytics tambahan.
3. Refund provider real; gunakan mock/manual state.
4. Reschedule UI kompleks; pertahankan basic admin flow.
5. Duplicate seat template polish.
6. Realtime fancy animation; fallback refresh masih boleh.
7. Super Admin overview analytics; pertahankan company management saja.

Yang **jangan dipotong**:

1. Multi-stop route.
2. Seat per segment.
3. Concurrency correctness.
4. Payment webhook idempotency.
5. QR → passenger trip profile.
6. Manifest.
7. Boarding + snack claim.
8. Tenant isolation.

---


# 42. Original MVP Acceptance Criteria — broader than the active demo release

Seatpax MVP dianggap selesai jika skenario berikut dapat didemokan tanpa edit database manual.

## 42.1 Tenant

- [ ] Super Admin dapat membuat/mengaktifkan PO.
- [ ] Admin PO A tidak dapat melihat data PO B.
- [ ] Crew PO A tidak dapat mutate trip PO B.

## 42.2 Route

- [ ] Admin dapat membuat route dengan ≥4 stop.
- [ ] Urutan stop tersimpan benar.
- [ ] Fare multi-segment dihitung dari segment fare.

## 42.3 Fleet

- [ ] Admin dapat membuat seat template grid.
- [ ] Vehicle memakai template.
- [ ] Trip menghasilkan snapshot seat.

## 42.4 Seat inventory

- [ ] Seat yang booked Bandung→Cianjur dapat dijual Cianjur→Bogor.
- [ ] Seat yang booked Bandung→Sukabumi tidak dapat dijual Cianjur→Bogor.
- [ ] Active hold memblokir overlapping purchase.
- [ ] Expired hold melepaskan inventory.

## 42.5 Concurrency

- [ ] 50 request pada seat/segment yang sama tidak menghasilkan double booking.
- [ ] Database tetap konsisten setelah test.

## 42.6 Payment

- [ ] Midtrans Sandbox transaction dapat dibuat.
- [ ] Webhook sukses meng-confirm booking.
- [ ] Duplicate webhook tidak duplicate ticket.
- [ ] Late success dapat masuk `PAYMENT_CONFLICT`.

## 42.7 Ticket

- [ ] Setiap booking passenger mempunyai QR sendiri.
- [ ] Guest dapat melihat ticket setelah booking.
- [ ] Ticket dapat di-claim via authenticated account.

## 42.8 Manifest

- [ ] Confirmed passenger muncul pada manifest trip.
- [ ] Crew dapat search passenger.
- [ ] Scan QR membuka passenger trip profile.

## 42.9 Operations

- [ ] Crew dapat mark boarded.
- [ ] Boarding tidak duplicate.
- [ ] Crew dapat claim snack.
- [ ] Snack claim tidak duplicate.

---


# 50. Final Product Boundary

Jika sebuah ide baru muncul, tanyakan empat hal:

1. Apakah memperkuat **segment seat inventory**?
2. Apakah memperkuat **booking correctness**?
3. Apakah memperkuat **passenger operations / manifest**?
4. Apakah wajib agar demo end-to-end bekerja?

Jika semua jawabannya "tidak", fitur tersebut masuk backlog terlebih dahulu.

Core Seatpax tetap:

```text
MULTI-STOP ROUTE
      +
SEGMENT SEAT INVENTORY
      +
CONCURRENCY-SAFE BOOKING
      +
PAYMENT
      +
QR TICKET
      +
TRIP MANIFEST
      +
BOARDING / FACILITY CLAIM
      +
MULTI-TENANT OPERATOR MANAGEMENT
```

---


# 51. Master Source-of-Truth Rule

Mulai setelah dokumen ini dibuat:

- Ide baru tidak otomatis mengubah MVP.
- Perubahan MVP harus memperbarui **Decision Ledger**.
- Schema berubah hanya jika business rule berubah atau implementasi membuktikan model tidak cukup.
- Future feature tidak boleh diam-diam masuk sprint MVP.
- Dokumen ini harus diperbarui bersama migration/API contract ketika keputusan teknis besar berubah.

Dengan aturan ini, Seatpax tidak lagi menjadi kumpulan brainstorming lepas, tetapi menjadi spesifikasi produk dan engineering yang bisa dipakai sebagai dasar desain Figma, implementasi, testing, README, dan presentasi.

## Adopted availability and hold slice — 7 October 2026

The approved availability/hold design and plan implement public snapshot search/quote, half-open interval availability, owner-only single-seat ten-minute holds, idempotent request keys, release and logical expiry with bounded cleanup. Company/trip guards and ordered seat×segment locks precede DB-time eligibility and occupancy checks. Snapshot inventory is now used for active holds; confirmed bookings and payment conversion remain unimplemented. RLS/browser revokes protect hold tables. See [availability design](../superpowers/specs/2026-10-07-availability-hold-design.md) and [setup evidence](../setup/AVAILABILITY_HOLD_SETUP.md).

## SaaS direction update — 20 October 2026

D2026-10-20-03 adopts PO self-service registration/subscription payment and ticket proceeds going directly to each PO's payment account. Seatpax subscription fees are a separate payment flow. These subsystems are pending architectural design and implementation planning; the retained 30-day demo implementation above does not provide them yet. Renewal mode, trial/activation and expiry policies remain unresolved. Existing tenant isolation, transactional ticketing and protected historical data remain the foundation.

Permanent Free clarification — 20 October 2026: PO onboarding should offer a permanent simulation-only Free plan with bounded setup data/usage, replacing the 14-day trial proposal. Exact quotas and simulation retention/reset policies are unresolved. This is product direction only; live ticket sales require the paid path and ready per-PO payment configuration in the future design.

Approved Free stored-data quotas — 20 October 2026: per PO workspace, maximum 2 routes, 2 vehicles, 2 seat templates, 2 Crew accounts, 3 simulation departures and 30 simulation bookings. Archives count. Simulation reset requires explicit user request/confirmation; upgrade is the other quota-exhaustion path. Secondary stop/seat/upload/rate limits require concrete design values. These adopted quotas are pending implementation.

Target customer refinement — 20 October 2026: focus the self-service SaaS on intercity shuttle companies whose bookings are managed exclusively within Seatpax. Each company retains its own workspace/inventory; external OTA/channel synchronization remains out of scope. The user rejected the proposed 10-vehicle Pro limit as too small; a larger cap and its operational/cost assumptions need review. Existing bus-compatible implementation is retained until a reviewed change plan exists.

Approved Pro vehicle quota-reduction behavior — 20 October 2026: Pro allowance limits vehicles eligible for new sales/operations, while historical records remain stored. PO Admin selects vehicles before a mandatory benefit reduction takes effect; excess vehicles become ineligible for new sales/new departure assignments. Without a valid selection, new sales are restricted until adjustment. Existing paid travel/Crew operations and valid initiated payment fulfillment remain protected. Free stored-data quotas still count archives. Implementation, concurrency/cutover details and separate storage controls remain pending written design/plan.

## Requested customer complaint flow — 20 October 2026

The SaaS restructuring must design customer complaints/help, including debit-success versus booking-failure/no-ticket payment discrepancies near expiry. The flow should attach to an owned booking and interact with existing provider reconciliation/late-conflict controls. This is newly requested scope pending written design/plan; no support-case subsystem or real refund integration is delivered by the current Sandbox implementation. Routing, evidence authorization, lifecycle and resolution policies remain under review.
<!-- Current SaaS commercial summary; detailed status is in the linked draft. -->

## SaaS initial Pro fleet allowance — 20 October 2026

The user approved an initial Pro allowance of **30 vehicles eligible for new operations/sales per workspace**, priced at **Rp299,000/month**. This is distinct from Free's stored-data limits; retained historical Pro vehicles do not become newly eligible automatically. Other Pro quotas remain undecided. Read the [SaaS draft awaiting review](../superpowers/specs/2026-10-20-shuttle-saas-design.md) and D2026-10-20-03; no billing/entitlement implementation is delivered by this decision.

## Public browsing and booking entry — 22 October 2026

D2026-10-22-01 keeps public journey search/detail/seat browsing and requires verified identity when continuing booking/creating an owned hold. Separate marketing `/` from the booking workspace `/trips`; preserve valid journey/seat intent through login without promising availability or creating a hold automatically. Existing single-seat inventory/payment/authorization rules remain unchanged. A unified Email OTP entry serves new and existing passengers. This does not add guest checkout, group booking or a separate registration subsystem.


## Adopted simple complaint module - 25 October 2026

The user approved the simple Helpdesk design and plan for ujikom, inside Seatpax rather than a separate application. Guest reporters submit and track by opaque complaint code without login/OTP. One new HELPDESK role handles completeness, staff-only LOW/MEDIUM/HIGH priorities and completion. Browser-local history, separate email supplementation capability and receipt/request/completion notification jobs are included. No live chat, assignments, escalation or automated financial resolution. This supersedes the earlier pending SaaS-oriented complaint sketch for this bounded module. Real mail/storage acceptance awaits credentials; see HELPDESK_SETUP.md.
