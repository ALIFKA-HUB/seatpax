# Manifest dan boarding online

Tanggal: 8 Oktober 2026. Status: scope disetujui; spec menunggu review pengguna.

## Tujuan dan batas

Crew yang ditugaskan dapat melihat penumpang confirmed, membuka profil melalui QR atau manifest, lalu mencatat boarding tepat sekali. Snack ditunda ke tahap berikutnya, tetap masuk release sebagaimana fondasi yang sudah diadopsi. Scan tidak otomatis mengubah status.

Acuan: `../../seatpax/00_INDEX.md`, scope aktif dan decision ledger, `08_TICKET_QR_MANIFEST.md`, `09_END_TO_END_FLOWS.md`, `03_ROLES_RBAC_AUTH.md`, arah desain terbaru `13_UI_UX_DESIGN.md`, review rekomendasi `../../analysis/SEATPAX_SPEC_REVIEW.md`, serta fondasi D2026-10-06-02. Rekomendasi review bukan perubahan kebijakan yang disetujui.

Pendekatan terpilih: manifest dan boarding online dalam satu slice. Scanner saja tidak menyediakan fallback saat kamera gagal; memasukkan snack sekaligus memperbesar tahap ini. Cash sale, offline sync, no-show otomatis, pembatalan boarding, GPS, export manifest, dan perubahan kursi tidak ditambahkan.

## Prasyarat implementasi

Checkout/payment berada pada branch `codex/checkout-payment`, belum terintegrasi ke main saat spec ini dibuat. Ticket service, confirmed assignments, migration 0006/0007 dan konfigurasi server menjadi dependency. Implementasi boarding harus memakai state terbaru dari branch tersebut setelah integrasi dan pencatatan hasil verifikasi checkout; jangan membuat model tiket alternatif.

## Akses dan data

- Identitas petugas berasal dari sesi terverifikasi server. Company diturunkan dari trip, bukan dipercaya dari form.
- CREW memerlukan membership ACTIVE dan assignment ACTIVE pada trip yang sama. ADMIN_PO dapat membaca manifest tenant sendiri; mutation boarding pada slice ini khusus assigned CREW. Super Admin tidak mendapat akses tenant otomatis.
- Manifest hanya memuat booking CONFIRMED dengan ticket dan assignment valid pada trip tersebut. Pending, expired dan payment conflict tidak masuk.
- Data minimum: ticket ID, nama penumpang snapshot, kode kursi, asal/tujuan, status dan waktu boarding. Tidak mengirim nomor telepon, email, token QR, ciphertext, atau data akun ke daftar manifest.
- Nama/seat dapat dicari dan difilter Semua / Belum naik / Sudah naik. Urutan stabil berdasarkan kursi, stop asal, lalu ticket ID. Penumpang yang memakai kursi sama pada interval bersebelahan tetap dua baris berbeda.
- Total penumpang dan total boarded diberi label terpisah dari kapasitas; keduanya bukan persentase occupancy.
- Suspension company tidak menghalangi operasional tiket existing; membership dan penugasan aktif tetap wajib.

## UI dan scanner

Trip crew menyediakan tombol Manifest dan Scan QR. Profil hasil scan dan profil dari baris manifest memakai komponen dan service yang sama: nama, kursi, interval, trip/armada, status boarding dan timestamp WIB.

Scanner online memakai kamera hanya setelah tindakan pengguna. Kamera ditutup ketika scanner ditutup atau halaman ditinggalkan. QR harus berupa opaque token dengan format tiket existing; tidak menerima URL sebagai navigasi, tidak mencatat token ke log, dan tidak memakai layanan decoder eksternal. Pembacaan berulang dikunci selama resolve agar tidak membanjiri server.

Jika kamera/decoder tidak tersedia atau izin ditolak, tampilkan pesan dan tautan pencarian manifest. Decoder browser native saja tidak dijadikan syarat; plan memilih library lokal yang kompatibel setelah pemeriksaan dependency. Scanner diuji di HTTPS/perangkat mobile; localhost desktop bukan bukti kamera ponsel.

Unknown token, wrong trip dan tiket yang tidak eligible ditolak dengan pesan umum tanpa membocorkan data trip lain. Resolve hanya baca. Sesudah resolve, crew memilih stop dari snapshot trip; tombol Tandai sudah naik hanya dapat diajukan dengan stop asal tiket yang cocok. Kesalahan ditampilkan jelas. Setelah berhasil, tampilkan Sudah naik beserta waktu; retry menampilkan catatan yang sama.

## Penyimpanan dan transaksi

Tambah `boarding_events`: ID, company ID, trip ID, ticket ID, boarding stop ID, actor user ID, source (`QR` atau `MANIFEST`), boarded_at dari database. Constraint unik `(ticket_id, trip_id)` menjamin satu boarding. Composite FK menjaga ticket/stop dalam company dan trip yang sama; actor FK valid. Tabel memakai RLS dan tidak memberi browser akses langsung. Event menjadi catatan audit permanen; tidak ada update/delete boarding melalui UI slice ini.

Domain service pada `modules/boarding` menyediakan manifest read, profile read/resolve dan board. Handler/UI hanya memvalidasi sesi/input dan memanggil service; server memeriksa ulang otorisasi pada setiap request.

Mutation melakukan lock membership dan assignment yang mendasari akses, trip/ticket/assignment terkait, lalu pemeriksaan booking CONFIRMED serta stop asal. Urutan harus konsisten dengan writer pencabutan assignment existing (membership → trip → crew assignment) dan jalur payment; jangan mengambil inventory locks setelah ticket locks. Plan merinci query dan lock order setelah membaca writer terkait. Lock SHARE pada membership/crew assignment menjaga pencabutan berserial dengan boarding: bila pencabutan sudah commit, boarding ditolak; bila boarding sudah memperoleh lock, boarding selesai lebih dahulu.

Board existing mengembalikan event semula setelah validasi akses terkini, tanpa mengganti actor/time/source. Insert dan audit dilakukan atomik dengan event unik; dua petugas/request bersamaan menghasilkan tepat satu event. Kesalahan/rollback tidak menyisakan boarding parsial. Boarding tidak mengubah kursi atau occupancy dan tidak mengklaim snack.

## Verifikasi dan penerimaan

Unit: format QR, validasi stop/source, state hasil scan, permission/error mapping, camera fallback dan cleanup. Database: confirmed-only manifest, interval bersebelahan, wrong-trip/foreign-tenant, revoked membership/assignment, suspended company, wrong stop, scan tanpa mutation, duplicate/concurrent boarding dan rollback.

Browser: assigned crew login, manifest penumpang dari pembayaran Sandbox yang sudah terkonfirmasi, buka profil manual, boarding di stop asal, scan ulang tanpa duplikasi, hitungan manifest berubah, kamera ditolak, keyboard dan viewport 390px. Scan kamera nyata di perangkat HTTPS wajib dicatat terpisah bila belum tersedia. Tes tidak memodifikasi tiket demo existing tanpa pemilihan eksplisit; fixtures terisolasi dipakai untuk concurrency.

Sukses berarti satu tiket confirmed dapat dibaca crew yang tepat dan dicatat naik sekali, dengan catatan actor/time/stop valid; crew yang dicabut atau salah trip tidak memperoleh data/mutation. Snack dan boarding reversal tetap belum diimplementasikan.

## Review spec

Scope, dependency, ownership, stop context, suspension, retry dan fallback mengikuti fondasi. Plan harus membuktikan lock order terhadap schema/writer aktual sebelum kode; bila menemukan konflik kebijakan baru, catat dan bawa kembali ke pengguna. Approval spec ini diperlukan sebelum writing-plans sesuai skill brainstorming.
