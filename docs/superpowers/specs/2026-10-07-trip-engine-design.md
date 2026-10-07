# Seatpax — Trip Engine

Tanggal: 7 Oktober 2026. Status: **APPROVED DESIGN — awaiting implementation plan approval.** Pengguna menyetujui paket jadwal, publikasi atomik, snapshot dan penugasan crew dengan “sstuju”, lalu spec tertulis dengan “spec oke”. Belum diimplementasikan.

## Tujuan dan acuan

Admin PO menyiapkan perjalanan nyata dari sumber rute, tarif dan armada yang sudah tersedia; membuka penjualan menghasilkan data trip mandiri untuk slice availability/hold berikutnya. Keberhasilan: draft tersimpan, published trip mempunyai jadwal setiap stop, tarif segmen, seluruh layout, identitas kursi dan anchor inventory; mengubah sumber tidak mengubah hasil publikasi; crew hanya membaca trip yang ditugaskan.

Acuan: scope aktif `02_MVP_SCOPE.md`, ledger D2026-10-06-01/02 dan keputusan route/fleet, fondasi bagian 1–3/7, `05_ROUTE_SEAT_INVENTORY.md`, `06_FLEET_SEAT_TEMPLATE.md`, `10_DATA_MODEL_DATABASE.md`, `11_API_PROJECT_STRUCTURE.md`, latest UI direction, serta review R01/R02/R10/R14. Rekomendasi review belum diadopsi tidak menjadi keputusan melalui dokumen ini.

## Pendekatan dan batas

Paket ini mencakup draft/list/detail/edit, buka penjualan, snapshot atomik, preview snapshot, crew assignment/revocation, audit assignment dan publikasi, serta halaman crew read-only daftar/detail assigned trips. Scheduling-only menunda hasil yang diperlukan inventory; menggabungkan checkout/payment memperbesar task secara berlebihan. Pilihan yang disetujui menyelesaikan persiapan trip dalam satu slice.

Tidak mencakup passenger search/availability/hold, booking/payment, manifest/QR/boarding/snack, company-management UI, completion/cancellation workflow, penggantian armada, kalender berulang, conflict jadwal fisik armada/crew atau pelacakan GPS. Assignment bukan bukti crew benar-benar tersedia secara fisik; tidak ada janji mencegah jadwal armada bertabrakan.

## Draft dan jadwal

- State slice: `DRAFT` dan `OPEN_FOR_SALE`. Penyederhanaan state per domain 18.1; state operasional ditambahkan pada slice terkait. OPEN_FOR_SALE menyatakan publikasi berhasil, bukan jaminan setiap interval masih dapat dijual.
- Trip: UUID/company, nama trimmed 1–120 karakter, route/vehicle/service-class references, departure instant, optional global sales-close instant, revision mulai 1, status, timestamps, published_at dan source revisions/snapshot metadata.
- Pilihan kelas layanan diisi dari default armada dan dapat diubah secara eksplisit ke kelas aktif pada PO yang sama. Tarif menggunakan kelas trip terpilih; mengganti armada tidak diam-diam mengganti pilihan kelas yang sudah disimpan.
- UI input/display `Asia/Jakarta` (WIB, UTC+07:00), server menyimpan instants `timestamptz`. Server mengonversi input WIB secara eksplisit dan menolak tanggal/jam malformed; tidak mengandalkan timezone perangkat atau host.
- Departure adalah waktu keberangkatan stop pertama. Saat publish, departure offset stop pertama wajib 0. Departure offset setiap stop sebelum terminus dan arrival offset setiap stop setelah origin wajib tersedia; nilai arrival origin/departure terminus yang kosong boleh memakai departure/arrival stop itu sendiri. Semua nilai terisi mempertahankan batas 0–10080 menit dan monotonicity aturan route, arrival <= departure. Jam stop = departure instant + offset; tidak mengisi offset transit yang hilang dengan tebakan.
- Draft boleh menyimpan konfigurasi yang belum lengkap; UI menampilkan blocker publikasi. Referensi draft wajib same-company dan active saat baru dipilih/diubah. Referensi lama yang kemudian inactive masih terbaca; publish memeriksa seluruh sumber active lagi.
- Draft update memerlukan expectedRevision dan hanya berlaku ketika DRAFT. Konflik mempertahankan input dan meminta pengguna membaca versi terbaru; tidak ada silent overwrite. Tidak ada hard delete trip di slice ini.
- Publish wajib departure stop pertama masih di masa depan menurut waktu DB setelah lock. Global sales_close_at bila diberikan harus lebih besar dari waktu publikasi dan tidak lebih lambat dari departure terminus; boleh sebelum atau sesudah departure origin. Nilai null memberi cutoff per origin. Published data tidak dapat diedit melalui form draft.

## Publikasi dan snapshot

Dalam satu transaksi, validasi actor/membership, company ACTIVE, trip DRAFT/revision, sumber active, 2–50 stop unik berurutan, jadwal lengkap, seluruh adjacent fares untuk kelas terpilih, serta grid lengkap dengan sedikitnya satu SEAT. Tarif 0 valid; fare missing memblokir publish. Snapshot hanya memakai data yang sudah dibaca di bawah lock sumber.

Salin nama/code route, nama/code kelas, nama/plate armada dan source revisions untuk detail historis; ordered stop nama/kota/alamat dan instants; tiap adjacent segment beserta fare IDR integer; full layout `{rows,cols,cells:[{rowIndex,colIndex,type,label,seatCode}]}`; trip seats dari SEAT cells; serta satu inventory anchor untuk setiap seat × segment. Snapshot dan seat projection berasal dari satu layout tervalidasi. Semua cell non-seat tetap tersimpan untuk renderer.

Trip stops/segments/seats menggunakan ID baru yang mandiri. Source IDs adalah provenance, bukan dependency pada mutable route-stop/cell rows yang diganti oleh editor. FK ke source route/vehicle/class yang dipertahankan hanya untuk provenance/reference; renderer dan harga tidak membaca sumber live. Published snapshot/layout/schedule/fare bersifat immutable melalui service yang tersedia; privilege browser tidak membuka jalur write lain.

Publikasi ulang trip yang sudah OPEN_FOR_SALE mengembalikan hasil existing setelah authorization, tanpa menggandakan snapshot/inventory/audit. Tidak memvalidasi ulang sumber yang mungkin sudah berubah atau company suspension untuk read hasil retry; retry tidak membuka sale eligibility yang diblokir suspension/cutoff. Draft publish memakai expectedRevision; published retry tidak mengubah revision atau data. Kegagalan satu langkah rollback seluruh publikasi, termasuk status dan audit.

Cutoff interval untuk consumer mendatang adalah min(departure stop asal, global sales_close_at jika ada), eksklusif. Stop tengah yang belum cutoff tetap eligible walaupun origin telah berangkat; OPEN_FOR_SALE sendiri tidak cukup untuk mengizinkan transaksi. Service slice ini menyediakan snapshot/cutoff projection yang bisa dipakai consumer, bukan endpoint penjualan yang sudah berjalan.

## Schema dan invariant

Tambahkan `trips`, `trip_stops`, `trip_segments`, `trip_seats`, `trip_seat_inventory`, `trip_crew_assignments` dan audit append-only untuk aksi slice ini. Trip menyimpan layout JSON tervalidasi plus source identity labels/revisions. Segment mengacu pada dua trip-stop berurutan dan menyimpan fare; trip-seat menyimpan code/row/col/label. Inventory adalah anchor lock tanpa mengarang status booking/occupancy pada tahap ini.

Compound keys/FKs menegakkan same-company trip references; stop/segment/seat/inventory satu trip; assignment actor/target merujuk users yang tersedia. Unique trip/stop sequence, trip/segment sequence, trip/seat code, trip/seat coordinate, inventory trip/seat/segment, dan assignment trip/user. Checks: positif revision/sequence, nonnegative fare IDR, coordinate bounds, timestamp order lokal, state dikenali. Contiguous sequences, adjacency, complete grid dan exact seat×segment count diperiksa domain dalam transaksi. Row CHECK bukan klaim enforcement lintas tabel.

Assignment mengacu pada membership CREW company target (composite association atau equivalent constrained FK), bukan hanya Auth user arbitrary. Audit mencatat company/trip/actor/action/time dan target crew/source revision yang diperlukan, tanpa token/kredensial. Browser anon/authenticated grants direvoke; RLS aktif/default deny. Koneksi privileged tetap membutuhkan guard service.

## Authorization dan transaksi

Domain ditempatkan di `modules/trip`; server actions/data adapters tipis mengikuti route/fleet. Supabase identity diverifikasi di server; client actor/role/company bukan authority. Admin harus membership ADMIN_PO aktif pada company resource. Global Super Admin saja tidak mendapat tenant trip management. Draft/source management tetap boleh ketika company suspended; publish baru dilarang.

Mutasi admin mengunci actor membership FOR SHARE terlebih dahulu. Publish memakai company FOR SHARE sebelum dependency/trip locks, sesuai protokol suspension fondasi. Untuk menjaga urutan dengan source services, lock source stops UUID order, seat template FOR SHARE, service class FOR SHARE, vehicle FOR SHARE, route FOR SHARE, lalu trip FOR UPDATE. Dependency IDs dibaca sebagai kandidat sebelum lock; setelah trip/vehicle/route locks, recheck bahwa IDs/revisions tidak bergeser. Pergeseran menghasilkan conflict/retry, tidak menambah dependency lock secara terbalik. Lock route mencegah replacement route-stops/fare; template lock mencegah partial layout replacement. Pembacaan sumber hanya dilakukan setelah seluruh guard yang relevan didapat. Plan harus memeriksa urutan aktual route/fleet writes dan menyesuaikan secara konsisten bila diperlukan, tanpa mengubah snapshot contract.

Draft edit mengikuti urutan dependency yang sama sebelum trip lock; pure trip update tanpa dependencies tetap mengunci trip dan expectedRevision. Source services tidak mengunci trip. Semua mutable eligibility/time/revision diperiksa ulang sesudah lock; gunakan waktu DB aktual, bukan transaction-start time. Tidak ada network/provider call di dalam transaksi. Deadlock/timeout memberi error retryable; retry publish existing aman.

## Crew assignment

Satu trip boleh mempunyai beberapa crew. Admin PO menambah/mencabut assignment pada DRAFT atau published trip. Target harus membership CREW aktif pada company yang sama saat assignment/reaktivasi. Pair trip/user unik; status ACTIVE/REVOKED, assigned_by/assigned_at/revoked_at; reactivation menyimpan audit baru dan membersihkan revoked_at.

Assignment change mengunci target membership FOR SHARE sebelum trip dan assignment row; beberapa membership locks diperoleh UUID order, termasuk actor, agar dua admin yang juga crew tidak membentuk opposite membership-lock order. Disable membership dan revoke assignment selalu menolak akses request berikutnya. Assignment/revoke ulang state yang sama sukses idempotent tanpa audit duplikat; perubahan state diaudit satu kali.

Crew read memeriksa identity, active CREW membership dan ACTIVE assignment setiap request. Crew hanya membaca published trip yang assigned; DRAFT tetap admin-only. Suspension tidak mencabut akses crew published trip existing. Read mengembalikan jadwal/layout dan ringkasan perjalanan, tanpa passenger PII yang belum tersedia di slice ini. Assignment list/manage hanya admin tenant.

## UI

Navigasi admin tambah Perjalanan. List status/jam WIB/rute/armada/kelas; create/edit draft memilih sumber active dan menampilkan preview jadwal/tarif/layout serta blocker yang spesifik. Buka penjualan meminta konfirmasi bahwa jadwal/layout/tarif akan terkunci. Published detail memakai snapshot dan menampilkan kapasitas, segment count, inventory-unit count serta penugasan crew. Tidak menyebut unit inventory sebagai kursi terjual.

Crew memperoleh link Perjalanan saya melalui akun, list assigned published trips dan detail ringkasan/jadwal/layout. Label Indonesia, fokus keyboard, pending/error/empty states, responsif desktop/narrow, mengikuti admin styling sekarang. Tombol pending tidak menjadi satu-satunya pencegah retry duplikat.

## Bukti keberhasilan

1. Admin A menyimpan draft empat stop, tiga adjacent fares dan layout; publish menghasilkan empat stops, tiga segments, C seats dan 3×C inventory anchors.
2. Semua jenis cell/non-seat labels, jadwal lintas tanggal WIB, IDR 0, kelas override dan source identity labels tersimpan tepat; tarif/jadwal hilang memblokir publish atomik.
3. Source edit/archive setelah publish tidak mengubah renderer/detail/fare/schedule trip; publication retry tetap snapshot yang sama. Dua publish bersamaan hanya satu membuat snapshot/audit.
4. Stale draft revision/publish, malformed times/grid, foreign tenant sources/seat/segment references, inactive sources dan company suspended publish ditolak. Membership revocation dan suspension races diuji dengan locks yang sebenarnya.
5. Assignment/reaktivasi/revoke hanya same-company active crew, audit transition tunggal; crew unassigned/revoked/disabled dan admin B ditolak; Super Admin tanpa tenant membership ditolak.
6. Browser direct access semua tabel baru ditolak. Unit tests untuk projection/time/validation; PostgreSQL integration untuk atomicity/concurrency/constraints/authz, fixtures UUID unik dan cleanup exact terbatas.
7. Browser admin create/publish/reopen + crew assigned/revoked + foreign URL, desktop/narrow/keyboard; OTP ditangani pengguna bila diperlukan. Unit mocks tidak disebut bukti browser.
8. Typecheck/lint/build dan satu final reviewer GPT-6 Luna medium; hanya dev migration setelah inspection/target validation. Tidak ada claim passenger purchase sebelum availability/hold slice berikutnya.

## Self-review dan handoff

Rancangan konsisten dengan snapshot-at-first-publish fondasi. Offset wajib pada publish, state dua tahap, WIB-only input, class override, publication future-time restriction, global cutoff bounds, provenance independence, audit minimum dan halaman crew read-only adalah detail usulan yang harus direview pengguna dalam spec ini. Lock ordering harus dicek melawan source writers dalam plan; tidak membuat loop lock baru yang tidak dianalisis. Tidak ada product code/migration Trip Engine yang dibuat pada tahap spec.

Setelah persetujuan spec tertulis, gunakan writing-plans untuk plan yang reviewable. Preferensi execution inline dan reviewer Luna medium tetap berlaku; approval plan diperlukan sebelum implementasi sesuai workflow.
