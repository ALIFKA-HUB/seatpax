# Tenant access development setup

Status: integrated locally; hosted migration and persistent two-company/five-membership seed applied on7October2026. Five database integration tests passed before persistent seed.

## Commands

Set `DATABASE_MIGRATION_URL` in ignored `.env.local` to the exact development Direct/session URI, explicit port5432. Runtime `DATABASE_URL` remains port6543. Never fall back to runtime for migration. Start Node with the existing CA:

```powershell
$env:NODE_EXTRA_CA_CERTS='C:/Users/ASUS/Downloads/prod-ca-2021.crt'
npm.cmd run db:migrate
npm.cmd run db:test
npm.cmd run db:seed
npm.cmd run db:seed -- --apply
```

Migration is reviewed `drizzle/0000_tenant_access.sql`: three public tables, FK to existing Auth identities, role/company CHECK, two partial unique membership indexes, RLS and browser grants revoked. Auth schema is not created or altered. The account page now bootstraps its profile, so migration must precede testing this branch's authenticated account page. Main stays on the working OTP implementation until integration.

## Seed accounts

Create/choose five existing authorized development Auth accounts. Store their UUIDs locally in `.seatpax/seed-accounts.json` (ignored). Input format below uses descriptive placeholders, not working seed values:

```json
{"adminA":"AUTH_UUID_ADMIN_A","crewA":"AUTH_UUID_CREW_A","adminB":"AUTH_UUID_ADMIN_B","crewB":"AUTH_UUID_CREW_B","superAdmin":"AUTH_UUID_SUPER"}
```

All five UUIDs must be distinct and exist in auth.users. Dry-run inspects all rows under the same transactional advisory lock as apply; no writes. Apply creates only missing demo companies/profiles/memberships. Existing statuses are preserved. A changed fixed-ID mapping aborts instead of reassigning privileges.

Company IDs end 4000-8000-000000000001/002, slugs demo-po-a/b. Membership IDs are 00000000-0000-4000-9000-000000000001 through005. Existing conflicting IDs/slugs/memberships must be resolved explicitly, not deleted by the seed.

## Verification boundaries

### Persistent seed completion — 7 October 2026

User created the five agreed Gmail alias accounts and supplied the Auth Users screenshot. Exact email lookup matched five confirmed Auth identities. Mapping was saved only in ignored `.seatpax/seed-accounts.json`. Dry-run passed, explicit apply created two companies/five memberships, and read-back verified each ACTIVE role/company match. No existing passenger account received an internal role.

The integration seed fixture currently requires absent fixed demo identities; after persistent seed, that fixture cannot run unchanged. Do not delete real seeded rows to rerun it. Future test maintenance must isolate seed fixture IDs or a separate development database.

Unit guard/seed/parser tests do not prove hosted RLS. Opt-in DB tests use generated UUID fixtures and rollback; the concurrency test commits one generated Auth identity and cleans up that exact UUID in finally. No email/password delivery. A terminated concurrency test could leave that UUID fixture and requires explicit inspection, not broad deletion.

Direct URL supplied on7October failed DNS ENOTFOUND; the subsequently supplied Session pooler on verified host/port5432 connected successfully. Preflight found no existing target tables. Migration0000 then applied successfully. Database tests5passed: role/company/FK/unique constraints, RLS enabled and all SELECT/INSERT/UPDATE/DELETE denied for anon/authenticated on all three tables, actual membership isolation/revocation, concurrent profile bootstrap/no role, seed dry-run/apply/rerun/status preservation/reassignment rejection inside rollback.

Persistent demo account mappings remain pending. Passing rollback seed tests does not mean actual internal users were granted roles. Final checks:83unit tests,5database tests,typecheck,lint,production build all passed. Fresh Luna medium review of bcab2c3..591d51f found no code findings. Reviewer did not independently run commands/access hosted DB. Its stale setup-evidence note was corrected in this document before integration.

Rulings: migration uses existing DATABASE_MIGRATION_URL name; account bootstrap verifies identity itself (one additional Auth request); integration membership fixtures use Drizzle transactions because a raw TransactionSql lacks driver options metadata. The five account seed remains pending user mapping; concurrent fixture interruption can require cleanup of its exact generated UUID. No deployed browser/role-dashboard QA is claimed.
