# Tenant Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Menyediakan tiga tabel fondasi, authorization server, dan seed dua PO dengan bukti isolasi akses.

**Architecture:** Supabase Auth menyediakan identity terverifikasi; Drizzle/PostgreSQL menyimpan profil, perusahaan dan membership. Guard server membaca membership pada setiap operasi. Tabel aplikasi mengaktifkan RLS dan menolak akses browser langsung.

**Tech Stack:** Existing Next.js/TypeScript, Drizzle, postgres-js, Zod, Vitest; tanpa dependency produk tambahan.

**Spec:** [Approved tenant design](../specs/2026-10-07-tenant-access-design.md).

## Global Constraints

- Scope D2026-10-06-01/02; hanya users, companies, memberships, access guards, seed dan verifikasi. Tidak ada dashboard, role editor, trip/assignment, payment atau perubahan OTP.
- SUPER_ADMIN company NULL; ADMIN_PO/CREW company non-NULL. Membership ACTIVE/DISABLED; company ACTIVE/SUSPENDED. Semua FK RESTRICT; partial unique indexes mencakup NULL global.
- Identitas dari getVerifiedUser; role dari database, tanpa metadata user atau cache lintas request. Privileged DB tidak menggantikan guard.
- Revoke anon/authenticated pada ketiga tabel, RLS enabled, tanpa policy browser atau SECURITY DEFINER.
- Runtime port 6543; migration/integration port 5432. Target development ref `slbkhdsfafcxaxqdxmet`; secrets dan account mapping tidak masuk Git/output.
- Seed default dry-run, apply eksplisit, transaksi, tidak reaktifkan company/membership. Tidak mengarang Auth IDs.
- Metode yang dipertahankan: inline melalui executing-plans; satu final reviewer GPT-6 Luna medium dengan konteks fokus. Tidak push/deploy otomatis.

## Review Focus

1. User punya beberapa role/company: tenant guard harus mencari role pada target tepat, bukan membership pertama (Task 2).
2. Dua request pertama membuat profil bersamaan: upsert tidak duplikat atau memberi role (Task 2/4).
3. Mapping seed berubah/akun hilang: validasi seluruh input sebelum write, tidak melakukan privilege reassignment diam-diam (Task 3).
4. Partial indexes global dan NULL: duplicate SUPER_ADMIN ditolak database nyata (Task 1/4).
5. URL target salah atau test terhenti: abort sebelum write pada target salah, fixture cleanup terbatas pada UUID run tersebut (Task 3/4).

## File map

`lib/db/schema.ts` schema Drizzle; `drizzle/0000_tenant_access.sql` migration bersama metadata generator; `drizzle.config.ts` konfigurasi migration; `lib/env/migration.ts` target/koneksi; `scripts/migrate-db.ts` apply terkontrol. `modules/access/{service,repository,server}.ts` guard murni, SQL, dan identity wiring. `modules/access/seed.ts` seed domain; `scripts/seed-dev.ts` CLI. `tests/unit/{access-service,access-seed,migration-env}.test.ts` unit; `tests/integration/tenant-access.test.ts` DB nyata. `docs/setup/TENANT_ACCESS_SETUP.md` prosedur dan bukti. Package scripts dan `.gitignore` diperbarui seperlunya.

## Task 1 — Schema dan migration

**Files:** Create schema/config/SQL/migration env/CLI/unit env tests above; modify package.json and .gitignore.

**Interfaces:** `parseMigrationEnvironment(env: Record<string,string|undefined>): { url:string; projectRef:string }`; `migrateDatabase(config): Promise<void>`. Parser menolak port selain 5432, ref selain development, dan URL yang username/host-nya tidak cocok ref. Jangan log URL atau error database mentah. Migration tidak berjalan otomatis saat app boot/build.

- [ ] Write RED parser tests: valid verified project session URL passes; port6543/wrong ref/missing URL throws safe configuration error with no password in text.
- [ ] Run `npm.cmd test -- tests/unit/migration-env.test.ts`; confirm RED, then implement parser and rerun GREEN.
- [ ] Define Drizzle tables/enums matching every field in approved spec; lowercase nonempty slug, nonnegative nullable cutoff, timestamps default now. Define auth.users as FK reference only; exclude it from migration generation ownership.
- [ ] Generate initial migration with Drizzle kit. Inspect SQL: no CREATE/ALTER of auth.users, no DROP objects; add explicit RLS ENABLE and REVOKE ALL FROM anon, authenticated on all three application tables. Partial unique indexes tenant/global and role/company CHECK must survive generation.
- [ ] Add `db:migrate` command using verified migration env and Drizzle migration journal; apply transactionally with connection closed in finally. Add no browser grants or policies. Command errors sanitized.
- [ ] Verify generator output matches schema and `git diff --check`; unit tests/typecheck pass. Commit `feat: define tenant schema and guarded migration`.

## Task 2 — Server identity, profile and access guards

**Files:** Create modules/access service/repository/server and tests/unit/access-service.test.ts; modify app/account/page.tsx only to bootstrap profile after verified identity.

**Interfaces:** `Actor = { id:string; email:string|null }`; `Membership = { userId:string; companyId:string|null; role:'ADMIN_PO'|'CREW'|'SUPER_ADMIN'; status:'ACTIVE'|'DISABLED' }`; repository `ensureProfile(actor): Promise<void>` and `listMemberships(userId): Promise<Membership[]>`. Service `authorize(actor:Actor|null, memberships:Membership[], permission:'tenant.admin'|'company.manage', companyId?:string): {ok:true}|{ok:false;reason:'unauthenticated'|'forbidden'}`. Server `requireAccess(permission,companyId?): Promise<{userId:string;companyId:string|null}>` throws typed safe access error after fresh verified identity/repository read.

- [ ] Write RED cases with assertions: `authorize(null,[], 'tenant.admin',A)` unauthenticated; passenger forbidden; Admin A allow A/deny B; reversed multi-membership list still finds exact target; disabled deny; Super allow company.manage/deny tenant.admin; Crew deny both; suspended company does not implicitly disable membership.
- [ ] Run focused test RED; implement service and rerun GREEN. Guards never trust browser role or requested user ID.
- [ ] Implement repository with `INSERT ... ON CONFLICT(id) DO NOTHING` profile bootstrap, nullable profile fields, no membership creation. Fresh query membership by verified user only; no module-scoped membership cache.
- [ ] Wire server guard using getVerifiedUser and repository. Missing session makes zero privileged queries; database failure remains safe and does not turn into allow. Add tests for call order, membership reread after disabling, and no raw SQL error leaks.
- [ ] Bootstrap profile on account page only after verified identity, preserve login/logout UI; schema must be applied before testing this page with hosted DB. Future domain services reuse same bootstrap/guard boundary.
- [ ] Run unit suite/typecheck; commit `feat: enforce server tenant membership guards`.

## Task 3 — Development seed with explicit account mapping

**Files:** Create modules/access/seed.ts, scripts/seed-dev.ts, tests/unit/access-seed.test.ts, docs/setup/TENANT_ACCESS_SETUP.md; modify package scripts and gitignore.

**Interfaces:** mapping JSON in ignored `.seatpax/seed-accounts.json`: `{adminA,crewA,adminB,crewB,superAdmin}` UUID strings, all distinct for demonstrable isolation. `parseSeedMapping(input:unknown): SeedMapping`; `seedDevelopment(config:{projectRef:string;mapping:SeedMapping;apply:boolean}, repository:SeedRepository): Promise<{mode:'dry-run'|'apply';companies:number;memberships:number}>`. Repository supports Auth ID existence check and one transaction for application writes.

- [ ] Write RED cases: malformed/missing/duplicate IDs rejected; wrong project abort before repository calls; unknown Auth user prevents writes; default dry-run validates but writes zero; apply requests one transaction; rollback on failure; output contains counts only.
- [ ] Define fixed company IDs `00000000-0000-4000-8000-000000000001/002`, slugs `demo-po-a/b`, names `Demo PO A/B`; fixed five membership IDs in a separate documented UUID range. Existing fixed ID with different company/user/role fails preflight rather than updates privilege. Existing statuses retained on rerun.
- [ ] Run focused RED; implement parser/service/CLI then GREEN. CLI `npm.cmd run db:seed` dry-run; `npm.cmd run db:seed -- --apply` explicit write. Use verified project migration connection and close finally.
- [ ] Add operator guide: obtain five existing authorized Auth IDs, mapping example placeholders clearly documented as input format, migration connection/CA setup, safe command order and status-preserving reruns. No secret/account values tracked.
- [ ] Verify unit/typecheck and commit `feat: add guarded two-company development seed`.

## Task 4 — Database proof and final review

**Files:** Create tests/integration/tenant-access.test.ts; modify package scripts, setup guide and plan evidence.

**Interfaces:** explicit `db:test` script opt-in to integration file; default unit command excludes integration writes. Integration target requires validated development migration env. Fixture setup/cleanup owns only UUIDs generated for that run. Auth fixture accounts created through privileged SQL only on verified development DB within rollback transactions; no email delivery or password creation.

- [ ] Inspect existing hosted schema and verified session/direct URI before apply; do not derive a host by guessing. If MIGRATION_URL unavailable, request exact URI while continuing unit work. Read concrete migration SQL and apply only after target check; capture version success without secrets.
- [ ] Write real DB constraint tests: tenant NULL/global company/duplicate tenant/duplicate global/FK invalid fail; valid rows work. Use savepoints for expected PostgreSQL failures.
- [ ] Test actual role paths inside rollback transactions: `SET LOCAL ROLE anon` and authenticated, all SELECT/INSERT/UPDATE/DELETE denied on each table (authenticated JWT subject set to a fixture ID). Reset role safely; privileged repository read succeeds only via authorized server service. These prove database grants/RLS posture, not HTTP Auth configuration.
- [ ] Test repository plus service against two fixture companies: Admin A cannot fetch company B via guarded path, disabled membership next request denied; Super never bypasses tenant guard. Test concurrent profile upserts produce one profile/no membership. Seed apply/rerun/status preservation/changed mapping preflight/rollback operate against real tables. Fixtures do not alter seeded operational rows.
- [ ] Run `npm.cmd run db:test`, then `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`; record counts/exit status separately. If missing hosted prerequisites, mark integration and seed verification pending, not passed.
- [ ] Request one fresh focused GPT-6 Luna medium reviewer for entire diff/spec/plan. Fix findings, rerun affected/full verification; record unresolved limits.
- [ ] Record local vs hosted results, seed mapping availability and migration version in setup guide. Commit verified work; integrate/cleanup locally using finishing-a-development-branch. No push or PR without authorization.

## Self-review / execution handoff

Spec sections 1/3/5 → Tasks1/4; section2 → Tasks2/4; section4 → Tasks3/4. Review Focus1/2 → Task2/4; 3/5 → Task3/4; 4 → Task1/4. Interfaces agree across tasks; privileged SQL and browser denial are separate verification paths. Membership revocation concurrent with future business mutations remains a later transactional concern explicitly stated in spec.

User approved spec on7October2026. **Plan pending review.** Preserve inline execution already selected by user; final reviewer remains Luna medium. Hosted migration/seed requires valid port5432 URI and explicit existing account mapping. Implementation starts after plan review.
