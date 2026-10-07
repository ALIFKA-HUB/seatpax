# Seatpax — Availability dan Seat Hold

Tanggal: 7 Oktober 2026. Status: **APPROVED SPEC — pengguna menyetujui dengan spekmoke; implementation plan menunggu review.** Belum mengizinkan implementation code atau migration. Pengguna memilih availability + hold sebagai slice berikutnya setelah Trip Engine.

## Tujuan dan acuan

Penumpang yang login dapat menemukan perjalanan, memilih asal–tujuan dan satu kursi, lalu menahannya selama 10 menit. Kursi yang sama bisa dipakai pada interval bersebelahan, tetapi tidak bisa ditahan dua akun pada interval beririsan. Keberhasilan mencakup expiry tanpa ketergantungan cleanup worker, release oleh owner, retry aman, serta bukti 50 attempt bersamaan.

Acuan: [scope aktif](../../seatpax/02_MVP_SCOPE.md), [ledger](../../seatpax/19_DECISION_LEDGER.md), [fondasi bagian 2–4](2026-10-06-foundation-design.md), [inventory](../../seatpax/05_ROUTE_SEAT_INVENTORY.md), [review R03–R05/R10/R14](../../analysis/SEATPAX_SPEC_REVIEW.md), [Trip Engine](2026-10-07-trip-engine-design.md), dan [struktur domain](../../seatpax/11_API_PROJECT_STRUCTURE.md). Rekomendasi review yang belum diadopsi tidak menjadi keputusan melalui spec ini.

## Pendekatan dan batas

Gunakan PostgreSQL dan anchor seat×segment Trip Engine; layanan inventory menjadi satu boundary untuk pembacaan dan mutasi. Dibanding menggabungkan payment sekarang, slice ini menghasilkan pemilihan kursi yang dapat diuji mandiri. Redis atau realtime tidak diperlukan; refresh/polling cukup untuk demo.

Termasuk pencarian minimal berdasarkan snapshot stop asal/tujuan dan tanggal keberangkatan asal dalam WIB, detail snapshot penumpang, quote server, availability, create/read/release hold, expiry logis dan cleanup terbatas, serta UI satu kursi. Tidak termasuk booking/passenger persistence, payment initiation, tambahan grace, conversion ke confirmed booking, ticket, manifest, boarding, guest, group checkout, cancellation, atau perubahan snapshot. Tombol pembayaran belum ditampilkan. Tidak membuat occupation palsu untuk mensimulasikan pembelian.

## Identitas dan hak akses

- Halaman pencarian dan snapshot/availability boleh dibaca tanpa login; hasil hanya memuat informasi perjalanan publik. Tidak menampilkan email, user ID, daftar crew, hold ID atau data pemegang kursi lain.
- Membuat, membaca detail hold, dan melepas hold memerlukan verified Supabase user. Actor diambil server, tidak dari body. Akun dengan role internal tetap boleh memakai alur penumpang sebagai dirinya sendiri; role tidak memberi akses ke hold orang lain.
- Company diturunkan dari trip. Semua references seat/stop/segment harus berada pada company dan trip yang sama, melalui service dan constraint.
- Read hold milik sendiri tetap tersedia setelah PO disuspend atau cutoff lewat. Release oleh owner diperbolehkan sebelum payment initiation; field initiation disiapkan nullable, tetapi tidak mempunyai writer pada slice ini.
- RLS diaktifkan dan grants anon/authenticated untuk tabel hold dicabut. Browser hanya mengakses adapter server, privileged SQL tetap mempunyai pemeriksaan ownership.

## Pencarian, interval, quote dan availability

- Pencarian memilih snapshot stop asal/tujuan berdasarkan ID stop sumber yang disalin ke trip_stops. Filter tanggal menggunakan departure instant snapshot stop asal pada rentang satu hari WIB. Nama/city ditampilkan dari snapshot; sumber stop yang berubah/nonaktif tidak mengubah trip terpublikasi.
- Daftar pilihan lokasi berasal dari snapshot published trip, bukan katalog mutable. Stop identik lintas PO dapat tampil sebagai pilihan terpisah sesuai ID sumber; penyatuan geografi ditunda.
- Endpoint interval adalah dua trip_stop ID pada trip yang sama, sequence asal < tujuan. Occupied interval adalah `[from, to)`; segment yang dipakai berurutan from hingga to−1. Tidak mempercayai sequence/harga dari browser.
- Hanya OPEN_FOR_SALE pada company ACTIVE dengan DB now < cutoff yang menerima hold baru. Cutoff = minimum departure asal dan sales_close_at jika ada. Origin tengah boleh dijual setelah origin pertama berangkat. Pada equality cutoff penjualan tertutup.
- Search menyembunyikan interval tertutup dan PO suspended. Detail known ID boleh menunjukkan snapshot dengan status penjualan ditutup; create hold tetap memeriksa eligibility setelah lock.
- Fare IDR dihitung tepat sebagai jumlah harga snapshot segment; gunakan bigint/decimal string. Nol valid, missing/duplicate segment atau anchor adalah invariant failure, bukan gratis/available. Tidak ada angka financial dari client yang diterima.
- Availability membaca satu statement konsisten dengan waktu DB dan mendeteksi hold ACTIVE dengan effective_expires_at > now pada segment beririsan. Response berisi serverNow, cutoff, fare, full layout dan status per kursi AVAILABLE/HELD; label held tidak mengungkap owner. Layout non-seat tidak dapat dipilih.
- Availability bersifat informatif dan dapat berubah. Hanya create hold atomik menentukan keberhasilan. Occupancy confirmed belum mempunyai writer atau schema pada slice ini; checkout/payment berikutnya wajib menambah pemeriksaan assignment confirmed pada boundary inventory sebelum conversion diaktifkan.

## Hold persistence dan lifecycle

- seat_holds: UUID, company_id, trip_id, trip_seat_id, from_trip_stop_id/to_trip_stop_id, from/to sequence tersalin, held_by_user_id, request_key UUID, status ACTIVE/RELEASED/EXPIRED/CONVERTED, created_at, base_expires_at, effective_expires_at, payment_initiated_at nullable, released_at/expired_at nullable.
- Satu hold = satu kursi pada satu interval. Kolom reference menggunakan composite same-trip/company FKs; checks from < to, timestamp order dan state terminal timestamps. UNIQUE(owner, request_key) menegakkan retry; tidak menambahkan batas satu hold per akun karena belum menjadi keputusan produk.
- Base expiry = waktu DB setelah lock + 10 menit; effective expiry awal sama dengan base. ACTIVE hanya efektif selama now < effective expiry. Client countdown tidak melepaskan kursi dan tidak memperpanjang deadline.
- CONVERTED dan initiation fields adalah compatibility untuk foundation berikutnya, tanpa transisi writer pada slice ini. Jangan menyediakan API yang menambah grace sekarang.
- Manual release menjadi RELEASED jika hold belum expired dan belum initiated; retry release terminal RELEASED/EXPIRED mengembalikan hasil yang sama. Jika expiry telah tercapai, release menandai EXPIRED. Tidak menghapus row untuk menyembunyikan riwayat.
- Read own hold menyertakan status efektif EXPIRED ketika deadline lewat walaupun persisted status masih ACTIVE. Nama field persisted/effective dibedakan agar response tidak menyatakan perubahan DB yang belum terjadi.
- Audit append-only HOLD_CREATED/HOLD_RELEASED/HOLD_EXPIRED, actor nullable untuk expiry maintenance; satu event per transition, same-company/trip/hold FKs. Retry/read tidak menghasilkan event tambahan.

## Transaksi, idempotency dan konflik

- Create: verified user → company FOR SHARE → trip FOR SHARE → seluruh anchor interval FOR UPDATE terurut `(trip_id, trip_seat_id, segment_sequence)` → records hold terkait → waktu DB aktual → recheck eligibility/occupancy → insert hold dan audit → commit. Anchor count harus to−from; tidak membuat anchor yang hilang.
- Retry request_key dengan payload sama mengembalikan hold existing milik actor, termasuk bila sudah expired/released atau PO sekarang suspended; tidak memperpanjang expiry atau membuat audit. Key sama dengan trip/seat/interval berbeda menghasilkan conflict. Repeated request berbeda keys bersaing seperti user lain; own active hold juga menghalangi interval overlap.
- Existing identity/payload read sebelum locks boleh dilakukan; mutasi menggunakan guard dan membaca ulang state sesudah lock. Dua initial requests dengan key sama di range berbeda dilindungi UNIQUE owner/key: insertion conflict ditangani melalui transaction rollback lalu bounded lookup existing dan comparison; tidak melanjutkan query pada aborted transaction.
- Release/cleanup mengenali immutable range terlebih dahulu, lalu company/trip guard dan semua anchor full-range terurut, kemudian hold FOR UPDATE, membaca clock_timestamp dan state ulang. Release tetap boleh pada suspended/closed trip; guard dipakai untuk ordering, bukan larangan release.
- New create tidak mengubah status hold expired orang lain ketika hanya mengunci sebagian range. Hold expired diabaikan secara logis; cleanup mengunci seluruh range sebelum transition/audit.
- Cleanup internal memproses batch maksimal 100 kandidat expired, satu transaksi per hold; invoked oleh script lokal/operator, tanpa endpoint publik atau scheduler eksternal pada slice ini. Kesalahan satu item dilaporkan aman dan tidak menggagalkan item yang sudah commit. Correctness tidak bergantung cleanup.
- SQL lock_timeout 5 detik, statement_timeout 15 detik untuk transaksi inventory. Deadlock/timeout/unique-key race boleh retry maksimal sekali dengan request_key yang sama; setelah itu return retryable unavailable. Jangan retry validation/ownership/occupancy conflict. Tidak ada network/provider call di dalam transaksi.
- Hold tidak dibatasi hingga cutoff: hold yang dibuat tepat sebelum cutoff dapat tetap aktif hingga expiry, tetapi future payment initiation harus memeriksa cutoff tersendiri sesuai fondasi. Ini tidak menjanjikan bahwa hold selalu dapat dibayar selama seluruh countdown.

## Boundary dan UI

- Domain `modules/inventory`: pure interval/fare validation, repository SQL, availability/search service, hold service dan cleanup service. Adapters di `app` memverifikasi identity dan memanggil layanan; transaksi tidak berada di komponen React.
- Halaman `/trips` untuk search dan `/trips/[tripId]` untuk asal–tujuan, snapshot schedule/fare/layout dan pemilihan satu kursi. Hold owner view `/holds/[holdId]` menampilkan interval, kursi, fare snapshot, deadline WIB/countdown, refresh dan release. Navigasi penumpang dari home/account.
- Login sebelum hold; setelah login kembali ke target lokal yang tervalidasi. Tidak menerima arbitrary redirect destination. Selected seat bukan reserved sebelum server mengembalikan hold.
- Request key dibuat sekali per intent hold dan dipakai ulang ketika hasil request tidak diketahui. Jika request uncertain, UI mempertahankan key, seat dan interval; explicit retry memanggil intent sama. Intent baru/key baru hanya setelah terminal outcome atau pilihan berubah.
- Busy/error/empty/closed/conflict states jelas; conflict memperbarui availability tanpa mengklaim kursi berhasil ditahan. Owner hold response mempunyai deadline server, tidak timer berdasarkan waktu request browser.
- Poll availability setiap 15 detik saat tab visible; hentikan ketika hidden/unmounted. Countdown adalah display; saat nol lakukan refresh own hold. Background polling tidak membuat hold/release. Server response errors tidak ditampilkan sebagai availability kosong.
- Tombol/cell kursi mempunyai label code dan keadaan, keyboard focus, selected styling dan legend; status bukan hanya warna. Form stack pada narrow viewport, layout boleh scroll dalam container. Desain mengikuti pola Seatpax sekarang; polish menyeluruh ditunda.

## Verifikasi yang harus dibuktikan saat implementasi

1. Unit: half-open overlap, exact fare/zero, interval/IDs invalid, WIB date bounds, cutoff/equality, deadline exclusive dan retry payload comparison.
2. Database: adjacent reuse dan overlap denial, rollback, owner isolation, forged IDs, same-trip/company FKs, RLS/grants, missing anchor failure, audit uniqueness, same-key concurrent retry (same/different payload).
3. 50 requests distinct users/keys pada seat/range sama: tepat satu created hold, sisanya conflict; koneksi paralel nyata dengan pool terbatas dan timeout terukur, bukan 50 calls pada satu connection yang terserialisasi.
4. Barriers: release vs create, expiry/cleanup vs create, suspension vs create dan cutoff/expiry tercapai ketika menunggu lock. Assert satu coherent outcome dan recheck waktu sesudah lock; tests tidak menunggu 10 menit nyata.
5. Jalur raw postgres dan application Drizzle-backed connection; serialized payload/audit harus dibaca sebagai JSON object, bukan double-encoded string.
6. Server adapters trusted actor, safe errors, malformed input dan no unauthorized hold reads. Unit/integration/typecheck/lint/build, reviewer Luna medium.
7. Browser login penumpang, search/date asal tengah, fare/layout, hold/reopen/release/expiry display, desktop/narrow/keyboard; two-account conflict jika session tersedia. Laporkan batas browser yang nyata, jangan klaim payment flow selesai.

## Handoff

Spec self-review: intent, scope dan ownership explicit; deadlines mengikuti foundation; cleanup tidak menjadi authority availability; request retry tidak memperpanjang hold; lock order menyatu dengan future payment; booking/confirmed assignment belum diaktifkan. Tidak ada konflik product FINAL yang diubah diam-diam. Detail persistence/UI/idempotency/bounds di atas adalah proposal untuk review pengguna; baru dicatat sebagai keputusan setelah spec disetujui.

Setelah pengguna menyetujui spec tertulis ini, gunakan writing-plans. Eksekusi baru dimulai setelah review plan; inline implementation dan final reviewer GPT-6 Luna medium mengikuti preferensi sebelumnya.
