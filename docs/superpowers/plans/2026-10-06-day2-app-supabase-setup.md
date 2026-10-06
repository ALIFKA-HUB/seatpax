# Seatpax Day 2 — App and Supabase Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user explicitly selected inline execution; preserve that method. Steps use checkbox syntax for tracking.

**Goal:** Boot Seatpax locally with validated configuration, server-only Drizzle database connectivity, and Supabase browser/server client adapters ready for Day 3 authentication.

**Architecture:** One Next.js App Router application at repository root, following existing `app/`, `lib/`, `modules/`, `db/` boundaries. Supabase SDK handles auth transport; Drizzle/postgres-js handles server SQL. This slice creates no domain tables, RLS policies, tenant data or product login flow; those belong to Day 3–4 plans.

**Tech Stack:** TypeScript, Next.js/React, Tailwind, Zod, Drizzle/postgres-js, `@supabase/supabase-js`, `@supabase/ssr`, Vitest, ESLint.

**Spec:** [Adopted foundation](../specs/2026-10-06-foundation-design.md), sections 1 and 3 plus handoff; [structure](../../seatpax/11_API_PROJECT_STRUCTURE.md); [stack](../../seatpax/12_TECH_STACK_ECOSYSTEM_SCALING.md); [calendar](2026-10-05-seatpax-30-day-delivery.md). D2026-10-06-02 adopts foundation; this plan is **LOCAL IMPLEMENTATION READY; HOSTED VERIFICATION PENDING** — user “rencana oke, eksekusi” on 6 October 2026.

## Global Constraints

- Existing documentation and `.git` history must remain intact. Use an isolated worktree at execution, not main; do not scaffold over this nonempty repository using destructive cleanup.
- Actual preflight: Node v26.3.0, npm 11.16.0 available. Check package engine requirements at execution; resolve stable compatible package versions, save package-lock, document exact installed versions. No global runtime replacement without need.
- Root paths follow modular-monolith specification; business rules stay in domain services. This slice implements connection adapters, not inventory/payment logic.
- Browser consumes only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `DATABASE_URL` and `DATABASE_MIGRATION_URL` are server/CLI-only. No service/secret key is required for this slice.
- Missing configuration must not break the public landing page/build. Only access to a configured capability should fail; errors name invalid variable names without echoing values.
- Public UI identifies this as Seatpax setup; never claims booking/login/payment works. Minimal heading and setup navigation, no full product design or placeholder operational dashboards.
- Supabase project is development/demo only. User completes account/project creation and enters credentials into ignored `.env.local`; never paste private credentials into chat or tracked docs. Project ref must be confirmed before any later migration/seed.
- Do not run migrations or modify hosted database in this slice. `db:check` is read-only `select 1`, always closes the connection.
- Preserve scope: Email OTP login Day 3, tenant schema/RLS/two-PO seed Day 4; remaining snapshots/holds/payments/operations in later plans. Unit tests here do not prove authorization or RLS.
- Save execution results/rulings in the skill's per-plan ledger. One final fresh-context reviewer uses GPT-6 Luna, medium, per AGENTS.md; no per-task implementer delegation for inline execution.

## Review Focus

- Missing/invalid env: public route still builds; adapters fail on use with names only. Task 1 tests this.
- Sensitive values and import boundary: browser adapter cannot load DB/server config; errors and CLI output omit URLs/credentials. Tasks 1–2 tests plus final bundle inspection.
- Connection failure: command exits nonzero, closes resources and prints sanitized failure. Task 2 tests this.
- Cookie writes in read-only server rendering: server adapter tolerates only the documented cookie-write restriction; other failures remain visible. Task 3 tests this; session refresh/proxy belongs to Day 3.
- Healthy mocked clients versus real provider: report mocks separately; hosted DB/auth settings must be manually verified before calling real integration complete. Task 3 checklist.

## Task 1: Runnable app with configuration boundary

**Files:** Create `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/env/public.ts`, `lib/env/server.ts`, `.env.example`, `tests/unit/env.test.ts`; modify `.gitignore`, `README.md`.

**Interfaces:** Consumes no prior code. Produces `parsePublicEnv(input: Record<string, string | undefined>): { supabaseUrl: string; supabasePublishableKey: string }`; `parseDatabaseEnv(input: Record<string, string | undefined>): { databaseUrl: string; migrationUrl: string }`. Migration URL uses `DATABASE_MIGRATION_URL` if present, otherwise database URL. Server-only loader wraps database parser; pure parsers remain unit-testable. Browser config passes explicit static `process.env.NEXT_PUBLIC_*` references so Next can inline values; never reads all process.env in browser code.

- [x] Step 1: Manually initialize root manifests/config and test runner without generating over docs. Runtime packages: next/react/react-dom, zod, server-only, supabase SDK/SSR, drizzle-orm, postgres. Dev packages: TypeScript/types, eslint/config-next, tailwindcss/postcss, vitest, drizzle-kit, tsx, dotenv. Add scripts `dev`, `build`, `start`, `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`). Install with `npm.cmd install`; Expected: success, lockfile records compatible stable versions.
- [x] Step 2: Write failing env tests with these assertions:

```ts
expect(() => parsePublicEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: 'invalid', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'demo' })).toThrow();
expect(parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo' })).toEqual({ supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'sb_publishable_demo' });
expect(parseDatabaseEnv({ DATABASE_URL: 'postgresql://user:password@localhost:5432/postgres' }).migrationUrl).toBe('postgresql://user:password@localhost:5432/postgres');
```

Also test blank keys, invalid DB protocol, explicit migration override, public return omits DATABASE_URL, and thrown error excludes input secret string. Keep provider key content validation to nonempty; do not invent provider key format checks.
- [x] Step 3: Run `npm.cmd test -- tests/unit/env.test.ts`. Expected: FAIL due to missing parser modules/functions, not runner configuration errors.
- [x] Step 4: Implement parsers with Zod and sanitized errors; create minimal app/layout/styles. `.env.example` lists empty credentials, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, and DB connection placeholders as comments. No eager env validation in page/layout/config. Add `.superpowers/` and TypeScript build artifacts to gitignore if needed.
- [x] Step 5: Run `npm.cmd test -- tests/unit/env.test.ts`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`. Expected: all pass with no real Supabase config. Start `npm.cmd run dev`; GET `/` Expected: HTTP 200 and Seatpax heading. Stop only the process created by this task.
- [x] Step 6: Commit Task 1 files with `chore: bootstrap Seatpax application and environment boundaries`.

## Task 2: Read-only database connection and diagnostic command

**Files:** Create `lib/db/connection.ts`, `lib/db/index.ts`, `scripts/check-db.ts`, `tests/unit/db-check.test.ts`, `drizzle.config.ts`; modify `package.json`, `.env.example`, `README.md`.

**Interfaces:** Consumes Task 1 database parser. Produces `createDatabaseConnection(url: string): { db: ReturnType<typeof drizzle>; close: () => Promise<void> }` using postgres-js and `drizzle-orm/postgres-js`; server-only `getDatabase()` lazily caches runtime connection. Produces testable `checkDatabase(connection: { query: () => Promise<unknown>; close: () => Promise<void> }): Promise<{ ok: boolean }>`; CLI invokes real `select 1 as ok`, no write. Pure connection factory importable by CLI/tests, `getDatabase` server-only wrapper isolated.

- [x] Step 1: Write tests: successful query returns `{ok:true}` and close called once; rejected query returns `{ok:false}` and close called once; close failure returns `{ok:false}` without exposing thrown credential string. Run `npm.cmd test -- tests/unit/db-check.test.ts`; Expected: FAIL for missing diagnostic implementation.
- [x] Step 2: Implement factory with `prepare:false` for transaction-pooler compatibility and bounded pool `max:1`; keep certificate verification enabled using provider-supported SSL configuration. No DB connection on import/build. CLI loads `.env.local` with dotenv, returns exit 0/1, prints only `Database connection OK` or sanitized failure/invalid env field names, and always closes resources. Add `db:check` (`tsx scripts/check-db.ts`). Drizzle config reads migration URL, points to `db/schema/*.ts` and `db/migrations`, but generate/migrate are not executed here. Do not create speculative schema files.
- [x] Step 3: Run `npm.cmd test -- tests/unit/db-check.test.ts`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`. Expected: all pass offline; fake secrets never appear in diagnostic output tests. Missing-env `npm.cmd run db:check` Expected: nonzero with variable names only, no stack/credential dump.
- [ ] Step 4: When user has configured the dev project, run `npm.cmd run db:check`. Expected: exit 0, `Database connection OK`. If credentials/project are unavailable, record real DB check as pending; complete local tasks but do not claim hosted integration done.
- [x] Step 5: Commit Task 2 files with `chore: add server database adapter and safe connection check`.

## Task 3: Supabase adapters and provider handoff

**Files:** Create `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `tests/unit/supabase-clients.test.ts`, `docs/setup/SUPABASE_DEV_SETUP.md`; modify `README.md`.

**Interfaces:** Consumes Task 1 public env parser. Produces `createBrowserSupabaseClient(): SupabaseClient` via `createBrowserClient`; `createServerSupabaseClient(): Promise<SupabaseClient>` via `createServerClient` and Next async cookies, using `getAll`/`setAll`. Not a role/session authorization helper. Server module uses `server-only`. Day 3 owns verified user helper, proxy/session refresh, OTP request/verification/logout and protected routes.

- [x] Step 1: Write failing tests with mocked SSR/cookie modules: browser constructor receives only public URL/key; server getAll returns current cookie store; setAll forwards name/value/options; expected read-only cookie write restriction is tolerated; unrelated failure is propagated. Missing public config yields sanitized field-only error. Run `npm.cmd test -- tests/unit/supabase-clients.test.ts`; Expected: FAIL for missing adapters. Mock server-only only in Vitest, never alias away its production import guard.
- [x] Step 2: Implement adapters using the current official Next.js SSR integration; do not infer roles from browser session or implement a fake login. In server rendering distinguish the documented cookie restriction, leaving session refresh to Day 3. If current API cannot distinguish this reliably, implement caller-explicit read-only cookie mode and ledger that ruling rather than swallowing arbitrary errors.
- [x] Step 3: Write user-facing setup guide: development/demo project; choose nearby region; save database password locally; copy project URL and publishable key; copy real pooler host/user from Connect panel, URL-encode DB password. Runtime transaction-pooler URL, migration direct URL or session pooler where IPv6 unavailable. Credentials go only into `.env.local`; never copy project keys into docs. Record project setup progress without credential values.
- [ ] Step 4: Guide user to set Auth Site URL `http://localhost:3000` and localhost callback allowlist for future `/auth/callback`, inspect email provider settings and delivery restrictions, record OTP-template configuration needed by Day 3. This step configures provider readiness, does not prove login. Confirm Midtrans Sandbox account access as an account checklist only; record accessible/unavailable/unknown. Defer hosted webhook reachability until actual staging deployment and verified webhook adapter; amend D02 calendar explicitly, do not deploy an empty public payment endpoint.
- [x] Step 5: Run `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`; Expected: all pass. Inspect client output for server module leakage using fake canary DB secret in a controlled build, never printing real `.env.local` values. `npm.cmd run dev`, GET `/` Expected: 200; database check real result recorded independently from SDK unit mocks.
- [x] Step 6: Commit Task 3 files with `chore: prepare Supabase clients and development setup guide`.

## Completion and handoff

- [x] Local slice complete only after tests/lint/typecheck/build and HTTP smoke evidence, final fresh whole-branch review, and any material fix verification.
- [ ] Supabase integration complete only after real `db:check` and configuration checklist. If user setup is pending, leave this item unchecked and provide the exact next dashboard step.
- [ ] Record D02 partial/complete based on evidence, preserve D03 OTP and D04 tenancy/seed as future tasks. Update README actual capability status.
- [ ] Present branch changes for integration using finishing-a-development-branch; no main merge/push inferred solely from design approval.

## Verified documentation references

Consulted 6 October 2026; check versions again at execution:

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) for App Router scaffold and engine requirements.
- [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs) for browser/server and cookies.
- [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres) for pooler/direct selection and prepared-statement limitations.
- [Supabase Drizzle](https://supabase.com/docs/guides/database/drizzle) for SQL adapter integration.

Self-review: scope is a standalone setup slice; domain adoption is not misrepresented as implemented. Parser→DB/client interfaces match; offline proofs and provider checks are separate. User-selected execution method is preserved; written plan review accepted; inline execution selected.

Execution evidence: 22 unit tests, lint/typecheck/build and HTTP 200 passed; browser-adapter canary check passed and server-only negative import rejected. Fresh whole-branch review by GPT-6 Luna medium: no Critical/Important/Minor findings. Task 2 Step 4 and Task 3 provider configuration remain pending without a development project. Ruling: explicit cookieMode read-only/read-write avoids blanket catch; session proxy stays Day 3. Pure DB parser split from server-only loader for CLI/test compatibility. Node >=26 reflects installed Vitest 5 engine; ESLint 9 retained for bundled React plugin compatibility.

Final review rulings: explicit read-only cookies, lazy runtime singleton, syntactic URL validation and invoked CLI config are consistent with this slice. Hosted verification, domain migrations, auth/refresh and payment are deferred to their owning tasks; no provider success inferred from mocks. Known tooling advisories remain tracked. Commits: 727b6ff (Task 1), 1c5e248 (Task 2), 48bcab7 (Task 3). Final CLI checks on invalid fake config and unreachable DB each exited 1 with sanitized output. Integration choice remains pending; branch not merged/pushed.
