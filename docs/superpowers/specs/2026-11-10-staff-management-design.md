# Super Admin Staff Management Design (`ADM-STAFF-01`)

**Approval:** Approved by user on 10 November 2026 with **"sikat"**.

## Scope & Goal

Extend the Super Admin dashboard (`/super-admin`) with single-company staff management (`ADM-STAFF-01`):
1. **Add Staff (`+ Tambah petugas`):** Provision a staff member by full name (`1..80` chars), email, and target role (`ADMIN_PO` displayed as **Operasional**, `HELPDESK` as **Helpdesk**, `CREW` as **Crew**).
2. **Change Role & Toggle Access Status:** Inline per-row controls in the staff directory table to switch a staff member's active role (`ADMIN_PO` | `HELPDESK` | `CREW`) or toggle their access status (`ACTIVE` <-> `DISABLED`).

## Data, Identity & Auth Contract

- **No Schema Migrations:** Reuses `auth.users`, `public.users`, and `public.memberships` in `lib/db/schema.ts`.
- **Auth Account Resolution (`addStaff`):**
  - First checks inside the Super Admin transaction whether `auth.users` already contains a user with `lower(email) = lower(input.email)`.
  - If not found in `auth.users`, calls an injected `ensureAuthUser(email, name)` adapter backed by Supabase Auth Admin (`createClient(url, serviceRoleKey).auth.admin.createUser({ email, email_confirm: true, user_metadata: { name } })`). Staff authenticate via the existing Email OTP flow at `/login`.
  - Upserts `public.users(id, name, email, updated_at)` and upserts `public.memberships(user_id, company_id, role, status = 'ACTIVE')`.
- **One Active Staff Role & Foreign-Key Safety:**
  - `trip_crew_assignments` references `memberships(id, user_id, company_id, role)` with `ON DELETE RESTRICT`. Therefore, `memberships` rows are **never deleted**.
  - Setting a target role (`role: StaffRole`) for `(userId, companyId)` upserts `(userId, companyId, role)` with `status = 'ACTIVE'` and updates all other staff roles (`ADMIN_PO`, `HELPDESK`, `CREW`) for `(userId, companyId)` to `status = 'DISABLED'`.
  - Disabling staff access (`status: 'DISABLED'`) updates all staff memberships (`ADMIN_PO`, `HELPDESK`, `CREW`) for `(userId, companyId)` to `status = 'DISABLED'`.
  - Activating staff access (`status: 'ACTIVE'` with `role: StaffRole`) sets the specified `role` to `ACTIVE` and disables other staff roles for `(userId, companyId)`.

## Security & Error Handling

- Every mutation runs inside `withSuperAdminTransaction`, verifying an active global `SUPER_ADMIN` membership (`company_id IS NULL AND role = 'SUPER_ADMIN' AND status = 'ACTIVE' FOR SHARE`) before touching any profile or membership.
- Company scope is strictly resolved server-side via `resolveDirectoryCompany(process.env)`. Browser input never supplies `companyId` or actor identity.
- Validation failures throw `DomainError('validation', ...)`; missing configuration or database/Auth Admin failures throw `DomainError('unavailable', ...)`.
