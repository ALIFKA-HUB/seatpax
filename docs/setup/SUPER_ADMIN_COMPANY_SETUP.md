# Super Admin company control — 9 October 2026

## Contract

`/super-admin/companies` lists existing companies for a verified user with fresh ACTIVE global SUPER_ADMIN membership and NULL company. The account page exposes the link only for that membership; destination/actions independently authorize. No tenant operational or passenger access is granted.

The list contains only id/name/slug/status/statusRevision/updatedAt, ordered by name/id. Every change takes membership SHARE then company UPDATE in one transaction with 5s lock timeout and 15s statement timeout. Expected revision is checked before no-op; real transitions increment once and insert an immutable audit event atomically. No-op preserves time/revision/event count. Stale/ABA and lost-response retries conflict safely. No automatic transaction retry is introduced.

Migration `0010_company_status_control.sql` was applied using the guarded development Drizzle workflow and verified TLS CA. It adds the nonnegative company revision and positive unique company/event revision, RESTRICT company/actor references, different from/to status, database timestamps, RLS and revoked browser grants. No browser audit write/delete/list endpoint exists.

Suspend blocks new publication/holds/checkout initiation. Existing valid initiated payment fulfillment and ticket/crew boarding/snack operations continue under their existing guards. No bulk cancellation, hold deletion, membership revocation or refund occurs. Reactivation restores only currently eligible sales, never expired resources or closed windows. Existing sales services needed no production change.

## Interface

ACTIVE rows offer Suspend; SUSPENDED rows offer Aktifkan. Both require a named explicit confirmation with consequences. Cancel changes nothing and restores trigger focus; pending disables repeated submission; server results update only the submitted company. Older responses cannot replace newer revisions. Conflict closes confirmation, refreshes server props and requires a new decision. Safe errors are announced with aria-live. Controls have 44px minimum targets and visible focus.

This slice reuses existing styles. Logo conversion, visual redesign, onboarding/invitations, role editing, deletion and analytics remain excluded.

## Verification record

- Baseline: 47 unit files / 199 tests passed.
- Validation RED missing module then 8 passing tests. Domain RED missing schema exposed fixture cleanup ordering; cleanup now always removes its global membership even if audit cleanup fails. Exactly six PO IDs and three extra users created by that RED run were removed; older fixtures and demo data were untouched.
- Company/tenant targeted regression: 2 files / 9 tests passed in 49.88s, covering minimum projection, role denial/no-op after revocation, status/audit/no-op/ABA/concurrency/rollback, constraints/browser grants and both revocation lock orders.
- Initial combined policy run: 16 passed / 1 fixture failure (provider order ID incorrectly read from bookings). Corrected to payments provider_order_id; suspension rerun 2 tests passed in 35.17s. Sale-first/suspension-first locks, new sale denial, initiated fulfillment/QR/boarding/snack and release/cutoff after activation passed.
- Action/UI RED missing modules then passing; refresh reconciliation helper RED then passing. Latest full units: 50 files / 218 tests passed in 2.62s. Typecheck, lint and production build passed with dynamic `/super-admin/companies`. An intermediate build overlapping the RED helper addition failed; full subsequent build passed.
- Full serial hosted DB regression: 21 files / 79 tests passed in719.03s. One focused GPT-6 Luna/medium review found no material domain/action/data bug. Opening confirmation focus was regraded as important to the keyboard contract: a RED autofocus assertion failed, then cancellation autofocus and a retained hidden trigger corrected opening/cancel behavior. Latest full unit50files/218tests2.89s, typecheck/lint/build passed after that fix. Additional explicit expired-resource regression follows below.

## Deferred manual acceptance

The user deferred manual testing while in a meeting. Automated results do not claim human login, actual keyboard focus, narrow-width rendering or phone success. Later use the seeded Super Admin account, explicitly select a demo PO and check cancel/confirm/suspend/reactivate and denial after access revocation. No demo company status was mutated during fixture tests. No push/deployment is authorized.

## Implementation ruling

Use the approved existing Drizzle journal/migration workflow rather than creating parallel Supabase CLI history. Reason: the repository already owns schema history in Drizzle. Cost if wrong: migration adapter correction. RLS/grants follow the current [Supabase database guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Final explicit expired-hold regression: initial fixture timestamp update violated hold_times because independent clock_timestamp calls differed by microseconds. A single materialized database clock preserves the existing exact 10-minute invariant. Targeted suspension suite then passed2tests/33.03s; terminal expired/released holds stay terminal after activation. No production lifecycle code was changed.


## Local integration evidence

Merged locally to main as2194130. Merged checks: 50unitfiles/218tests passed3.05s; typecheck/lint/production build passed with /super-admin/companies. Original main next-env.d.ts SHA256 B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000 was restored and verified; user remote attachments remain intact and unstaged. Managed worktree retained. Preview restarted from the verified production build on port3001 and reported Ready. No push/deployment or authenticated/manual browser success is claimed.

