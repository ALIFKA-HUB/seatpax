# Seatpax — Rancangan fondasi release 30 hari

Tanggal: 6 Oktober 2026. **Status: READY FOR USER REVIEW — desain belum diadopsi dan belum diimplementasikan.** Scope produk sudah diadopsi melalui D2026-10-06-01. Dokumen ini memperjelas F01–F11 pada [proposal Hari 1](2026-10-06-day1-scope-foundation-proposal.md), bukan memperluas scope.

## Ringkasan untuk pengguna

- Admin menugaskan crew ke trip; crew bekerja hanya pada trip tersebut.
- Trip memakai salinan tetap dari rute, waktu, harga dan layout, sehingga perubahan template tidak merusak tiket.
- Kursi ditahan 10 menit. Memulai pembayaran melalui server sebelum deadline memberi tambahan 1 menit, sekali saja.
- Database memeriksa kursi kembali saat pembayaran dikonfirmasi. Pemrosesan terlambat masuk review admin; tidak mengambil kursi milik orang lain.
- Penumpang login untuk membuka tiketnya. QR membuka profil melalui pemeriksaan hak akses; scan sendiri tidak langsung mencatat boarding.
- Boarding dan snack dicatat masing-masing sekali. Crew memilih stop tempat penumpang naik.
- PO yang disuspend berhenti menerima penjualan baru; tiket valid dan pembayaran yang sudah dimulai tetap ditangani.

## Acuan dan batas

[Scope aktif](../../seatpax/02_MVP_SCOPE.md), [ledger](../../seatpax/19_DECISION_LEDGER.md), [schema proposal](../../seatpax/10_DATA_MODEL_DATABASE.md), [inventory](../../seatpax/05_ROUTE_SEAT_INVENTORY.md), [ticket/manifest](../../seatpax/08_TICKET_QR_MANIFEST.md), dan [review gap](../../analysis/SEATPAX_SPEC_REVIEW.md).

Retained flow: Email OTP → login → search → satu seat/satu passenger → Sandbox payment → ticket → manifest → boarding/snack. Guest, group checkout, cash sale, general cancellation/reschedule/reseat, vehicle replacement pada trip terjual, offline sync, dan live tracking tetap ditunda. Refund untuk payment conflict adalah pencatatan demo/mock dengan audit, bukan transaksi uang riil.

## 1. Identity, authorization, dan crew assignment — F01/F04/F07/F10

- Server memverifikasi Supabase session untuk mendapatkan user; user/role/company dari request body tidak dipercaya.
- Passenger memiliki booking sebagai `booker_user_id` dan passenger sebagai `account_id`; release ini menetapkan keduanya ke user checkout yang sama. Tidak ada claim guest atau pembelian untuk akun lain.
- Admin PO memakai membership aktif pada PO resource. Crew memerlukan membership aktif **dan** assignment aktif pada trip; satu trip boleh mempunyai beberapa crew.
- `trip_crew_assignments` mempunyai `trip_id`, `user_id`, `status ACTIVE|REVOKED`, `assigned_by`, `assigned_at`, `revoked_at`; pasangan trip/user unik. Admin PO membuat/mencabut assignment untuk company sendiri; perubahan diaudit. Riwayat reactivation berada pada audit log.
- Super Admin hanya mendapat permission company management pada release ini, bukan akses PII/boarding/refund tenant secara otomatis.
- Tiap resource read/mutation server mengecek ownership/role, company melalui relasi, state, dan assignment jika diperlukan. Crew yang dicabut haknya tidak dapat melakukan mutasi baru; event lama tetap disimpan.
- Browser tidak membaca tabel operasional melalui koneksi privileged. Supabase exposed tables memakai RLS/default-deny dan tidak memiliki policy write langsung yang melewati layanan inventory. Server service-key/privileged DB queries tetap memerlukan authorization service; **RLS tidak dianggap membatasi koneksi yang bypass RLS**. Implementasi nanti harus menguji dua jalur: request server dan akses browser langsung. Drizzle tetap untuk schema/migration dan server SQL; JWT/session user tidak otomatis menjadi identitas koneksi DB.

Supabase mendokumentasikan bahwa RLS berlaku pada exposed tables dan service keys dapat bypass RLS; karena itu server authorization tetap wajib. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 2. Trip snapshot dan waktu stop — F02/F11

- Draft trip boleh diedit. Saat pertama dipublish/open-for-sale, buat snapshot atomik: ordered stops beserta nama/alamat dan arrival/departure instants; segment dan fare untuk service class trip; grid dimensions, semua cell type/position/label; trip seats dan inventory seat×segment.
- Gunakan `trip_stops` untuk snapshot stop dengan sequence unik per trip dan timestamp timezone-aware. Snapshot label/alamat, bukan hanya FK ke Stop yang dapat diedit. Segment mengacu kepada pasangan trip-stop berurutan.
- Simpan `layout_snapshot` sebagai JSON tervalidasi pada trip (rows, cols, cells) dan `trip_seats` berkoordinat/grid-code untuk identitas inventory. Kedua representasi dibentuk dari satu input dalam transaksi yang sama; tidak diedit setelah publish. Renderer memakai snapshot trip, bukan template aktif.
- Fare snapshot mengikuti service class trip; harga quote/checkout dihitung server dari jumlah fare segment pada interval. Harga/role/company dari browser tidak menjadi authority.
- Setelah publish, route/vehicle/service-class/layout/schedule snapshot tidak dapat diubah pada release ini. Gunakan trip baru untuk jadwal baru. Template dan source route tetap boleh diubah untuk future trip. Publication retry mengembalikan snapshot yang sudah ada, bukan regenerasi inventory.
- Stop sequence `1..N`; from < to dan endpoint harus berada pada trip yang sama. Occupancy dihitung per segment, sedangkan passenger total/boarded total diberi label terpisah; jumlah passenger total tidak dibagi kapasitas menjadi occupancy.
- Sales cutoff interval = nilai yang lebih awal antara departure instant stop asal dan global `sales_close_at` jika ada. Server mengizinkan hold/payment initiation hanya jika now < cutoff. Search memakai jam stop asal. Cutoff yang sudah tercapai menutup initiation baru; payment yang telah dimulai sebelumnya dapat diselesaikan hingga effective hold deadline.
- Status sale-ready mengizinkan penjualan stop tengah yang cutoff-nya belum lewat walaupun stop pertama sudah berangkat; jangan memakai departure stop pertama sebagai cutoff semua origins. Penyelesaian trip menutup seluruh penjualan.
- Untuk boarding, crew memilih stop context dari `trip_stops`; context harus sama dengan stop asal ticket. Snack hanya boleh diklaim setelah boarding dan pada trip/ticket valid yang sama. Tidak ada inferensi GPS/current vehicle stop atau otomatis no-show.

## 3. Inventory dan lock protocol — F03

- Unit `trip_seat_inventory` disiapkan saat publish dan menjadi anchor lock, bukan row yang baru dibuat ketika hold.
- Interval `[from_stop_sequence, to_stop_sequence)` menempati segment dengan sequence from sampai to−1. Contoh [1,2) dan [2,4) tidak overlap; [1,3) dan [2,4) overlap.
- Semua operasi yang dapat mengubah occupancy mengunci inventory row terkait dengan `FOR UPDATE` dalam urutan `(trip_id, trip_seat_id, segment_sequence)`. Jumlah row harus sama dengan to−from; missing row adalah invariant failure, bukan kursi available.
- Urutan transaksi yang dipakai bersama: company guard → trip guard saat dibutuhkan → inventory rows terurut → hold → booking → payment. Publish, hold creation dan payment initiation mengunci company row `FOR SHARE` terlebih dahulu, lalu membaca ulang status. Activate/suspend mengunci company row yang sama `FOR UPDATE` sebagai lock pertama. Trip eligibility memakai trip row `FOR SHARE`; perubahan state trip memakai `FOR UPDATE`, sesudah company guard bila keduanya diperlukan. Tidak ada code path payment yang lebih dahulu mengunci booking lalu menunggu inventory. Query identitas immutable sebelum lock boleh dilakukan; state mutable dicek ulang sesudah lock.
- Urutan suspension ditentukan guard tersebut: initiation yang memperoleh guard dan commit lebih dahulu merupakan pembayaran yang sudah dimulai; suspension menunggu transaksi itu selesai. Jika suspension memperoleh lock dan commit lebih dahulu, initiation membaca status suspended dan ditolak. Publish/hold mengikuti aturan yang sama. Kegagalan transaksi tidak menghasilkan initiation yang sah.
- Setelah lock, requery ACTIVE assignments dan ACTIVE holds dengan `effective_expires_at > waktu DB aktual`. Hold expired secara logis tidak menghalangi kursi walaupun cleanup worker belum berjalan. Availability UI boleh stale; mutasi selalu mengulang pemeriksaan.
- Request baru tidak mengubah status hold expired milik orang lain tanpa mengunci seluruh unit hold itu. Cleanup satu hold mengunci semua unit hold tersebut sebelum mengubah state/audit. Ini menjaga full-range lock tanpa perlu memperluas lock request baru.
- Hold creation, release/expiry, confirmation, dan late manual confirmation memakai protokol yang sama dan commit/rollback atomik. Assignment, converted hold, confirmed booking, paid payment, dan ticket dibuat dalam satu transaksi confirmation.
- Deadlock/timeout menghasilkan bounded retry atau error retryable; request idempotency dipertahankan. Tidak ada provider/network request di dalam transaksi inventory.

Row locks `FOR UPDATE` menahan penulis/locker lain pada row terkait hingga transaksi selesai; urutan lock konsisten membantu mengurangi deadlock. [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## 4. Hold, booking, dan initiation — F04/F05

- `held_by_user_id` wajib untuk release ini. Account harus sama dengan user checkout; perubahan interval/kursi memakai release lalu hold baru.
- Persist `base_expires_at = created_at +10 menit`, `effective_expires_at = base_expires_at`, `payment_initiated_at nullable`; statuses ACTIVE, RELEASED, EXPIRED, CONVERTED. Deadline eksklusif: now >= effective deadline berarti expired. Waktu dicek sesudah memperoleh lock memakai waktu DB aktual, bukan timer browser atau timestamp yang dibekukan sebelum menunggu lock.
- `bookings.seat_hold_id` unique dan owner wajib. `booking_passengers.booking_id` unique untuk membatasi satu passenger pada release ini. Booking/checkout idempotency key per user disimpan; retry payload sama mengembalikan hasil existing, payload berbeda pada key sama menghasilkan conflict.
- Validasi server: owner, ACTIVE hold, interval valid, sales eligibility, fare snapshot dan satu seat/passenger. Pending booking belum muncul di manifest.
- Payment initiation berarti **server menerima intent valid dan menyimpan satu payment attempt/order** sebelum base deadline dan sebelum sales cutoff. Dalam transaksi ini simpan payment_initiated_at dan effective deadline = base+60 detik, sekali saja. Lalu commit sebelum memanggil provider. Ini sengaja tidak menunggu Snap response sebagai pemicu grace.
- Satu active provider order untuk booking. Retry memakai order identity yang sama, tidak menciptakan order baru/menambah waktu. Unknown provider outcome direkonsiliasi, bukan diasumsikan gagal atau membuat order pengganti.
- Provider timeout/failure tidak menandai PAID. Grace yang sudah diberikan tidak dicabut dan tidak bertambah; kursi tetap expire paling lambat pada effective deadline. Tidak ada hold tanpa batas karena pending payment.
- Manual release sebelum payment initiation diperbolehkan. Setelah initiation, tombol release ditolak untuk release ini; user dapat meninggalkan checkout dan menunggu expiry agar retry/payment tidak membatalkan hold secara ambigu. Tidak menganggap abandonment sebagai pembayaran gagal.

## 5. Webhook, late conflict, dan retry — F06/F09

**Penyempurnaan dari proposal awal F06:** deadline confirmation memakai waktu aktual pemrosesan sesudah lock, bukan receipt sebagai hak atas inventory. `received_at` adalah audit. Event yang tiba tepat waktu tetapi baru diproses sesudah deadline tetap masuk conflict; ini menghindari receipt menghidupkan kembali kursi yang telah dilepas.

- Adapter memverifikasi provider notification dan order/amount/currency terhadap expected payment. Client success callback tidak mengubah state financial.
- Event terverifikasi dipersist/deduplicate terlebih dahulu; event processing dapat diretry jika crash. Exact field/signature/status mapping dan event identity harus dicocokkan dengan dokumentasi Midtrans saat integration plan; jangan mendefinisikan event key hanya dari order ID karena order memiliki beberapa perubahan status.
- Confirmation mengunci unit interval dan records terkait. Auto-confirm hanya jika hold masih ACTIVE milik booking, processing now < effective deadline, tidak ada assignment/hold lain yang menguasai unit, dan payment mempunyai verified success. Retry pada booking already-confirmed mengembalikan hasil existing; tidak membuat assignment/ticket baru.
- Ketika verified success diterima untuk expired/released hold atau occupancy sudah pindah: payment menyimpan fakta PAID; booking menjadi PAYMENT_CONFLICT; tidak membuat VALID ticket/assignment. Pisahkan paid-money fact dari booking fulfillment conflict.
- FAILED/EXPIRED notification tidak boleh menurunkan PAID atau menghapus ticket confirmed. Nilai provider dan event order divalidasi berdasarkan transition table saat integrasi. Keadaan yang tidak dapat dipastikan masuk reconciliation/manual review, bukan dipaksa sukses.
- Admin PO resolve conflict melalui aplikasi: confirm hanya jika interval masih sebelum sales cutoff, trip masih valid, tidak suspended untuk penjualan, dan seluruh unit kosong setelah lock/recheck. Ini tidak memerlukan hold baru atau payment kedua; audit alasan/actor.
- Jika kursi unavailable/cutoff lewat atau admin memilih refund: catat resolution MOCK_REFUND_RECORDED dengan amount, reason dan actor; booking REFUNDED terminal untuk demo, tidak ada ticket/assignment. Payment tetap mencatat success asli; refund record method MOCK menjelaskan bahwa tidak terjadi real refund provider. Resolve retry tidak menggandakan refund/confirmation; sesudah keputusan terminal, aksi berbeda ditolak.
- Admin confirmation tetap dapat dijalankan sesudah hold deadline ketika interval masih dijual dan available. Late webhook tidak otomatis menjalankannya.

## 6. QR, manifest dan operasional — F07/F08

- Ticket menghasilkan opaque random token dengan 32 byte cryptographic randomness. QR berisi identifier tersebut, tidak PII atau kredensial akun.
- Persist unique token hash untuk lookup dan encrypted token ciphertext agar QR yang sama dapat dirender ulang dari My Tickets. Key enkripsi hanya environment server; ticket service yang berwenang membuka ciphertext. Tidak ada plaintext/ciphertext di manifest umum, log, analytics, atau response selain QR untuk owner yang authorized.
- Hash/token cocok belum cukup untuk membaca private profile. Owner login, Admin PO resource-company, atau crew assigned melakukan resolve. Tidak ada anonymous public-ticket route yang mengembalikan PII. Token unknown/wrong trip/cancelled tetap ditolak; error lintas-tenant tidak membuka informasi ticket.
- Uniqueness ticket per passenger/trip, assignment ACTIVE per passenger/trip, serta boarding/snack per ticket/trip dijamin migration/transaction. General ticket reissue/reseat tidak masuk release ini.
- QR resolve hanya baca. `board` dan `claim-snack` adalah endpoint terpisah dengan role/context validation. Boarding mencatat actor/time/source/stop context; snack mencatat actor/time. Retry mengembalikan record existing; audit tidak membuat success kedua.
- Manifest query hanya confirmed passenger dengan valid ticket/assignment. Crew profile memberi minimum data operasional; search manual menuju profile yang sama. Owner dapat membaca ticket di perangkat baru setelah login; tidak membutuhkan rotasi QR pada setiap read.

## 7. Suspension dan policy release — F10/F11

- Super Admin dapat activate/suspend seeded PO; semua aksi diaudit. ADMIN_PO/CREW tidak dapat mutate company platform status.
- Suspension melarang publish trip, hold baru, dan initiation payment baru. Uninitiated holds expire sesuai deadline; initiated payments dapat confirm selama hold masih valid menurut aturan §5. Jadi company active bukan syarat tambahan untuk menyelesaikan initiation yang sudah sah.
- Owner ticket read dan assigned-crew boarding/snack untuk ticket existing tetap diperbolehkan; membership aktif masih wajib. Admin tetap dapat membaca manifest/conflict dan mencatat mock refund. Conflict manual-confirm memerlukan company aktif dan sales eligibility sesuai §5.
- Reactivation mengembalikan eligibility bagi trip yang sebelumnya sudah sale-ready dan cutoff belum lewat; tidak menghidupkan hold expired, booking refunded, atau trip completed. Tidak memerlukan bulk transition/reopen flag terpisah pada release ini.
- Semua foreign keys terkait trip/company divalidasi secara server dan constraint yang sesuai: seat/segment/inventory/assignment/ticket/event satu trip; route/vehicle/service class/stops satu PO. Jangan menerima resource silang walaupun setiap FK individual valid.

## 8. Acceptance evidence yang harus dihasilkan implementasi

| Bukti | Hasil wajib |
| --- | --- |
| Dua PO + assignment dicabut | Admin/crew asing atau unassigned ditolak; event lama tetap ada |
| Source template/route diedit | Snapshot trip published dan harga/jadwal/layoutnya tetap |
| Interval [1,2), [2,4), [1,3) | Dua pertama bisa reuse; yang overlap ditolak |
| 50 simultaneous same-seat attempts | Satu hold owner; tidak ada overlapping duplicate |
| Expiry worker berhenti | Hold logically expired tidak memblokir sale; confirmation lama tidak mengambil occupancy baru |
| Initiation retry/timeout | Satu order/booking; grace sekali; deadline tetap terbatas |
| Event tiba sebelum deadline, diproses sesudah expiry/reassignment | PAYMENT_CONFLICT, tidak auto-confirm |
| Duplicate/out-of-order webhook + crash setelah event persisted | Replay aman; satu ticket; PAID tidak turun karena event gagal lama |
| Wrong-trip QR, kamera ditolak | Akses ditolak atau fallback manifest; scan tidak mutate |
| Concurrent board/snack | Masing-masing satu record; snack sebelum boarding ditolak |
| Suspension selama checkout | Initiation baru ditolak; initiated flow dan existing ticket tetap ditangani |
| Dua perangkat owner | QR yang sama dapat dibuka ulang; foreign owner/anonymous ditolak |

Tidak ada test aplikasi yang dijalankan pada tahap desain ini. Bukti tersebut menjadi target meaningful tests pada hari implementasi yang terkait.

## Handoff dan status Hari 1

Review read-only oleh GPT-6 Luna, effort medium, menemukan race suspension versus sales pada wording guard awal. Revisi §3 menetapkan lock bersama dan urutan commit secara eksplisit. Pemeriksaan mandiri dan tautan lokal selesai; review ini merupakan pemeriksaan desain, bukan bukti implementasi.

- Scope dan repo sudah selesai; dokumen ini menutup rancangan gap R01–R06/R10–R14 untuk retained flow setelah diadopsi. R07/R08/R09 dan vehicle-replacement portion R15 ditunda bersama fitur terkait.
- Pengguna perlu review ringkasan perilaku dan menerima/revisi dokumen tertulis ini. Detail teknis merupakan rekomendasi; pengguna tidak diminta memilih format lock atau SQL.
- Setelah review diterima: sinkronkan spec modular/schema/API dan ledger; buat plan subsystem pertama untuk setup/auth/tenant, review plan sebelum kode sesuai workflow project. Hari 1 dicentang selesai sesudah foundation adoption dan sinkronisasi.
- Dokumen ini tidak menjadikan setup, migration, atau provider account creation sudah disetujui/selesai secara otomatis.
