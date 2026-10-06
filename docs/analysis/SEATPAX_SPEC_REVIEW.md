# Analisis spesifikasi Seatpax

Tanggal: 5 Oktober 2026. Basis: 21 dokumen modular termasuk indeks, serta struktur dan isi historis yang diekstrak dari arsip master. Project belum memiliki implementasi aplikasi atau migration.

## Penilaian

Arah produk, batas MVP, dan alur utama sudah cukup jelas untuk merencanakan pembangunan. Spesifikasi belum menjadi kontrak implementasi lengkap: schema masih proposal dan beberapa aturan penting belum terhubung ke model data, authorization, atau transaksi.

Fondasi yang sudah kuat:

- Model multi-stop menggunakan interval half-open `[from, to)`, sehingga kursi dapat dipakai ulang pada interval yang tidak beririsan.
- PostgreSQL menjadi sumber kebenaran; realtime hanya memperbarui pengalaman pengguna.
- Cash sale MVP khusus online. Offline cash, printer, escrow, dan microservices ditunda.
- Hold 10 menit, grace pembayaran 1 menit, dan late payment conflict sudah menjadi keputusan eksplisit.
- Trip memiliki snapshot segmen dan kursi; QR per penumpang membuka profil dalam konteks trip.
- Boarding dan snack dipisahkan; manifest berupa query atas penumpang confirmed.
- Scope, acceptance criteria, roadmap 12 minggu, dan demo seat reuse saling mendukung.

Rekomendasi berikut adalah hasil review, bukan perubahan keputusan FINAL. Tidak ada fitur atau migration yang diimplementasikan pada pekerjaan ini.

## Temuan yang perlu dituntaskan sebelum fondasi database dan transaksi

### R01 — Penugasan crew belum memiliki model data

**Prioritas: tinggi.** [RBAC](../seatpax/03_ROLES_RBAC_AUTH.md), bagian 5.3 dan 6.2, membatasi crew ke assigned trip. [Schema](../seatpax/10_DATA_MODEL_DATABASE.md) hanya memiliki membership company; belum ada hubungan crew dengan trip. [API](../seatpax/11_API_PROJECT_STRUCTURE.md), bagian 22.4, membutuhkan daftar trip crew.

Akibatnya, membership company saja belum cukup untuk menentukan trip mana yang boleh dilihat atau dimutasi crew. Tetapkan relasi penugasan crew ke trip, pemeriksaan status membership/assignment, serta siapa yang mengelola penugasan. Jangan menyamakan akses semua trip PO dengan akses assigned trip.

### R02 — Snapshot layout belum cukup untuk merender grid secara mandiri

**Prioritas: tinggi.** [Schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.14, menyediakan `trip_seats` dengan seat code, source cell, dan metadata. Posisi row/col, ukuran grid, serta cell non-seat belum ditentukan sebagai bagian snapshot. [Desain terbaru](../seatpax/13_UI_UX_DESIGN.md) masih menyebut rendering dari SeatTemplate.

Jika renderer membaca template aktif, perubahan template dapat mengubah visual trip lama meskipun identitas seat sudah disnapshot. Tentukan snapshot layout lengkap atau versi template immutable yang dirujuk trip. Renderer trip harus menggunakan versi/snapshot yang sama dengan inventory. Tetapkan juga versioning ketika kendaraan diganti dan penjualan berlangsung.

### R03 — Protokol locking baru menjelaskan pembuatan hold

**Prioritas: tinggi.** [Inventory](../seatpax/05_ROUTE_SEAT_INVENTORY.md), bagian 11.4, menjelaskan lock → recheck → hold. [Schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.15–20.19, memiliki inventory rows, holds, dan assignments, tetapi belum mendefinisikan satu protokol untuk seluruh jalur perubahan inventory.

Constraint unik unit inventory tidak dengan sendirinya menyatakan siapa yang memilikinya. Dokumentasikan transaksi dan urutan lock yang konsisten untuk hold, checkout multi-passenger, conversion payment, cash sale, expiry, reseat, refund/release, dan reschedule. Tentukan recheck sesudah lock, operasi atomik semua kursi dalam booking, serta rollback bila satu kursi gagal. Seluruh jalur harus menjaga invariant yang sama.

### R04 — Pembatalan hold dan hubungan hold ke booking belum lengkap

**Prioritas: tinggi.** [API](../seatpax/11_API_PROJECT_STRUCTURE.md), bagian 22.1, memiliki `DELETE /api/seat-holds/:id`. [State](../seatpax/04_DOMAIN_BUSINESS_RULES.md), bagian 18.3, dan [schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.16, hanya memiliki ACTIVE, CONVERTED, EXPIRED. Hold berisi `booking_session_id`, sedangkan bookings belum memiliki relasi eksplisit ke session/hold.

Tentukan apakah release manual menghapus hold atau memakai status terminal tersendiri, bagaimana ownership session diverifikasi untuk guest, bagaimana hold ditautkan ke booking, dan bagaimana request checkout berulang dicegah membuat booking ganda. Ini perlu keputusan eksplisit sebelum membuat migration/API contract.

### R05 — Grace pembayaran belum memiliki pemicu dan deadline tersimpan

**Prioritas: tinggi.** [Inventory](../seatpax/05_ROUTE_SEAT_INVENTORY.md), bagian 11.2, memberi grace jika payment dimulai sebelum expiry. [Schema](../seatpax/10_DATA_MODEL_DATABASE.md) hanya mencantumkan hold `expires_at`; payment initiation dan deadline efektif belum dijelaskan. [Reliability](../seatpax/14_SECURITY_RELIABILITY_OFFLINE.md), bagian 34.2, masih menyebut release ketika timer selesai.

Tetapkan kejadian server yang menandai payment initiated, deadline efektif, perbedaan timer checkout dan deadline inventory, serta koordinasi expiry dengan webhook. Tentukan apakah penilaian terlambat berdasarkan waktu provider, waktu webhook diterima, atau aturan lain. Recheck inventory tetap diperlukan untuk manual confirmation late payment.

### R06 — Guest access dan claim belum menjadi kontrak authorization

**Prioritas: tinggi.** [Auth](../seatpax/03_ROLES_RBAC_AUTH.md), bagian 7.2–7.4, mengizinkan guest dan meminta verifikasi ketika claim. [API](../seatpax/11_API_PROJECT_STRUCTURE.md) menyediakan booking read berdasarkan ID dan ticket read berdasarkan token. [Schema](../seatpax/10_DATA_MODEL_DATABASE.md) menyimpan account pada passenger dan booker pada booking.

Belum ditentukan bukti bahwa akun yang login berhak claim passenger tertentu, akses guest ke booking sesudah pembayaran, atau batas data yang bisa dibaca pemegang QR. Tetapkan guest session/access credential, aturan claim berbasis identitas atau claim credential, masa berlaku, penggunaan ulang, dan redaksi field. Google/OTP login saja belum menjelaskan hubungan akun dengan tiket guest. Tentukan juga apakah booker boleh claim semua passenger dalam booking atau hanya dirinya.

### R07 — State no-show pada satu passenger dapat berbenturan dengan state booking grup

**Prioritas: tinggi.** [Booking](../seatpax/07_BOOKING_PAYMENT.md), bagian 13.1, mengizinkan beberapa passenger. [Domain](../seatpax/04_DOMAIN_BUSINESS_RULES.md), bagian 9.6 dan 18.2, menempatkan MISSED_TRIP pada booking; schema juga memiliki status individual passenger.

Jika satu dari tiga passenger no-show, mengubah seluruh booking menjadi MISSED_TRIP dapat memengaruhi manifest dua passenger lainnya. Tentukan state individual sebagai dasar operasional dan aturan agregasi booking. Hal yang sama perlu diputuskan untuk partial refund, partial cancellation, serta reschedule sebagian passenger: model saat ini mengarah ke request/refund pada level booking.

### R08 — Reschedule belum mendefinisikan pertukaran inventory dan settlement

**Prioritas: tinggi.** [Domain](../seatpax/04_DOMAIN_BUSINESS_RULES.md), bagian 9.7, menetapkan selisih fare dan fee. [Flow](../seatpax/09_END_TO_END_FLOWS.md), bagian 17.6, berhenti di APPROVED/REJECTED. [Schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.26, menyimpan requested trip tetapi belum seat/interval target atau payment tambahan.

Tentukan scope satu booking atau satu passenger, kapan kursi baru ditahan, kapan tiket lama dibatalkan, bagaimana target interval dipilih, dan apa yang terjadi bila pembayaran selisih gagal. Approval dan pelepasan kursi lama harus memiliki aturan atomik yang menjaga inventory serta riwayat tiket. Perubahan karena kesalahan PO harus tetap mengikuti keputusan tanpa fee/biaya upgrade.

## Temuan untuk API, authorization, dan operasi

### R09 — Hak crew untuk reseat belum konsisten dengan API dan permission mapping

**Prioritas: menengah.** [Domain](../seatpax/04_DOMAIN_BUSINESS_RULES.md), bagian 9.4–9.5, dan [ledger](../seatpax/19_DECISION_LEDGER.md) memberi reseat kepada Admin PO + Crew. Permission mapping Crew di [RBAC](../seatpax/03_ROLES_RBAC_AUTH.md) tidak menyebut reseat; [API](../seatpax/11_API_PROJECT_STRUCTURE.md) hanya memiliki endpoint reseat admin.

Selaraskan permission dan boundary API dengan keputusan FINAL. Definisikan pembatasan assigned trip, alasan wajib, penanganan seat conflict, serta audit. Jangan menghapus hak crew diam-diam hanya karena endpoint belum terdaftar.

### R10 — Constraint antar-relasi belum menjamin konsistensi trip/company

**Prioritas: tinggi sebelum migration.** [Schema](../seatpax/10_DATA_MODEL_DATABASE.md) mempunyai banyak FK individual dan `trip_id` yang berulang. Belum ada uraian validasi bahwa route, vehicle, service class, dan stop berasal dari tenant yang benar; inventory seat/segment juga harus berasal dari trip yang sama.

Definisikan invariant lintas-relasi pada schema/service: route stops dan segment fares konsisten dengan route; inventory seat/segment konsisten dengan trip; assignment konsisten dengan passenger dan trip; ticket/event konsisten dengan trip. Dokumentasikan enforcement database yang dipilih serta authorization server, bukan hanya filter UI atau klaim umum RLS. Tentukan bagaimana koneksi Drizzle membawa konteks user/tenant ketika RLS diandalkan.

### R11 — Pembacaan ulang QR saat token hanya disimpan sebagai hash belum dijelaskan

**Prioritas: menengah.** [Schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.23, menyimpan `public_token_hash` dan mengatakan token asli tidak wajib plaintext. [UI](../seatpax/13_UI_UX_DESIGN.md) dan auth meminta tiket dapat dibuka ulang lintas perangkat.

Hash digunakan untuk mencocokkan token yang diserahkan, tetapi dokumen belum menyebut dari mana aplikasi mendapatkan token asli saat akun membuka My Tickets di perangkat baru. Tentukan lifecycle token: penyimpanan terenkripsi, penerbitan ulang/rotasi, atau desain credential lain. Jangan menambahkan hashing lalu menganggap QR lama dapat dibentuk ulang tanpa sumber token.

### R12 — Exactly-once boarding dan penerbitan ticket perlu invariant yang eksplisit

**Prioritas: menengah.** [Schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.24, menyebut uniqueness boarding opsional, sementara [acceptance criteria](../seatpax/02_MVP_SCOPE.md), bagian 42.9, melarang boarding duplikat. Ticket mempunyai unique token hash tetapi uniqueness penerbitan aktif per passenger/trip belum didefinisikan.

Pilih constraint atau mutasi atomik yang menjamin satu keberhasilan boarding, satu snack claim, serta tidak ada ticket ganda pada retry confirmation. Tentukan hasil repeat request: sukses idempotent dengan state yang sudah ada atau conflict yang jelas. Scan resolve tetap baca saja; action boarding/snack melakukan perubahan.

### R13 — Event identity pembayaran perlu membedakan retry dari perubahan status

**Prioritas: tinggi sebelum integrasi payment.** [Payment](../seatpax/07_BOOKING_PAYMENT.md), bagian 14.3, menyebut unique event/order identity; [schema](../seatpax/10_DATA_MODEL_DATABASE.md), bagian 20.21, menyediakan `provider_event_key` tanpa derivasi.

Definisikan key event dan state transition agar retry identik dideduplikasi, tetapi perubahan status pada order yang sama tetap diproses. Pastikan confirmation booking, assignments, dan penerbitan ticket dilakukan atomik. Simpan hasil pemrosesan gagal dan aturan retry/reconciliation. Mapping payload, autentikasi, dan behavior provider aktual harus diverifikasi dari dokumentasi resmi saat integrasi; review ini belum memverifikasi API Midtrans terbaru.

### R14 — Waktu per stop dan inventory setelah keberangkatan perlu aturan

**Prioritas: menengah.** [Schema](../seatpax/10_DATA_MODEL_DATABASE.md) memiliki offset pada route stops dan scheduled departure/arrival trip; snapshot segmen belum mencantumkan waktu stop. [Domain](../seatpax/04_DOMAIN_BUSINESS_RULES.md) mengizinkan origin di stop tengah dan crew cash sale pada active trip.

Tetapkan waktu keberangkatan yang ditampilkan untuk origin passenger, snapshot jadwal per stop, stop/current segment yang dianggap masih terbuka, serta aturan sales close, boarding, no-show, dan refund cutoff. Membatasi penjualan hanya dengan status trip global dapat menutup atau membuka segmen yang salah.

### R15 — Definisi occupancy, suspension, dan penggantian armada belum lengkap

**Prioritas: menengah.** [UI](../seatpax/13_UI_UX_DESIGN.md) menyebut occupancy dan jumlah booked/boarded. Pada trip multi-stop, jumlah penumpang total dapat melampaui jumlah kursi; indikator harus menjelaskan segmen atau metrik agregasi yang digunakan.

[Ledger](../seatpax/19_DECISION_LEDGER.md) dan schema mengizinkan company suspension serta vehicle replacement. Tetapkan dampak suspend terhadap penjualan baru dan tiket existing; definisikan penanganan jika armada pengganti lebih kecil, apa yang terjadi pada active holds, kapan sales dihentikan sementara, dan bagaimana NEEDS_RESEAT tampil di manifest. Manual reseat sudah final; resolver otomatis tetap deferred.

## Kerapian dokumentasi yang sudah ditangani

| Masalah | Perubahan |
| --- | --- |
| Folder sumber berbeda dari target project | `docs/seatpax_docs` dipindahkan dengan rename menjadi `docs/seatpax` |
| Dua file bernomor 14 | Brand menjadi `13A_BRAND_LOGO.md`; security tetap 14, nama engineering/delivery lainnya tetap |
| Arsip masih menyebut dirinya master source of truth | Indeks menjelaskan bahwa header tersebut historis dan dokumen modular adalah acuan aktif |
| Indeks belum memetakan task ke file | Ditambahkan task reading map dan kebijakan menangani perbedaan |
| UI menyebut 18–22 tetapi daftar aktual berisi 23 | Estimasi diperbaiki menjadi 23 entri: 9 + 6 + 7 + 1 |
| Stack mewajibkan dnd-kit, desain terbaru membolehkan klik cell | Tabel stack diselaraskan: click-cell MVP, dnd-kit opsional |
| Indent field schema tidak konsisten | Spasi awal `departure_offset_min` dibersihkan |
| Agent belum punya petunjuk entry point di root | Ditambahkan `AGENTS.md` dan README project |

Analisis awal dari percakapan sebelumnya menyebut 24 layar; hitungan tersebut digantikan oleh daftar aktual file yang berisi 23. Arsip master asli tidak diubah. Nomor section master tetap dipertahankan agar rujukan historis tidak putus.

## Urutan kerja yang disarankan

1. Tutup R01–R07 dan R10 sebelum migration utama: assignment crew, layout snapshot, inventory protocol, hold/session, grace, ownership, state individual, dan relasi tenant/trip.
2. Definisikan happy path atomik: trip snapshot → hold → booking → payment confirmation → assignment → ticket → manifest.
3. Tutup R12–R14 bersama kontrak endpoint dan payment adapter sebelum flow pembayaran/boarding dipakai.
4. Tutup R08–R09 dan R15 sebelum admin operations, suspension, cancellation, dan replacement.
5. Turunkan acceptance criteria ke bukti implementasi sesuai `15_TESTING_NFR.md`; tidak ada test aplikasi yang dijalankan karena belum ada aplikasi.

Roadmap 12 minggu tetap rencana asli. Tambahkan cash booking online, crew assignment, payment conflict resolution UI, dan jalur operasional yang belum punya gate eksplisit ke daftar kerja minggu terkait. Perubahan scope memerlukan pembaruan scope/ledger, bukan hanya checklist implementasi.

## Batas hasil review

Review ini menganalisis spesifikasi lokal dan konsistensi antar-dokumen, bukan audit aplikasi berjalan, validasi performa, atau konfirmasi ketersediaan free-tier/vendor pada Oktober 2026. Kelayakan deployment, versi dependency, dan kontrak provider harus diperiksa ketika pekerjaan implementasi terkait dimulai.

## Pemeriksaan hasil perapihan

- Semua 22 dokumen sumber tersedia pada folder tujuan.
- SHA-256 18 dokumen yang tidak diedit cocok dengan manifest sumber, termasuk arsip master dan file brand yang hanya berganti nama.
- Empat dokumen diedit secara sengaja: indeks, schema (indent satu field), UI (jumlah layar), dan stack (builder opsional).
- Pemeriksaan 25 file Markdown menemukan 0 tautan lokal yang putus.
- Arsip aktual berisi 3.959 baris isi ditambah newline terminal dan 10.539 token kata berbasis whitespace; klaim ukuran master sekitar 3.959 baris/10.500 kata cocok secara kasar dengan file yang diterima.
