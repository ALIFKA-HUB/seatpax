# Seatpax — End-to-End Product Flows

> **Active release — 6 Oktober 2026:** Flow aktif: login Email OTP → search → seat hold → one-passenger checkout → Sandbox payment → ticket → manifest → boarding/snack. Flow guest claim, crew cash sale, reschedule dan trip cancellation di bawah ditunda. Acuan: [scope aktif](02_MVP_SCOPE.md) dan [D2026-10-06-01](19_DECISION_LEDGER.md).


> Modular documentation extracted from the Seatpax master specification.


# 17. End-to-End User Flows

## 17.1 Admin PO — setup sampai trip open

```text
Login
  ↓
Create / select Route
  ↓
Configure RouteStops
  ↓
Set Segment Fare per Service Class
  ↓
Create Seat Template
  ↓
Register Vehicle
  ↓
Assign Seat Template
  ↓
Create Trip
  ↓
Assign Vehicle + Service Class
  ↓
Generate Trip Segments + Seat Inventory
  ↓
OPEN FOR SALE
```

## 17.2 Passenger — online booking

```text
Open Seatpax
  ↓
Select From / To / Date
  ↓
Search Trip
  ↓
Select Trip
  ↓
Load seat availability for selected segments
  ↓
Select Seat
  ↓
Create 10-minute hold
  ↓
Input passenger data
  ↓
Checkout
  ↓
Midtrans Sandbox
  ↓
Webhook PAID
  ↓
Booking CONFIRMED
  ↓
Ticket QR issued
  ↓
Passenger appears in trip manifest
```

## 17.3 Guest ticket claim

```text
Guest booking confirmed
      ↓
Ticket page
      ↓
[ Simpan tiket ke akun ]
      ↓
Google OAuth OR Email OTP
      ↓
Verify
      ↓
Link ticket to account
```

## 17.4 Crew boarding

```text
Crew login
   ↓
Open Active Trip
   ↓
Manifest
   ↓
Scan QR
   ↓
Passenger Trip Profile
   ↓
Mark Boarded
   ↓
Claim Snack if delivered
```

## 17.5 Crew cash booking

```text
Open Active Trip
   ↓
New Cash Sale
   ↓
Select boarding stop
   ↓
Select destination
   ↓
Calculate fare
   ↓
Select available seat
   ↓
Input guest passenger
   ↓
Receive cash
   ↓
Confirm
   ↓
Booking CONFIRMED immediately
   ↓
Ticket QR created
   ↓
Passenger appears in manifest
```

## 17.6 Reschedule

```text
Passenger opens ticket
    ↓
Request Reschedule
    ↓
Select requested new trip
    ↓
REQUESTED
    ↓
Admin review availability + policy
    ↓
Calculate fare difference + fee
    ↓
APPROVED / REJECTED
```

## 17.7 Trip cancellation

```text
Admin cancels Trip
      ↓
Affected bookings
      ↓
Passenger option
  ┌───────────────┐
  │               │
Reschedule    Full Refund
```

---
