# Seatpax — Demo Data & Presentation Script


> Modular documentation extracted from the Seatpax master specification.


# 38. Demo Data Strategy

Gunakan minimal dua PO untuk menunjukkan tenant isolation tanpa harus membuat onboarding PO.

Contoh:

```text
PO Nusantara
PO Maju Jaya
```

## 38.1 Route demo utama

```text
Bandung
  ↓
Cianjur
  ↓
Sukabumi
  ↓
Bogor
```

Kenapa route ini cocok untuk demo:

- 4 stop,
- 3 segment,
- gampang menunjukkan seat reuse,
- mudah menjelaskan overlap.

## 38.2 Seat demo

Gunakan seat template kecil 10–12 seat supaya visual jelas.

Demo skenario:

```text
Seat 07
Budi: Bandung → Cianjur
Andi: Cianjur → Bogor
```

Kemudian tunjukkan user lain gagal membeli:

```text
Seat 07
Bandung → Sukabumi
```

jika segment overlap dengan booking yang aktif.

## 38.3 Demo role accounts

Seed:

```text
superadmin@demo
admin.po.a@demo
crew.po.a@demo
passenger@demo
```

Gunakan credential demo yang aman hanya di environment lokal/demo, jangan production secrets.

---


# 39. Demo Script untuk Presentasi

## Scene 1 — Masalah

Jelaskan:

```text
Bandung → Cianjur → Sukabumi → Bogor
```

"Kursi tidak bisa dianggap booked sepanjang perjalanan."

## Scene 2 — Admin PO

- buka route,
- tunjukkan stop sequence,
- tunjukkan seat template,
- buka trip.

## Scene 3 — Passenger A

- search Bandung → Cianjur,
- pilih Seat 07,
- bayar sandbox,
- dapat QR.

## Scene 4 — Passenger B

- search Cianjur → Bogor,
- Seat 07 masih available,
- booking seat yang sama.

Ini adalah **wow moment utama**.

## Scene 5 — Concurrency proof

Tunjukkan test output 50 parallel requests dan hanya satu hold pada overlapping segment berhasil.

## Scene 6 — Crew

- buka manifest,
- scan QR,
- passenger profile muncul,
- mark boarded,
- claim snack.

## Scene 7 — Tenant isolation

Login sebagai Admin PO lain dan tunjukkan data PO A tidak dapat diakses.

---


# 49. Pertanyaan Penguji yang Harus Bisa Dijawab

## "Kenapa tidak pakai status seat BOOKED saja?"

Karena satu seat dapat dipakai kembali pada segment yang tidak overlap.

## "Bagaimana mencegah double booking?"

Seat hold dilakukan server-side dengan PostgreSQL transaction/locking dan availability selalu dicek ulang sebelum commit.

## "Kalau realtime telat?"

Realtime hanya UX. Database tetap source of truth.

## "Kalau webhook Midtrans dikirim dua kali?"

Payment event idempotency + unique provider event/order identity.

## "Bagaimana kalau Admin PO A mencoba akses data PO B?"

Server authorization + company membership + RLS.

## "Kenapa tidak microservices?"

Traffic demo tidak membutuhkannya. Modular monolith lebih sederhana, lebih mudah dites, dan domain module masih bisa diekstrak jika scaling benar-benar menuntut.

## "Apakah bisa handle jutaan booking?"

Jumlah booking tersimpan bukan satu-satunya problem. Correctness pada concurrent seat purchase lebih penting. Arsitektur memakai PostgreSQL sebagai source of truth dan memiliki scaling path melalui compute upgrade, pooling, cache, queue, read replica, lalu service separation jika dibutuhkan.

## "Kenapa WhatsApp/SMS tidak real?"

Project tidak memiliki budget. Notification menggunakan provider abstraction + mock adapter pada demo, sehingga production provider dapat ditambahkan tanpa mengubah domain flow.

## "Kenapa crew bukan React Native?"

Setelah Bluetooth printer dan offline cash kompleks dipangkas, kebutuhan crew MVP dapat dipenuhi PWA: camera scan, manifest, boarding, snack, dan online cash booking.

---
