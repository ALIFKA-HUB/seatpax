# Seatpax Hari 1 — Proposal scope dan fondasi

Tanggal: 6 Oktober 2026. Status: **SCOPE DIADOPSI; FONDASI F01–F11 MASIH PROPOSAL**. Keputusan scope tercatat sebagai D2026-10-06-01; jawaban pengguna “oke” mengadopsi paket scope yang disajikan, bukan seluruh detail teknik pada dokumen ini.

## Tujuan sesi

Menetapkan batas release untuk 30 hari dengan waktu pengguna 2–3 jam/hari, lalu mendefinisikan aturan dasar yang dibutuhkan sebelum migration dan kode aplikasi. Repo public sudah dibuat di `ALIFKA-HUB/seatpax`; commit awal dokumentasi sudah tersedia.

Sumber: [indeks](../../seatpax/00_INDEX.md), [scope saat ini](../../seatpax/02_MVP_SCOPE.md), [ledger](../../seatpax/19_DECISION_LEDGER.md), [review](../../analysis/SEATPAX_SPEC_REVIEW.md), [kalender 30 hari](../plans/2026-10-05-seatpax-30-day-delivery.md).

## Keputusan A — Target release

**Rekomendasi: release demo end-to-end dengan fokus inti Seatpax.** Ini merupakan subset dari MVP asli, bukan klaim bahwa semua fitur MVP sudah selesai. Waktu 60–90 jam menjadi batas perencanaan, bukan garansi durasi implementasi.

Alternatif: pertahankan seluruh MVP asli dan jadikan akhir bulan sebagai milestone core-flow; completion seluruh MVP dijadwalkan ulang berdasarkan progres. Alternatif ketiga adalah mempertahankan satu fitur tambahan yang paling penting bagi kebutuhan penilaian, lalu menghitung ulang jadwal/buffer secara eksplisit.

### Tetap masuk release 30 hari

- Empat role: Passenger, Admin PO, Crew, Super Admin; dua PO demo dan isolasi server-side.
- Crew hanya mengakses trip yang ditugaskan kepadanya.
- Route multi-stop, urutan stop, adjacent-segment fare per service class.
- Seat template grid sederhana, vehicle association, trip scheduling/open-for-sale dan snapshot tetap.
- Search, seat availability per interval, hold 10 menit, conditional grace 1 menit, expiry/release dan contention proof.
- Login Email OTP sebelum checkout; satu passenger dan satu seat per booking; My Tickets.
- Midtrans Sandbox, webhook valid/idempotent, ticket issuance dan late payment conflict.
- Admin dapat menyelesaikan late payment melalui confirmation setelah recheck kursi atau pencatatan refund mock/manual untuk demo sandbox.
- QR per passenger, manifest, scanner, pencarian manual, Passenger Trip Profile, boarding, dan snack claim terpisah.
- Admin memiliki form/list minimum untuk setup perjalanan dan akses booking/manifest; akun internal serta dua company dapat dibuat melalui seed.
- Super Admin melihat companies, activate/suspend; kebijakan suspension perlu ditetapkan pada fondasi.
- Crew PWA shell, mutasi online, availability refresh/polling, hosted demo, seed/reset, dokumentasi dan bukti verifikasi.

### Usulan tunda dari MVP asli

- Google OAuth, guest checkout dan guest ticket claim.
- Multi-passenger checkout dan operasi parsial booking.
- Crew cash sale.
- Reschedule, operational reseat, penggantian armada pada trip terjual, serta trip cancellation/refund workflow umum.
- Live realtime subscriptions bila mengganggu core delivery; polling tetap digunakan untuk UX.
- Company onboarding/user invitation UI lengkap; company demo dan akun internal memakai seed.
- Drag-and-drop, analytics, serta polish fitur tambahan.

Printer, offline cash, marketplace finance, GPS, dan microservices tetap deferred/future sesuai spec lama; proposal ini tidak mengaktifkannya.

### Dampak yang harus disadari

- Passenger harus login sebelum membeli; klaim guest tidak menjadi bagian demo.
- Satu transaksi hanya untuk satu penumpang. Data boleh disusun agar perluasan nanti tidak memerlukan penghapusan domain model.
- Cash sale dan perubahan perjalanan penumpang tidak dapat didemokan pada release ini.
- Late digital payment tetap harus ditangani melalui aplikasi, tidak lewat edit database manual.
- Acceptance criteria guest claim dan company creation UI dari MVP asli belum terpenuhi. Checklist release harus menyatakan pengecualian tersebut.

**Status keputusan A: DIADOPSI pada 6 Oktober 2026.** Scope aktif dan ledger sudah diperbarui. Bila rubrik penilaian kemudian mewajibkan fitur tambahan, perubahan scope harus dicatat sebagai keputusan berikutnya dan jadwal diestimasi ulang.

## Keputusan B — Usulan fondasi untuk retained flow

Bagian ini adalah rekomendasi teknik untuk dibahas setelah target release dipilih. Tidak ada migration atau implementasi yang dibuat berdasarkan proposal ini.

| ID | Usulan aturan | Alasan dan kaitan review |
| --- | --- | --- |
| F01 | Sediakan assignment crew↔trip. Admin PO mengelolanya untuk PO sendiri; crew perlu membership aktif dan assignment aktif untuk membaca manifest atau melakukan boarding/snack. | Company membership saja tidak memberi hak seluruh trip. R01/R10. |
| F02 | Saat trip dibuka untuk penjualan, snapshot urutan stop, waktu stop, fare, dimensi grid dan seluruh cell. Renderer membaca snapshot trip. Perubahan template/route kemudian tidak berlaku retroaktif. Setelah penjualan dimulai, perubahan layout/vehicle ditolak pada release ini. | Menjaga layout dan inventory yang sama. R02/R14/R15. |
| F03 | Semua inventory write memakai lock unit seat-segment dengan urutan deterministik, recheck setelah lock, lalu commit atomik. Hold, conversion, expiry/release dan late confirmation memakai protokol yang sama; jangan menahan transaksi saat memanggil provider. | Mencegah jalur alternatif menyebabkan overlap. R03/R10. |
| F04 | Login-only hold dimiliki account dari session server. Booking menyimpan relasi ke hold; creation idempotent. Release manual punya state terminal RELEASED dan audit; hold valid dapat dikonversi satu kali. | Menutup kontrak ownership dan delete/retry. R04/R06. |
| F05 | Base deadline = waktu server ketika hold dibuat +10 menit. Initiation payment dicatat sekali sebelum deadline; effective deadline = base +1 menit. Retry tidak memperpanjang lagi. Pada deadline, receipt/processing notification tidak boleh mengambil kursi tanpa recheck; race webhook/expiry wajib diuji. Kegagalan provider tidak dinyatakan PAID. | Batas waktu persisten dan seragam. R05/R13. |
| F06 | Untuk proposal awal, timely confirmation menggunakan waktu penerimaan webhook terverifikasi yang direkam server; receipt tidak otomatis mempertahankan kursi. Confirmation tetap di transaksi dan recheck inventory. Receipt setelah effective deadline masuk PAYMENT_CONFLICT, walaupun provider menyatakan pembayaran terjadi sebelumnya; admin review yang menyelesaikannya. | Aturan demo eksplisit, bukan asumsi timestamp provider; perlu dicocokkan dengan kontrak provider saat integrasi. R05/R13. |
| F07 | QR memakai token random opaque sebagai identitas ticket; pemegang QR saja tidak berhak membaca data pribadi atau mutate. Resolve hanya untuk owner login, crew assigned, atau admin PO sesuai resource. Untuk re-opening lintas perangkat, simpan token asli dalam penyimpanan server-only dengan hak baca terbatas dan hash unik untuk lookup; token tidak keluar lewat manifest umum/log. | Hash tidak dapat membentuk ulang QR. Pilihan penyimpanan server-only perlu review keamanan pada desain auth; belum menjadi kode. R06/R11. |
| F08 | Satu ticket aktif per passenger/trip; boarding dan snack masing-masing satu success state/record. Repeat request mengembalikan state existing, bukan membuat event sukses kedua. | Menjamin retry aman. R12. |
| F09 | Late conflict: Admin PO dapat confirm sesudah lock/recheck seluruh interval; jika bentrok, pilih pencatatan refund sandbox/mock. Status financial refund tidak dianggap real uang terkirim jika adapter mock yang digunakan. | Tidak mencuri kursi dan tidak perlu reseat otomatis. R05/R13. |
| F10 | Company suspension menutup penjualan baru dan payment initiation baru; pembayaran yang sudah dimulai serta tiket existing tetap mengikuti lifecycle dan deadline normal. Existing-ticket read dan operasi crew tetap tersedia bagi membership/assignment aktif. Super Admin tidak otomatis mendapat permission operasional PO. | Menghindari suspension merusak booking existing. R15. |
| F11 | Fares dan departure untuk passenger memakai snapshot stop asal, bukan selalu jam stop pertama. Sales close per interval di waktu scheduled departure stop asal; boarding hanya konteks stop asal dengan konfirmasi manual crew. Tidak ada transaksi cash setelah trip berjalan dalam proposal release ini. | Multi-stop time semantics jelas; current-stop/live movement tidak ditambahkan diam-diam. R14. |

Usulan F05/F06 tidak menjanjikan bahwa provider success selalu langsung menerbitkan ticket: availability dan deadline tetap menentukan auto-confirm versus conflict. Event deduplication key/status mapping harus ditentukan dari dokumentasi resmi provider sebelum integrasi, bukan hanya memakai order ID sebagai satu-satunya identitas event.

## Hasil Hari 1 dan urutan dokumen

- [x] Repo public dan commit dokumentasi awal tersedia.
- [x] Proposal target release ditulis dengan dampak dan pengecualian eksplisit.
- [x] Pengguna memilih target release yang direkomendasikan pada 6 Oktober 2026.
- [ ] Fondasi F01–F11 direview, direvisi bila perlu, dan diadopsi.
- [ ] Scope/ledger dan dokumen domain/schema/API terkait diselaraskan terhadap keputusan yang diadopsi.
- [ ] Kalender Hari 2–30 disesuaikan bila fitur tambahan dipertahankan.
- [ ] Dokumen keputusan dan hasil review dicommit; D01 dicentang hanya ketika keputusan selesai.

Scaffolding aplikasi bukan hasil yang diwajibkan Hari 1. Setelah keputusan selesai, Hari 2 membangun setup terhadap kontrak yang sudah jelas.

## Review independen

Review sinkronisasi setelah adopsi scope: scope, ledger dan kalender sudah membedakan keputusan produk yang diadopsi dari F01–F11 yang masih pending. D01 tetap belum selesai. Pemeriksaan tautan lokal lulus; review ini hanya untuk dokumentasi, bukan bukti implementasi.

Reviewer: subagent GPT-6 Luna, effort medium; review read-only pada 6 Oktober 2026.

- Reviewer mengonfirmasi gap assignment crew, snapshot grid, transaksi/deadline hold, dan lifecycle token.
- Pengurangan guest, multi-passenger, cash sale dan reschedule adalah keputusan produk yang memengaruhi acceptance criteria asli; jangan dinyatakan FINAL sebelum diadopsi.
- Alternatif F07 dari reviewer adalah token rotation/reissue dengan audit. Proposal utama memilih QR stabil yang bisa dibuka ulang melalui penyimpanan token server-only untuk mengurangi kompleksitas release; pilihan tersebut masih harus direview, terutama batas akses dan larangan token bocor lewat log/manifest.
- Deferral reschedule tidak otomatis menghapus hak penanganan kesalahan PO. Pada subset release, perubahan/cancellation trip terjual dinonaktifkan; payment conflict tetap punya penyelesaian refund mock/manual. Release bukan sistem operasional produksi untuk menjalankan penggantian armada/cancellation riil.
- Review tidak membuktikan implementasi atau estimasi waktu; belum ada kode aplikasi yang dibuat.
