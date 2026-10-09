# Seatpax — Ticket, QR, Entitlements & Passenger Manifest

> **Implementation update — 9 October 2026:** Manifest and explicit once-only boarding are implemented for assigned active crew, with same-tenant Admin read-only access, minimum passenger data, origin-stop validation and immutable event retries. QR resolves only; snack and offline operations remain subsequent work. See `../setup/MANIFEST_BOARDING_SETUP.md` for evidence and pending physical-camera acceptance.


> **Implementation update — 8 October 2026:** Current ticket issuance is atomic with verified payment and occupancy. QR contains a random 32-byte opaque token only; SHA256 lookup plus AES-256-GCM ciphertext, nonce, tag and key version allow stable authorized reopening. Booker-only reads; operational token resolution requires fresh tenant membership and assigned-trip crew access. OTHER uses actual passenger snapshot. Manifest/scanner/boarding are implemented in the 9 October slice; snack screens remain subsequent work. See `../setup/CHECKOUT_PAYMENT_SETUP.md`.

> **Fondasi diadopsi — D2026-10-06-02:** Token QR random 32 byte, unique hash untuk lookup dan ciphertext terenkripsi server untuk render ulang. Owner/tenant Admin/assigned crew tetap harus authorized; QR tidak memberi akses PII anonim. Ticket/active assignment dan boarding/snack memiliki uniqueness; resolve tidak mutate, snack membutuhkan boarding. Acuan: [rancangan fondasi](../superpowers/specs/2026-10-06-foundation-design.md) dan [ledger](19_DECISION_LEDGER.md). Kontrak ini mendahului uraian lama yang berbeda; implementasi belum dibuat.


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

## Adopted snack claim slice — 9 October 2026

Assigned active crew records one snack claim per boarded ticket/trip through a separate explicit action. Scan remains read-only. Retry returns the original event after fresh access checks; operational snack state contains claimedAt only. Admin PO reads but cannot claim. See ../setup/SNACK_CLAIM_SETUP.md for verification and manual acceptance limits.
