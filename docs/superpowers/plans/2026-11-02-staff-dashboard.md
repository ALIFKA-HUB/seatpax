# Staff dashboard implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the approved dashboard's example metrics/register with a truthful Super Admin view of Demo PO A's staff for development and the configured single company for production.

**Architecture:** A server-only adapter resolves the verified actor and company configuration. A new `modules/staff-directory/` read service authorizes the actor in the existing Super Admin transaction pattern, then reads a bounded directory snapshot. Server-rendered cards and a GET-filtered register reuse the approved internal shell and scoped design tokens; no staff mutation endpoint is added.

**Tech Stack:** Next.js App Router, React, TypeScript, PostgreSQL through existing postgres.js/Drizzle connection, Zod, Vitest, Phosphor.

**Spec:** `docs/superpowers/specs/2026-11-02-staff-directory-read-model.md`.

## Global constraints

- `ADM-DATA-01` scope and count rules approved in chat; `ADM-DASH-01` approved by the user with **"ACC, langsung eksekusi ADM-DASH-01"** on 2 November 2026.
- One scoped person = one staff row; active if any scoped staff membership is active. Display all legacy roles without changing records. Operasional/Helpdesk/Crew only; global-only Super Admin/customer-only excluded.
- Production requires `SEATPAX_COMPANY_ID`; development-only fallback is the approved Demo PO A ID. Never trust browser-supplied actor/company or expose secret keys.
- Existing RLS/revoked browser grants and all other domain authorization remain unchanged. No migrations or staff CRUD/password/RBAC configuration in this slice.
- Do not hardcode observed counts or import preview sample names/activity into production.
- After approved implementation passes checks, commit/push only task files on the current `codex/` branch and verify the remote ref; no merge to main or force push.

## Review focus

- Multiple/mixed-status memberships never double-count or silently grant/remove access.
- A direct customer request or a revoked Super Admin session returns no staff details.
- Missing configuration/profile fields and DB errors cannot become fabricated data or genuine zero counts.
- Search, summary counts, filters and pagination agree under concurrent membership changes and out-of-range requests.
- Long names/emails, mobile navigation and browser history remain usable without horizontal document overflow.

### ADM-DASH-01 — Live, read-only staff dashboard

**Goal:** Ship the three approved coloured cards and staff register backed by actual authorized single-company data.

**Scope:** Read service, real dashboard page, scoped navigation, search/status/pagination and Super Admin entry link. User/role mutations and general staff activity remain deferred.

**Dependencies:** Reviewed read-model spec and this plan; existing users/memberships/companies schema; verified runtime database connection; approved v5 shell.

**Files and interfaces:**
- Create `modules/staff-directory/types.ts`: `StaffRole`, `StaffStatus`, `StaffDirectoryQuery`, `StaffDirectoryRow`, `StaffDirectorySnapshot` matching the spec's exact fields/counts.
- Create `modules/staff-directory/validation.ts`: `parseDirectoryQuery(raw: {q?: unknown; status?: unknown; page?: unknown}): StaffDirectoryQuery`, `resolveDirectoryCompany(env: {NODE_ENV?: string; SEATPAX_COMPANY_ID?: string}): string`.
- Create `modules/staff-directory/repository.ts`: `createStaffDirectoryRepository(client: Sql)` with `client`, `authorize(tx,userId)` and `read(tx,companyId,query): Promise<StaffDirectorySnapshot>`; reuse existing Super Admin authorization rather than exposing browser table reads.
- Create `modules/staff-directory/service.ts`: `createStaffDirectoryService(repo).read(userId: string, companyId: string, query: StaffDirectoryQuery): Promise<StaffDirectorySnapshot>`; fail closed, no mutations.
- Narrow `modules/company/transaction.ts` guard parameter to `Pick<CompanyRepository,'client'|'authorize'>` so both repositories can reuse the same guard without carrying unrelated company methods. No runtime change to company status transactions.
- Create `app/super-admin/dashboard-data.ts` (`server-only`), `app/super-admin/page.tsx` (`force-dynamic`), `app/super-admin/components/staff-directory.tsx`, `app/super-admin/dashboard.css`.
- Modify `app/super-admin/components/super-admin-shell.tsx` and `internal-navigation.tsx` to accept current section (`dashboard` or `companies`), expose real Dashboard/Perusahaan links and correct breadcrumbs. Preserve default company shell behavior.
- Modify `modules/auth/entry-destination.ts`, `modules/auth/dev-login-policy.ts` only for the Super Admin href to `/super-admin`; all other role destinations/guards unchanged.
- Extend `.env.example` with the non-secret company ID setting, and relevant setup/index/decision documents.
- Tests: `tests/unit/staff-directory.test.ts`, `tests/unit/staff-dashboard-view.test.ts`, update existing auth-entry/dev-login/shell contracts where expected links change; `tests/integration/staff-directory.test.ts` for scoped SQL reads and rollback fixtures.

**Completion criteria:** Real 3-card summaries equal the configured company's actual staff groups; search/status/page preserve the spec; inactive/empty/unavailable/forbidden states are truthful; no cross-company/profile leak or mutation; original company controls/auth work; approved visual responsiveness retained; checks and remote-ref verification pass.

- [x] Write failing query/config tests: whitespace/80-character search, invalid status/page, explicit invalid UUID, no production demo fallback.
- [x] Implement query/config parsing and domain types with the specified 25-row page size.
- [x] Write failing service tests: authorization denies before data read, mixed roles count once, company ID remains server-controlled, errors propagate to unavailable rather than empty results.
- [x] Implement repository/service: current global Super Admin guard and one parameterized SQL snapshot for company context, unfiltered counts, filtered count, clamped page and ordered page rows. Return minimal profile and per-role statuses only; use no Auth Admin API.
- [x] Write rollback integration fixtures for another company, customer-only/global-only users, two-role mixed/all-disabled cases, missing profile fields, 26+ rows, duplicate sort values, literal wildcards and empty/out-of-range results; verify exact expected counts/pages and no persistent writes.
- [x] Write failing page/navigation assertions: real Dashboard URL, three status filters, GET search with accessible labels, page links retaining filters, no preview staff/CRUD/activity controls, and consistent denied/empty/unavailable views.
- [x] Implement the server adapter/page/register and approved card styling; align current shell section and change only the Super Admin entry destination.
- [x] Run focused unit and configured DB integration tests; actual read-only acceptance checks compare the dashboard with the Demo PO A aggregate query. No live memberships/accounts/statuses changed for testing.
- [x] Run `npm run test -- --maxWorkers=2`, `npm run typecheck`, `npm run lint`; all pass. If integration cannot be executed, record the exact blocker instead of claiming it passed.
- [x] Browser-check 320/390/768/1024/1440/1920px, filters/search/back navigation, zero matches, role statuses, long text, mobile menu/Escape, reduced motion, and direct unauthenticated/customer/disabled-Super-Admin access without data leakage.
- [x] Complete one read-only final review, fix important findings, update delivery evidence, commit/push the approved branch and verify remote HEAD.

## Self-review

The only delivery task is ADM-DASH-01; setup and tests are part of the same independently reviewable slice. The later user management/RBAC/password-login features are excluded. No inferred staff event log, demo production fallback, cross-company selector or data cleanup is introduced.

Delivery and verification: docs/setup/STAFF_DASHBOARD_SETUP.md. Publication is verified against the remote branch and reported in the final delivery message.
