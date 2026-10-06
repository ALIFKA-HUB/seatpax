# Seatpax — Decision Ledger & Historical Direction


> Modular documentation extracted from the Seatpax master specification.


# 45. Decision Ledger — Final MVP

| Decision | Final Choice |
|---|---|
| Product | Multi-PO Seatpax platform |
| Main differentiator | Seat inventory per segment + passenger operations |
| Route model | Multi-stop penuh |
| Route vs Trip | Dipisah |
| Stops | `Stop` + `RouteStop.sequence` |
| Segment | Derived from route structure, snapshot on Trip |
| Pricing | Per segment + service class |
| Normal passenger seat | Satu seat dari origin ke destination |
| Reseat | Admin PO + Crew |
| Missed bus | Tidak otomatis pindah trip |
| Reschedule | Passenger request, Admin approve |
| Reschedule charge | Fare difference + configurable fee |
| PO/system fault | No passenger fee; downgrade refunds difference |
| PO trip cancellation | Reschedule or full refund |
| Seat hold | 10 menit |
| Payment grace | +1 menit if payment initiated |
| Late payment | `PAYMENT_CONFLICT` manual review |
| QR | 1 QR per passenger |
| QR use | Boarding + snack/entitlements |
| Manifest | Per Trip |
| Passenger scan target | Passenger Trip Profile |
| Boarding scanner | Crew / gate represented by CREW role |
| Roles | PASSENGER, ADMIN_PO, CREW, SUPER_ADMIN |
| RBAC | Static RBAC |
| Tenant isolation | Yes |
| Passenger login | Google OAuth + Email OTP |
| Guest booking | Yes |
| Cross-device | Verified account/claim required |
| Cash booking | Crew, online only |
| Offline cash | Deferred |
| Bluetooth printer | Deferred |
| Crew client | PWA |
| Database | PostgreSQL / Supabase |
| Realtime | Supabase Realtime |
| Payment | Midtrans Sandbox |
| Notification | Mock provider for demo |
| Architecture | Next.js modular monolith |
| Redis | Not required MVP |
| Microservices | Not MVP |

---


# 46. Historical Ideas vs Current Direction

Bagian ini menjaga konteks brainstorming agar ide lama tidak hilang.

## Pernah dibahas dan masih memengaruhi desain

- Visual Seat Builder.
- Seat template berbasis grid.
- Karoseri modifikasi.
- On-board cash sale.
- QR sebagai boarding + facility claim.
- Passenger manifest.
- Multi-tenant PO.
- RBAC.
- Offline reliability.
- Thermal printer.
- marketplace rating.
- payout/ledger.

## Yang tetap masuk MVP setelah pemangkasan

- visual seat builder,
- dynamic seat template,
- online cash sale,
- QR boarding/facility claim,
- manifest,
- multi-tenant,
- RBAC,
- segment seat inventory.

## Yang dipindah ke future

- printer,
- offline cash,
- deep offline sync,
- marketplace financial layer,
- rating algorithm,
- GPS tracking,
- microservices.

---
