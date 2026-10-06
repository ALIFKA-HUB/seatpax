# Seatpax — Booking, Payment, Refund & Transaction Rules

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
