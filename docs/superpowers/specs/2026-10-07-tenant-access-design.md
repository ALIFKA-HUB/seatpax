# Seatpax — Fondasi perusahaan dan hak akses

Tanggal: 7 Oktober 2026. **Status: PROPOSED — menunggu review spec tertulis.** Pengguna menyetujui pendekatan bertahap dengan “Setuju, fondasi akses dulu”. Persetujuan tersebut mengizinkan penulisan spec ini; migration dan kode belum dibuat.

## Tujuan dan batas

Membangun identitas aplikasi, dua perusahaan demo, serta keanggotaan internal yang dapat dicabut. Bukti utama: admin PO A tidak dapat membaca/mengubah data PO B; akun penumpang tidak mendapat hak internal setelah login.

Acuan: [scope aktif](../../seatpax/02_MVP_SCOPE.md), [keputusan](../../seatpax/19_DECISION_LEDGER.md), [fondasi diadopsi](2026-10-06-foundation-design.md), [schema proposal](../../seatpax/10_DATA_MODEL_DATABASE.md), [review gap](../../analysis/SEATPAX_SPEC_REVIEW.md). Scope tetap D2026-10-06-01/02.

Slice ini mencakup schema, migration, authorization service, seed development, dan verifikasi isolasi. Dashboard perusahaan, undangan akun, trip/assignment, inventory, payment, serta perubahan UI/OTP dikerjakan pada slice berikutnya.

## 1. Model data

| Tabel | Field dan aturan |
| --- | --- |
| `public.users` | `id` UUID PK/FK `auth.users.id`; `name`, `avatar_url`, `email` nullable; `created_at`, `updated_at` timestamptz. Email profil hanya salinan informasi, bukan authority login/role. |
| `public.companies` | UUID PK; `name` wajib; `slug` wajib unik dan lowercase; `logo_url` nullable; `status` ACTIVE/SUSPENDED; `refund_cutoff_minutes` nullable dan nonnegatif; timestamps. |
| `public.memberships` | UUID PK; FK `user_id`; FK `company_id` nullable; `role` ADMIN_PO/CREW/SUPER_ADMIN; `status` ACTIVE/DISABLED; timestamps. |

CHECK membership: SUPER_ADMIN harus mempunyai company NULL; ADMIN_PO/CREW harus mempunyai company non-NULL. Unique partial index `(user_id, company_id, role)` untuk membership tenant dan `(user_id, role)` untuk membership global mencegah duplikasi termasuk kasus NULL. Satu user dapat mempunyai beberapa membership; tidak ada kolom global role pada profil. PASSENGER adalah kemampuan akun terverifikasi tanpa membership internal.

FK profil ke Auth memakai ON DELETE RESTRICT; penghapusan akun dan data operasional bukan fitur slice ini. FK membership juga RESTRICT. Tidak ada cascade yang menghapus riwayat bisnis. Profil dibuat secara idempotent oleh server setelah identity diverifikasi, sebelum akses domain; akun yang sudah login sebelum migration juga tercakup. Tidak memakai metadata yang dikirim user untuk memberi role.

## 2. Authorization di server

- Identitas berasal dari `getVerifiedUser()`; parameter user/role dari browser tidak menjadi authority.
- Modul `modules/access` memuat permission mapping dan guard; repository memuat query database. Koneksi privileged tetap membutuhkan guard, karena RLS tidak membatasi koneksi yang bypass RLS.
- Guard mengambil membership aktif dari database pada setiap operasi; tidak menyimpan role di cookie/JWT sebagai authority. Tidak ada cache membership lintas request.
- Admin memerlukan ADMIN_PO aktif pada company resource. Company diperoleh dari resource tersimpan, bukan klaim browser. Company ID yang dipilih hanya target yang harus diperiksa.
- SUPER_ADMIN aktif mendapat company management saja. Guard admin tenant tidak menerima SUPER_ADMIN sebagai pengganti ADMIN_PO.
- CREW membership hanya membuktikan hubungan company. Guard akses operasional crew belum tersedia sampai trip dan assignment dibuat; membership sendiri tidak memberi akses manifest/boarding.
- Membership DISABLED selalu ditolak. Company SUSPENDED tidak mencabut membership: operasi penjualan kelak memeriksa state secara terpisah, sedangkan penanganan tiket valid tetap mengikuti fondasi.
- Error aman: unauthenticated atau forbidden; tidak membocorkan profil/membership tenant lain. Tidak ada public endpoint untuk mengubah role.

Guard read adalah fondasi, bukan jaminan terhadap pencabutan akses yang terjadi bersamaan dengan transaksi. Pada slice mutation berikutnya, membership/state yang relevan harus diperiksa ulang di dalam transaksi dengan protokol lock yang sesuai.

## 3. RLS dan privileges

Aktifkan RLS pada ketiga tabel. Revoke akses `anon` dan `authenticated` ke ketiganya; tidak buat policy/grant browser langsung pada slice ini. Akses aplikasi berjalan melalui server yang memverifikasi identity dan membership. Ini adalah pilihan default-deny yang konkret; akses profil lewat browser pun belum diaktifkan.

Tidak ada fungsi SECURITY DEFINER atau policy membership yang saling membaca tabel dan menyebabkan rekursi. Schema Auth dikelola Supabase; migration aplikasi hanya merujuk identity yang sudah tersedia. Tes membuktikan akses langsung anon/authenticated ditolak, bukan hanya menguji tampilan UI.

## 4. Seed development

- Dua company dengan UUID/slug tetap; label jelas sebagai data demo.
- Internal accounts berasal dari Auth user UUID yang sudah ada. Input mapping admin/crew per PO dan Super Admin disediakan lewat konfigurasi lokal yang diabaikan Git; tidak membuat password atau mencetak token.
- Seed memvalidasi semua UUID exist, company-role constraint, dan kelengkapan mapping sebelum menulis. Tidak menganggap akun penumpang yang kebetulan login sebagai admin.
- Command default dry-run; apply harus eksplisit. Guard project ref hanya mengizinkan `seatpax-dev` yang sudah tercatat di setup. Gunakan transaksi dan upsert idempotent berdasarkan identitas tetap.
- Rerun tidak mengaktifkan kembali membership DISABLED atau company SUSPENDED: konflik mempertahankan status yang ada dan dilaporkan. Perubahan role/account mapping membutuhkan tindakan eksplisit terpisah.
- Mapping Auth ID belum diberikan pengguna; implementasi dapat selesai tanpa mengarang identity, tetapi seed hosted belum dapat dinyatakan selesai tanpa mapping tersebut.

## 5. Migration dan verifikasi

Drizzle schema dan SQL migration ditinjau bersama agar CHECK, partial indexes, RLS, dan grants tidak hilang. Migration menggunakan koneksi Direct/session yang benar pada port 5432; runtime transaction pooler port 6543 tetap terpisah. Secret dan CA tetap di konfigurasi lokal.

Sebelum apply hosted: periksa target project, schema existing, SQL konkret, serta koneksi migration. Migration tidak mengubah konfigurasi Auth atau menghapus tabel/data. Jika prerequisite koneksi/mapping belum tersedia, laporkan batas verifikasi tanpa klaim hosted berhasil.

Acceptance:

1. Constraint menolak tenant membership NULL, global membership ber-company, duplicate tenant/global, serta FK invalid.
2. Passenger/anon/disabled membership ditolak pada guard internal.
3. Admin A diterima untuk A dan ditolak untuk B; Admin B sebaliknya. Super Admin diterima untuk company management dan ditolak guard tenant tanpa membership tenant.
4. Crew tidak mendapat akses operasional hanya karena membership aktif.
5. Setelah membership dinonaktifkan, request berikutnya ditolak.
6. Query langsung role anon/authenticated terhadap ketiga tabel ditolak; repository server tetap berjalan setelah guard berhasil.
7. Seed dry-run tanpa write, apply atomik, rerun tanpa duplikasi atau reactivation, mapping invalid rollback.
8. Unit tests, database integration tests pada development, typecheck, lint, dan build dicatat terpisah. Mock tidak menjadi bukti RLS hosted.

## Self-review dan handoff

Pilihan tiga tabel sesuai pendekatan yang disetujui. Kekurangan UNIQUE dengan NULL pada proposal lama ditutup oleh partial indexes. Assignment crew tetap mengikuti fondasi, bukan disimulasikan dengan membership. Tidak ada perluasan fitur produk. RLS default-deny dan guard server diuji sebagai dua batas berbeda.

Berikutnya: pengguna mereview spec ini; setelah disetujui, tulis implementation plan melalui writing-plans dan minta review plan/metode sebelum eksekusi. Desain belum menjadi keputusan ADOPTED sampai review tertulis tersebut.
