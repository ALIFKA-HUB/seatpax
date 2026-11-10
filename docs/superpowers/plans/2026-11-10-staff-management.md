# Super Admin Staff Management (`ADM-STAFF-01`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Super Admin at `/super-admin` to add new staff members (with automatic Supabase Auth OTP-ready account provisioning if not yet registered) and change staff roles or active/disabled status inline for the configured single company.

**Architecture:** Extend `modules/staff-directory/` with Zod-validated mutation inputs (`parseCreateStaffInput`, `parseUpdateStaffInput`), non-destructive SQL membership upserts that preserve `trip_crew_assignments` foreign keys, and an injectable Auth Admin provisioning callback for newly added emails. Expose server actions in `app/super-admin/staff-actions.ts` and progressive-enhancement forms inside `app/super-admin/components/staff-directory.tsx`.

**Tech Stack:** Next.js App Router (Server Actions), React, TypeScript, PostgreSQL (`postgres`), Supabase Auth Admin (`@supabase/supabase-js`), Zod, Vitest.

## Global Constraints

- Only an authenticated user with an active global `SUPER_ADMIN` membership (`company_id IS NULL AND role = 'SUPER_ADMIN' AND status = 'ACTIVE'`) may add or update staff.
- Company ID is always resolved server-side via `resolveDirectoryCompany(process.env)`; never accept `companyId` from client input.
- Never `DELETE` rows from `public.memberships` (to preserve `trip_crew_assignments` foreign keys). Enforce "one active staff role per account" by setting the chosen role (`ADMIN_PO` | `HELPDESK` | `CREW`) to `ACTIVE` via upsert and setting the user's other staff roles in that company to `DISABLED`.
- Keep all existing read-model exports (`StaffRole`, `StaffStatus`, `StaffDirectoryQuery`, `StaffDirectoryRow`, `StaffDirectorySnapshot`, `parseDirectoryQuery`, `resolveDirectoryCompany`, `createStaffDirectoryRepository`, `createStaffDirectoryService`) backward-compatible.
- All colors in `app/super-admin/dashboard.css` must use CSS custom properties declared on `.super-admin-shell`; no literal hex/rgb colors in rule bodies.

---

### Task 1: Domain Validation, Auth Provisioning & Staff Mutation Service

**Files:**
- Modify: `modules/staff-directory/types.ts`
- Modify: `modules/staff-directory/validation.ts`
- Modify: `modules/staff-directory/repository.ts`
- Modify: `modules/staff-directory/service.ts`
- Modify: `tests/unit/staff-directory.test.ts`

**Interfaces:**
- Consumes: `DomainError`, `DomainTx` from `@/modules/access/transaction`; `withSuperAdminTransaction` from `@/modules/company/transaction`.
- Produces:
  - `CreateStaffInput = { name: string; email: string; role: StaffRole }` in `modules/staff-directory/types.ts`
  - `UpdateStaffInput = { userId: string; role: StaffRole; status: StaffStatus }` in `modules/staff-directory/types.ts`
  - `parseCreateStaffInput(raw: unknown): CreateStaffInput` in `modules/staff-directory/validation.ts`
  - `parseUpdateStaffInput(raw: unknown): UpdateStaffInput` in `modules/staff-directory/validation.ts`
  - `repo.findAuthUserByEmail(tx: DomainTx, email: string): Promise<string | null>` in `modules/staff-directory/repository.ts`
  - `repo.upsertStaff(tx: DomainTx, input: { companyId: string; userId: string; name?: string; email?: string; role: StaffRole; status: StaffStatus }): Promise<void>` in `modules/staff-directory/repository.ts`
  - `createStaffDirectoryService(repo, ensureAuthUser?: (email: string, name: string) => Promise<string>)` with `.read(...)`, `.createStaff(actorId: string, companyId: string, raw: unknown): Promise<{ userId: string }>`, and `.updateStaff(actorId: string, companyId: string, raw: unknown): Promise<{ userId: string }>` in `modules/staff-directory/service.ts`

- [x] **Step 1: Write failing unit tests in `tests/unit/staff-directory.test.ts`**

Append tests to `tests/unit/staff-directory.test.ts` verifying:
1. `parseCreateStaffInput` trims name (`1..80` chars), normalizes email to lowercase, validates role (`ADMIN_PO` | `HELPDESK` | `CREW`), and throws `DomainError('validation')` on invalid input.
2. `parseUpdateStaffInput` validates `userId` (UUID), `role` (`ADMIN_PO` | `HELPDESK` | `CREW`), and `status` (`ACTIVE` | `DISABLED`), throwing `DomainError('validation')` on invalid input.
3. `service.createStaff` authorizes as Super Admin first, reuses an existing `auth.users` ID when `findAuthUserByEmail` finds one (without calling `ensureAuthUser`), or calls `ensureAuthUser(email, name)` when not found, then calls `repo.upsertStaff` with `status: 'ACTIVE'`.
4. `service.updateStaff` authorizes as Super Admin first and calls `repo.upsertStaff` with the validated `userId`, `role`, and `status`.

- [x] **Step 2: Run unit test to verify RED state**

Run: `npx vitest run tests/unit/staff-directory.test.ts`
Expected: FAIL because `parseCreateStaffInput`, `parseUpdateStaffInput`, `createStaff`, and `updateStaff` do not exist yet.

- [x] **Step 3: Implement types, validation, repository methods, and service mutations**

1. In `modules/staff-directory/types.ts`, add:
```ts
export type CreateStaffInput={name:string;email:string;role:StaffRole};
export type UpdateStaffInput={userId:string;role:StaffRole;status:StaffStatus};
```
2. In `modules/staff-directory/validation.ts`, add `parseCreateStaffInput(raw: unknown): CreateStaffInput` and `parseUpdateStaffInput(raw: unknown): UpdateStaffInput` using Zod (`z.enum(['ADMIN_PO','HELPDESK','CREW'])`, `z.enum(['ACTIVE','DISABLED'])`, `z.email()`, `z.uuid()`). Throw `new DomainError('validation', 'Data petugas tidak valid.')` when parsing fails.
3. In `modules/staff-directory/repository.ts`, add:
   - `async findAuthUserByEmail(tx:DomainTx,email:string):Promise<string|null>`: queries `select id from auth.users where lower(email)=lower(${email}) limit 1` and returns `row?.id ?? null`.
   - `async upsertStaff(tx:DomainTx,input:{companyId:string;userId:string;name?:string;email?:string;role:StaffRole;status:StaffStatus}):Promise<void>`:
     - Verifies company exists in `public.companies` (`select id from public.companies where id=${input.companyId} for share`; if missing, throws `new DomainError('unavailable','Data perusahaan belum tersedia.')`).
     - If `input.name` or `input.email` is provided, upserts `public.users(id, name, email, updated_at)` on conflict `(id)` updating `name = coalesce(excluded.name, public.users.name)`, `email = coalesce(excluded.email, public.users.email)`, `updated_at = clock_timestamp()`; otherwise ensures `userId` exists in `public.users` (`select id from public.users where id=${input.userId} for update`, throwing `new DomainError('validation','Petugas tidak ditemukan.')` if absent).
     - Upserts `public.memberships(user_id, company_id, role, status, updated_at)` on `(user_id, company_id, role) where company_id is not null` setting `status = ${input.status}, updated_at = clock_timestamp()`.
     - Updates other staff roles (`role::text in ('ADMIN_PO','HELPDESK','CREW') and role <> ${input.role}`) for `(user_id = ${input.userId} and company_id = ${input.companyId})` to `status = 'DISABLED', updated_at = clock_timestamp()`.
4. In `modules/staff-directory/service.ts`, extend `createStaffDirectoryService(repo: StaffDirectoryRepository, ensureAuthUser?: (email: string, name: string) => Promise<string>)` with `createStaff` and `updateStaff`.

- [x] **Step 4: Run unit tests and typecheck to verify GREEN state**

Run: `npx vitest run tests/unit/staff-directory.test.ts` and `npm run typecheck`
Expected: PASS (all tests in `tests/unit/staff-directory.test.ts` pass, 0 type errors).

- [x] **Step 5: Commit Task 1**

```bash
git add modules/staff-directory/types.ts modules/staff-directory/validation.ts modules/staff-directory/repository.ts modules/staff-directory/service.ts tests/unit/staff-directory.test.ts
git commit -m "feat: add staff directory create and access update service"
```

---

### Task 2: Super Admin Staff Management Server Actions, UI & Documentation

**Files:**
- Create: `app/super-admin/staff-actions.ts`
- Modify: `app/super-admin/components/staff-directory.tsx`
- Modify: `app/super-admin/dashboard.css`
- Modify: `tests/unit/staff-dashboard-view.test.ts`
- Modify: `docs/seatpax/00_INDEX.md`
- Modify: `docs/seatpax/19_DECISION_LEDGER.md`

**Interfaces:**
- Consumes: `createStaffDirectoryService`, `createStaffDirectoryRepository`, `parseCreateStaffInput`, `parseUpdateStaffInput`, `resolveDirectoryCompany` from `@/modules/staff-directory/*`.
- Produces:
  - `createStaffFormAction(formData: FormData): Promise<void>` and `updateStaffFormAction(formData: FormData): Promise<void>` in `app/super-admin/staff-actions.ts`
  - Add-staff form (`id="tambah-petugas"`, fields `name`, `email`, `role`, submit button `Tambah petugas`) and per-row inline update form (select `name="role"`, hidden `userId`, hidden `status`, submit button `Simpan` / `Nonaktifkan` / `Aktifkan`) in `app/super-admin/components/staff-directory.tsx`.

- [x] **Step 1: Update `tests/unit/staff-dashboard-view.test.ts` with failing UI & action assertions**

Update `tests/unit/staff-dashboard-view.test.ts` to assert:
1. The rendered `/super-admin` page contains the real `+ Tambah petugas` form (`action`, `name="name"`, `name="email"`, `name="role"`, button `Tambah petugas`) and per-row role/status controls (`name="userId"`, `name="role"`, `Nonaktifkan`), while still forbidding fake preview artifacts (`'Kelola user'`, `'Aktivitas terbaru'`, `'aditya@example.com'`, `'data-explain='`).
2. Active role selection defaults to the staff member's active role (or first role when disabled).

- [x] **Step 2: Run view test to verify RED state**

Run: `npx vitest run tests/unit/staff-dashboard-view.test.ts`
Expected: FAIL because `StaffDirectory` does not render the add-staff form or per-row management controls yet.

- [x] **Step 3: Implement `app/super-admin/staff-actions.ts`, update `staff-directory.tsx`, `dashboard.css`, and docs**

1. Create `app/super-admin/staff-actions.ts` with `'use server'`:
   - Helper `ensureSupabaseAuthUser(email: string, name: string): Promise<string>` using `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })` to call `auth.admin.createUser({ email, email_confirm: true, user_metadata: { name } })` (throwing `DomainError('unavailable', 'Layanan akun belum tersedia.')` if env vars are missing or creation fails).
   - `createStaffFormAction(formData: FormData)` and `updateStaffFormAction(formData: FormData)`: verify user via `getVerifiedUser()`, resolve company via `resolveDirectoryCompany(process.env)`, invoke `createStaffDirectoryService(createStaffDirectoryRepository(getDatabase().$client), ensureSupabaseAuthUser)`, call `revalidatePath('/super-admin')`.
2. In `app/super-admin/components/staff-directory.tsx`:
   - Add the `Tambah petugas` form in `.super-directory-heading` / collapsible `<details className="super-add-staff">` with `<summary>+ Tambah petugas</summary>` and fields `name` (`required maxLength={80}`), `email` (`type="email" required`), `role` (`ADMIN_PO`, `HELPDESK`, `CREW`), and submit button `Tambah petugas`.
   - In each staff row of `.super-staff-table`, add an inline action cell (`<th scope="col">Kelola akses</th>` / `<td>`) containing:
     - Form calling `updateStaffFormAction` to update role (`<input type="hidden" name="userId" value={person.id}/>`, `<input type="hidden" name="status" value="ACTIVE"/>`, `<select name="role" defaultValue={activeRole} aria-label={"Role " + person.name}>`, `<button type="submit">Simpan role</button>`).
     - Form calling `updateStaffFormAction` to toggle status (`<input type="hidden" name="userId" value={person.id}/>`, `<input type="hidden" name="role" value={activeRole}/>`, `<input type="hidden" name="status" value={person.status==='ACTIVE'?'DISABLED':'ACTIVE'}/>`, `<button type="submit">{person.status==='ACTIVE'?'Nonaktifkan':'Aktifkan'}</button>`).
3. In `app/super-admin/dashboard.css`, style `.super-add-staff`, `.super-add-form`, and `.super-staff-actions` using only existing CSS variables (`--super-border`, `--super-surface`, `--super-canvas`, `--super-primary`, `--super-ink`, `--super-muted`, `--super-soft`, `--super-action-hover`, `--super-on-card`) with 44px minimum touch targets.
4. Record `D2026-11-10-01 — Single-company Super Admin staff management (ADM-STAFF-01)` in `docs/seatpax/19_DECISION_LEDGER.md` and `docs/seatpax/00_INDEX.md`.

- [x] **Step 4: Run tests, typecheck, and lint to verify GREEN state**

Run: `npx vitest run tests/unit/staff-dashboard-view.test.ts tests/unit/staff-directory.test.ts tests/unit/super-admin-view.test.ts`, `npm run typecheck`, and `npm run lint`
Expected: PASS (all tests pass, 0 type errors, 0 lint errors).

- [x] **Step 5: Commit Task 2**

```bash
git add app/super-admin/staff-actions.ts app/super-admin/components/staff-directory.tsx app/super-admin/dashboard.css tests/unit/staff-dashboard-view.test.ts docs/seatpax/00_INDEX.md docs/seatpax/19_DECISION_LEDGER.md docs/superpowers/specs/2026-11-10-staff-management-design.md docs/superpowers/plans/2026-11-10-staff-management.md
git commit -m "feat: add Super Admin staff creation and inline access controls"
```
