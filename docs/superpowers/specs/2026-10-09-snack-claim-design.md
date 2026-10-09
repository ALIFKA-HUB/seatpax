# Klaim snack setelah boarding

Tanggal: 9 Oktober 2026. Status: rancangan percakapan disetujui; spec tertulis menunggu review pengguna. Belum ada kode, migration atau dependency yang ditambahkan.

## Tujuan dan batas

Crew menyerahkan snack kepada penumpang yang sudah boarding dan mencatat penyerahan sekali per tiket/trip. Tombol **Serahkan snack** berada pada profil penumpang yang sekarang, baik dibuka melalui QR maupun manifest. Scan hanya membuka profil; tidak otomatis melakukan boarding atau klaim.

Rancangan ini menerapkan fondasi F07/F08 yang sudah diadopsi. Acuan: `../../seatpax/00_INDEX.md`, scope aktif `02_MVP_SCOPE.md`, `19_DECISION_LEDGER.md`, `08_TICKET_QR_MANIFEST.md`, `11_API_PROJECT_STRUCTURE.md`, fondasi `2026-10-06-foundation-design.md`, dan implementasi `../../setup/MANIFEST_BOARDING_SETUP.md`. Review `../../analysis/SEATPAX_SPEC_REVIEW.md` sudah dibaca; rekomendasinya bukan perubahan produk otomatis.

Satu klaim per tiket tanpa pengaturan paket, jumlah, jenis snack atau jatah per kelas pada tahap ini. Tidak menambahkan stok gudang, pembayaran snack, offline sync, pembatalan/reversal klaim, GPS, cash, reseat atau aturan no-show. Penyerahan fisik dilakukan crew; aplikasi mencatat konfirmasi crew dan tidak mendeteksi penyerahan secara otomatis.

## Pilihan pendekatan

Pilihan disetujui: aksi snack terpisah pada profil yang ada, dengan catatan unik di database. Ini menggunakan jalur scan/manual dan pemeriksaan akses yang sudah tersedia.

Alternatif pengaturan paket/jatah per kelas membutuhkan snapshot entitlement dan kebijakan tambahan, sehingga ditunda. Menggabungkan klaim dengan scan atau boarding tidak memenuhi aksi terpisah yang sudah diadopsi.

## Aturan akses dan eligibility

- Mutasi hanya untuk verified-session user dengan membership CREW ACTIVE dan assignment ACTIVE pada trip yang sama. Pemeriksaan selalu baru pada server, termasuk retry setelah profil lama terbuka.
- Company diturunkan dari trip; actor dari sesi. Input tidak menentukan company, actor atau waktu klaim.
- Ticket, passenger, assignment dan booking CONFIRMED harus valid pada company/trip tersebut, menggunakan predicate yang sama dengan boarding.
- Boarding event pada ticket/trip/company tersebut wajib sudah ada. Klaim sebelum boarding ditolak tanpa menulis event. Snack tidak membutuhkan stop context baru; stop asal sudah divalidasi saat boarding.
- Perusahaan SUSPENDED tetap mengizinkan klaim untuk tiket existing, dengan membership/assignment aktif tetap wajib.
- ADMIN_PO boleh membaca status snack di manifest tenant sendiri, tetapi tidak melakukan klaim. Super Admin dan pemilik tiket tidak mendapat hak mutasi melalui role tersebut.
- Error wrong-trip/foreign-tenant/unknown ticket tidak mengungkap informasi tiket lintas konteks.

## Data dan transaksi

Domain baru di `modules/snack/` menyediakan `claim(actor,tripId,{ticketId})`, menghasilkan `{claim,alreadyClaimed}`. Catatan claim memuat UUID, company/trip/ticket, actor dan `claimedAt` dari database. Record menjadi audit service; tidak membuat audit sukses kedua pada retry.

Migration berikutnya menambahkan `snack_claims` dengan UUID PK, UNIQUE(ticket_id,trip_id), actor FK ke users, composite FK ticket/trip/company, dan composite FK ticket/trip/company ke boarding_events. Tambahkan matching UNIQUE pada boarding_events untuk composite FK tersebut. Dengan demikian keberadaan boarding menjadi invariant database, bukan pemeriksaan UI saja. RLS diaktifkan dan grant browser anon/authenticated dicabut. Tidak ada endpoint update/delete/reversal. Fixture cleanup privileged hanya menghapus UUID miliknya dengan snack sebelum boarding/ticket.

Gunakan satu transaksi dan reuse authorization/lock helpers boarding, tanpa nested transaction. Urutan: membership SHARE → company SHARE → trip SHARE → crew assignment SHARE → booking UPDATE → seat assignment SHARE → ticket UPDATE → boarding event SHARE → existing snack/insert. Lookup ID awal hanya hint; recheck setelah lock. Tidak mengambil inventory locks. Statement/lock timeout mengikuti boarding yang ada.

Lock ticket yang sama menserialisasi boarding dan klaim. Jika klaim memperoleh lock sebelum boarding tercatat, klaim ditolak dan crew dapat mencoba kembali setelah boarding. Jika boarding commit terlebih dahulu, klaim dapat berhasil. Dua crew yang mengklaim bersamaan menerima satu record yang sama; actor/time asli dipertahankan. Retry mengecek akses sebelum mengembalikan catatan lama. Rollback tidak meninggalkan claim parsial. Tidak memakai retry untuk menutupi deadlock atau ketidaksesuaian authorization.

## Data baca dan UI

Profil QR/manual memakai service dan komponen yang sama, ditambah state snack minimum `{claimedAt}|null`. Manifest crew/Admin menambahkan state/waktu snack minimum pada masing-masing penumpang, tanpa actor/account identity, phone, email, token atau ciphertext. Detail claim internal tetap menyimpan actor untuk audit; tidak perlu mengirim identitas aktor ke daftar manifest.

- Belum boarding: **Snack belum diserahkan**, tombol tidak aktif, penjelasan harus boarding dahulu.
- Sudah boarding, belum claim: tombol **Serahkan snack** aktif.
- Sedang request: tombol nonaktif dengan status **Mencatat…**, mencegah pengiriman ganda.
- Sukses atau retry existing: **Snack sudah diserahkan**, waktu WIB asli, tanpa tombol klaim kedua.
- Error/koneksi putus: tampilkan pesan aman dan izinkan retry aksi yang sama; tidak mengubah state lokal menjadi sukses sebelum response server.

Setelah sukses, refresh data profil/manifest. Callback terlambat hanya memperbarui profil jika ticket ID masih sama, agar scan tiket berikutnya tidak tertimpa response sebelumnya. Kamera/decoder dan format QR tetap memakai implementasi boarding saat ini, tanpa library tambahan. Gunakan layout, focus, aria-live dan ukuran kontrol yang ada; ini bukan redesign UI.

## Verifikasi dan penerimaan

Unit: UUID/input dan actor sesi, data projection minimum, state/tombol sebelum/sesudah boarding, pending submission, response lama setelah scan berganti, error aman dan retry.

Database fixture terisolasi: sebelum boarding ditolak; setelah boarding berhasil; wrong trip/company/role dan revoke membership/assignment ditolak; company suspended diizinkan; dua crew concurrent satu event; retry mempertahankan actor/time; revoke-first dan claim-first serialization; board/claim concurrency; rollback; uniqueness/composite FK termasuk larangan claim tanpa boarding; adjacent passengers berkursi sama tetap mempunyai claim terpisah. Jalankan regresi boarding/payment serta suite lengkap secara serial dengan TLS yang sudah ada.

Manual: assigned crew membuka satu tiket demo yang dipilih eksplisit, board bila diperlukan, menyerahkan snack, reopen dan memeriksa status/waktu yang sama; Admin hanya membaca. Tidak mengklaim seluruh data demo atau mengotomasi login/OTP. Keyboard/390px dan kamera HTTPS phone tetap membutuhkan evidence nyata; keterbatasan tooling dicatat, bukan dinyatakan lolos. Tidak memperluas tunnel webhook untuk preview tanpa setup terpisah.

## Handoff

Setelah pengguna menyetujui spec tertulis, buat implementation plan melalui writing-plans. Eksekusi inline dan satu reviewer akhir GPT-6 Luna medium mengikuti preferensi sebelumnya. Integrasi lokal/no push mengikuti otorisasi tahap eksekusi yang berlaku; spec ini sendiri belum mengizinkan implementasi.

Self-review: tidak ada placeholder kebijakan, tidak mengubah scope release, akses/suspension mengikuti fondasi, QR tetap read-only, uniqueness dan boarding prerequisite ditegakkan pada database dan service, retry serta race mengikuti lock order yang sudah diterapkan. Konflik yang diketahui: uraian lama snack pada modular spec tidak menyebut prerequisite boarding; fondasi FINAL yang lebih baru mensyaratkannya dan menjadi acuan di sini.
