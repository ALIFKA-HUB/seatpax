# Tenant access development setup

Status: implementation in isolated branch; hosted migration/seed not verified yet.

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

Unit guard/seed/parser tests do not prove hosted RLS. Opt-in DB tests use generated UUID fixtures and rollback; no email/password delivery. Direct URL supplied on7October failed DNS ENOTFOUND; Session pooler URI is requested. Account mappings remain pending. Do not report migration/seed completed from code tests alone.
