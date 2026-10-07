# Seatpax — Rute dan tarif untuk admin PO

Tanggal: 7 Oktober 2026. **Status: PROPOSED — review spec tertulis pending.** Pengguna menyetujui paket rute, stop, kelas layanan, tarif segmen dan halaman admin; belum menyetujui spec/plan implementasi baru.

## Tujuan dan acuan

Admin PO membuat rute empat stop, menetapkan tarif tiga segmen per kelas layanan, lalu mencoba total tarif perjalanan. Admin PO B tidak dapat mengakses data PO A. Hasil ini menjadi input pembuatan trip berikutnya.

Acuan: scope aktif dan ledger D2026-10-06-01/02; schema proposal bagian20.4–20.8; API/project structure; latest UI direction; review R10 mengenai konsistensi tenant; fondasi snapshot trip. UI sederhana dengan komponen/form yang bisa dipakai, sesuai arahan pengguna yang sekarang mempunyai waktu lebih banyak.

## Model dan invariant

- `stops`: UUID, company FK, nama, kota, alamat nullable, ACTIVE/INACTIVE, timestamps. Koordinat/maps ditunda.
- `routes`: UUID, company FK, nama, code nullable, ACTIVE/INACTIVE, revision integer mulai1, timestamps.
- `route_stops`: UUID, company FK, route FK, stop FK, sequence mulai1; offset arrival/departure menit nullable. Daftar minimal dua stop dengan sequence berurutan. Composite FKs memastikan route dan stop berasal dari company sama. Unik route/sequence dan route/stop.
- `service_classes`: UUID, company FK, nama, code, ACTIVE/INACTIVE, timestamps. Code unik per company. Amenity editor ditunda.
- `segment_fares`: UUID, company FK, route FK, endpoint route-stop FK, service-class FK, harga integer rupiah nonnegatif, currency IDR. Unik route/endpoints/class; endpoint harus berurutan dalam route sama. Composite FKs mencegah referensi lintas company/route; adjacent sequence diperiksa layanan di bawah route lock.
- Usulan aturan release: stop sama tidak boleh berulang dalam satu route; rute loop ditunda. Batas input: nama/kota1–120 karakter, alamat maksimal500, code1–32; trim; code lowercase slug. Maksimal50stop per route; offset integer0–10080menit, arrival<=departure pada stop sama dan offset yang terisi tidak mundur sepanjang rute. Aturan/batas ini baru diusulkan dalam spec ini.
- Harga diproses sebagai integer/bigint, bukan float. Input/response wire berupa string desimal; total tidak kehilangan presisi. Tarif0 valid. Segmen hilang berarti quote belum tersedia, bukan dianggap0.

## Perubahan rute dan transaksi

Simpan nama, ordered stops, offsets dan tarif sebagai perubahan terkontrol. Reorder/add/remove stop hanya ketika belum ada fare tersimpan; jika fare ada, tolak dengan pesan jelas. Pengguna dapat menghapus konfigurasi fare kelas terkait lewat tindakan eksplisit sebelum mengubah urutan. Metadata stop/route tetap dapat diedit; future trip memakai snapshot immutable.

Setiap write memverifikasi Auth identity dan membership ADMIN_PO aktif; kunci membership row FOR SHARE dan baca ulang dalam transaksi agar disable yang menang lock lebih dulu ditolak. Kunci route FOR UPDATE sebelum membaca revision dan mengubah ordered stops/fare. Client mengirim expectedRevision; stale revision menghasilkan conflict dan meminta refresh, tanpa overwrite diam-diam. Semua write route/fare menaikkan revision. Lock order membership→route; tidak ada provider/network call di transaksi.

Profile bootstrap/identity dilakukan sebelum transaksi. Resource tenant berasal dari database. Company yang dipilih client tetap harus lolos membership; Super Admin tanpa ADMIN_PO pada company tidak bisa menggunakan fitur ini. Crew/passenger ditolak. Company suspension tetap bukan pencabutan membership; slice ini mengelola template, bukan membuka penjualan.

Penghapusan stop/route/class memakai INACTIVE, bukan hard delete. Form menyaring entitas aktif untuk pilihan baru; referensi lama tetap dapat dibaca. Quote preview memerlukan route, endpoints dan class aktif serta seluruh adjacent fares tersedia. Race aktivasi/mutation diserialisasi dalam transaksi relevan; lock resource terkait sesudah membership dan sebelum route secara konsisten (stop/class UUID terurut bila diperlukan).

## Quote preview

Input routeId, fromRouteStopId, toRouteStopId, serviceClassId. Server memvalidasi tenant, endpoint route sama dan from<to; ambil tarif adjacent pada interval [from,to), jumlahkan sebagai bigint, kembalikan string total IDR dan rincian segmen. Quote ini preview template admin, bukan checkout price atau inventory reservation. Trip nanti menggunakan snapshot fare, bukan route aktif yang dapat berubah.

## Server dan database boundary

Domain di `modules/route` dan `modules/pricing`; repository berisi SQL, service berisi validasi/authz/state/transaksi; handler/action tipis. Runtime privileged SQL tetap wajib guard. Migration additive, RLS aktif dan REVOKE anon/authenticated pada semua tabel baru; tidak memberikan browser write policy.

## Halaman admin

`/admin` memilih company dari membership ADMIN_PO aktif milik akun. Jika satu company, pilih otomatis; beberapa company ditampilkan sebagai pilihan. URL company adalah target yang diverifikasi server, bukan bukti hak akses. `/admin/companies/[companyId]/routes` daftar rute; detail route untuk ordered stops/fare preview; halaman stops dan service-classes untuk master data.

UI mengikuti latest direction di13_UI_UX_DESIGN.md: bahasa Indonesia, konsistensi visual project, form berlabel, fokus keyboard, status/error terbaca, layout mobile. Kontrol move-up/down untuk stop, tanpa drag-and-drop. Currency ditampilkan sebagai rupiah; input integer tanpa pemisah ambigu. Loading/pending mencegah submit ganda; empty state memberi tindakan pertama. Konflik stale mempertahankan input dan menawarkan refresh. Navigasi akun memberi link admin hanya bila membership sesuai; penyembunyian link bukan security guard.

## Bukti keberhasilan

1. Login admin A membuat stop/kelas/rute4stop dan3fare; preview stop1→3 tepat jumlah dua tarif, segmen0 valid.
2. Admin B tidak dapat list/read/write resource A dengan mengganti URL/ID; crew, passenger, Super Admin tanpa ADMIN_PO ditolak.
3. FK lintas company/route, duplicate sequence/class-code, malformed offsets/harga, reversed/equal endpoints ditolak.
4. Dua penyimpanan revision sama hanya satu menang; fare mutation dan reorder tidak membuat tariff endpoint tidak valid.
5. Missing fare memblokir quote; disabled membership memblokir write termasuk pemeriksaan transaksi; browser direct table access ditolak.
6. Source route dapat menjadi input snapshot trip berikutnya; slice ini belum mengklaim trip/publish/inventory/payment tersedia.
7. Unit dan PostgreSQL integration tests terpisah; fixtures memakai UUID run dan cleanup terbatas. Perbaiki seed integration fixture lama agar tes tidak memerlukan penghapusan seed permanen.
8. Typecheck/lint/build, smoke form desktop/mobile/keyboard, serta satu final reviewer Luna medium. Pengguna sendiri melakukan OTP bila diperlukan.

## Self-review dan handoff

Paket konsisten dengan kalender route/pricing. Larangan repeated stop, batas input, revision conflict dan pembatasan reorder ketika fare ada adalah keputusan baru yang membutuhkan review spec ini. Tidak menambahkan booking, maps, invitation, payment atau role editor. UI dan DB menjadi satu deliverable yang dapat dicoba.

Setelah spec disetujui: writing-plans menyusun plan; inline execution yang sudah dipilih dipertahankan, final reviewer Luna medium. Plan direview sebelum implementasi.
