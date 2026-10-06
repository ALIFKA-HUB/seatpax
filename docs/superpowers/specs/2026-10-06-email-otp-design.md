# Seatpax — Login Email OTP (Hari 3)

Tanggal: 6 Oktober 2026. Status: **DRAFT untuk review dokumen tertulis**. Pengguna menyetujui alur dalam chat; dokumen dan rencana implementasi masih memerlukan review. Tidak ada kode login atau perubahan konfigurasi Auth yang dibuat pada tahap ini.

## Tujuan dan batas

Passenger dapat memasukkan email, menerima kode, memverifikasi kode, mempertahankan sesi ketika refresh, dan logout. Identitas terverifikasi menjadi dasar checkout pada slice berikutnya. Acuan: scope aktif `02_MVP_SCOPE.md`, `03_ROLES_RBAC_AUTH.md`, fondasi D2026-10-06-02, dan latest direction `13_UI_UX_DESIGN.md`.

Tidak termasuk Google OAuth, password login, guest claim, booking, tabel profile/membership, penentuan role, dashboard operasional, atau migration. Identitas Supabase baru boleh dibuat melalui OTP; hal itu tidak memberikan role Admin/crew/Super Admin. Internal accounts dan hak tenant mengikuti Hari 4.

## Pendekatan yang disetujui

Gunakan server actions untuk request OTP, verify OTP, dan logout. Alternatif browser langsung memakai SDK yang sama, tetapi tetap membutuhkan verifikasi identitas server. Server actions dipilih agar validasi, hasil error, dan penulisan cookie memakai satu boundary. Tidak menambah provider/dependency auth baru.

## Antarmuka

- `/login`: satu halaman dengan state email dan state kode. Label jelas, input email, input kode tunggal dengan `autocomplete=one-time-code`, tombol kirim/verifikasi, status pending dan pesan error yang dapat dibaca screen reader.
- Setelah request diterima, tampilkan email tujuan, kirim ulang dengan cooldown 60 detik, dan ganti email. Cooldown UI membantu pengguna; Supabase tetap menjadi authority rate limit. Resend hanya dimulai oleh aksi pengguna, tidak otomatis oleh render/refresh.
- Ganti email menghapus input kode dan hasil error. Email hanya berada dalam state formulir, bukan query string atau localStorage. Refresh sebelum login mengulang tahap email; pengguna boleh memakai kode yang masih valid untuk email yang sama.
- `/account`: halaman sederhana berisi email terverifikasi dan logout. Belum menampilkan role, tiket, atau data booking. Anonymous diarahkan ke `/login`; pengguna login yang membuka `/login` diarahkan ke `/account`.
- Sukses verifikasi selalu menuju `/account`. Tidak menerima arbitrary redirect/parameter `next` pada slice ini.
- Home memberi tautan login/akun dan memperbarui status setup. Visual mengikuti navy, bright blue/cyan, off-white, tipografi sistem yang tersedia; responsif dan keyboard accessible.

## Boundary dan alur data

- `modules/auth/`: validasi input dan service request/verify/logout dengan adapter Supabase yang dapat diganti pada pemeriksaan lokal. Route/page/action tetap tipis.
- Request: trim email, validasi panjang maksimal 254 dan format menggunakan Zod; panggil `signInWithOtp` dengan `shouldCreateUser: true`. Respons sukses tidak mengklaim sesi sudah terbentuk atau memastikan email telah diterima.
- Verify: validasi email dan kode numerik sesuai panjang yang diperiksa pada konfigurasi hosted sebelum implementasi; panggil `verifyOtp` dengan `type: email`. Sesudah sukses, redirect dilakukan di luar catch agar mekanisme redirect Next tidak ditelan.
- Actions memakai `createServerSupabaseClient({cookieMode: read-write})`; Server Components memakai mode read-only.
- `proxy.ts` dan helper Supabase proxy menyegarkan sesi, meneruskan cookie ke request dan response sesuai SDK SSR. Header/cache directives SDK dipertahankan. Tidak memakai response refresh yang kemudian diganti sehingga cookie hilang.
- Helper identitas server memakai `auth.getUser()` dan menolak error/identitas kosong; tidak mempercayai `getSession()` saja, body request, role metadata yang dapat diedit pengguna, atau keberadaan cookie.
- `/account` dirender dinamis dan tidak menggunakan shared cache untuk response/data user. Proxy membantu refresh, tetapi setiap private page/action tetap memverifikasi identitas.
- Logout memakai scope local agar mengakhiri sesi browser ini. Kegagalan logout ditampilkan; jangan menampilkan sukses ketika provider gagal. Cookie sesi dibersihkan melalui SDK pada hasil sukses.
- Server actions mengikuti pemeriksaan origin bawaan Next. Tidak menambah wildcard allowed origins. Sesi dikelola Supabase SSR; tidak ada token/session/password di log, query string, atau response formulir.

## Error dan batas pengiriman

- Validasi input memberi pesan field yang jelas. Jangan mengirim request provider pada input invalid.
- Kode invalid/expired menghasilkan satu pesan umum: kode tidak valid atau kedaluwarsa; pengguna dapat kirim ulang.
- Rate limit menghasilkan instruksi menunggu; cooldown UI tidak dipakai sebagai proteksi server.
- Kegagalan network/provider dan email delivery disampaikan dengan pesan aman tanpa raw error, stack, token, atau informasi keberadaan akun.
- Pending menonaktifkan tombol agar klik berulang tidak mengirim request paralel dari satu formulir. Provider tetap menangani batas request lintas browser.
- Tidak membuat counter rate limit in-memory yang memberi kesan berlaku global. CAPTCHA/custom SMTP bukan bagian implementasi ini; keterbatasan provider dicatat sebelum demo publik.

## Konfigurasi hosted dan keterlibatan pengguna

Project `seatpax-dev` telah tersambung; read-only `select 1` berhasil dengan sertifikat CA tambahan dan Auth settings endpoint HTTP 200. Ini belum membuktikan pengiriman OTP.

- Site URL development `http://localhost:3000`; port harus sesuai server yang dijalankan. Tidak perlu callback magic-link dalam alur kode ini.
- Periksa email provider aktif, panjang/expiry OTP yang sebenarnya, dan pembatasan pengiriman. Jangan mengubah expiry tanpa kebutuhan atau mengklaim countdown UI mewakili expiry provider.
- Template Magic Link menampilkan `{{ .Token }}`. Periksa juga Confirm signup untuk pengguna baru agar email pertama memberi kode yang dapat diverifikasi, tanpa mengubah flow akun lain secara diam-diam.
- Siapkan subject/body sederhana berbahasa Indonesia dengan kode dan larangan membagikan kode. Simpan sumber template dalam repo untuk ditinjau sebelum pengguna menerapkannya.
- Default SMTP Supabase membatasi penerima pada alamat yang diizinkan. Demo awal memakai email anggota organization milik pengguna; bila alamat tersebut tidak dapat menerima, catat blocker delivery dan rencanakan SMTP terpisah.
- Skill computer-use melarang agent mengubah pengaturan keamanan/privasi aplikasi atau mengotomasi authentication. Agent boleh membaca halaman; pengguna menerapkan perubahan Auth dan memasukkan OTP sendiri. Jangan meminta pengguna menempel OTP ke chat atau mencoba membaca inbox secara otomatis.

## Kriteria penerimaan implementasi

1. Email invalid tidak memanggil provider; request valid menampilkan tahap kode dan cooldown.
2. Kode salah/expired, resend rate limit, network failure dan signup delivery failure menghasilkan pesan aman.
3. Verify sukses menulis cookie dan membuka `/account`; refresh mempertahankan identitas.
4. Cookie invalid/expired tidak memberi akses private tanpa identitas terverifikasi; refresh meneruskan cookie/header yang diperlukan.
5. Logout sukses mengakhiri sesi lokal; akses `/account` sesudahnya diarahkan ke login.
6. Tidak ada role privilege otomatis, kredensial di client assets/log, shared cache data user, atau open redirect.
7. Bukti lokal mencakup unit checks service/identity/proxy sesuai rencana yang akan disetujui, lint/typecheck/build, dan smoke UI. Bukti hosted harus terpisah: satu email/kode nyata dimasukkan pengguna, refresh dan logout. Tanpa hasil tersebut jangan mengklaim OTP end-to-end selesai.

## Referensi dan review mandiri

- [Supabase Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless): request, template Token, verify type email, signup, rate limits.
- [Supabase SSR Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs): server/browser clients, proxy refresh dan verified identity.
- [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp): batas default delivery.

Review mandiri: alur tetap dalam scope OTP Hari 3; tidak bergantung pada migration Hari 4; data user tidak masuk shared cache; verifikasi server tetap wajib sesudah refresh. Panjang/expiry OTP dan delivery diperiksa dari konfigurasi aktual sebagai langkah provider, bukan kebijakan produk baru yang ditebak.
