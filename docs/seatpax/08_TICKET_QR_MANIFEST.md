# Seatpax — Ticket, QR, Entitlements & Passenger Manifest


> Modular documentation extracted from the Seatpax master specification.


# 15. Ticket, QR & Entitlement

## 15.1 Satu QR per passenger

**FINAL:** QR dimiliki `Ticket`, bukan seluruh booking.

## 15.2 QR bukan "sekali scan lalu mati"

QR berfungsi sebagai identifier/access token ke passenger trip profile.

State terpisah:

```text
Ticket QR
├── Boarding       ✅ / ❌
├── Snack Claim    ✅ / ❌
└── Future Entitlement ...
```

## 15.3 Scan behavior

```text
Scan QR
   ↓
Resolve ticket
   ↓
Verify ticket belongs to trip/context
   ↓
Load passenger trip profile
```

Tampilan:

```text
BUDI SANTOSO
Seat 07
Bandung → Bogor
Trip 08:00
Bus D 1234 ABC

Boarding
✅ Sudah masuk bus — 07:53

Snack
❌ Belum diklaim

[ Claim Snack ]
```

## 15.4 Boarding

Action:

```text
[ MARK BOARDED ]
```

Mencatat:

```text
boarded_at
boarded_by
```

## 15.5 Snack claim

Action:

```text
[ CLAIM SNACK ]
```

Mencatat:

```text
snack_claimed_at
snack_claimed_by
```

Scan ulang tidak menggandakan claim karena state sudah `claimed`.

## 15.6 QR cryptography

Untuk MVP online, QR dapat berisi opaque random ticket token yang diverifikasi server.

**FUTURE:** signed payload Ed25519 untuk offline verification.

Catatan teknis:

- Ed25519 adalah **digital signature**, bukan encrypt/decrypt.
- Private key hanya di server/signing service.
- Scanner memegang public key jika offline verification diimplementasikan.
- HMAC dan Ed25519 tidak boleh dicampur sebagai konsep yang sama.

---


# 16. Manifest & Passenger Trip Profile

## 16.1 Manifest dikelompokkan per trip

Bukan per vehicle permanen.

```text
Vehicle D 1234 ABC
├── Trip Senin 08:00 → Manifest A
├── Trip Senin 14:00 → Manifest B
└── Trip Selasa 08:00 → Manifest C
```

## 16.2 Manifest content

```text
TRIP #T001
Bandung → Bogor
08:00
D 1234 ABC

Seat | Passenger | From      | To        | Boarding | Snack
01   | Budi      | Bandung   | Bogor     | ✅       | ✅
02   | Siti      | Bandung   | Cianjur   | ✅       | ❌
03   | Andi      | Cianjur   | Bogor     | ❌       | ❌
```

## 16.3 Passenger Profile vs Passenger Trip Profile

Global user profile:

```text
Budi Santoso
email
identity/account
```

Trip context:

```text
Budi Santoso
Trip T001
Seat 07
Bandung → Bogor
Boarded ✅
Snack ❌
```

UI scan QR harus membuka **Passenger Trip Profile**.

## 16.4 Manifest sebagai query

Manifest dapat dibentuk dari confirmed booking passengers untuk `trip_id` tertentu.

Tidak wajib mempunyai entity `manifest` terpisah kecuali dibutuhkan snapshot/audit di masa depan.

---
