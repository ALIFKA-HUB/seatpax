# Seatpax — Booking, Payment, Refund & Transaction Rules

> **Implementation update — 8 October 2026:** Current checkout implementation uses one immutable persisted payment order, creation/event leases, authenticated GET status, one-time 60-second grace, late PAID conflicts, and exact-price MOCK_REFUND recording. OTHER has no account association; booker owns ticket access. Zero-total intervals reject payment initiation pending a free-ticket policy. Setup/evidence: `../setup/CHECKOUT_PAYMENT_SETUP.md`.

> **Product change — D2026-10-08-01:** Logged-in booker may purchase SELF or OTHER, still one passenger/seat per booking. OTHER stores actual passenger name/phone without an account association; the booker retains My Tickets access. This supersedes passenger/account equality in the older foundation overlay below. Written design and plan are approved; implementation evidence and remaining manual acceptance are documented in the setup guide.

> **Fondasi diadopsi — D2026-10-06-02:** Hold login-only; satu booking terkait satu hold unik dan satu passenger akun checkout. Intent/order server yang tersimpan sebelum base deadline/cutoff memberi grace sekali +60 detik; provider call setelah commit. Auto-confirm memakai waktu processing sesudah lock, bukan receipt/provider timestamp. Late success mencatat PAID + PAYMENT_CONFLICT tanpa ticket. Admin recheck atau MOCK refund; aturan lengkap bagian 4–5 fondasi. Acuan: [rancangan fondasi](../superpowers/specs/2026-10-06-foundation-design.md) dan [ledger](19_DECISION_LEDGER.md). Kontrak ini mendahului uraian lama yang berbeda; implementasi belum dibuat.

> **Active release — 6 Oktober 2026:** Checkout aktif membutuhkan login dan menerima satu passenger/seat per booking. Contoh booking grup dan state reschedule di bawah adalah referensi perluasan; Sandbox payment, verified/idempotent webhook, late conflict dan ticket issuance tetap dikerjakan. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


# 13. Booking Model

## 13.1 Booking versus passenger

Satu booking dapat mempunyai beberapa passenger.

```text
Booking #BKG-001
├── Budi  → Seat 01 → QR-A
├── Siti  → Seat 02 → QR-B
└── Andi  → Seat 03 → QR-C
```

Setiap `BookingPassenger` memiliki ticket sendiri.

## 13.2 Booking lifecycle

Konseptual:

```text
DRAFT / CREATED
      ↓
PENDING_PAYMENT
      ↓
CONFIRMED
```

Cabang:

```text
PENDING_PAYMENT → EXPIRED
CONFIRMED       → CANCELLED
CONFIRMED       → RESCHEDULED
CONFIRMED       → REFUNDED
CONFIRMED       → MISSED_TRIP
```

## 13.3 Payment tidak boleh dianggap sukses dari frontend

Frontend success callback hanya UX.

Source of truth:

```text
Midtrans Webhook
      ↓
verify
      ↓
payment = PAID
      ↓
booking = CONFIRMED
```

---


# 14. Payment Architecture

## 14.1 Provider

**FINAL:** Midtrans Sandbox untuk demo.

## 14.2 Flow

```text
Seat Hold
   ↓
Create Booking
   ↓
Create Midtrans transaction
   ↓
Receive Snap token
   ↓
Passenger pays in Sandbox
   ↓
Webhook
   ↓
Verify status/signature
   ↓
Idempotency check
   ↓
Payment PAID
   ↓
Booking CONFIRMED
   ↓
Finalize seat inventory
   ↓
Issue tickets
```

## 14.3 Idempotency

Webhook yang sama dapat datang lebih dari sekali.

Sistem harus menyimpan provider event/order identity dengan unique constraint.

```text
Webhook X
Webhook X
Webhook X
```

harus menghasilkan:

```text
1 payment transition
1 booking confirmation
1 set of tickets
```

## 14.4 Payment statuses

Minimal:

```text
PENDING
PAID
FAILED
EXPIRED
REFUNDED
CONFLICT
```

## 14.5 Payment adapter

Business domain tidak boleh bergantung langsung ke Midtrans-specific code.

```text
PaymentProvider
├── createTransaction()
├── verifyWebhook()
├── getStatus()
└── refund()
```

Implementasi MVP:

```text
MidtransPaymentProvider
```

---

## SaaS payment ownership — adopted direction, 20 October 2026

Ticket payments are intended to go directly to the respective PO's payment account; Seatpax collects SaaS subscription fees separately. Platform collection followed by PO payouts is not the adopted approach. Current Sandbox ticket implementation uses one environment-level merchant, so per-tenant merchant resolution/verification and independent SaaS billing require a reviewed design/plan before implementation. Provider connection/activation, renewal mode, trial, package rules and expiry entitlements are still unresolved. See D2026-10-20-03.

Free plan clarification — 20 October 2026: the adopted Free experience is permanent and simulation-only, with setup/usage quotas yet to be decided. Free simulation must not initiate real ticket charges or enter live public inventory. The earlier 14-day trial duration is superseded; simulation storage/reset policy and paid billing behavior await design review.

Subscription renewal refinement — 20 October 2026: the adopted initial paid package is Pro, billed monthly with the PO initiating each payment. Invoice/reminder handling is intended to be automated; autodebit is deferred. This subscription flow remains separate from passenger ticket payments into the respective PO account. Price, invoice/period calculation, grace and recovery policies remain under design, with no billing implementation delivered yet.

Adopted grace policy — 20 October 2026: Pro has seven days of grace after expiry, with service and reminders continuing. Thereafter new ticket sales stop, but data, paid tickets and associated passenger operations remain available. Expired Pro data is not automatically reduced to Free quotas. Verified renewal restores otherwise eligible access. This is pending SaaS implementation; exact invoice/period/payment-cutover semantics remain part of written-design work.

Pro pricing direction — 20 October 2026: the user approved Rp299,000 per PO workspace per month and requested increased vehicle capacity beyond the earlier 1–5-vehicle assumption. Exact Pro vehicle/other quotas and tax/period/price-change policies remain under design. No deployed billing price or payment transaction was changed by this decision.

Plan policy-change discussion — 20 October 2026: benefit/quantity settings should be managed by platform Admin with delayed billing-period application. User highlighted quota reductions affecting existing usage. Published plan versioning, notice/renewal cutoffs and grandfather/over-quota migration rules remain under design; do not mutate existing paid-period entitlements or remove operational history through a plan edit.

Mandatory benefit-version adoption — 20 October 2026: all Pro subscribers, including existing customers, must follow Admin-published reduced benefits after the planned delayed application. The prior grandfathering recommendation was rejected. A 30-to-20-vehicle reduction must define how existing over-quota data is handled without silently deleting histories or cancelling paid tickets. Concrete quota-adjustment behavior remains under design.
## Adopted subscription month calculation — 20 October 2026

The original calendar-month choice was superseded after clarification: Pro now uses exactly **30 days (720 hours)** per period, regardless of calendar-month length. Renewal paid within seven-day subscription grace extends from the previous period end by 30 days; already-used grace time is part of that extension. Early renewal, reactivation after grace and invoice timing remain pending in the [SaaS design](../superpowers/specs/2026-10-20-shuttle-saas-design.md). This concerns PO subscription billing, not passenger hold/payment deadlines.
Post-grace billing refinement: payment verified after subscription grace ends starts a fresh 30-day period at verified payment time; no arrears are charged for an interval when new sales were disabled. This differs from payment within grace, which extends from the old expiry. Invoice cutover and in-flight payment handling still require the billing technical specification. No actual subscription payment or invoice implementation is delivered by this product decision.
Renewal invoicing refinement: issue the renewal invoice automatically seven days before subscription expiry. Early renewal adds 30 days after the current period end. Dashboard/email reminders occur at H-7, H-3, H-1, expiry, grace day 3 and grace day 6, stopping for settled obligations. Delivery/retry and billing implementation are pending the reviewed technical specification and plan.
