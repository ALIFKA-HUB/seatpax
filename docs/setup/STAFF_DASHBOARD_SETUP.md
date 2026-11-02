# Live staff dashboard — ADM-DASH-01

## Delivery and approval

The user selected Demo PO A for testing, approved distinct-person/any-active-role counting, then approved the [implementation plan](../superpowers/plans/2026-11-02-staff-dashboard.md) with **"ACC, langsung eksekusi ADM-DASH-01"** on 2 November 2026. Implemented on `codex/internal-panel-ui`, following the approved v5 visual direction.

`/super-admin` now contains the real staff summary and register. Super Admin login/workspace links point there. `/super-admin/companies` remains available with its existing company controls. Other role destinations, company authorization and ticket/payment/Helpdesk/Crew operations remain unchanged.

## Data and configuration

- Production requires server-only `SEATPAX_COMPANY_ID` containing the intended company's UUID. Missing/blank/invalid production configuration fails closed with an unavailable state. There is no production demo fallback or automatic first-company selection.
- In development only, omitted configuration uses the explicitly approved Demo PO A ID. An explicitly invalid/blank value does not trigger fallback. The example setting is commented out to keep omission distinct from invalid configuration.
- Reads use a verified identity and a fresh active global Super Admin membership under the existing shared-lock transaction guard. Browser-supplied actor/company parameters have no effect.
- Each configured-company staff user is counted once across `ADMIN_PO`, `HELPDESK`, `CREW`. Any active scoped role makes the person active; all disabled scoped roles make them inactive. Per-role statuses remain visible without rewriting memberships. Global-only Super Admin and customer-only accounts are excluded.
- The 25-row register has name/email search, status filtering and stable pagination. Summary counts, filtered count, clamped page and rows come from a single SQL snapshot. Literal `%`/`_` searches are not wildcards.
- Missing names fall back to existing email; no fake names, metrics or audit events. Actual development acceptance observed **3 total / 3 active / 0 inactive**; these values are never hardcoded in the application.

No schema migrations, browser grants, RLS policies, staff/account mutations, Auth Admin lookups, role changes, archive/deletion or password-login changes are introduced. The server repository selects only minimal public profile fields plus scoped roles.

## Verification evidence

- New parsing/service/view/entry-link tests were observed failing before their implementation and then passing.
- Final focused tests: **25 passed** across six files.
- Final unit suite: **89 files / 336 tests passed**, `npm run test -- --maxWorkers=2`.
- Hosted development integration: **5 tests passed**, `npm run db:test -- tests/integration/staff-directory.test.ts`, using the existing CA and validated `DATABASE_MIGRATION_URL`. All generated users/companies/memberships were confined to rollback transactions; the grants check is read-only.
- Integration cases cover mixed/all-disabled roles, deduplication, other-company/customer/global-only exclusion, all non-Super roles and revoked Super Admin, next-request revocation, suspended company reads, missing names/emails/company, 27-row stable pagination, huge-page clamping, literal wildcards, zero matches, retained RLS and revoked browser SELECT grants.
- `npm run typecheck`, `npm run lint` and `git diff --check`: passed.
- Actual Chrome browser: local Super Admin entry; live 3/3/0 counts; search/back/zero matches; status links; page clamping; ignored URL company tampering; guest redirect; Customer, Operasional, Helpdesk and Crew denied without staff rows/counts; existing company destination still works; no JavaScript errors.
- Responsive browser coverage: 320/390/768/1024/1440/1920px with no horizontal document overflow; long names; mobile navigation/current-link focus/Escape; CSS 200% zoom; reduced motion.
- Visual review removed inherited public `section` padding from the staff card. A browser computed-padding assertion failed at 48px and passed at 0px after the scoped fix.
- A fresh Luna/medium read-only review found one Important issue: database initialization errors could bypass the unavailable state. A new regression test failed before mapping these errors to a safe `DomainError`, then passed; the whole suite passed after the fix. No Critical findings or deferred code minors were reported.

## Boundaries and remaining work

- Staff creation, role editing, deactivation, archival deletion, configurable RBAC and staff password login remain separate work. No non-working preview action or invented staff activity appears.
- Actual development data has three staff, so multi-page navigation is proven by rollback SQL fixtures and page-link tests; live browser acceptance verifies page clamping and ordinary filters rather than creating persistent staff to fill another page.
- Revoked Super Admin is tested through actual rollback database requests, not by disabling the real testing administrator's browser account.
- This task does not rename/remove old company fixtures, grant Super Admin tenant-operational permissions or merge the branch into main.
- Physical phones, production build/deployment and the unrelated full database integration suite are not claimed as tested. Browser viewports use desktop Chrome emulation.
- Generated `next-env.d.ts`, the unrelated historical untracked plan and ignored local test artifacts are excluded from the task commit.

The verified task branch is pushed and its remote hash is compared with local HEAD; the final delivery message reports the commit.
