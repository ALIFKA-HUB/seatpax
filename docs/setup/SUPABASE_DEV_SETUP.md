# Supabase development setup

Status: aplikasi/adapters lokal tersedia. **Project hosted, query nyata dan konfigurasi Auth belum diverifikasi.** Tidak ada migration, seed, login OTP, atau payment yang berjalan.

## 1. Buat project

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Buat project development bernama `seatpax-dev` pada organization milik lo; pilih region dekat pengguna/demo, misalnya Singapore jika tersedia.
3. Simpan database password di password manager lokal. Tunggu project selesai provisioning.
4. Catat project reference untuk memastikan target pada migration Hari 4. Jangan taruh password/key/private connection string di chat atau Git.

## 2. Isi environment lokal

Gunakan folder checkout tempat aplikasi dijalankan. Implementasi sekarang berada di worktree:
`C:\Users\ASUS\.codex\worktrees\day2-supabase-setup\SeatPax`.
Setelah integrasi branch, gunakan checkout project utama. File ignored tidak ikut merge.

```powershell
Copy-Item .env.example .env.local
```

Isi lewat editor lokal:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key, **bukan secret/service-role key**.
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` untuk development.
- `DATABASE_URL`: connection string dari **Connect → Transaction pooler**, port 6543. Host dan username harus disalin dari dashboard.
- `DATABASE_MIGRATION_URL`: direct connection untuk migration jika jaringan IPv6 tersedia; session pooler port 5432 menjadi alternatif pada jaringan IPv4. Field boleh kosong pada Hari 2: parser memakai runtime URL, tetapi pilih connection migration yang sesuai sebelum migration Hari 4.

Ganti password placeholder menggunakan percent-encoded password jika mengandung karakter reserved. Jangan mengarang pooler hostname berdasarkan region. Gunakan nilai dashboard. Runtime driver memakai `prepare:false`, max 1 connection dan verifikasi sertifikat TLS; jangan menonaktifkan TLS verification saat troubleshooting.

## 3. Buktikan koneksi

```powershell
npm.cmd run db:check
```

Sukses berarti exit 0 dan `Database connection OK`. Perintah hanya `select 1`, tidak menambah tabel/data, serta menutup koneksi. Jika gagal: cek project paused/provisioning, host/port, username/password encoding, konektivitas dan sertifikat. Output hanya pesan aman; jangan menempelkan connection string saat meminta bantuan.

## 4. Siapkan Auth untuk Hari 3

Di Authentication URL Configuration:

- Site URL: `http://localhost:3000`.
- Redirect allowlist untuk callback yang akan dibuat: `http://localhost:3000/auth/callback`.
- Jika port lokal berubah, tambahkan URL development yang benar; URL deploy ditambahkan saat staging tersedia.
- Periksa email provider aktif. Untuk kode Email OTP, template yang sesuai harus menampilkan `{{ .Token }}`; implementasi request/verify dan penyesuaian template diuji pada Hari 3.
- Periksa batas pengiriman email/default SMTP di project. Default sender dibatasi untuk alamat yang diizinkan; gunakan alamat anggota organization untuk demo awal atau konfigurasi SMTP bila diperlukan.

Client adapters di slice ini tidak memverifikasi role atau menjadi login flow. Server default `cookieMode: "read-only"`; route/action auth nanti harus memakai `read-write`. Proxy refresh dan verified identity helper menjadi pekerjaan Hari 3.

## Checklist provider

- [ ] Project development siap dan project reference diketahui.
- [ ] URL/publishable key/database URLs terisi di ignored environment.
- [ ] Query nyata `db:check` sukses.
- [ ] Site URL, allowlist, email delivery dan OTP template diperiksa.
- [ ] Akses Midtrans Sandbox tersedia. Status saat penulisan: **unknown**; tidak ada account/token payment yang diverifikasi.
- [ ] Hari 3 login OTP nyata diuji; **belum selesai**.

RLS/domain tables/seed dua PO menjadi Hari 4. Hosted webhook baru diperiksa bersama adapter payment dan staging.

## Toolchain dan hasil lokal

Node v26.3.0 / npm 11.16.0; package-lock adalah catatan versi yang digunakan. Next 16.3.8 / React 19.3.0 / TypeScript 6.0.3 / Vitest 5.0.3. SDK Supabase 2.117.2 + SSR 0.12.7, Drizzle ORM 0.45.3. Node >=26 dipilih karena engine Vitest 5 pada runtime yang tersedia.

ESLint 9 dipertahankan karena eslint-plugin-react pada eslint-config-next belum kompatibel dengan API ESLint 10. Audit dependency saat setup menemukan 9 advisories pada tooling lint/migration (4 moderate, 5 high), bukan bukti eksploitasi aplikasi. Registry saat diperiksa belum memberi patched braces dalam range tooling; audit menyarankan downgrade besar. Tidak menjalankan force downgrade. Periksa ulang sebelum migration tooling dipakai atau dependency diperbarui. Offline tests/build tidak membuktikan koneksi hosted atau RLS.

## Referensi resmi

- [SSR clients dan cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).
- [Connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres).
- [Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
- [Default SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

