# Langganan Pro 30 hari — billing Sandbox

Tanggal: 20 Oktober 2026. **Status: draft teknis untuk review. Arah produk disepakati; mekanisme teknis di dokumen ini belum disetujui sampai review keseluruhan spec. Belum ada izin implementasi billing.**

## 1. Tujuan dan batas

Admin PO dapat mencoba membeli/perpanjang Pro melalui Midtrans Sandbox, melihat invoice, periode 30 hari, grace dan riwayat perubahan paket. Pengujian tidak perlu menunggu satu bulan karena ada fasilitas advance waktu khusus billing development. Persetujuan pengguna mencakup scope Sandbox ini, bukan penarikan uang nyata atau aktivasi penjualan tiket live.

Dependensi: [rancangan induk SaaS](2026-10-20-shuttle-saas-design.md), [Free onboarding](2026-10-20-po-onboarding-free-simulation-design.md) dan implementasi branch `codex/po-free-simulation`. Branch Free masih belum digabung dan belum diverifikasi. Plan billing harus memilih base yang membawa kode Free beserta keputusan dokumentasi terbaru tanpa menimpa perubahan lokal pengguna.

Di luar slice: autodebit, multi-periode/annual purchase, prorata upgrade/downgrade, production payment, pajak/invoice fiskal, refund provider nyata, koneksi merchant tiap PO, public portal live, perubahan jadwal perjalanan, undangan Crew dan aplikasi Flutter. Harga Rp299.000 adalah nominal percobaan yang di-quote; tidak menyatakan kebijakan pajak komersial sudah selesai.

## 2. Keputusan produk yang telah disepakati

| Ketentuan | Aturan |
|---|---|
| Paket awal | Pro Rp299.000 per workspace per **30 hari/720 jam**; benefit awal 30 armada operasional |
| Pembayaran | PO memulai pembayaran invoice sendiri; tidak ada autodebit |
| Aktif pertama | Periode pertama dimulai saat pembayaran terverifikasi |
| Bayar sebelum habis | Tambah 30 hari setelah akhir periode yang sedang berjalan; sisa hari tidak hilang |
| Bayar dalam grace | Tambah 30 hari dari akhir periode sebelumnya; grace yang terpakai termasuk periode tersebut |
| Grace | 7 hari setelah expiry; layanan existing dilanjutkan sesuai kewajiban dan pengingat |
| Setelah grace | Penjualan baru berhenti; pembayaran terverifikasi memulai 30 hari baru tanpa tunggakan masa layanan berhenti |
| Invoice renewal | Otomatis H-7 sebelum expiry |
| Pengingat | Dashboard/email H-7, H-3, H-1, expiry, grace hari ke-3 dan ke-6; berhenti untuk kewajiban yang sudah dibayar |
| Ubah paket | Minimal 30 hari pemberitahuan; periode yang sudah dibayar mempertahankan versi yang dibeli; semua pelanggan akhirnya mengikuti versi baru |
| Data dan tiket | Tidak dihapus/dibatalkan karena tunggakan SaaS; kewajiban penumpang dan fulfillment valid tetap dilindungi |

Keputusan fixed 30 hari menggantikan bulan kalender dan aturan tanggal akhir bulan sebelumnya.

## 3. Arsitektur yang direkomendasikan

Pilihan A, **direkomendasikan**: domain `modules/subscription` untuk paket/invoice/periode dan adapter `modules/subscription/payment` untuk Midtrans. Financial rows dan receipt billing berada terpisah dari booking/payment tiket. Reuse fungsi murni/verifikasi transport yang aman; jangan memakai confirmation booking untuk membeli paket.

Pilihan B: memasukkan langganan ke `public.bookings/payments` existing. Ditolak dalam rancangan ini karena FK, hold, merchant dan expiry 11 menit terkait tiket tidak sesuai invoice SaaS. Pilihan C: memakai Midtrans recurring subscription ditunda karena pengguna memilih pembayaran manual.

Status plan/pembayaran Sandbox disimpan sebagai overlay **SANDBOX**, bukan mengubah status perusahaan, membership atau entitlement Free menjadi produksi. UI wajib menyebut “Pro Sandbox · Pembayaran uji”. Data rute/armada simulasi tetap memakai batas Free yang sudah ada pada slice ini; batas Pro yang ditampilkan adalah benefit paket yang diuji, bukan janji akses operasional live. Implementasi kuota Pro produksi selain armada tetap pekerjaan berikutnya.

## 4. Jam, interval dan klasifikasi waktu

Simpan timestamp UTC, tampilkan Asia/Jakarta (WIB) dengan tanggal **dan jam** jatuh tempo. Satu hari berarti 24 jam, sehingga periode 30×24 jam dan grace 7×24 jam. Interval aktif `[starts_at, ends_at)`; grace `[ends_at, ends_at+7 hari)`. Tepat di batas akhir grace termasuk sesudah grace.

Usulan arti “pembayaran terverifikasi”: simpan `recognized_at_real` satu kali dari jam database ketika service pertama kali mengesahkan GET Status provider, dan `recognized_at` untuk periode bisnis sebagai waktu nyata tersebut + offset billing workspace uji. Tanpa offset, keduanya sama. Callback browser dan timestamp client tidak dapat menentukan tanggal aktif. Timestamp provider tetap disimpan sebagai evidence bila tersedia, tetapi tidak menggeser recognition secara retroaktif. Dengan aturan ini keterlambatan callback setelah masa berhenti tidak memotong 30 hari reaktivasi yang baru diberikan. Mekanisme ini perlu persetujuan melalui review spec.

Tanggal renewal ditentukan dan disimpan atomik pada konfirmasi:

- Pembelian pertama: start = recognized_at, end = start+30 hari.
- Renewal saat masih aktif atau dalam grace: start = paid current period.end, end = start+30 hari.
- Reaktivasi sesudah grace: start = recognized_at, end = start+30 hari.

Satu renewal yang sudah dibayar boleh menunggu sebagai periode mendatang; tidak menjual rangkaian beberapa periode lama sekaligus. Aktivasi periode mendatang dihitung dari waktu, bukan memerlukan job tepat pada detik expiry. Unique invoice settlement mencegah webhook retry menambah 30 hari berkali-kali.

## 5. Paket dan perubahan versi

Platform Admin mengedit draft versi Pro: nama, harga integer IDR positif, vehicle allowance integer positif; duration 30 hari dan grace 7 hari tetap kontrak slice, bukan toggle bebas. Seed versi pertama Rp299.000/30 armada. Benefit lain tidak diberi nilai “unlimited” karena belum disepakati.

Publish membuat snapshot immutable dengan `published_at` dan `effective_at >= published_at+30 hari`. Versi yang sudah published/terjual tidak diedit; koreksi memakai versi baru. Pada waktu yang sama hanya satu versi untuk satu effective instant. Versi yang telah diberitahukan tidak boleh dihapus atau dimundurkan diam-diam dalam slice ini. Published price/benefit change mempunyai audit actor, from/to snapshot, waktu dan alasan.

Usulan pemilihan versi: pilih versi terbaru yang `effective_at <= target period start`. Target renewal adalah akhir periode saat ini. Jadi invoice H-7 dapat menampilkan versi baru untuk periode yang memang mulai setelah tanggal berlakunya; halaman invoice menunjukkan tanggal perubahan dan benefit dengan jelas. Periode dibayar lebih awal tetap mendapat versi invoice yang dibeli. Pembelian awal/reaktivasi menargetkan waktu quote saat itu.

Invoice dan payment attempt menyimpan versi/nominal immutable. Jika invoice belum dibayar, belum punya attempt yang terbuka, dan versi yang layak berubah atau renewal berubah menjadi reaktivasi, supersede invoice lalu buat quote baru. Jangan mengganti harga di row yang sama. Tampilkan perubahan dan minta PO menekan Bayar lagi.

Attempt yang sudah dibuat dengan quote sah sebelum cutover dihormati sesuai harga/benefitnya jika provider benar-benar sukses. Ini dapat mempertahankan versi lama untuk paling banyak satu pembelian yang sudah dimulai; setelah itu renewal mengikuti versi baru. Upaya baru tidak dapat terus memakai invoice/attempt lama. Tidak ada grandfathering berulang tanpa batas.

Pemilihan armada saat penurunan kuota hanya dicatat sebagai kebutuhan entitlement produksi; slice Sandbox menampilkan jumlah/versi yang akan berlaku dan status perhatian, tidak menonaktifkan armada nyata. Alur pemilihan armada produksi yang telah disepakati tetap berlaku untuk slice aktivasi live berikutnya.

## 6. Invoice dan payment attempt

Invoice memuat company, environment SANDBOX, tujuan FIRST/RENEWAL/REACTIVATION, versi paket, nominal IDR, duration, target start, due_at, status dan predecessor bila superseded. Identitas invoice berbeda dari provider order. Status invoice: OPEN, PAID, SUPERSEDED; status overdue adalah tampilan dari waktu, bukan bukti transaksi gagal.

Untuk renewal: unik per workspace dan periode sumber. Job H-7 bersifat idempotent; jika terlambat, buat invoice sekali pada tick berikutnya. Tidak mengeluarkan invoice renewal baru untuk periode yang sudah memiliki paid successor. Invoice FIRST dibuat atas aksi Upgrade pengguna, bukan otomatis menagih semua akun Free.

Usulan batas checkout: satu attempt nonterminal per invoice/workspace, expiry provider **maksimal satu jam waktu nyata** dari initiation. Provider order `spxsub-{uuid}` tidak lebih dari batas parser 50 karakter. Invoice dapat tetap terbuka setelah attempt expired; retry berikutnya membuat attempt baru hanya sesudah status attempt lama dipastikan terminal. Batasi maksimum 20 attempt tersimpan per invoice pada slice awal; ketika habis, tampilkan perlu bantuan, jangan menghapus histori pembayaran untuk membuka kuota.

Create memakai lease pendek dan request key/hash. Jika create timeout/hasil tidak pasti, query GET Status untuk order **yang sama** sebelum mengizinkan order baru. Status provider yang belum diketahui mengunci retry berisiko sampai reconciled; jangan mengasumsikan belum dibayar karena browser ditutup.

Tidak mengaktifkan Pro dari callback Snap. UI kembali ke invoice menunggu server, dengan “Perbarui status”. Tidak menyediakan tombol “Tandai lunas” kepada Admin PO. Platform Admin hanya membaca queue discrepancy pada slice ini; manual paid/refund override tidak termasuk.

## 7. Webhook, rekonsiliasi dan konfirmasi

Gunakan merchant Sandbox Seatpax, terpisah secara domain/order prefix dari pembayaran tiket. Receiver existing tetap satu URL yang telah dikonfigurasi; router membedakan order tiket/billing hanya sesudah memverifikasi signature/merchant dan memetakan order ke row tersimpan. Prefix client saja tidak memberi otoritas. Unknown order tidak menciptakan invoice/company otomatis.

Verifikasi GET Status, merchant, order ID, amount dan currency sebelum settlement. Hanya mapping success yang sudah diterapkan secara benar untuk status settlement/capture yang memenuhi fraud checks. Pending/challenge/unknown tidak mengaktifkan periode. Receipt durable disimpan sebelum acknowledgment; event key membedakan retry identik dari perubahan status. Arrival out-of-order tidak menurunkan PAID.

Konfirmasi mengunci subscription workspace lalu invoice/attempt, recheck identity/status, menyimpan financial success, invoice PAID dan satu purchased period dalam transaksi atomik. Constraint unik invoice→period, provider order dan transaction identity menjaga once-only grant. Jika lebih dari satu attempt benar-benar sukses karena anomali provider, grant satu periode saja dan tempatkan kelebihan ke REVIEW; jangan menghilangkan evidence atau otomatis membebankan refund yang belum ada.

Reconciler bounded memproses missing/failed receipts dan payment attempts unresolved. Layanan otomatis tidak bergantung pada pengguna membuka halaman. Tidak menambah active access tanpa provider truth. Profile/role/entitlement updates tidak dilakukan oleh webhook.

## 8. Model data dan authorization

Usulan schema privat billing berisi plan_versions, subscriptions, invoices, payment_attempts, payment_events, purchased_periods, reminders/outbox dan admin_audit. Semua financial row terkait company dan environment secara konsisten, menggunakan compound identity/FK, amount integer positif dan batas JSON/teks. Tidak ada FK invoice ke passenger booking, hold atau inventory tiket. Retensi finansial tidak memakai reset simulasi Free.

Satu subscription Sandbox per company; satu current plus paling banyak satu future paid period. Active/GRACE/EXPIRED/SCHEDULED diturunkan dari interval dan billing clock. Invoice status bukan status perusahaan. Manual SUSPENDED tidak otomatis hilang ketika invoice dibayar. Purchased version tidak diperbarui melalui join mutable ke katalog terbaru.

Admin PO aktif hanya dapat melihat dan membayar invoice workspace-nya; fresh membership/company checks dilakukan pada setiap aksi pengguna. Settlement provider yang sudah sah tetap direkam meski membership pembayar kemudian dicabut atau perusahaan disuspend; pencatatan pembayaran tidak mengembalikan role/akses atau membatalkan suspend. Platform Admin aktif SUPER_ADMIN global dapat melihat daftar perusahaan/invoice serta publish plan, tetapi tidak otomatis menjadi Admin PO operasional. Email billing adalah email verified pemilik Admin yang mendaftar; perubahan billing contact/undangan bukan slice ini. Jika pemilik tidak aktif/tidak ada, pengiriman email ditahan dan tampil perhatian di dashboard platform.

Handler/server action tipis mengikuti `11_API_PROJECT_STRUCTURE.md`; transaksi dan idempotensi berada pada domain service. Browser tidak dapat mengirim role, versi efektif, harga, durasi, waktu aktif atau status PAID sebagai authority. Tabel billing tidak diberi browser/Data API grants; exposed tables wajib RLS. Server secrets tidak masuk client bundle atau log.

## 9. Pengingat dan email

Materialize satu reminder per subscription/source period/stage/channel. Tahap dihitung terhadap akhir periode bersangkutan: -7/-3/-1/0/+3/+6 hari. H-7 sekaligus invoice-created reminder, bukan dua email. Sebelum enqueue **dan** sebelum send, recheck invoice belum settled, belum superseded dan source period masih relevan. Paid invoice membatalkan kewajiban reminder yang tersisa secara atomik.

Jika worker baru hidup setelah beberapa tahap terlewat, usulkan mengirim tahap terbaru yang masih relevan saja; jangan membanjiri PO dengan seluruh email lampau. Simpan skipped/delivered/retry status dan lease. Dashboard dapat menampilkan perhatian segera berdasarkan jam meskipun email gagal.

Saat ini Brevo dipakai sebagai SMTP Supabase Auth, belum ada transactional email adapter aplikasi. Jangan memakai template OTP sebagai invoice sender. Usulkan outbox email billing dengan transport tersendiri yang dikonfigurasi kemudian, retry bounded dan redacted errors. Default Sandbox adalah **capture email tanpa mengirim**; platform dapat melihat preview/status “Belum dikirim”. Real send memerlukan sender/transport siap dan permintaan uji pengiriman yang eksplisit. Ini mempertahankan kontrak fitur email tanpa berpura-pura sudah delivered.

Untuk transport yang tidak menjamin idempotent delivery, jangan menjanjikan exactly-once email; outbox mengurangi duplikat dan memastikan retry tercatat. Tidak menyimpan kredensial atau isi kontak sensitif dalam audit publik.

## 10. Sandbox clock untuk pengujian nanti

Gate billing Sandbox dan gate advance clock terpisah, server-only, default off. Advance hanya pada NODE_ENV development, merchant environment sandbox, workspace yang eksplisit di-allowlist untuk uji, dan actor ADMIN_PO aktif untuk workspace tersebut atau SUPER_ADMIN berwenang. Gate tidak dapat diaktifkan lewat querystring/client header.

Clock billing adalah jam database + offset monotonic per workspace uji; UTC tetap sumber timestamp nyata provider/receipt. Purchased period/invoice/reminder bisnis memakai clock billing. Tidak mengubah server OS, database clock, Supabase OTP/JWT, jadwal trip, hold kursi, payment timeout atau payment event legacy.

UI menawarkan maju ke H-7, expiry, grace day 3/6 dan setelah grace berdasarkan state, dengan konfirmasi serta audit. Tidak dapat mundur, lintas workspace atau mengubah interval pembelian lama. Batasi offset maksimal 366 hari dan satu aksi advance per 5 detik/workspace agar worker tidak dibanjiri. Angka batas ini adalah usulan teknis untuk review.

Tidak boleh advance ketika ada payment attempt nonterminal/unknown/processing lease; reconcile/selesaikan dulu menggunakan waktu provider nyata. Ini mencegah fake clock merusak transaksi Sandbox yang masih aktif. Case in-flight cutover nantinya diverifikasi melalui unit/domain tests terkontrol, bukan dengan memodifikasi jam provider.

## 11. Antarmuka minimum

Admin PO, tab **Langganan**: badge Sandbox, paket dan versi, periode beserta jam WIB, hari tersisa, grace/expired state, invoice aktif dan histori; aksi Bayar via Snap/Perbarui status. Jadwal benefit mendatang serta penjelasan early/grace/reactivation terlihat sebelum pembayaran. Informasi “Pembayaran uji; belum mengaktifkan penjualan nyata” selalu tampil.

Platform Admin: **Paket & benefit** (draft/publish versi), **Langganan & tagihan** (filter state/company dan detail minimum), **Riwayat perubahan** (audit). Ringkasan menampilkan hitungan minimal billing attention; Perusahaan tetap memakai kontrol existing. Jangan mencampurkan pengaturan rute/fleet perusahaan ke platform panel.

Development-only panel waktu muncul hanya jika semua gate/allowlist terpenuhi. Email capture preview hanya terlihat oleh actor billing berwenang, tidak di dashboard pelanggan. Loading/error/empty states dan dialog keyboard/focus mengikuti visual foundation dan responsif desktop/tablet/mobile.

## 12. Migrasi dan urutan pengiriman

Migrasi aditif pada basis kode Free: menambah private billing tables, tanpa menimpa Free operational mode, harga/transaction history tiket atau membership. Tidak backfill Demo A/B menjadi paid subscriber; pengujian harus memilih workspace tersendiri. Tidak menghapus atau mereset financial billing history lewat reset Free.

Usulan urutan: (1) interval/paket/invoice/clock + schema, (2) Sandbox payment attempts/router/reconciliation dan once-only periods, (3) reminder outbox/capture dan schedule runner, (4) Admin PO/platform UI, (5) review seluruh branch. Development job berupa CLI bounded yang dapat dipanggil berulang; deployment scheduler nyata dan email transport live tetap belum diaktifkan.

Testing tetap ditunda sesuai arahan pengguna sampai diminta. Jangan menambah/menjalankan tests, build/typecheck/lint atau mengklaim acceptance saat menulis spec. Pada pelaksanaan berikutnya, fitur tetap gated off sampai verifikasi yang diperlukan diterima; tidak menjanjikan selesai/siap diuji besok sebelum evidence tersedia.

Kriteria untuk sesi verifikasi: 30 hari tepat/UTC-WIB; early renewal menjaga sisa hari; tepat expiry masuk grace dan tepat grace_end masuk expired; renewal dalam/selepas grace sesuai anchor; invoice H-7 idempotent; notification out-of-order/retry tidak menggandakan periode; duplicate provider success masuk review; quote cutover immutable; reminders paid tidak dikirim; clock advance ditolak untuk pending provider; tenant/role/production gate menolak bypass; financial histories dan OTP/trip clock tetap utuh.

## 13. Dasar provider dan batas hasil

Sumber resmi dibaca untuk kontrak adapter: [Midtrans Snap advanced expiry/attempts](https://docs.midtrans.com/docs/snap-advanced-feature), [notification verification dan out-of-order delivery](https://docs.midtrans.com/docs/https-notification-webhooks), [Snap integration](https://docs.midtrans.com/docs/snap-snap-integration-guide). Backend autentikasi/status yang terverifikasi tetap otoritas; jangan menganggap redirect browser sebagai paid. Aturan harga, grace, cutover dan 30 hari berasal dari keputusan Seatpax, bukan ketentuan provider.

Review ini bukan bukti integrasi berjalan. Sebelum implementation adapter, cek lagi dokumentasi provider untuk parameter expiry dan status yang digunakan; provider create existing yang hardcoded 11 menit tidak dipakai diam-diam untuk invoice billing.

## 14. Ringkasan usulan yang disetujui lewat review spec

Review khusus: overlay Sandbox tidak membuka Pro/live; first verified server recognition menetapkan waktu grant; versi invoice dipilih berdasarkan target period start dan sahnya in-flight quote; maximum checkout satu jam/20 attempts per invoice; outbox capture tanpa email nyata; UTC/WIB dan development-only clock offset maksimal 366 hari dengan cooldown 5 detik. Detail ini belum menjadi keputusan final sampai pengguna menyetujui dokumen tertulis.

Self-review: periode kalender sudah diganti 30 hari, grace bukan tambahan hari gratis setelah renewal, perpanjangan awal tidak mengurangi sisa, harga/benefit paid immutable, reminder tidak mengirim setelah paid, finance Sandbox terpisah dari tiket dan reset Free. Tidak memasukkan production activation atau benefit Pro lain yang belum disepakati.
