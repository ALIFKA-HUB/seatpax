# Pendaftaran PO dan Free simulasi

Tanggal: 20 Oktober 2026. **Status: spesifikasi teknis usulan, menunggu review pengguna. Tidak memberi izin implementasi atau operasi penghapusan.**

## 1. Tujuan

PO baru dapat mendaftar mandiri, menyiapkan data operasional dengan batas Free, mencoba perjalanan sebagai pelanggan tanpa Midtrans, lalu mereset simulasi tanpa menyiapkan master dari awal. Seluruh pengalaman menggunakan label SIMULASI dan tidak menghasilkan tagihan atau tiket perjalanan nyata.

Acuan produk: [rancangan induk SaaS](2026-10-20-shuttle-saas-design.md), D2026-10-20-03, scope aktif dan kontrak inventori/checkout yang telah diadopsi. `docs/analysis/SEATPAX_SPEC_REVIEW.md` dibaca sebagai review historis dengan rekomendasi pending; bukan perluasan scope otomatis.

Dokumen membedakan **keputusan produk yang telah disepakati** dari **mekanisme teknis/default yang diusulkan untuk persetujuan melalui review dokumen ini**.

## 2. Ruang lingkup

Termasuk: registrasi workspace, profil kontak perusahaan, membership Admin pembuat, entitlement Free, kuota master, dashboard panduan, preview pelanggan, keberangkatan/hold/booking/pembayaran/tiket simulasi dan reset terkonfirmasi.

Tidak termasuk: billing Pro, koneksi merchant per PO, penjualan live bagi PO baru, domain khusus, recurring scheduler, per-trip route override, pengaduan, aplikasi Flutter, manajemen undangan/tambah Crew baru, atau migrasi otomatis seluruh demo lama ke Free. Kuota dua Crew disiapkan untuk jalur pemberian membership yang kelak disetujui; tidak membuat akun Crew palsu atau API undangan baru pada slice ini.

Penyiapan draft dan publication simulasi memakai kemampuan operasional yang ada. Istilah “jadwal” pada panduan berarti keberangkatan bertanggal, bukan janji jadwal berulang mingguan.

## 3. Kondisi kode saat ini

- `modules/company/service.ts` mengelola status perusahaan lewat Super Admin, belum registrasi mandiri.
- `modules/auth/entry-destination.ts` memilih tujuan berdasarkan membership, dengan fallback pelanggan `/trips`.
- `public.memberships` mengizinkan beberapa perusahaan per akun; belum ada batas khusus Admin PO satu perusahaan.
- Master rute/fleet dan snapshot trip berada di tabel yang sama dengan transaksi Sandbox lama. Banyak FK menggunakan RESTRICT.
- `modules/booking/checkout-service.ts` membuat booking/payment untuk adapter Midtrans. `modules/payment/confirmation-service.ts` mengikat konfirmasi ke merchant environment.
- Riwayat yang ada harus dipertahankan. Status ACTIVE/SUSPENDED perusahaan bukan status paket Free/Pro.

## 4. Pilihan isolasi simulasi

| Pendekatan | Implikasi |
|---|---|
| **Tabel simulasi terpisah — rekomendasi** | Batas reset jelas, transaksi lama tidak tersentuh; membutuhkan repository/service simulasi tersendiri |
| Tambah mode pada seluruh tabel transaksi lama | Lebih banyak kode dapat dipakai ulang, tetapi setiap query publik, webhook, worker, manifest dan FK perlu membedakan mode secara konsisten |
| Lingkungan/database per PO | Isolasi kuat, tetapi provisioning, koneksi dan migrasi berulang terlalu besar untuk kebutuhan Free awal |

Usulkan satu kelompok tabel di schema privat `simulation`, master operasional tetap company-scoped pada tabel sekarang. Reuse fungsi murni seperti interval, tarif, grid dan validasi; jangan menggandakan seluruh adapter Midtrans atau berpura-pura simulator adalah status provider terverifikasi.

## 5. Pendaftaran dan identitas

### Form yang disepakati

Nama perusahaan/shuttle, nama penanggung jawab, WhatsApp, kota/kabupaten dari katalog. Email dari akun login, tidak dapat diganti lewat payload form. Tidak ada unggahan dokumen atau logo pada pendaftaran awal.

Usulan validasi: nama perusahaan dan penanggung jawab 1–120 karakter setelah trim; WhatsApp dinormalisasi dari format Indonesia ke E.164 dan divalidasi konsisten dengan nomor domain yang ada; regency harus aktif pada saat commit. Nomor kontak tidak otomatis dipublikasikan dan tidak dianggap sudah diverifikasi WhatsApp.

Tidak mengalihkan semua pengguna baru ke registrasi PO. Login pelanggan tetap menuju perjalanan/return path aman. Aksi eksplisit “Daftarkan perusahaan” mengantar ke `/onboarding/po`; pengguna tanpa sesi login terlebih dahulu lalu kembali ke form tersebut. Slug dibuat server dengan suffix unik; editing slug/custom domain ditunda.

### Batas Admin PO

Disepakati: satu akun Admin PO untuk satu perusahaan. Usulan konservatif: membership ADMIN_PO yang DISABLED tetap mencadangkan hubungan perusahaan sampai kebijakan perpindahan disetujui. Ini mencegah penonaktifan membuka pendaftaran perusahaan baru tanpa batas. Aturan Crew lintas perusahaan tidak diubah.

Pembuatan perusahaan baru ketika akun sudah terdaftar sebagai Admin PO perusahaan lain ditolak dengan:

**Email sudah digunakan oleh Admin PO**

Email ini sudah terdaftar sebagai Admin PO di perusahaan lain. Gunakan email berbeda untuk melanjutkan.

Tombol **Ganti email** memulai pergantian akun melalui logout/login yang ada; tidak mengubah email Auth melalui form perusahaan. Jangan tampilkan daftar perusahaan atau hasil pencarian email orang lain kepada pengguna tanpa hak. Idempotent retry pendaftaran yang sama mengembalikan workspace yang telah dibuat, bukan menampilkan konflik palsu.

### Transaksi pembuatan workspace

Usulan kontrak: verified actor UUID + verified email dari server auth, request UUID dan payload tervalidasi. Lock user sebagai anchor pendaftaran; periksa reservasi Admin sebelum membuat data. Company, profil kontak privat, entitlement Free, membership ADMIN_PO dan receipt idempotensi dibuat dalam satu transaksi. Membership tetap sumber role yang diperiksa fresh, bukan user metadata.

Receipt menyimpan actor/request key, hash payload dan company hasil. Request key sama dengan payload berbeda menghasilkan conflict; retry yang sama tidak membuat perusahaan kedua. Dua request berbeda untuk actor sama juga tidak boleh membuat dua perusahaan. Slug collision ditangani server dengan bounded retry. Gagal transaksi tidak meninggalkan company tanpa Admin/entitlement.

Membership guard dan constraint database harus sama-sama menegakkan batas Admin. Sebelum menambah constraint, lakukan audit read-only atas membership lama. Jika ada akun ADMIN_PO lintas perusahaan, migration berhenti untuk penentuan mapping; jangan menghapus/menggabungkan membership otomatis.

## 6. Data dan otorisasi — usulan teknis

Tambahkan profil kontak perusahaan privat dan entitlement workspace yang eksplisit. Entitlement pertama hanya FREE_SIMULATION; record legacy tidak otomatis memperoleh paket Free atau hak Pro. Semua tabel baru pada schema yang diekspos harus RLS; schema simulasi tidak diberikan grant ke anon/authenticated atau Data API. Akses awal melalui layanan server, sesuai pola koneksi privileged yang sudah ada dengan pemeriksaan otorisasi eksplisit.

Entitas simulasi: run/generation workspace; keberangkatan beserta snapshot stop/fare/layout/seat/segment; holds; booking/passenger; pembayaran simulator; assignments/occupancy; tiket simulasi. Identitas semua relasi membawa company dan run yang konsisten. Receipt reset/audit disimpan di luar kumpulan yang dihapus. Tidak ada FK dari transaksi nyata ke transaksi simulasi.

Run adalah generasi data simulasi. Master rute, stop, kelas, armada, template dan akun tidak menjadi milik run. Publication membuat snapshot immutable supaya perubahan master tidak mengubah tiket simulasi sebelumnya.

Admin preview mempertahankan identitas actor aslinya. Setiap read/mutasi memeriksa membership ADMIN_PO aktif pada company, company masih dapat diakses dan run masih current; ID/slug client tidak memberi hak akses. “Coba sebagai pelanggan” tidak menciptakan role atau akun pelanggan baru. Tidak ada akses publik ke preview pada slice ini.

## 7. Kuota dan penyimpanan

### Kuota yang telah disepakati

Per workspace Free: 2 rute, 2 armada, 2 template, 2 Crew, 3 keberangkatan simulasi, 30 booking simulasi. Arsip/inaktif tetap dihitung; booking gagal atau expired juga dihitung sampai reset. Draft keberangkatan ikut dihitung agar tidak menjadi jalur menumpuk record.

### Jeda reset — disepakati setelah klarifikasi

Reset berikutnya paling cepat 60 detik setelah reset sebelumnya berhasil, per workspace. Simulasi baru langsung dapat digunakan setelah reset berhasil; yang dibatasi hanya tindakan reset berikutnya. Ini tidak menyetujui seluruh usulan teknis lain secara otomatis.

### Default tambahan yang diusulkan, belum merupakan keputusan final

- Maksimum 20 titik layanan dan 2 kelas layanan per workspace Free.
- Pertahankan batas validator saat ini: maksimal 50 stop per rute, grid 30×8/240 sel per template. Tidak menambah fitur unggahan file pada slice ini.
- Maksimum satu hold ACTIVE milik actor per run; hold berakhir mengikuti durasi domain yang ada. Sebelum membuat hold baru, bersihkan hold expired yang relevan agar tidak menumpuk.
- Tidak menyimpan histori setiap klik pembayaran. Maksimum satu record pembayaran per booking, hasil terminal immutable dan replay idempotent.
- Usulan implementasi audit: request reset yang ditolak tidak membuat audit baru. Receipt reset diringkas ke 20 hasil terakhir per workspace, tanpa identitas penumpang. Detail retensi ini khusus simulasi dan perlu persetujuan; jeda reset 60 detik sendiri telah disepakati di atas.

Angka tambahan tersebut diajukan untuk membatasi record turunan; dapat direvisi saat review. Free tidak boleh dirilis tanpa batas ini atau penggantinya yang disepakati.

Kuota dicek di server di dalam transaksi yang menahan anchor entitlement/run. Semua create/clone/import/re-activate/membership grant yang tersedia harus memakai aturan yang sama; edit record yang sudah ada tidak mengonsumsi slot kedua. Hitung data tersimpan, bukan hanya record berstatus aktif. Penguncian membership → company → entitlement → run → resource mengikuti satu urutan di semua mutasi baru; perubahan status/membership harus diaudit kompatibilitas lock-nya sebelum implementasi.

## 8. Dashboard dan preview pelanggan

Dashboard Free menampilkan badge **Free · Simulasi**, pemakaian kuota dan panduan titik layanan → rute → armada → jadwal. Dependensi template/kelas sebelum armada tetap ditunjukkan oleh form yang ada. Status panduan dihitung dari data, bukan flag frontend yang dapat kedaluwarsa.

Saat belum ada keberangkatan siap, tombol “Coba sebagai pelanggan” menjelaskan prasyarat dan memberi tautan penyiapan. Setelah siap, preview menampilkan hanya keberangkatan simulasi PO tersebut. Semua halaman memilih perjalanan/kursi, checkout, hasil dan tiket memuat label SIMULASI serta tombol kembali ke dashboard. Gunakan palette/logo Seatpax yang ada dan layout responsif.

Usulan path privat: `/admin/companies/{id}/simulation` dengan turunan trips, holds, bookings dan tickets. Prefix URL membantu UX, tetapi service tetap wajib memeriksa actor/tenant/run. Tidak mencampur hasil simulasi ke `/trips`, My Tickets nyata, laporan pendapatan atau manifest perjalanan nyata.

## 9. Transaksi dan simulator pembayaran

Preview memakai satu passenger/seat per booking, sesuai retained checkout SELF/OTHER; data percobaan tidak mengubah profil pribadi actor. Tarif dihitung server dari snapshot dan bernilai positif seperti checkout saat ini. Hold, interval occupancy dan deadline memakai fungsi murni domain yang ada: durasi hold 10 menit, initiation valid memberi tambahan 60 detik satu kali. Jam database menjadi acuan.

Initiation dan pemilihan hasil simulator adalah mutasi berbeda. Initiation mengikat hold, fare, passenger dan request key. Tidak memanggil Midtrans, tidak mengisi identitas merchant palsu dan tidak menyimpan key provider.

| Tindakan simulator | Hasil yang diusulkan |
|---|---|
| Menunggu | Payment PENDING; booking PENDING_PAYMENT, tidak ada tiket |
| Berhasil sebelum deadline dengan hold sah | Payment SIMULATED_PAID, booking CONFIRMED, occupancy dan satu tiket simulasi atomik |
| Gagal | Payment FAILED, booking gagal; hold/occupancy simulasi dibebaskan atomik |
| Kedaluwarsa | Payment EXPIRED, booking expired; hold/occupancy simulasi dibebaskan atomik |

Berhasil setelah deadline atau inventory tidak lagi sah tidak boleh merebut kursi: hasil simulasi PAYMENT_CONFLICT tanpa tiket. UI menawarkan reset/booking baru; resolver manual konflik dan refund simulasi bukan scope awal. Payment yang sudah SIMULATED_PAID tidak dapat diturunkan oleh klik lain. Hasil terminal lain tidak dibuka kembali; skenario baru memakai booking baru. Hasil PENDING dapat dilanjutkan ke hasil terminal. Request idempotensi sama/payload berbeda ditolak.

Tombol sukses/gagal/expired memanggil service simulator dengan authority Admin, bukan webhook publik atau adapter konfirmasi Midtrans. Kode QR simulasi memakai namespace berbeda dan hanya di-resolve pada halaman simulasi; scanner layanan nyata menolaknya. QR/tiket nyata yang lama tidak diubah. Kunci/token simulasi tidak memberi akses lintas perangkat tanpa sesi/authorization.

## 10. Reset terkonfirmasi

Disepakati: hapus transaksi dan keberangkatan simulasi, pertahankan profil serta master. Usulan implementasi: modal memuat jumlah data dan current run/revision. Konfirmasi mengirim run/revision serta request key, bukan daftar ID dari browser.

Di dalam transaksi: fresh guard → lock entitlement/run → recheck current run/revision dan cooldown → hapus seluruh dependensi run sesuai FK → buat generasi run baru → simpan receipt audit ringkas. Snapshot trip, inventory, holds, booking/passenger, pembayaran, occupancy/assignment, tiket dan event simulasi terkait ikut dibersihkan. Tidak menonaktifkan constraint untuk memaksa DELETE.

Seluruh mutasi preview memeriksa current run di bawah lock yang sama dan menaikkan revision run setelah perubahan yang berhasil. Jika mutasi mendahului konfirmasi reset dan mengubah revision, ringkasan reset harus dimuat ulang; jika reset mendahului mutasi, request run lama ditolak. Tidak ada worker simulator yang menulis ulang run lama. Retry reset yang telah sukses mengembalikan receipt, bukan menghapus run baru. Jika receipt lama sudah keluar dari retensi, request run lama ditolak sebagai usang. Request reset dengan revision lama tidak boleh menghapus generasi baru secara diam-diam.

Tiket/tab lama menampilkan “Simulasi ini sudah direset. Mulai simulasi baru.” Transaksi publik/legacy dan identitas Auth tidak ikut dihapus. Reset juga tidak menghapus Crew atau mengembalikan kuota master yang tetap tersimpan.

## 11. Error dan perilaku pengguna

- Session habis: login lalu kembali ke halaman aman; jangan mengirim ulang mutasi tanpa recheck.
- Kuota tercapai: tampilkan pemakaian/batas dan pilihan kelola data, reset transaksi simulasi atau lihat paket. Reset tidak ditawarkan sebagai solusi kuota master karena master dipertahankan.
- Katalog wilayah tidak tersedia: simpan input non-wilayah di form dan beri retry; jangan menerima kota teks bebas sebagai fallback baru.
- Kursi diambil/tab usang: refresh availability, pertahankan pesan yang jelas; tidak menerbitkan tiket berdasarkan state browser.
- Gagal pendaftaran/reset: tidak menampilkan sukses sebelum commit; retry aman dengan request key yang sama.
- Upgrade: CTA informatif saja sampai billing diimplementasikan; tidak ada tombol yang mengaktifkan Pro langsung dari client.

## 12. Perubahan kode yang direncanakan secara konseptual

`modules/onboarding` mengurus atomic registration; `modules/subscription` awalnya hanya entitlement Free dan quota guard; `modules/simulation` menangani run, preview transactions, simulator dan reset. Repository menyembunyikan SQL, service memegang aturan dan transaction boundary. App server actions mendapatkan verified actor serta mengembalikan hasil/error; tidak menerima role/plan dari client.

Master services di `modules/route`, `modules/fleet`, `modules/pricing` dan draft/publication perlu quota hook untuk workspace Free. Publication simulasi menghasilkan snapshot di repository simulasi; jalur publication nyata menolak entitlement Free. Jalur publik yang menerima company/trip ID juga harus menolak company Free, termasuk URL langsung, hold dan payment initiation. Existing legacy company tetap mengikuti kontrak lama sampai migrasi SaaS terpisah disetujui.

## 13. Migrasi dan gerbang penerimaan

Migration bersifat aditif. Tidak mengonversi booking/payment/ticket lama menjadi simulasi, tidak menghapus data, tidak mengubah Demo A/B menjadi Free dan tidak mengubah ACTIVE/SUSPENDED existing. Audit membership lama menentukan apakah constraint Admin baru aman. Migrasi/aplikasi development baru memerlukan plan yang direview; penulisan dokumen ini tidak menerapkan schema.

Kriteria penerimaan untuk verifikasi nanti: pendaftaran/retry paralel menghasilkan satu perusahaan; field email/role/plan palsu diabaikan/ditolak; tenant lain tidak dapat membaca simulasi; kuota tidak terlewati pada request bersamaan; Free tidak masuk discovery/payment nyata; preview berhasil/pending/gagal/expired tidak memanggil provider; replay sukses tidak menggandakan tiket; reset versus checkout/retry tidak menghasilkan orphan atau transaksi hidup kembali; master/legacy tetap utuh; tampilan dapat dipakai pada desktop/tablet/mobile. **Tidak ada test atau migrasi yang dijalankan dalam pekerjaan penulisan spec ini.**

## 14. Hal yang harus disetujui melalui review ini

1. Tabel simulasi terpisah dengan shared master dan private Admin preview.
2. Membership Admin DISABLED tetap mencadangkan satu perusahaan; perpindahan melalui proses terpisah yang belum dibangun.
3. Default tambahan: 20 titik, 2 kelas, batas grid existing, satu active hold/actor/run dan 20 receipt reset terakhir. Cooldown reset 60 detik sudah disepakati setelah klarifikasi.
4. State simulator, penanganan late simulated success, serta tidak adanya resolver/refund simulasi pada slice awal.

Jika salah satu ditolak, revisi spesifikasi sebelum plan. Keputusan lain pada rancangan induk—tanggal billing Pro, perubahan benefit, verifikasi merchant dan penjualan live—tetap pekerjaan terpisah dan tidak menghambat slice Free yang terisolasi ini.
