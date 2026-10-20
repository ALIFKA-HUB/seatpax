# PO Onboarding & Free Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PO baru dapat mendaftar Free, menyiapkan master, mencoba pembelian simulasi tanpa Midtrans, dan reset transaksi simulasi tanpa kehilangan master.

**Architecture:** Shared master tetap company-scoped pada tabel existing; transaksi simulasi memakai schema privat `simulation`. Server services mengendalikan registration, entitlement/quota, run revision, simulator dan reset; UI hanya menjadi adapter verified actor. Semua alur baru diaktifkan bersama setelah selesai agar Free tidak melewati batas penjualan nyata selama implementasi bertahap.

**Tech Stack:** Next.js App Router/React, TypeScript, Zod, Postgres.js/Drizzle, Supabase Auth existing, QR library existing; tanpa dependency produk baru.

**Spec:** [approved technical specification](../specs/2026-10-20-po-onboarding-free-simulation-design.md), approved in chat after cooldown clarification. Read it together with D2026-10-20-03 and `docs/analysis/SEATPAX_SPEC_REVIEW.md`.

**Status:** Plan untuk review; belum dieksekusi. Metode rekomendasi: native/inline melalui executing-plans karena perubahan berbagi kontrak transaksi. User preference untuk reviewer/subagent tetap GPT-6 Luna medium bila delegasi digunakan; model utama hanya dapat diatur oleh runtime, bukan dokumen ini.

## Global Constraints

- Free: 2 rute, 2 armada, 2 template, 2 Crew, 3 keberangkatan simulasi, 30 booking simulasi; arsip/inaktif dan draft tetap dihitung.
- Default teknis dalam spec kini disetujui melalui review: 20 titik layanan, 2 kelas, maksimal 50 stop/rute, grid 30×8/240 sel, satu active hold/actor/run, 20 receipt reset terakhir.
- Jeda reset sukses 60 detik/workspace; simulasi baru langsung tersedia sesudah reset.
- Membership ADMIN_PO termasuk DISABLED mencadangkan satu perusahaan; tidak menghapus membership legacy untuk memenuhi constraint.
- Tidak ada Midtrans/key provider di simulator; tidak mengubah histori legacy, Demo A/B, Auth users, status perusahaan atau token tiket lama.
- Tidak ada undangan Crew, billing Pro, merchant PO live, Flutter, scheduler mingguan, complaints atau route overrides dalam plan ini.
- Secret tetap server-only. Email/role/plan dari payload client bukan sumber otoritas. Existing app-metadata/user-metadata tidak menggantikan fresh membership.
- Persetujuan plan tidak otomatis menyetujui testing: **jangan menambah atau menjalankan test sebelum pengguna meminta test/verifikasi**. Acceptance scenarios di bawah adalah daftar untuk verifikasi nanti. Tidak menandai hasil sebagai passing tanpa evidence.
- File `next-env.d.ts` dan `.codex-remote-attachments/` yang telah berubah di main berada di luar pekerjaan; jangan stage/revert.

## Review Focus

1. Dua tab mendaftar dengan request key berbeda: satu actor tetap hanya memiliki satu perusahaan; owned retry kembali ke hasil yang sama. Pemilik: Task 2.
2. Membership dinonaktifkan ketika request sedang berjalan: tidak boleh menyelesaikan mutasi setelah pencabutan yang sudah berlaku. Pemilik: Task 1/3.
3. Reset bersamaan checkout/hasil simulator: revision lama gagal dengan pesan refresh, run lama tidak hidup kembali. Pemilik: Task 7.
4. URL trip/payment nyata ditebak oleh Admin Free: tombol tersembunyi saja tidak cukup, server tetap menolak. Pemilik: Task 3/6.
5. Timestamp tepat pada deadline, hasil sukses diulang atau ditimpa failure: occupancy/tiket hanya sekali; conflict tidak mengambil kursi lain. Pemilik: Task 5/6.

## File structure dan kontrak bersama

Lokasi di bawah relatif terhadap root repository SeatPax. Jangan menulis logika bisnis ke komponen halaman. Tambahkan hanya file yang dipakai deliverable, tanpa scaffold kosong.

| Area | File utama baru / tanggung jawab |
|---|---|
| Entitlement | `modules/subscription/{types,policy,repository,service}.ts`: mode workspace dan kuota master |
| Onboarding | `modules/onboarding/{types,validation,repository,service}.ts`: input, receipt dan atomic registration |
| Simulation storage | `lib/db/simulation-schema.ts`, `modules/simulation/{types,repository,transaction}.ts`: private tables, guard/run lock |
| Simulation domain | `modules/simulation/{trip-service,hold-service,checkout-service,payment-service,ticket-service,reset-service}.ts` |
| UI onboarding | `app/onboarding/po/{page,registration-form,actions}.tsx` (actions memakai `.ts`) |
| UI simulation | route company-private di Task 8; presentation dan server adapter terpisah |
| Delivery | `scripts/audit-po-onboarding.ts`, `docs/setup/PO_ONBOARDING_FREE_SIMULATION_SETUP.md` |

Public service interfaces menggunakan `Context={actorId:string;companyId:string}` dan `DomainError` existing. Tetapkan exported types dalam task pemiliknya dan import di task berikutnya:

```ts
type VerifiedActor = {userId:string;verifiedEmail:string};
type RunRef = {runId:string;revision:number};
type CommandKey = {requestKey:string};
type MutationResult<T> = {value:T;run:RunRef};
type SimulationContext = Context & {runId:string};
type SimulationOutcome = 'PENDING'|'SUCCESS'|'FAILED'|'EXPIRED';
```

Onboarding memakai hash dari payload normalisasi; simulation command key selalu diikat actor/company/run dan hash payload. Beda payload pada key sama menghasilkan conflict. Exact replay tidak menaikkan revision atau mengonsumsi kuota lagi.

## Task 1: Penyimpanan aditif dan batas transaksi

**Files:** Modify `lib/db/schema.ts`, `drizzle/meta/_journal.json`; create `lib/db/simulation-schema.ts`, `scripts/audit-po-onboarding.ts`, `modules/simulation/types.ts`, `modules/simulation/transaction.ts`; migration baru di `drizzle/` dibuat mengikuti generator/journal repository setelah membaca CLI help. Jangan menebak nomor file ketika execution dimulai.

**Produces:** schema untuk company contact profile, Free entitlement, registration receipt, simulation run/reset receipt serta normalized simulation trip/snapshot/hold/booking/payment/assignment/occupancy/ticket. `withSimulationTransaction<T>(client:Sql,ctx:SimulationContext,work:(tx:DomainTx,run:RunRef,now:string)=>Promise<T>):Promise<T>` melakukan fresh guard dan run lock; service yang memutasi memanggil `bumpRun(tx,companyId,runId):Promise<RunRef>` tepat sekali per perubahan.

- [ ] Buat read-only audit yang menghitung ADMIN_PO per distinct company/user termasuk DISABLED, mengeluarkan UUID minimum tanpa email/secret, dan exit nonzero bila constraint tidak aman. Audit tidak memperbaiki data.
- [ ] Definisikan schema aditif: profil privat FK company/regency, entitlement unik company, registration receipt unique actor/request, satu current run per company dan reset receipt di luar subtree run. Run revision disimpan bigint dengan constraint 0–9007199254740991, diekspos sebagai number safe integer dan overflow ditolak sebelum mutasi.
- [ ] Tambahkan unique Admin reservation pada user untuk role ADMIN_PO termasuk DISABLED; migration memeriksa konflik dahulu dan rollback keseluruhan bila ada. Tidak menghapus row existing.
- [ ] Buat tabel simulation dengan compound company/run/resource identities. Snapshot stops, segments, seats dan inventory menjadi immutable saat publication; occupancy unique inventory, assignment/ticket unique passenger. Payment statuses hanya PENDING/SIMULATED_PAID/FAILED/EXPIRED. Booking terminal mencakup CONFIRMED/PAYMENT_CONFLICT/FAILED/EXPIRED.
- [ ] Enable RLS pada tabel baru, revoke schema/table/function privilege PUBLIC/anon/authenticated pada simulation; tidak menambah exposed API atau SECURITY DEFINER. Grant hanya ke jalur server repository yang diperlukan.
- [ ] Tetapkan lock order membership SHARE → company SHARE → entitlement UPDATE → current run UPDATE → resource, clock database, timeout/retry bounded seperti pola existing. Reset/membership/status services harus memakai ordering kompatibel; tidak mengunci master sebelum entitlement di create Free.
- [ ] Siapkan migration tanpa menjalankannya saat plan dibuat; pada execution jalankan preflight read-only sebelum target development migration. Jika ada konflik/target tidak jelas, laporkan dan hentikan operasi DB dependent sambil lanjut pekerjaan file yang independen.
- [ ] Commit hanya schema, audit dan transaction/types deliverable. Acceptance nanti: cross-company FK ditolak, privileges tertutup, duplicate Admin gagal atomik, revocation ordering tidak deadlock.

## Task 2: Atomic registration dan form PO

**Files:** Create `modules/onboarding/{types,validation,repository,service}.ts`, `app/onboarding/po/{page.tsx,registration-form.tsx,actions.ts}`; modify `modules/auth/return-path.ts` hanya bila safe return belum menerima path ini, dan entry link pada `app/account/page.tsx`.

**Consumes:** Task 1 tables. **Produces:** `registerPo(actor:VerifiedActor,input:RegistrationInput & CommandKey):Promise<{companyId:string;dashboardHref:string}>`; `RegistrationInput={companyName:string;responsibleName:string;whatsapp:string;regionRegencyId:string}`. Repository/service dependency injection mengikuti pola modules existing.

- [ ] Definisikan strict validated shape, nama 1–120 trim, regency UUID aktif, WhatsApp Indonesia `08…`/`628…`/`+628…` dinormalisasi E.164 dengan validasi domain nomor existing. Jangan menerima arbitrary international/extension/markup sebagai nomor Indonesia.
- [ ] Actor diperoleh dari `getVerifiedUser`, profile di-ensure lewat service existing, lalu user row di-lock untuk registration. Periksa receipt sebelum konflik reservation; payload hash berbeda dengan key sama conflict.
- [ ] Dalam satu transaksi buat company ACTIVE, private contact, FREE_SIMULATION entitlement, run awal, ADMIN_PO dan receipt. Recheck region aktif dengan shared row lock; slug nama + UUID suffix dibuat server dengan maksimal tiga percobaan collision.
- [ ] Semua konflik unique Admin dipetakan ke copy spec: “Email sudah digunakan oleh Admin PO” / “Email ini sudah terdaftar sebagai Admin PO di perusahaan lain. Gunakan email berbeda untuk melanjutkan.” / “Ganti email”. Tidak memaparkan perusahaan lain. Owned retry kembali ke dashboard walau respons pertama hilang.
- [ ] Form menyimpan request key selama retry dan mengganti key hanya saat memulai submission baru; email readonly berasal dari sesi. Ganti email memanggil logout/login existing, tidak mengubah identitas Auth. Account switch mengosongkan request key milik actor lama.
- [ ] Tambahkan aksi eksplisit Daftarkan perusahaan; jangan ubah fallback login pelanggan. Redirect sukses ke dashboard Task 8; gate onboarding tetap off sampai Task 9 selesai.
- [ ] Commit deliverable. Acceptance nanti: double submit/two tabs, forged email/role/plan, katalog retired, rollback partial create dan expired session.

## Task 3: Quota guard dan larangan penjualan nyata Free

**Files:** Create `modules/subscription/{types,policy,repository,service}.ts`; modify `modules/route/service.ts`, `modules/fleet/{template-service,vehicle-service}.ts`, `modules/trip/{draft-service,publication-service}.ts`, `modules/inventory/{repository,hold-service}.ts`, `modules/booking/checkout-service.ts`, `modules/payment/creation-service.ts`, `modules/access/seed.ts` hanya untuk menolak provisioning Free yang melewati quota; gunakan path tepat setelah membaca file.

**Produces:** `readWorkspaceMode(tx,companyId):Promise<'FREE_SIMULATION'|'LEGACY'>`, `assertFreeCapacity(tx,ctx,resource):Promise<void>`, `assertLegacySaleAllowed(tx,companyId):Promise<void>`, `quotaUsage(ctx):Promise<QuotaUsage>`. `resource` union STOP/CLASS/ROUTE/VEHICLE/TEMPLATE/CREW; limits 20/2/2/2/2/2. LEGACY berarti kontrak existing, bukan paket Pro atau hak tenant baru.

- [ ] Mode berasal dari database, bukan flag client. FREE entitlement eksplisit menolak live publication/draft creation nyata/hold/initiation/provider creation; absent entitlement mempertahankan kontrak perusahaan legacy existing. Onboarding tidak pernah menghasilkan company tanpa entitlement.
- [ ] Pada create master lock entitlement sebelum master/source locks, hitung seluruh record tersimpan termasuk inactive/archive. Existing edit yang tidak menambah row tidak mengambil slot baru; cloning tetap create. Jangan menggunakan status reactivation untuk mengurangi hitungan.
- [ ] Audit semua jalur master writes yang bisa diakses app. Quota hook harus berada pada transaksi service, tidak hanya form. Seed/operator tooling tidak boleh menambah Crew ke Free melewati limit; tidak memperkenalkan undangan UI.
- [ ] Exclude Free di discovery/search/location candidate query serta direct detail/availability/hold/payment. Recheck transaksi mutasi; tidak cukup filter query daftar. Historical initiated valid payment legacy tidak diubah oleh guard ini.
- [ ] Commit deliverable. Acceptance nanti: create paralel pada sisa satu slot, forged companyId, direct URL, edit saat kuota penuh dan status archiving tidak menambah slot.

## Task 4: Simulation draft dan publication snapshot

**Files:** Create `modules/simulation/{repository,trip-service}.ts`; modify `modules/simulation/types.ts`; reuse `modules/trip/{validation,time,snapshot}.ts` sebagai fungsi murni, tanpa memindahkan legacy persistence.

**Produces:** `saveSimulationTrip(ctx:SimulationContext,input:unknown,request:CommandKey & {tripId?:string;expectedRevision?:number}):Promise<MutationResult<{tripId:string}>>`, `publishSimulationTrip(ctx,tripId,expectedRevision,requestKey):Promise<MutationResult<{tripId:string}>>`, `listSimulationTrips(ctx:Context):Promise<SimulationTripSummary[]>`.

- [ ] Persist draft ke schema simulation, cap tiga termasuk draft. Validate route/vehicle/class tenant sama, active references, tanggal WIB dan sales close mengikuti validator existing. Request replay bukan trip baru.
- [ ] Publication membangun full immutable ordered-stop/time/fare/layout snapshot, normalized seats/segments dan seat×segment inventory; gunakan tariff per kelas dan snapshot identity yang dibaca server.
- [ ] Master edits tidak mengubah published snapshot. Record simulation tidak dapat dicari lewat repository `public.trips`; jangan menambahkan simulator mode ke adapter publication legacy.
- [ ] Tambahkan bounded list/current-run reads; invalidate stale run via standard simulation guard. Commit. Acceptance nanti: publication retry, missing fare, crossed tenant references, source edit versus publication, fourth draft rejected.

## Task 5: Hold dan checkout simulasi

**Files:** Create `modules/simulation/{hold-service,checkout-service}.ts`; extend simulation repository/types. Reuse pure helpers `modules/inventory/{interval,fare,deadline}.ts` dan input validation SELF/OTHER; jangan invoke legacy checkout service yang menulis public tables.

**Produces:** `holdSimulationSeat(ctx:SimulationContext,input:SimulationHoldInput):Promise<MutationResult<{holdId:string}>>`, `initiateSimulationCheckout(ctx:SimulationContext,input:SimulationCheckoutInput):Promise<MutationResult<{bookingId:string}>>`, `simulationBooking(ctx:SimulationContext,bookingId:string):Promise<SimulationBookingView>`. Define `SimulationHoldInput=CommandKey & {tripId:string;seatId:string;fromStopId:string;toStopId:string}` dan `SimulationCheckoutInput=CommandKey & {holdId:string;mode:'SELF'|'OTHER';name:string;phone:string}` di simulation types. Parser menerima IDs dan server-owned run context, bukan harga dari browser.

- [ ] Lock current run lalu inventory, expire relevant holds menurut clock DB, tolak overlap half-open interval. Satu ACTIVE hold per actor/run. Hapus expired/uninitiated holds lama beserta ephemeral receipts yang tidak direferensikan booking saat mengganti hold; initiated holds dibatasi oleh 30 booking. Key milik hold lama yang dipangkas harus dianggap usang, bukan menciptakan duplikat tak terlihat.
- [ ] Checkout satu passenger/seat, SELF/OTHER, tanpa mutasi profile actor. Compute fare positif dari snapshot, immutable payload hash, unique booking/hold dan satu payment. Semua booking termasuk failed/expired dihitung pada batas 30.
- [ ] Initiation sebelum base expiry memberi effective deadline base+60 detik satu kali; tepat pada deadline dianggap expired. Concurrent retry returns same booking; closed interval/hold ownership mismatch ditolak.
- [ ] Reads memiliki company/run/actor authorization. Commit. Acceptance nanti: two tabs seat sama, kuota booking terakhir, zero fare, deadline boundary dan expired-tab key.

## Task 6: Simulator hasil pembayaran dan tiket

**Files:** Create `modules/simulation/{payment-service,ticket-service}.ts`; extend repository/types; modify scanner resolver guard hanya bila perlu untuk namespace rejection (ikuti `modules/boarding/service.ts`), tanpa menambahkan scanner simulasi.

**Produces:** `applySimulationOutcome(ctx,bookingId,outcome:SimulationOutcome,requestKey:string):Promise<MutationResult<SimulationBookingView>>`, `getSimulationTicket(ctx,ticketId):Promise<SimulationTicketView>`.

- [ ] PENDING tidak menerbitkan tiket dan dapat dilanjutkan ke terminal. FAILED/EXPIRED terminal melepaskan hold simulasi; tidak dibuka kembali. Terminal berbeda berikutnya conflict, replay identik mengembalikan hasil lama tanpa duplicate audit/revision.
- [ ] SUCCESS mencatat SIMULATED_PAID, recheck deadline/interval dan inventory; eligible menghasilkan assignment/occupancy dan unique ticket atomik. Terlambat/kehilangan inventory menghasilkan PAYMENT_CONFLICT tanpa tiket. SIMULATED_PAID tidak pernah downgrade.
- [ ] QR payload memakai `seatpax-sim:` namespace + opaque random token yang hash-nya disimpan; simpan sumber token terenkripsi memakai mekanisme crypto existing dengan AAD/namespace terpisah dari tiket nyata. Tidak memberi akses tanpa sesi Admin. Live scanner menolak prefix ini sebelum lookup; jangan mengubah decrypt key/version legacy.
- [ ] Tidak mengimpor/memanggil Midtrans provider/event/confirmation service atau menambah endpoint webhook simulation. Read stale/reset ticket menghasilkan pesan spec. Commit. Acceptance nanti: replay success vs failure, fake callback, ticket QR beda tenant dan late success tanpa seat theft.

## Task 7: Reset current run secara atomik

**Files:** Create `modules/simulation/reset-service.ts`; extend repository/types.

**Produces:** `simulationResetSummary(ctx:Context):Promise<{run:RunRef;counts:ResetCounts;nextResetAt:string|null}>`, `resetSimulation(ctx:SimulationContext,input:CommandKey & {expectedRevision:number}):Promise<{run:RunRef;receiptId:string;nextResetAt:string}>`.

- [ ] Summary read konsisten, fresh auth, menghitung seluruh dependensi current run; jangan memuat PII passenger ke modal. Timestamp cooldown memakai last successful reset workspace, bukan client timer.
- [ ] Lock guards sesuai Task 1, check receipt replay dahulu, kemudian current run/revision/cooldown. Sukses terakhir+60 detik adalah batas berikutnya; tepat pada batas boleh reset. Rejected attempts tidak menulis audit.
- [ ] Delete FK children topologically: payment events bila ada → tickets → occupancy → assignments → payments → booking passengers → bookings → holds → inventory → snapshot seats/segments/stops → trips → run lama. Sesuaikan urutan terhadap FK persis Task 1 tanpa menambah scope entitas baru. Buat run baru dan receipt dalam transaksi yang sama. Jangan menyentuh public transaction/master/Auth tables atau menonaktifkan constraint.
- [ ] Receipt hidup di luar run, hanya 20 hasil terakhir per workspace; pangkas dalam transaksi reset. Request run lama yang receipt-nya sudah dipangkas conflict, tidak melakukan reset kedua. Mutasi baru Task 4–6 selalu menaikkan run revision; request lama harus refresh summary.
- [ ] Commit. Acceptance nanti: reset/checkout/success races, response hilang lalu retry, cooldown boundary, tiket tab lama, rollback satu DELETE gagal dan master tetap utuh.

## Task 8: Dashboard, preview responsif dan adapter UI

**Files:** Create `app/admin/companies/[companyId]/page.tsx`, `app/admin/simulation-{actions,data}.ts`, `app/admin/components/{free-onboarding-guide,simulation-shell,simulation-payment-controls,simulation-reset-dialog}.tsx`; create `app/admin/companies/[companyId]/simulation/page.tsx`, `simulation/trips/{page.tsx,[tripId]/page.tsx}`, `simulation/holds/[holdId]/page.tsx`, `simulation/bookings/[bookingId]/page.tsx`, `simulation/tickets/[ticketId]/page.tsx` (semua subpath di bawah company path); modify `app/admin/page.tsx`, `app/admin/components/{admin-shell,admin-navigation}.tsx`, `app/admin/admin-refresh.css` dan existing trip form adapter bila dipakai ulang.

**Consumes:** services Task 2–7; data adapter membuat ctx hanya dari fresh auth + validated company route. **Produces:** registration-to-ticket journey, quota dashboard, explicit reset modal.

- [ ] `/admin` mengantar Free ke company dashboard; legacy tetap entry existing agar tidak merombak navigasi yang belum disetujui. Dashboard read-only progres berasal dari data; arah titik→rute→armada→jadwal menampilkan prasyarat kelas/template yang dibutuhkan.
- [ ] Free menu Perjalanan masuk simulation trip list, bukan form public trip legacy. Bind reusable form/grid ke simulation actions tanpa conditional business logic di UI. “Coba sebagai pelanggan” menjelaskan prasyarat sampai ada published sim trip.
- [ ] Shell seluruh preview menampilkan **SIMULASI**, PO identity, kembali dashboard; sukses ticket juga bertuliskan tidak berlaku untuk perjalanan nyata. Tombol outcome hanya pada sim booking authorized. Upgrade hanya informasi, tidak mengubah entitlement.
- [ ] Modal reset menampilkan counts/revision, button confirm disabled selama submit dan countdown cooldown berdasarkan server nextResetAt. Error stale mempertahankan state yang masuk akal dan meminta ringkasan baru, tanpa auto-submit ulang reset.
- [ ] Desktop/tablet/mobile: mobile form satu kolom, grid kursi dapat di-scroll tanpa menutup tombol, table menjadi scroll-region berlabel, dialog tidak melebihi viewport. Focus management, keyboard close, live errors dan accessible labels. Jangan menambah imagery/bus/logo baru.
- [ ] Commit. Acceptance nanti: 360/768/1280px, keyboard-only modal, expired session, catalogue unavailable, click retry dan pindah akun.

## Task 9: Penyambungan, audit dan handoff

**Files:** Create `docs/setup/PO_ONBOARDING_FREE_SIMULATION_SETUP.md`; update `docs/seatpax/{00_INDEX,02_MVP_SCOPE,03_ROLES_RBAC_AUTH,10_DATA_MODEL_DATABASE,11_API_PROJECT_STRUCTURE,13_UI_UX_DESIGN,19_DECISION_LEDGER}.md`, `lib/env/server.ts` untuk feature flag onboarding server-only default off.

- [ ] Lakukan source review spec-to-task: tidak ada import provider di simulator, guard Free tersedia di direct live writes/reads, reset tidak menulis public master/transactions, semua mutations memakai guarded run/revision dan tidak ada email enumeration.
- [ ] Baca diff seluruh branch, catat setiap keterbatasan dan risiko tanpa mengklaim acceptance yang belum dilakukan. Pastikan export schema dan migration journal tetap konsisten serta `.env.local` tidak masuk commit.
- [ ] Jika user telah meminta verifikasi saat execution, barulah tambah/jalankan targeted unit/integration tests untuk lima Review Focus dan acceptance tasks, di target DB khusus yang jelas; gunakan `npm run typecheck`, `npm run lint`, `npm run build` dan test commands repository sesuai permintaan. Jika belum, tandai semua **belum diverifikasi**, jangan menjalankan test/build otomatis untuk mengklaim selesai.
- [ ] Operational DB application hanya setelah execution authorized, target development teridentifikasi dan audit Task 1 aman. Catat migration applied versus prepared secara terpisah. Jangan mengaktifkan registration pada DB yang belum migrate.
- [ ] Gate onboarding tetap default off sampai seluruh Task 1–8 selesai dan acceptance yang diperlukan dilaksanakan/diterima pengguna. Jika testing masih ditunda, serahkan kode sebagai implementation awaiting verification, bukan live-ready. Tidak memakai feature flag browser untuk authorization.
- [ ] Tulis receipts/status delivery tanpa secret; update spesifikasi hanya sesuai hasil nyata. Commit documentation dan perubahan wiring terakhir; integration/merge mengikuti instruksi user berikutnya.

## Self-review dan handoff

Coverage: spec §§1–5 → Tasks 1–2; §§6–7 → Tasks 1/3; §8 → Tasks 4/8; §9 → Tasks 5–6; §10 → Task 7; §§11–13 → Tasks 8–9. Review Focus dipetakan ke task pemilik. Scope billing/merchant live/undangan Crew tetap dikeluarkan. Tidak ada test file, schema atau product code yang dibuat saat penulisan plan ini.

Review plan sebelum execution. Rekomendasi native/inline karena task berbagi schema/run contracts; bila user memilih subagent-driven, pertahankan task interfaces dan override model/effort sesuai AGENTS.md. Persetujuan tertulis untuk plan serta pilihan metode diperlukan sebelum mulai implementasi.
