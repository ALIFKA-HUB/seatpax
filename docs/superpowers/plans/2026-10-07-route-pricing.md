# Route Pricing Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for preserved inline execution, or superpowers:subagent-driven-development if the user changes method. Track steps using checkboxes.

**Goal:** Admin PO dapat mengelola rute/stop/kelas/tarif dan mencoba quote, dengan isolasi dua PO.

**Architecture:** Server actions tipis memanggil domain services dan repository transaksi PostgreSQL. Identity diverifikasi sebelum transaksi; membership dan resource dikunci/diperiksa ulang saat write. Browser tidak mempunyai akses langsung tabel domain.

**Tech Stack:** Existing Next.js App Router, TypeScript, Drizzle/postgres-js, Zod, Vitest; tanpa dependency produk baru.

**Spec:** [Approved route/pricing design](../specs/2026-10-07-route-pricing-design.md).

## Global Constraints

- Tabel stops/routes/route_stops/service_classes/segment_fares; composite FKs tenant/route, RLS aktif, anon/authenticated revoked. Migration additive.
- ACTIVE/INACTIVE; soft deactivation. Minimal2/maksimal50stop, unik stop pada route, sequence contiguous mulai1.
- Nama/kota1–120, alamat<=500, code1–32 lowercase slug; offset integer0–10080, arrival<=departure dan known offsets tidak mundur.
- IDR, integer rupiah nonnegatif; wire harga/total string desimal, kalkulasi bigint. Missing fare bukan0.
- Urutan rute hanya dapat diubah jika seluruh fare route telah dihapus secara eksplisit. Revision mulai1; setiap write route/fare menaikkan revision; stale expectedRevision conflict.
- Identity Supabase terverifikasi, ADMIN_PO aktif pada target company; Crew/Passenger/Super tanpa membership admin tenant ditolak.
- Lock order untuk writes: membership FOR SHARE → referenced stops/classes UUID terurut → route FOR UPDATE. Recheck state, tenant dan revision sesudah lock. Stop/class mutations mengikuti urutan yang sama bila mengakses route; tanpa network call dalam transaksi.
- Form berlabel bahasa Indonesia, keyboard focus, mobile layout, move-up/down bukan drag-and-drop. Preserve input saat conflict/error.
- Tidak membuat trip/snapshot/inventory/payment/maps/invitation/role editor. Company suspension tidak mencabut hak kelola template.
- Inline execution dipertahankan; satu final reviewer GPT-6 Luna medium. Koneksi/secrets/mapping lokal diabaikan Git; tidak push/deploy otomatis.

## Review Focus

1. Company/resource ID URL diganti atau endpoint berasal dari route lain → deny sebelum write/quote (Tasks2/3/5).
2. Two tabs stale revision dan revoke membership bersamaan → satu writer menang, revoked writer ditolak sesuai lock order (Tasks2/5).
3. Fare0/missing/angka di atas JS safe integer → akurasi bigint atau error, tidak silent rounding/default0 (Tasks3/5).
4. Reorder saat fare ada dan class/stop dinonaktifkan → state tetap konsisten, quote diblokir bila tidak eligible (Tasks2/3/5).
5. Tes seed lama setelah persistent seed → fixture terisolasi, tidak menghapus data demo pengguna (Tasks1/5).

## File map

- `lib/db/schema.ts`, `drizzle/0001_route_pricing.sql` + generated metadata: schema/invariants.
- `modules/access/transaction.ts`: guard membership transaction dan list admin companies.
- `modules/route/{validation,service,repository}.ts`: master data, ordered route, revision writes.
- `modules/pricing/{validation,service,repository}.ts`: adjacent fares dan bigint quote.
- `app/admin/page.tsx`, `app/admin/companies/[companyId]/layout.tsx`, route/stops/service-classes pages and `actions.ts`: server boundary.
- `app/admin/components/{master-form,route-editor,fare-editor,quote-preview}.tsx`, `app/admin/admin.css`: form state/layout.
- `tests/unit/{route-validation,route-service,pricing-service,admin-actions,access-transaction}.test.ts`; `tests/integration/route-pricing.test.ts`: proof.
- `tests/integration/tenant-access.test.ts`, `modules/access/seed.ts`: isolate seed fixture IDs via configurable test identity catalog whose production CLI always uses fixed approved catalog.
- `docs/setup/ROUTE_PRICING_SETUP.md`, related modular docs/ledger: reviewed decisions and evidence.

## Task 1: Schema and reusable integration fixtures

**Interfaces:** Export stops/routes/routeStops/serviceClasses/segmentFares tables. Repository wire `RouteRevision={routeId:string;revision:number}`, `RouteStopInput={stopId:string;arrivalOffsetMin:number|null;departureOffsetMin:number|null}`. Price persisted PostgreSQL bigint and read bigint.

- [ ] Write RED integration assertions for same-company composite FKs, same-route fare endpoint FKs, unique sequence/stop/class code, offset/price nonnegative and browser denial. Keep default unit command free of DB writes.
- [ ] Extend schema, generate additive migration0001; manually inspect SQL, add REVOKE all new tables. No Auth alterations or drops. Add compound unique keys required by FKs; route-stop fare FK binds endpoint route/company together.
- [ ] Add test catalog injection to seed domain/repository with default fixed DEMO catalog; production CLI cannot accept alternate IDs. First regression RED: existing real DEMO companies do not prevent rollback seed tests; rerun/status/reassignment assertions remain. Generate test UUID catalog per run; never delete permanent seed.
- [ ] Apply inspected migration only to verified development session target; run constraint/seed tests GREEN and typecheck. Commit `feat: define tenant route pricing schema`.

## Task 2: Transaction guards and route/master services

**Interfaces:** `withAdminTransaction<T>(actorId:string,companyId:string,work:(tx:DomainTx)=>Promise<T>):Promise<T>` locks/rechecks membership; caller identity always from verified server session. `listAdminCompanies(actorId):Promise<{id:string;name:string}[]>`. `createStop`, `updateStop`, `createServiceClass`, `updateServiceClass` consume normalized validated inputs with company context. `createRoute(context,{name,code,stops}):Promise<RouteRevision>`; `saveRoute(context,{routeId,expectedRevision,name,code,stops}):Promise<RouteRevision>`; `deactivateRoute(context,routeId,expectedRevision):Promise<RouteRevision>`.

- [ ] Write RED validation tests for exact spec limits, whitespace normalization, duplicate stop, discontinuous/descending offsets, negative/fractional offsets. Run focused RED then implement Zod parsers GREEN.
- [ ] Write guard tests: no active ADMIN_PO target denies; disabled and global Super deny; mutation rechecks membership in transaction; errors sanitized. Reads use verified actor and fresh membership.
- [ ] Implement master repositories/services, composite tenant scoping and ACTIVE/INACTIVE updates. Read resource company from stored relation, reject cross-company IDs.
- [ ] Implement route writes in stated lock order. Lock all referenced stop/class rows before route; validate active selections. Detect fare existence and revision before replacement; reject reorder/add/remove while any fare exists. Metadata-only edits allowed with revision check. Replace ordered rows atomically only when structure actually changes.
- [ ] Write and run RED→GREEN for rollback on invalid stop, stale revision, fare-exists conflict, exact revision increment, inactive target and other-company input; run full unit/typecheck. Commit `feat: manage tenant routes and master data`.

## Task 3: Adjacent fares and quote service

**Interfaces:** `saveFares(context,{routeId,serviceClassId,expectedRevision,prices:string[]}):Promise<RouteRevision>` requires one price per adjacent pair. `deleteFares(context,{routeId,serviceClassId,expectedRevision}):Promise<RouteRevision>` explicit. `previewQuote(context,{routeId,fromRouteStopId,toRouteStopId,serviceClassId}):Promise<{currency:'IDR';total:string;segments:{fromId:string;toId:string;price:string}[]}>`.

- [ ] Write RED tests: fare sum across subset, zero, missing adjacent segment blocks quote, bigint above Number.MAX_SAFE_INTEGER stays exact, equal/reversed/wrong-route endpoints rejected, inactive route/endpoint stop/class rejected.
- [ ] Implement strict decimal string parser bounded to PostgreSQL bigint, check total does not overflow persistence-compatible range. Normalize output decimal strings; reject scientific notation/signs/fractions.
- [ ] Save/delete uses same membership→class/stops→route lock order and expectedRevision, upsert adjacent fares in transaction, increment revision once. Quote reads a consistent transaction snapshot and checks membership/tenant and all eligibility/fare rows; no browser-provided price authority.
- [ ] Run focused RED→GREEN/full unit/typecheck. Commit `feat: calculate and manage adjacent route fares`.

## Task 4: Admin pages and actions

**Interfaces:** Action result `{ok:true;revision?:number}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string;fieldErrors?:Record<string,string[]>}`. Server actions get identity themselves, validate inputs and call services; never accept actor role/user ID. Pages deny access server-side and load scoped data only.

- [ ] Write RED actions tests for unauthenticated/cross-tenant input, malformed price/UUID, stale conflict, safe errors, service-only calls and fixed revalidation paths.
- [ ] Implement `/admin` picker (one company auto redirects); company layout guard; pages stops/service-classes/routes/detail; account link conditional on admin membership. Existing OTP flow preserved.
- [ ] Build master forms and ordered stop editor with labelled inputs, move buttons, explicit deactivate/clear-fares confirmation, status text, empty state. Add per-class adjacent fare editor and origin/destination quote preview.
- [ ] Keep local edited input on failed submit/conflict; refresh server revision deliberately before retry. Prevent concurrent submit with pending state; show safe actionable Indonesian errors and keyboard focus. Responsive labels/tables; no opaque technical messages to users.
- [ ] Run actions tests GREEN, full unit/typecheck/lint/build; inspect desktop/mobile/keyboard, record what actually checked. Commit `feat: add route pricing admin pages`.

## Task 5: End-to-end database proof and review

**Interfaces:** Opt-in `db:test`; fixtures use per-run company/Auth/resource UUIDs with rollback/exact cleanup. Permanent DEMO PO rows retained.

- [ ] Test Admin A versus B for list/read/write and quote using real repositories/services; browser roles denied on all new tables; invalid composite relationships/constraints fail.
- [ ] Test two independent transactions with expectedRevision same: exactly one success and one conflict; simultaneous revoke/write respects membership lock order. Assert no partial replacement/fare loss.
- [ ] Test save/delete fare then reorder, inactive class/stop quote rejection, missing fare, zero/bigint accuracy, atomic rollback. Verify fixed seed survives repeated full db:test runs.
- [ ] With user's OTP login if needed, smoke four-stop route/three fares/quote and admin B URL denial. No automated OTP entry; do not claim UI smoke from unit mocks.
- [ ] Run db:test twice, unit suite, typecheck, lint, build; record counts and limitations. Review complete branch with fresh Luna medium, fix Important/Critical via RED→GREEN and rerun suite.
- [ ] Synchronize reviewed spec rules to schema/auth/ledger docs; write setup evidence with local/hosted/UI separation. Commit verified work and integrate locally using existing approved method; preserve any unresolved work explicitly.

## Self-review and handoff

Coverage: schema/invariants Task1; route/transaction/master Task2; pricing Task3; UI/boundary Task4; concurrency/tenant/browser/seed regressions Task5. Review Focus1→2/3/5,2→2/5,3→3/5,4→2/3/5,5→1/5. Wire prices remain strings across repository/action/UI. Identity outside transaction and database authorization inside transaction are separate checks. Optional loop/maps/drag-and-drop remain deferred.

Spec approved7October2026. **Plan awaiting review.** Preserve inline method with one Luna medium final review. Implementation starts after the user reviews this plan.
