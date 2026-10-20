# Seatpax — Rancangan induk SaaS shuttle

Tanggal: 20 Oktober 2026. **Status: draft untuk review pengguna; belum menjadi kontrak implementasi lengkap.**

Dokumen ini merangkum keputusan D2026-10-20-03 beserta penyempurnaannya. Bagian “disepakati” adalah keputusan produk; bagian “usulan” dan “belum diputuskan” tidak memberi izin implementasi. Rancangan ini mencakup beberapa subsistem, sehingga perlu dipecah menjadi spesifikasi teknis dan plan per bagian.

## 1. Tujuan dan batas produk — disepakati

Seatpax menyediakan perangkat penjualan dan operasional untuk perusahaan shuttle antarkota. Banyak PO dapat berlangganan, masing-masing memiliki workspace, data, inventori kursi, dan portal pelanggan sendiri. Sasaran awal adalah PO yang seluruh pemesanan tiketnya ditangani Seatpax. Integrasi distribusi OTA atau sinkronisasi penjualan platform lain berada di luar lingkup awal.

Keberhasilan berarti PO dapat mencoba simulasi, berlangganan, lalu menjalankan penjualan miliknya sendiri. Perubahan paket atau tunggakan langganan tidak boleh menghapus data atau mengabaikan kewajiban terhadap penumpang yang sudah membayar.

Belum ada PO pilot nyata atau lokasi layanan terverifikasi. Demo PO A/B tetap data simulasi; kota referensi nasional tidak membuktikan adanya terminal/pool yang benar-benar dilayani PO.

## 2. Paket awal — disepakati

### Pendaftaran awal PO — disepakati

Form awal berisi nama perusahaan/shuttle, nama penanggung jawab, nomor WhatsApp dan kota/kabupaten dari referensi yang tersedia. Email diambil dari akun yang sedang login. Setelah pendaftaran berhasil, pengguna masuk dashboard Free simulasi dengan panduan penyiapan berurutan: titik layanan → rute → armada → jadwal. Urutan panduan ini tidak mengubah dependensi teknis domain yang sudah berlaku.

Verifikasi untuk penjualan tiket nyata dibahas terpisah pada upgrade Pro; pengisian form awal tidak berarti perusahaan sudah diverifikasi atau boleh menerima pembayaran nyata. Batas satu perusahaan per akun Admin PO tetap berlaku. Validasi field, privasi nomor kontak, kegagalan/retry pembuatan workspace dan detail verifikasi upgrade memerlukan spesifikasi teknis.

Paket melekat pada workspace PO, bukan menjadi role pengguna.

| Ketentuan | Free | Pro |
|---|---|---|
| Harga | Gratis selamanya | Rp299.000/workspace/bulan |
| Penggunaan | Simulasi saja | Operasional dan penjualan nyata setelah konfigurasi pembayaran PO siap |
| Armada | 2 record tersimpan | 30 armada yang layak untuk operasi/penjualan baru |
| Rute | 2 record tersimpan | Kuota belum diputuskan |
| Template kursi | 2 record tersimpan | Kuota belum diputuskan |
| Crew | 2 akun | Kuota belum diputuskan |
| Keberangkatan simulasi | 3 | Kuota belum diputuskan |
| Booking simulasi | 30 | Kuota belum diputuskan |

Untuk Free, arsip tetap dihitung. Saat kuota habis, tersedia reset simulasi atas permintaan dan konfirmasi pengguna, atau upgrade. Angka kuota adalah batas per workspace dan harus ditegakkan di server, termasuk ketika request bersamaan.

Free tidak melakukan penagihan tiket nyata dan keberangkatan simulasinya tidak masuk pencarian publik untuk penjualan nyata. Label simulasi perlu terlihat pada alurnya. Mekanisme pemisahan data serta pemakaian ulang master saat upgrade masih memerlukan desain; histori simulasi tidak boleh disalahartikan sebagai transaksi nyata.

### Reset simulasi Free — disepakati

Reset menghapus booking, pembayaran simulasi dan keberangkatan simulasi pada workspace tersebut. Profil PO, titik layanan, rute, armada, template kursi dan akun Crew tetap tersimpan. Sebelum reset, tampilkan ringkasan data yang akan dihapus dan minta konfirmasi pengguna. Ini menetapkan perilaku fitur reset mendatang, bukan izin menghapus data sekarang.

Reset tidak menambah kapasitas penyimpanan master: rute/armada/template/Crew yang dipertahankan tetap dihitung pada kuotanya. Reset tidak boleh menjangkau transaksi nyata atau perusahaan lain. Daftar dependensi transaksi simulasi (termasuk tiket, hold, inventori dan event terkait), penanganan request yang sedang berjalan, audit reset dan retensi teknis perlu ditetapkan dalam spesifikasi reset sebelum implementasi agar tidak meninggalkan relasi rusak atau menghidupkan kembali transaksi yang dihapus.

Kuota Pro 30 berarti kelayakan armada untuk operasi baru, bukan izin penyimpanan tanpa batas. Batas storage, record historis, stop, kursi, unggahan, dan frekuensi tindakan belum ditentukan. Harga dan kuota ini juga bukan hasil validasi biaya atau jaminan kapasitas infrastruktur.

## 3. Dua aliran pembayaran — disepakati

1. **Langganan:** PO membayar biaya SaaS kepada Seatpax melalui invoice bulanan. PO memulai pembayaran secara manual; pembuatan invoice dan pengingat diotomatisasi. Autodebit ditunda.
2. **Tiket:** pelanggan membayar tiket ke akun pembayaran PO terkait. Tidak ada keputusan platform menampung seluruh penjualan lalu melakukan payout.

Saat ini kode hanya menggunakan satu merchant Midtrans Sandbox dari environment. Dukungan merchant per PO, onboarding pembayaran dan billing langganan belum diimplementasikan. Pemilihan akun merchant, penyimpanan/rotasi kredensial dan penanganan transaksi lama setelah perubahan konfigurasi memerlukan spesifikasi teknis tersendiri.

## 4. Langganan habis dan pemulihan — disepakati

Setelah periode Pro habis, terdapat **grace tujuh hari**. Layanan berlanjut dengan pengingat. Setelah grace, penjualan baru dihentikan. Tidak ada penghapusan otomatis, pengurangan record ke kuota Free, atau pembatalan otomatis tiket yang sudah dibayar.

Pelanggan tetap dapat mengakses tiketnya. Crew yang masih berwenang dan ditugaskan tetap dapat melayani manifest/boarding kewajiban yang ada. Pembayaran yang sudah dimulai secara valid tetap diproses menurut kontrak hold dan pembayaran yang berlaku; perubahan langganan tidak menjadi alasan menolak fulfillment yang masih sah.

Pembayaran perpanjangan yang terverifikasi memulihkan layanan yang memenuhi syarat lain. Pembayaran tersebut tidak otomatis membatalkan suspend manual, masalah merchant, atau pembatasan armada. Status langganan harus dibedakan dari status perusahaan dan keanggotaan.

Jam mulai/akhir periode bulanan, tanggal invoice, pembayaran lebih awal/terlambat, serta titik potong publication/hold/initiation masih perlu ditentukan. **Grace langganan tujuh hari berbeda dari grace pembayaran tiket yang sudah ada.**

## 5. Perubahan harga/benefit — disepakati dengan detail waktu terbuka

Admin Seatpax dapat mengelola harga dan benefit paket. Perubahan tidak boleh diam-diam mengubah periode yang sudah dibayar. Pengguna menghendaki jeda pemberitahuan dan penerapan pada periode berlangganan berikutnya. Seluruh pelanggan Pro akhirnya mengikuti kebijakan baru; tidak ada grandfathering tanpa batas bagi pelanggan lama.

Usulan mekanisme: versi paket menyimpan harga/benefit immutable dan periode berlangganan menyimpan versi yang dibeli. Publikasi versi baru, pemilihan versi invoice dan aktivasi periode harus memiliki aturan konsisten serta audit. Durasi minimum pemberitahuan dan aturan invoice yang terbit sebelum perubahan **belum disepakati**. Angka pemberitahuan 30 hari pernah direkomendasikan, belum menjadi kebijakan final.

### Jika kuota armada turun

Contoh 30 menjadi 20 menjelaskan mekanisme, bukan perubahan kuota awal yang sekarang 30:

- Sebelum berlaku, Admin PO memilih maksimal 20 armada yang akan tetap layak untuk operasi baru.
- Saat berlaku, armada terpilih boleh digunakan untuk penjualan/keberangkatan baru; sepuluh lainnya kehilangan kelayakan tersebut tanpa dihapus.
- Jika belum ada pilihan yang valid, penjualan baru dibatasi sampai penyesuaian selesai. Sistem tidak memilih armada secara acak.
- Perjalanan dengan tiket terjual, layanan Crew yang sah dan fulfillment pembayaran yang sudah dimulai tetap dilindungi, termasuk pada armada yang tidak terpilih.
- Pilihan kelayakan dapat ditukar kemudian dalam kuota dengan tetap menjaga kewajiban penumpang.

Transaksi pemilihan, pengaruh pada jadwal mendatang yang belum terjual, batas assignment baru dan pencegahan konflik ketika menukar armada masih perlu kontrak teknis.

## 6. Portal dan pembagian peran

**Disepakati:** portal pelanggan PO menggunakan path seperti `/po/{company-slug}`, menampilkan identitas dan perjalanan PO tersebut. Pencarian, checkout dan pembayaran terikat pada PO yang dipilih. Custom domain ditunda. Kepemilikan booking tetap diperiksa di server; mengetahui slug atau ID booking bukan bukti hak akses.

Empat kategori role tetap ada: Admin Seatpax, Admin PO, Crew dan pelanggan. Paket Free/Pro tidak menambah role.

### Satu perusahaan untuk akun Admin PO — disepakati

Satu akun Admin PO hanya terhubung sebagai Admin PO pada satu perusahaan. Pengguna menolak kebutuhan undangan Admin PO lintas perusahaan untuk tahap ini. Jika email yang dimasukkan sudah menjadi Admin PO di perusahaan lain, tolak penambahan/pendaftaran tersebut dan tampilkan:

**Email sudah digunakan oleh Admin PO**

Email ini sudah terdaftar sebagai Admin PO di perusahaan lain. Gunakan email berbeda untuk melanjutkan.

Tombol: **Ganti email**.

Ini merupakan batas produk yang harus ditegakkan server-side pada implementasi nanti, bukan hanya alert frontend. Tidak memberi izin mengubah atau menghapus membership lama secara otomatis. Aturan Crew lintas perusahaan, perpindahan kepemilikan, serta status membership nonaktif belum diputuskan oleh persetujuan ini.

### Admin Seatpax — lima menu disepakati

1. Ringkasan.
2. Perusahaan.
3. Paket & benefit.
4. Langganan & tagihan.
5. Riwayat perubahan.

Panel platform mengurus layanan SaaS. Pengelolaan rute, armada, jadwal dan pesanan adalah tanggung jawab Admin PO pada workspace masing-masing.

### Admin PO — pengelompokan usulan untuk review

Ringkasan; Operasional; Pesanan; Tim; Langganan; Pengaturan PO. Operasional mengelompokkan titik layanan, rute/tarif, armada, template, jadwal dan keberangkatan. Pengaturan PO mencakup profil, portal dan koneksi pembayaran. Pengelompokan enam menu ini belum memperoleh persetujuan terpisah secara lengkap.

Yang sudah disepakati: **Pesanan → Daftar pesanan / Pengaduan pelanggan**, dengan jumlah pengaduan belum selesai pada menu Pesanan. Tidak menambah menu utama khusus pengaduan.

Antarmuka web tetap responsif untuk ponsel, tablet dan desktop. Arah Flutter Crew Android/iPhone yang disepakati sebelumnya tetap pekerjaan terpisah; belum ada aplikasi mobile yang dikirimkan oleh rancangan ini.

## 7. Pengaduan pelanggan

**Disepakati:** pelanggan membuka `Laporkan masalah` serta histori pengaduan dari detail booking miliknya. Pengaduan mencakup kasus uang terdebit tetapi booking belum berhasil, termasuk pembayaran pada detik akhir. Admin PO membacanya dalam konteks perusahaan dan booking terkait.

Usulan alur: lakukan rekonsiliasi provider, tampilkan status pemeriksaan secara jujur, lalu izinkan laporan dengan kategori, uraian dan bukti pendukung opsional. Admin PO menjadi penerima awal; eskalasi teknis ke Seatpax perlu otorisasi dan batas akses tersendiri.

Bukti transfer/screenshot dan callback browser bukan otoritas pembayaran. Konfirmasi provider dan pemeriksaan inventori menentukan hasil. Pembayaran terlambat yang kehilangan hold mengikuti jalur PAYMENT_CONFLICT yang ada; tiket tidak diterbitkan dengan mengambil kursi penumpang lain. Tidak ada janji refund otomatis: implementasi saat ini hanya memiliki pencatatan Sandbox MOCK_REFUND.

Status pengaduan, siapa yang menutup/membuka kembali, notifikasi, waktu respons, akses/lama simpan lampiran, eskalasi dan prosedur refund nyata belum diputuskan. Akses terhadap kewajiban lama perlu dipertahankan meskipun langganan PO habis.

## 8. Perubahan operasional yang dipisahkan

Pengguna menghendaki rute sebagai dasar yang dapat disesuaikan untuk satu keberangkatan dan jadwal berulang dengan pilihan hari. Ini bukan fitur yang otomatis selesai bersama billing SaaS.

Perubahan rute tidak boleh mengubah snapshot keberangkatan lain atau merusak tiket yang sudah dijual. Field yang dapat diedit, batas sesudah publication/penjualan, horizon pembangkitan jadwal, batas jumlah, retry dan konflik armada perlu spesifikasi terpisah. Kontrak inventori dan layanan yang sudah diadopsi tetap berlaku.

## 9. Batas arsitektur — usulan untuk spesifikasi teknis

Ikuti domain module/service pada `11_API_PROJECT_STRUCTURE.md`; handler dan komponen UI tidak menjadi sumber aturan entitlement. Pisahkan tanggung jawab: onboarding workspace, katalog versi paket, invoice/periode langganan, keputusan kelayakan penjualan, konfigurasi pembayaran PO, dan pengaduan.

Authorization harus memeriksa user, membership/assignment, perusahaan dan kepemilikan resource di server. Entitlement harus diperiksa pada jalur mutasi yang relevan, bukan sekadar menyembunyikan tombol. Pengurangan kuota dan pemesanan bersamaan harus mempertahankan invariant transaksi yang ada. Jangan menerima company/merchant dari client sebagai sumber otoritas.

Tidak ada schema/migration final dalam dokumen ini. Review `SEATPAX_SPEC_REVIEW.md` beserta overlay implementasi terkait sebelum mendesain schema, pembayaran atau Crew. Rekomendasi historis yang masih pending tidak otomatis menjadi fitur yang diadopsi.

## 10. Keputusan terbuka dan urutan lanjutan

| Bagian | Yang harus diputuskan sebelum plan implementasinya |
|---|---|
| Free/onboarding | Enforcement batas satu perusahaan Admin PO, anti-abuse, batas data sekunder, pemisahan simulasi, dependensi/concurrency reset dan retensi |
| Pro/billing | Kuota selain armada, kalender bulanan, invoice/perpanjangan, pajak dan penanganan pembayaran langganan gagal |
| Versi paket | Jeda pemberitahuan, periode efektif, invoice yang sudah terbit/dibayar, perubahan harga |
| Entitlement | Titik potong penjualan dan transaksi kuota; jadwal belum terjual; penukaran armada |
| Merchant PO | Cara koneksi/verifikasi, rahasia/rotasi, routing webhook dan pembayaran historis |
| Portal | Slug lifecycle, sesi/return URL, navigasi akun lintas PO dengan ownership tetap aman |
| Pengaduan | Lifecycle, bukti, eskalasi, akses, retensi dan batas refund nyata |
| Migrasi | Perlakuan akun/demo/booking lama dan rollback; tidak mengubah histori menjadi transaksi live |

Usulan urutan pengerjaan: **(1)** Free/onboarding serta pemisahan simulasi, **(2)** paket/periode/invoice dan entitlement, **(3)** merchant PO dan portal live, **(4)** pengaduan, **(5)** route override serta jadwal berulang. Setiap bagian memerlukan spesifikasi teknis dan plan yang bisa direview sendiri. Urutan ini belum menjadi persetujuan eksekusi.

## 11. Pemeriksaan dokumen

Penyelarasan dilakukan terhadap ledger: Free permanen menggantikan trial 14 hari; kuota Pro adalah armada operasional sementara arsip Free tetap dihitung; perubahan benefit wajib diadopsi dengan jeda yang belum ditetapkan; riwayat/tiket lama dipertahankan. Bagian terbuka dicatat sebagai keputusan yang dibutuhkan, bukan diisi dengan kebijakan rekaan. Dokumen tidak mengklaim fitur SaaS telah dibangun atau diuji.
