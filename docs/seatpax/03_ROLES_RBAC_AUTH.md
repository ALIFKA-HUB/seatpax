# Seatpax — Roles, RBAC, Tenant Isolation & Authentication


> Modular documentation extracted from the Seatpax master specification.


# 5. Role Model

Seatpax menggunakan **empat role utama**.

```text
PASSENGER
ADMIN_PO
CREW
SUPER_ADMIN
```

## 5.1 PASSENGER

Kemampuan:

- mencari trip,
- memilih asal dan tujuan,
- memilih seat,
- membuat booking,
- membayar,
- melihat QR tiket,
- melihat status perjalanan,
- melihat boarding status,
- melihat snack claim status,
- request reschedule,
- mengakses histori tiket setelah login.

Guest **bukan role**. Guest adalah kondisi passenger belum terhubung account:

```text
account_id = NULL
```

## 5.2 ADMIN_PO

Role ini sengaja menggabungkan fungsi yang di production dapat dipecah menjadi Owner, Dispatcher, Cashier, Finance, dan Operations.

Kemampuan MVP:

- route & stop management,
- segment fare,
- service class,
- vehicle management,
- visual seat template,
- trip scheduling,
- assign vehicle,
- booking management,
- manifest,
- manual cash booking,
- reseat,
- refund basic,
- reschedule basic,
- payment conflict resolution,
- laporan sederhana.

## 5.3 CREW

Mewakili kondektur / gate staff / operational crew dalam satu role agar scope tidak membesar.

Kemampuan:

- melihat assigned/active trip,
- melihat manifest,
- search passenger,
- scan QR,
- melihat passenger trip profile,
- mark boarded,
- claim snack,
- membuat cash booking saat online.

## 5.4 SUPER_ADMIN

Kemampuan minimal:

- melihat daftar PO,
- membuat / menambahkan PO,
- mengaktifkan PO,
- suspend PO,
- melihat platform overview sederhana.

Tidak perlu dashboard finansial besar pada MVP.

---


# 6. RBAC + Tenant Isolation

## 6.1 Konsep

```text
RBAC            = user boleh NGAPAIN?
Tenant Isolation = user boleh melakukan itu ke DATA SIAPA?
```

Contoh:

```text
CREW punya boarding.scan ✅

Trip perusahaan sendiri ✅
Trip perusahaan lain     ❌
```

## 6.2 Static RBAC

**FINAL — MVP v1:** Role bersifat statis. Tidak ada UI untuk membuat custom role.

Contoh permission mapping konseptual:

### PASSENGER

```text
booking.create
booking.view_own
ticket.view_own
reschedule.request
```

### ADMIN_PO

```text
route.manage
vehicle.manage
seat_template.manage
trip.manage
booking.manage
refund.manage
reschedule.manage
manifest.view
report.view
```

### CREW

```text
trip.view_assigned
manifest.view_assigned
passenger.view_assigned
boarding.scan
snack.claim
cash_sale.create
```

### SUPER_ADMIN

```text
company.manage
company.suspend
platform.view
```

Implementasi awal dapat menggunakan role checks di server/service layer tanpa tabel permission yang kompleks.

## 6.3 Tenant isolation

Record milik PO harus memiliki jalur relasi ke company.

Contoh:

```text
Trip.company_id = Company.id
Vehicle.company_id = Company.id
Route.company_id = Company.id
```

`ADMIN_PO` dan `CREW` hanya boleh mengakses company yang tercantum dalam membership mereka.

Defense-in-depth:

1. Server-side authorization.
2. PostgreSQL RLS untuk tabel yang relevan.
3. UI conditional rendering hanya sebagai UX layer, bukan keamanan utama.

---


# 7. Authentication & Identity

## 7.1 Passenger auth

**FINAL:**

```text
[ Continue with Google ]
          OR
[ Continue with Email ]
          ↓
      Email OTP
          ↓
        Login
```

Password tradisional tidak wajib untuk passenger MVP.

## 7.2 Guest booking

Passenger tetap boleh booking tanpa login.

Alasan:

- checkout lebih cepat,
- cocok untuk transaksi spontan,
- crew cash sale tidak perlu memaksa account creation.

Guest record dapat menyimpan:

```text
name
email / phone
account_id = NULL
claim_status = UNCLAIMED
```

## 7.3 Claim ticket

Setelah booking sukses:

```text
Booking Success
      ↓
[ Simpan tiket ke akun ]
      ↓
Google / Email OTP
      ↓
Verify identity
      ↓
Ticket linked to account
```

## 7.4 Cross-device access

Booking di HP 1 kemudian dibuka di HP 2 membutuhkan identitas terverifikasi.

Prinsip:

> Booking boleh tanpa akun; akses lintas perangkat membutuhkan login atau claim terverifikasi.

---
