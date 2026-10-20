# Reversible Fixture Cleanup Implementation Plan

> Execution update: preparation/apply code and bound backup manifest delivered on 20 October 2026. Live suspension awaits concrete operation approval. See ../../setup/FIXTURE_CLEANUP_SETUP.md.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suspend reviewed leftover test companies while preserving every identity, transaction, ticket and snapshot.

**Architecture:** A maintenance command produces a fingerprinted dry-run and a restorable backup of company records, then uses the existing Super Admin transaction/lock/audit rules for a bounded batch. Normal payment/ticket behavior and public company-control functionality remain intact.

**Tech Stack:** Existing TypeScript, Postgres.js, Zod, Node filesystem/crypto and company domain service. No new runtime dependency or schema migration.

**Spec:** `docs/superpowers/specs/2026-10-20-region-reference-cleanup-design.md`, section 3; target records in `docs/analysis/2026-10-20-region-data-audit.md`.

## Execution order

This is **Package B**, run after [Package A](2026-10-20-region-reference.md). It can be prepared independently. Status: planning only; the audited company statuses/counts are a baseline, not a fresh preflight or an approval to apply changes now.

## Global Constraints

- Development project only: `slbkhdsfafcxaxqdxmet`, via existing `parseMigrationEnvironment` and validated TLS.
- No deletion of companies, users, memberships, stops, routes, trips, holds, payments, bookings, tickets or audit records. Do not alter published snapshots or retire real operational records by name matching.
- Keep Demo PO A/B (`00000000-0000-4000-8000-000000000001` / `...0002`) and their accounts unchanged.
- Only the eight explicitly listed fixture company IDs below may be considered; seven proposed ACTIVE→SUSPENDED transitions and one already-SUSPENDED no-op.
- Applying company status changes requires explicit approval of the concrete dry-run under the adopted spec. Prepare code, backup and a reviewable manifest first; the only application gate is after those exist. A changed preflight must be reviewed again, not silently accepted.
- No tests are added/run unless the user requests testing/verification. Acceptance cases below describe what must be proved if authorized; record deferrals.

## Review Focus

1. A similarly named real company or wrong database must never be included (Task 1).
2. Stale revisions, new transactions or active holds must stop writes before any transition (Tasks 1–2).
3. An unauthorized/revoked Super Admin must cause the entire batch to fail (Task 2).
4. A failed audit/transition must roll back all company changes; retries and existing suspension must not duplicate events (Task 2).
5. Backup/rollback must preserve immutable history and avoid reactivating a company already suspended before cleanup (Tasks 1–3).

## Exact allowlist

All eight IDs had `status_revision=0` at the audit; verify afresh before application. Expected name is `Trip fixture`; expected slug is `trip-<full UUID>`.

| ID | Audited status | Bookings / payments / tickets | Proposed action |
| --- | --- | --- | --- |
| `1d9e8f7a-f6b7-42d3-a7b5-e38ecfb02bee` | ACTIVE | 0 / 0 / 0 | Suspend |
| `5aa60dfe-aadf-423e-a863-11fe69e12422` | ACTIVE | 0 / 0 / 0 | Suspend |
| `6f20f864-d10d-46cf-8183-e5b9b5dc51a1` | ACTIVE | 0 / 0 / 0 | Suspend |
| `762a3201-19df-4b3d-a5c6-88983b52e1d9` | ACTIVE | 0 / 0 / 0 | Suspend |
| `7e275bb1-739a-4e8e-80e2-17905e5344b1` | ACTIVE | 0 / 0 / 0 | Suspend |
| `a0315534-d5b2-4e43-b3a0-5b2237f115a4` | SUSPENDED | 1 / 1 / 0 | No-op |
| `a123531d-143d-4e15-a4a5-9f0c5cf4775d` | ACTIVE | 1 / 1 / 0 | Suspend |
| `c469c45d-da34-42fd-89bc-19a6bf1dbfd8` | ACTIVE | 0 / 0 / 0 | Suspend |

---

### Task 1: Read-only manifest and backup

**Files:** Create `modules/company/fixture-maintenance.ts`, `fixture-maintenance-repository.ts`, `scripts/prepare-fixture-cleanup.ts`. Keep generated manifests/backups under ignored `.seatpax/fixture-cleanup/`.

**Interfaces:**
- `prepareFixtureCleanup(client:Sql):Promise<FixtureCleanupManifest>` reads only the exact allowlist after target guard validation.
- `FixtureCleanupManifest = {version:1;projectRef:string;preparedAt:string;digest:string;companies:{id:string;name:string;slug:string;status:'ACTIVE'|'SUSPENDED';statusRevision:number;target:'SUSPENDED'}[];protectedDigest:string;activeHoldCount:number;livePaymentHoldCount:number}`. Protected digest covers target identities/memberships, operational masters, snapshots and booking/payment/hold/ticket/boarding/snack rows and their audit histories. Company status/revision/updated-at fields and new `company_status_events` are intentionally excluded and verified separately by exact transition/event checks.
- `writeFixtureBackup(manifest:FixtureCleanupManifest,companyRows:unknown[]):Promise<{manifestPath:string;backupPath:string;backupDigest:string}>` saves complete original company rows plus manifest under the fixed ignored directory, with restrictive file permissions where supported. Do not print credentials, Auth data, booker details or raw payment payloads.

- [ ] Implement read-only preflight with exact IDs, name/slug provenance, status/revision and expected booking/payment/ticket counts from the table. Compute stable canonical sorted digests in memory and print only summary counts and proposed transitions. No arbitrary SQL identifier or CLI company-ID override is accepted.
- [ ] Require zero live holds (`status=ACTIVE` and effective expiry after DB time), including payment-extended holds. Include payment/booking status and event identity in the protected digest so new activity since preparation invalidates apply. If identity/count/status differs from the audited baseline, produce a changed-manifest report and stop for review.
- [ ] Save manifest and original company rows with SHA-256 digests before offering apply. A file-write or digest failure leaves the database unchanged. Backup only fields needed to restore target companies; old transaction histories stay in the database.
- [ ] If testing is authorized, create `tests/unit/fixture-cleanup-manifest.test.ts`: wrong project/extra ID/name mismatch rejects; active hold blocks eligibility; a changed payment status changes digest; failed backup produces no writes; `expect(manifest.companies).toHaveLength(8)` and `expect(proposedTransitions).toHaveLength(7)` for the audited fixture.
- [ ] Verification when authorized: `npm test -- tests/unit/fixture-cleanup-manifest.test.ts --maxWorkers=2`; expected pass. Commit with `feat: prepare reviewed fixture cleanup manifests`.

### Task 2: Authorized atomic suspension

**Files:** Extend `modules/company/fixture-maintenance.ts` and `fixture-maintenance-repository.ts`; extract existing shared authorization into `modules/company/transaction.ts` and consume it from `modules/company/service.ts`; create `scripts/apply-fixture-cleanup.ts`. Preserve ordinary `changeStatus` behavior.

**Interfaces:**
- Export `withSuperAdminTransaction<T>(repo:CompanyRepository,userId:string,work:(tx:DomainTx)=>Promise<T>):Promise<T>` from `modules/company/transaction.ts`, extracting the current private authorized transaction unchanged.
- Add `applyReviewedFixtureCleanup(userId:string,manifest:FixtureCleanupManifest,repo:ReturnType<typeof createFixtureMaintenanceRepository>):Promise<{changed:{id:string;statusRevision:number}[];unchanged:string[]}>` in `fixture-maintenance.ts`. `createFixtureMaintenanceRepository(client:Sql)` composes the existing company repository with bounded target inspection/digest reads; it is not a generic public SQL executor.
- `scripts/apply-fixture-cleanup.ts --manifest <reviewed-file> --digest <reviewed-sha256>` obtains the existing `superAdmin` actor from `.seatpax/seed-accounts.json` using `parseSeedMapping`; never grants or inserts a membership. Reject missing/unknown arguments and unexpected target.

- [ ] Reuse the service's authorized transaction: SHARE-lock the active global Super Admin membership, UPDATE-lock all target companies in deterministic UUID order, then reread current rows/protected digest and reject stale data, active holds or mismatch before any update. The complete batch is one transaction, not eight sequential `changeStatus` calls.
- [ ] For each ACTIVE company, apply SUSPENDED with revision +1 and the same company status event fields/DB clock behavior used by existing company controls. Preserve the already suspended row, its revision and event count. A failed row/audit rolls back every transition. Return only safe IDs/revisions.
- [ ] Detect a fully applied retry only when stored per-company transitions/events match the reviewed manifest's exact revisions/actor and current state, with protected data unchanged. Otherwise return a conflict; never treat a newer unrelated suspension as this batch's successful retry.
- [ ] Prepare the command but do not apply yet. Show the user the actual seven transitions, backup location/digest, unchanged demo companies and transaction preservation counts; obtain the concrete operation approval required by the spec. Unknown new activity stops this operation while Package A remains usable.
- [ ] If testing is authorized, create `tests/unit/fixture-cleanup-apply.test.ts` plus isolated `tests/integration/fixture-cleanup.test.ts`: revoked actor denies; stale sixth company causes zero changes; audit failure causes rollback; seven ACTIVE rows gain one revision/event each; existing suspended row remains untouched; exact retry does not duplicate events. Test only disposable seeded rows on an explicitly authorized isolated database.
- [ ] Commit code with `feat: suspend reviewed test fixtures atomically`; approval of code is not evidence that the live operation ran.

### Task 3: Apply, verify and document rollback

**Files:** Create `docs/setup/FIXTURE_CLEANUP_SETUP.md`; update the audit's application status, decision ledger and index only after actual application.

- [ ] After concrete dry-run approval, run the prepared apply command once against the guarded development target. Preserve backup/manifest files, output and final report; never commit secrets/backups to Git.
- [ ] Verify target statuses/revisions and exact new event count, unchanged Demo PO A/B, identical protected row digests and identical booking/payment/ticket counts. Verify selected published snapshots and old ticket identity remain intact using read-only SQL. Any discrepancy is a failure requiring investigation, not a successful cleanup.
- [ ] Document rollback: only companies changed by this batch are eligible; invoke existing authorized `changeStatus` individually with the actual post-cleanup expected revision to reactivate when rollback is requested. Retain new audit events. Do not restore old revisions/timestamps by SQL or reactivate the original SUSPENDED no-op.
- [ ] When testing/verification is requested, run focused tests and full unit suite, typecheck and lint. Record exact outcomes and checks deferred. Obtain final review and commit delivery evidence with `docs: record reversible fixture cleanup`.

## Self-review

This package covers spec section 3 without expanding catalogue, billing or marketplace scope. Every Review Focus has named acceptance cases. The manifest and apply signatures agree, status changes reuse existing company authorization/audit semantics, and the separate final dry-run gate is explicitly required by the adopted spec. No destructive cleanup, fabricated real PO, hosted operation or passing test is claimed by this plan.
