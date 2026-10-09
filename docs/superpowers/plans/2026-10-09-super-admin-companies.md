# Super Admin Company Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Primary implements inline; one final focused reviewer.

**Goal:** Active global Super Admin lists existing PO companies and explicitly activates/suspends them with atomic audit and stale-write protection.

**Architecture:** A small company domain checks current global membership and locks company status inside one transaction. Server actions derive the actor from the verified session; a dedicated page shows a minimum company projection and explicit status confirmation. Existing sales and ticket services retain their policies.

**Tech Stack:** Existing Next.js/React, TypeScript, Zod, postgres-js/Drizzle and Vitest. No new dependency.

**Spec:** `../specs/2026-10-09-super-admin-company-design.md`, written spec approved by user on 9 October 2026.

## Global Constraints

- ACTIVE global SUPER_ADMIN with company_id NULL is required on every read/mutation/retry; no metadata/client-role or tenant-operation fallback.
- Company list fields only: id, name, slug, status, statusRevision, updatedAt. No account/booking/payment/QR data.
- ACTIVE/SUSPENDED controls only. No onboarding, invitations, membership editing, deletion, analytics, audit-list UI or visual redesign.
- Membership SHARE → company UPDATE; lock_timeout5s, statement_timeout15s; no nested transaction, inventory lock or silent deadlock retry.
- Check expected revision before no-op; real transitions increment once and audit in the same transaction. Database owns timestamps/actor is verified session.
- Suspension blocks new publish/hold/initiation; valid initiated payments and existing ticket/boarding/snack operations continue. Reactivation does not resurrect expired/terminal resources.
- Confirmation names PO and explains consequences; cancel changes nothing, pending blocks resubmission, no optimistic success. Conflict requires refreshed state and a new decision.
- Main next-env.d.ts bytes, ignored credentials and `.codex-remote-attachments/` must remain intact and unstaged. No demo company/status mutation or push/deployment.
- Manual browser/login/keyboard/narrow-width acceptance is deferred by user. Automated verification remains required.
- Reuse suitable managed worktree only after inspecting artifacts. Primary inline; final reviewer explicitly gpt-6-luna/medium, focused fork none.

## Review Focus

1. Old page after global membership disabled: read/change/no-op must deny (Task1 real access barriers, Task3 actions).
2. Status changes ACTIVE→SUSPENDED→ACTIVE while a page is open: original revision must conflict despite same visible status (Task1 ABA test).
3. Sale and suspension overlap: actual lock/commit ordering determines outcome, never retroactive hold deletion (Task2 two-direction barriers).
4. Lost success response and explicit retry: stale revision conflicts safely; refresh exposes committed state, one audit event (Tasks1/3).
5. Two PO rows and delayed response: submitted company identity cannot update the other row; cancel/pending/conflict preserve explicit decision (Task3 state tests).

---

## Execution preflight

- [x] Read using-git-worktrees, inspect attached artifacts and reuse suitable managed checkout from current integrated main on codex/super-admin-companies. Preserve ignored env without printing it. Record base commit, main dirty next-env hash, baseline unit count and ledger `.superpowers/sdd/2026-10-09-super-admin-companies/progress.md`. Do not remove the active preview checkout.

### Task 1: Guarded company status domain and schema

**Files:** Create `modules/company/{types,validation,repository,service}.ts`, `drizzle/0010_company_status_control.sql`, `tests/unit/company-validation.test.ts`, `tests/integration/company-status.test.ts`, `tests/integration/helpers/company-fixture.ts`. Modify `lib/db/schema.ts`, `drizzle/meta/_journal.json`.

**Interfaces:** `CompanySummary={id,name,slug,status:'ACTIVE'|'SUSPENDED',statusRevision:number,updatedAt:string}`; `parseCompanyStatusInput(unknown):{companyId:string;target:'ACTIVE'|'SUSPENDED';expectedStatusRevision:number}` strips identity/time. `createCompanyRepository(Sql)` exposes client, authorize(tx,userId), list(tx), company(tx,id), update(tx,id,target,nextRevision), audit(tx,{companyId,actorId,fromStatus,toStatus,statusRevision}); company() locks FOR UPDATE, update returns CompanySummary. `createCompanyService(repo)` exposes list(userId:string):Promise<CompanySummary[]> and changeStatus(userId:string,raw:unknown):Promise<{company:CompanySummary;changed:boolean}>.

- [x] Write RED validation tests for malformed UUID/status, negative/fractional/unsafe or too-large revision (maximum2147483647), and forged actor/audit/time stripping. Run `npm test -- tests/unit/company-validation.test.ts`, expect missing module/validation failure before implementation.
- [x] Write real domain tests: active global membership succeeds; tenant ADMIN_PO/CREW, absent or disabled membership denies both list/change; list contains exactly the six fields, sorted name/id. Malformed company lookup returns safe unavailable. No-op from matching revision preserves updatedAt/revision and zero audit. Transition produces next revision, original actor and DB time; stale revision conflicts including ABA. Two simultaneous changes from revision0 produce one success/one conflict and one event. Forced audit failure rolls back status/revision. Direct malformed audit/FK/duplicate revision inserts fail; RLS and revoked anon/authenticated grants are asserted. Run targeted DB file with existing TLS CA; record meaningful RED missing schema/service, not DNS failure.
- [x] Implement migration: companies.status_revision integer NOT NULL DEFAULT0 CHECK>=0; company_status_events UUID/default, company/actor FKs RESTRICT, enum company_status from/to, positive resulting revision, DB changed_at, CHECK from!=to and UNIQUE(company_id,status_revision); enable RLS/revoke ALL anon/authenticated. Mirror Drizzle and journal idx10 with increasing timestamp. Apply through existing guarded dev migration command.
- [x] Implement service with fresh global membership SHARE before list/transition and local SQL timeouts. Mutation locks company UPDATE, checks expected revision, no-op if current target matches, otherwise increments/update then audit atomically. Preserve DomainError; unexpected DB errors map to unavailable. Reject revision overflow safely without partial write. Do not reuse inventoryTransaction's automatic retry loop for this writer.
- [x] Build company-fixture around existing boardingFixture: seed an extra auth/public user and ACTIVE global membership; register user in fixture users. In callback finally delete only fixture-owned company_status_events and that user's global membership before outer cleanup removes users/companies. Never use global demo cleanup.
- [x] Add bounded promise gates: claim/change first holds membership lock while disable writer waits; after commit disable then next request denies. Reverse disable writer holds membership UPDATE while company change queues; release disable then assert forbidden/no event. Gates always release in finally; do not use timed sleeps as proof.
- [x] Run company units/DB plus existing tenant-access regression, typecheck; require zero failures then commit Task1 files.

### Task 2: Suspension policy and sales regression

**Files:** Create `tests/integration/company-suspension.test.ts`; reuse company-fixture and existing inventory/booking/payment/ticket/boarding/snack services. Modify production sales code only if tests expose disagreement with already adopted suspension policy, with focused regression evidence.

**Interfaces:** Consumes Task1 changeStatus/list and fixture `{superUserId,superMembershipId,...boardingFixtureFields}`. Company service does not update other domain records.

- [x] Write real-service tests: create separate available hold and initiated booking before suspension; use company service to suspend, then verify publication/new hold/new initiation denied. Apply verified success to the pre-initiated valid booking, read its issued QR as owner, board and claim snack as assigned crew while suspended. Confirm no automatic company-wide hold/trip/booking deletion or membership revocation.
- [x] Verify reactivation permits a new eligible hold on an available interval but cannot revive an expired/released hold or reopen a sales cutoff in the past. Use scoped DB fixture timestamps, not altered production clocks.
- [x] Pin both race directions using real transactions: wrap inventory repo.guards after acquiring its company SHARE to hold a real hold creation; start company suspension, assert pending, release sale and expect hold commit before suspension, then new sale denied. Reverse wrap company repo.company after acquiring UPDATE to hold suspension; queue hold creation, release suspension, expect sale guard denial and no new hold. Keep barriers under5s lock timeout and finally-release; observe queued task entry without arbitrary sleeps.
- [x] Run `npm run db:test -- tests/integration/company-status.test.ts tests/integration/company-suspension.test.ts tests/integration/checkout-initiation.test.ts tests/integration/payment-confirmation.test.ts` serially with TLS CA. Require zero failures; if real guard behavior differs, diagnose before a minimal fix. Commit policy tests/fixes.

### Task 3: Verified action, dedicated page and confirmation

**Files:** Create `app/super-admin/{data,action-core,actions}.ts`, `app/super-admin/companies/page.tsx`, `app/super-admin/components/{company-list,company-status-control}.tsx`, `app/super-admin/company-ui-state.ts`, `tests/unit/{company-actions,company-ui}.test.ts`. Modify `app/account/page.tsx`; reuse existing global/admin styles, add scoped styles in `app/globals.css` only when required.

**Interfaces:** Action factory createCompanyActions({getUserId:()=>Promise<string|null>,changeStatus:service.changeStatus}).change(raw) returns `{ok:true,result:{company,changed}}|{ok:false,code:'validation'|'forbidden'|'conflict'|'unavailable',message}`. changeCompanyStatusAction(raw) gets verified session ID. Data loader gets verified user, redirects /login if absent and calls service.list; page handles forbidden/unavailable without company data. `applyCompanyResult(rows:CompanySummary[],company:CompanySummary)` updates matching ID only and ignores a result older than displayed statusRevision. `CompanyStatusControl` is presentation with company, confirming, pending, message and onRequest/onCancel/onConfirm; CompanyList owns confirmation/request state.

- [x] Write action RED for verified actor overriding forged input, absent session and malformed fields never mutating, preexisting forbidden/conflict messages safe, and unexpected error secrets hidden. Write UI/helper RED for named confirmation/consequence copy, cancelled confirmation leaving rows unchanged, pending disabled controls, current target ACTIVE→Suspend and SUSPENDED→Aktifkan, no mutation while only opening confirmation, stale result rejected and matching-ID update preserving other rows. Render actual presentation states; test submit controller behavior without mocking a UI component into existence.
- [x] Implement verified action and data/page. Account link uses a fresh ACTIVE NULL-company SUPER_ADMIN lookup, label Super Admin →, and destination still independently authorizes. Add no role editing or tenant-operation fallback.
- [x] Implement per-row explicit inline confirmation with request/cancel/confirm, submit guarded by a synchronous busy ref, pending state and server-returned row only after success. Name PO, explain suspension/new sales and existing tickets/payment, explain eligible reactivation. Cancel restores focus to trigger, keyboard Enter/Space work, 44px controls, visible focus and aria-live errors. On conflict close confirmation and refresh list; reconcile the refreshed server props by revision instead of retaining initial useState rows forever. User must choose again. Network errors preserve displayed row and allow explicit retry with revision protection.
- [x] Run company action/UI units and existing access units, full units/typecheck/lint/build; require zero failures and /super-admin/companies dynamic route in output. Commit Task3.

### Task 4: Final evidence, review and local integration

**Files:** Create `docs/setup/SUPER_ADMIN_COMPANY_SETUP.md`; update spec/plan status and `docs/seatpax/{00_INDEX,03_ROLES_RBAC_AUTH,10_DATA_MODEL_DATABASE,11_API_PROJECT_STRUCTURE,19_DECISION_LEDGER}.md`.

- [x] Run full unit and serial DB suites with verified TLS CA; typecheck/lint/build. Record exact counts, duration, fixture failures/reruns and cleanup outcome. No demo mutation or secret logging. Manual acceptance stays pending per user instruction; do not ask them to log in during meeting.
- [x] One focused reviewer gpt-6-luna medium/fork none checks whole diff/spec, global authorization, lock-order races, atomic revision/audit, minimum data and confirmation/late-response behavior. Fix material findings through RED→GREEN and rerun affected checks.
- [x] Record implementation and pending manual acceptance in setup, sync adopted rules into ledger/modules without broadening scope. Commit docs and perform authorized local integration to main. Rerun merged units/typecheck/lint/build; preserve exact main next-env bytes and remote attachment folder. No push/deploy. Keep attached worktree for preview, restart port3001 from verified production build and report the URL.

## Self-review and handoff

All spec sections map to Tasks1–4; every Review Focus condition has an explicit owning test. Domain/action/UI all use CompanySummary and expectedStatusRevision consistently; migration increments only real status transitions. No unspecified onboarding, membership, payment or visual policy is introduced. Extra global fixture membership is removed before parent user cleanup. Native inline execution and one final reviewer are preserved. User approved this plan on9October2026. Implemented; evidence and deferred manual acceptance are in docs/setup/SUPER_ADMIN_COMPANY_SETUP.md.
