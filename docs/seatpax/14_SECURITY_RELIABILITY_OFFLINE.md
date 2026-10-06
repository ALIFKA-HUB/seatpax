# Seatpax — Security, Reliability & Offline Strategy


> Modular documentation extracted from the Seatpax master specification.


# 33. Security Model

## 33.1 Authentication

- Supabase Auth.
- Google OAuth / Email OTP untuk passenger.
- Internal authenticated account untuk Admin/Crew/Super Admin.

## 33.2 Authorization

Setiap mutation server harus mengecek:

```text
authenticated?
role allowed?
company allowed?
resource belongs to company?
state transition valid?
```

Jangan hanya hide button di frontend.

## 33.3 RLS

RLS dipakai sebagai defense-in-depth untuk data tenant.

Contoh konseptual:

```text
ADMIN_PO can SELECT trip
IF membership.company_id = trip.company_id
```

Service role key tidak boleh dikirim ke browser.

## 33.4 Input validation

Semua request penting melalui Zod / schema validation.

Jangan percaya:

- price dari frontend,
- company_id dari frontend,
- seat availability dari frontend,
- role dari frontend,
- payment status dari frontend.

## 33.5 Price calculation

Harga dihitung server berdasarkan:

```text
route
from/to segment
service class
```

Frontend hanya menampilkan quote.

## 33.6 QR token

QR gunakan random high-entropy token / opaque identifier.

Server menyimpan hash jika memungkinkan.

Jangan isi QR hanya dengan sequential ticket ID seperti `1234`.

## 33.7 Webhook

- Verify provider authenticity.
- Idempotency.
- Store relevant raw payload for audit/debug.
- Never trust client callback.

## 33.8 Audit trail

Mutation sensitif dicatat:

```text
who
role
what
entity
when
before/after
```

---


# 34. Reliability & Failure Handling

## 34.1 Seat conflict

Jika hold gagal:

```text
409 CONFLICT
Seat no longer available
```

Client reload availability.

## 34.2 Hold expiry

Saat timer selesai:

```text
Checkout disabled
Seat released
User kembali ke seat selection
```

## 34.3 Payment provider timeout

Jangan langsung menyatakan gagal permanen.

Status:

```text
PENDING
```

Sediakan status polling/recheck bila perlu.

## 34.4 Late payment

Masuk `PAYMENT_CONFLICT`, tidak otomatis issue ticket pada inventory yang sudah mungkin dijual.

## 34.5 Realtime down

Booking tetap aman.

Client dapat fallback ke refresh/polling karena database adalah source of truth.

## 34.6 QR scanner failure

Crew dapat search passenger secara manual dari manifest.

Ini penting sebagai operational fallback.

---


# 35. Offline Strategy

## 35.1 MVP

Crew membutuhkan internet untuk:

- cash sale,
- mutation boarding/snack jika implementation belum mempunyai offline cache.

QR ticket milik passenger tetap dapat discreenshot karena gambar QR statis.

## 35.2 Optional MVP bonus

Jika waktu cukup, boarding scan dapat memakai pre-cached manifest atau PWA cache sederhana.

Namun jangan memasukkan full bidirectional offline sync tanpa waktu testing yang cukup.

## 35.3 Future offline-first

Design yang pernah dibahas dan dapat menjadi roadmap:

```text
Trip Snapshot
SQLite/local DB
Outbox Events
Signed QR (Ed25519)
Offline boarding
Offline cash sale
Reserved offline inventory
Conflict reconciliation
```

Status: **FUTURE**, bukan janji MVP.

---
