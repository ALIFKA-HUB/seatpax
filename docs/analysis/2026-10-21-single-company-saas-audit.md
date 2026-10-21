# Audit sisa ketergantungan SaaS — 21 Oktober 2026

## Lingkup dan batas bukti

Keputusan aktif: D2026-10-21-01, satu perusahaan shuttle. Audit membaca `main` pada08eb540 dan membandingkan kode Free/billing di `codex/pro-sandbox-billing` padaac43da8. Server localhost3001 sesi ini dijalankan dari worktree billing tersebut, bukan main. Perubahan generator `next-env.d.ts` pada kedua checkout dan attachment pengguna tidak disentuh.

Pemeriksaan: pencarian import/policy/config, penelusuran entry/auth/Admin/discovery/payment, perbandingan branch dan satu transaksi database **READ ONLY** pada project development yang di-allowlist (`slbkhdsfafcxaxqdxmet`). Tidak menjalankan tests/build/typecheck/lint, tidak mengubah data/schema/env, tidak memindahkan server, tidak mengaktifkan/menonaktifkan membership atau perusahaan. Ini audit sumber dan keadaan terbatas, bukan jaminan seluruh alur bekerja.

## Kesimpulan

`main` tidak berisi modul Free/subscription billing atau import ke modul SaaS tersebut pada app/modules/lib/scripts yang dipindai. Sistem tiket di main tidak memerlukan langganan Pro. Namun proses yang sedang dibuka pengguna masih memakai branch SaaS; main sendiri masih mempunyai struktur/menu/discovery banyak perusahaan dan database development sudah lebih maju daripada riwayat migrasi main.

## 1. Prioritas tinggi — proses aktif masih memakai branch SaaS

Server dijalankan dengan `next dev --webpack --port3001` dari `C:/Users/ASUS/.codex/worktrees/pro-sandbox-billing/SeatPax`. Gate onboarding/billing/clock pada kedua env diperiksa sebagai off/unset; **itu tidak meniadakan policy Free dalam service branch**.

Bukti source branch billing:

- `modules/subscription/service.ts:4` membaca `workspace_entitlements` tanpa gate.
- `modules/subscription/service.ts:8` menolak penjualan untuk Free; `:9` menghitung kuota.
- `modules/fleet/vehicle-service.ts:25`, `template-service.ts:26`, `modules/route/service.ts:13` memasukkan quota checks ke operasi master.
- `modules/trip/draft-service.ts:11`, `publication-service.ts:9`, `modules/inventory/repository.ts:40` memasukkan Free/live-sale guards.
- Discovery branch billing mengecualikan perusahaan yang memiliki entitlement, dan Admin layout membaca mode sebelum membentuk navigasi.

Dampak bersyarat: jika perusahaan diberi entitlement Free, armada/rute dan penjualan dapat dibatasi walaupun halaman registrasi/billing disembunyikan. **Saat audit jumlah entitlement Free adalah0**, jadi tidak ada bukti quota tersebut sedang membatasi perusahaan sekarang. Jangan menyamakan risiko ini dengan bug aktif yang sudah teramati.

Rekomendasi: jalankan main untuk aplikasi satu perusahaan; simpan branch Free/billing terpisah. Jangan merge seluruh branch SaaS hanya untuk memperoleh perubahan UI. Server belum dipindahkan dalam audit ini.

## 2. Prioritas tinggi — main belum membatasi satu perusahaan operasional

Bukti:

- `modules/inventory/repository.ts:15`, `:32`, `:33`: discovery, pilihan lokasi dan pencarian mengambil semua perusahaan ACTIVE dengan perjalanan layak, tanpa satu companyID konfigurasi.
- `modules/inventory/repository.ts:29` dan penjagaan hold masih berangkat dari identitas trip, bukan perusahaan tunggal yang ditetapkan.
- `app/admin/page.tsx:8` otomatis masuk hanya bila akun punya tepat satu perusahaan; `:9` masih menyediakan pemilih untuk banyak perusahaan.

Database agregat menunjukkan10company:2ACTIVE dan8SUSPENDED. Ini tidak membuktikan jadwal dua perusahaan sedang tampil sekaligus; hasil aktual bergantung pada jadwal/status/jam. Tetapi jika dua perusahaan mempunyai perjalanan yang layak, query sekarang dapat menampilkan keduanya. Ini ketidaksesuaian lingkup satu perusahaan, **bukan bukti tenant security bocor**.

Rekomendasi: tentukan company operasional yang digunakan, kemudian batasi discovery/direct trip/new booking serta tujuan Admin ke identitas tersebut dari server. Jangan mengambil company pertama berdasarkan urutan secara diam-diam atau menghapus pemeriksaan kepemilikan. Tetap lindungi akses tiket/pembayaran yang sudah ada; pembatasan penjualan baru tidak menjadi alasan menolak pemilik tiket lama.

Belum diputuskan: perusahaan nyata/ID operasional yang dipakai. Audit tidak memilih atau membuat perusahaan.

## 3. Prioritas tinggi sebelum migrasi berikutnya — database sudah mempunyai migrasi Free

READ ONLY memperoleh:

- `public.workspace_entitlements` ada; jumlah row mode Free0.
- Schema `simulation` ada; schema `billing` **tidak ada**.
- Riwayat database terbaru created_at1792509312865, sesuai migrasi0012 Free pada branch SaaS.
- Journal main terakhir `0011_region_reference`, timestamp1792466840127.

Main belum membawa file/journal/schema0012. Jadi berpindah checkout tidak otomatis mengembalikan database ke keadaan main. Keberadaan tabel pasif ini tidak otomatis menyalakan paket Free pada main; tetapi perbedaan baseline harus diselesaikan sebelum generate/apply migrasi baru agar tidak terjadi benturan penomoran/snapshot atau perubahan tak disengaja.

Rekomendasi: catat/adopsi baseline migrasi yang sudah applied tanpa mengaktifkan fitur SaaS, atau gunakan database development terpisah dengan migrasi main. Pilihan final memerlukan plan perubahan tersendiri. Jangan drop schema/reset database sebagai shortcut. Tidak ada rollback/apply dilakukan dalam audit.

## 4. Prioritas menengah — navigasi, role platform dan seed masih untuk banyak perusahaan

- `modules/auth/entry-destination.ts:11` dan `app/account/page.tsx:15` masih mengenali SUPER_ADMIN global.
- `app/super-admin/companies`/`modules/company/service.ts` masih mengelola daftar dan activate/suspend perusahaan.
- `app/workspaces/page.tsx` memilih area kerja ketika akun mempunyai beberapa role; ini tidak selalu merupakan pilihan perusahaan.
- `modules/access/seed.ts:10` memuat DemoPOA/B dan lima akun internal, bukan setup satu perusahaan.

Dampak: navigasi/persiapan akun membingungkan untuk satu perusahaan dan seed dapat membawa struktur demo ganda. SUPER_ADMIN bukan otomatis Admin PO operasional; menambahkan hak operasional hanya karena role platform akan mengubah security contract.

Rekomendasi: sederhanakan entry/navigation setelah pemilik/Admin perusahaan diputuskan, dan buat setup satu perusahaan yang eksplisit. Belum ada keputusan menggabung role SUPER_ADMIN dengan ADMIN_PO; simpan pemeriksaan keamanan sampai keputusan itu dibuat. Jangan menjalankan seed lama untuk bootstrap produksi satu perusahaan.

## Bagian yang dipertahankan

- `company_id`, foreign keys perusahaan, server membership authorization/RLS dan kepemilikan resource: tetap berguna meskipun satu perusahaan.
- Relasi assignment Crew/manifest/boarding dan otorisasi pemilik booking/tiket.
- `app/api/payments/midtrans/route.ts` pada main menangani pembayaran tiket tanpa import billing subscription; Midtrans tiket, event reconciliation, QR/enkripsi tidak boleh dihapus sebagai bagian pembersihan SaaS.
- Istilah entitlement pada tiket/snack berbeda dari benefit paket Free/Pro; jangan menghapusnya lewat pencarian kata semata.
- Riwayat transaksi dan company status yang sudah ada tidak boleh dihapus/relabel otomatis.

## Urutan tindak lanjut yang disarankan

1. Gunakan main untuk server yang diuji, dengan CA development yang benar dan env lokal tetap privat.
2. Tentukan satu perusahaan operasional serta akun Admin/Crew yang dipakai, tanpa menebak perusahaan dari data demo.
3. Selaraskan baseline migrasi database secara aman sebelum schema changes berikutnya.
4. Susun perubahan minimum untuk membatasi sumber perusahaan di server dan menyederhanakan entry/nav/seed; pertahankan security dan layanan tiket lama.
5. Lakukan verifikasi alur satu perusahaan ketika pengujian diminta. Tidak memasukkan pengujian/alih server/pembersihan data sebagai tindakan yang sudah dilakukan audit ini.
