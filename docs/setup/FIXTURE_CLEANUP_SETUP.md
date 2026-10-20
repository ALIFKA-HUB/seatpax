# Fixture cleanup — concrete operation review

Date: 20 October 2026. **Prepared only; no company status changes applied.**

The approved design requires approval of this concrete dry-run because suspending companies changes access and sales eligibility. Preparation used SELECTs only, then saved and fsynced the manifest and complete original company records under ignored `.seatpax/fixture-cleanup/`.

## Proposed operation

All targets are named `Trip fixture`, with slug `trip-<full UUID>`. All currently have revision 0. Exactly these IDs are accepted by the command:

| Company ID | Current | Proposed |
| --- | --- | --- |
| `1d9e8f7a-f6b7-42d3-a7b5-e38ecfb02bee` | ACTIVE | SUSPENDED, revision 1 |
| `5aa60dfe-aadf-423e-a863-11fe69e12422` | ACTIVE | SUSPENDED, revision 1 |
| `6f20f864-d10d-46cf-8183-e5b9b5dc51a1` | ACTIVE | SUSPENDED, revision 1 |
| `762a3201-19df-4b3d-a5c6-88983b52e1d9` | ACTIVE | SUSPENDED, revision 1 |
| `7e275bb1-739a-4e8e-80e2-17905e5344b1` | ACTIVE | SUSPENDED, revision 1 |
| `a0315534-d5b2-4e43-b3a0-5b2237f115a4` | SUSPENDED | No change, revision 0 |
| `a123531d-143d-4e15-a4a5-9f0c5cf4775d` | ACTIVE | SUSPENDED, revision 1 |
| `c469c45d-da34-42fd-89bc-19a6bf1dbfd8` | ACTIVE | SUSPENDED, revision 1 |

Demo PO A/B remain unchanged. Fixture records retain 2 bookings, 2 payments and 0 tickets; complete development totals remain 5 bookings, 5 payments and 1 ticket. Live and payment-extended live holds: 0. Every identity, membership, stop, route, snapshot, transaction and audit remains stored.

## Reviewed artifacts

Worktree root: `C:/Users/ASUS/.codex/worktrees/day3-email-otp/SeatPax`.

- Manifest: `.seatpax/fixture-cleanup/d37d854376e0c1ee481d9d3ddb37a52e79d94417f603a0b79a152294ad658fb9.manifest.json`
- Original company backup: same directory and basename, `.backup.json`.
- Manifest canonical SHA256: `d37d854376e0c1ee481d9d3ddb37a52e79d94417f603a0b79a152294ad658fb9`.
- Backup company-payload canonical SHA256: `fe74badb76bdfcf878f1d2b56bcdf9713bd2a5ac258817df8dc1fbc5d2579522` (SHA256 of canonical `{companies:[complete original rows]}`, bound into manifest).
- Protected target-row SHA256: `0afc6e1110c8a09be5d6e6a19228ad63963cb46740de81547baa304bd5552bb0`.

The earlier preliminary manifest/backup are superseded and are not approved artifacts. Nothing from `.seatpax` is committed.

## After explicit operation approval only

```powershell
node_modules/.bin/tsx scripts/apply-fixture-cleanup.ts --manifest .seatpax/fixture-cleanup/d37d854376e0c1ee481d9d3ddb37a52e79d94417f603a0b79a152294ad658fb9.manifest.json --digest d37d854376e0c1ee481d9d3ddb37a52e79d94417f603a0b79a152294ad658fb9
```

The command validates development target, manifest, bound backup and the existing Super Admin seed mapping. It grants no membership. One transaction locks the active global Super Admin membership and all target companies in UUID order, rechecks protected data and holds, and writes seven normal status events. Failed row/audit rolls back the batch. Changed revisions, transaction activity or identities stop apply and require a new review.

The maintenance transaction takes short SHARE locks over protected domain tables to prevent new payment/audit events between fingerprint and commit. These can briefly block unrelated writes; the existing 5-second lock timeout aborts safely on contention. This is a manual maintenance operation, never a browser request.

On success, the command fsyncs `<manifest-digest>.receipt.json` with the result and exact rollback-eligible IDs/revisions. If receipt persistence fails after commit, the outcome is unconfirmed: inspect status/events, then retry only the identical manifest and actor. An exact completed retry is recognized by all seven actor/revision events and unchanged protected data; it writes no duplicate events. The receipt still lists the original seven rollback-eligible IDs.

## Rollback when requested

1. Read the successful receipt and original backup; verify all seven listed ACTIVE-to-SUSPENDED transitions belong to this manifest/actor and their expected post-cleanup revision is 1.
2. Use existing authorized `createCompanyService(repo).changeStatus(superAdminId,{companyId,target:'ACTIVE',expectedStatusRevision:1})` for each of those seven IDs only. A changed revision must stop that rollback for review; never overwrite it.
3. Each normal transition creates a new immutable audit event and increments the current revision. Never restore old revisions/timestamps with SQL or overwrite transaction data.
4. Never reactivate `a0315534-d5b2-4e43-b3a0-5b2237f115a4`: it was already suspended before this operation.
5. Compare protected data and booking/payment/ticket totals again. Reactivation only restores otherwise eligible sales; expired trips remain expired.

## Review and verification

Fresh GPT-6 Luna / medium review identified missing backup binding and an unfinished rollback handoff. Backup payload SHA256 is now part of the fingerprinted manifest, exact saved rows are validated at apply, and this document plus persisted receipt define rollback. Typecheck/lint/build are recorded in the regional delivery document. No tests or live apply/retry/rollback were run; these acceptance checks remain pending.

Ruling: manifest adds `backupDigest` to the planned interface to bind the restorable artifact durably; old preliminary manifests are rejected. Cost: pre-fix files must be regenerated/reviewed. Ruling: tests remain deferred under developer instruction; behavior under concurrency has not been demonstrated by a test suite.
