# Snack Claim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve inline execution and one final reviewer.

**Goal:** Assigned active crew explicitly records one snack handover per boarded ticket/trip.

**Architecture:** A snack domain reuses boarding authorization and passenger locks inside one transaction. Database uniqueness and composite foreign keys enforce one claim and an existing boarding event. Existing QR/manual profiles expose minimum snack state and a separate server action.

**Tech Stack:** Existing Next.js/React, TypeScript, Zod, postgres-js/Drizzle and Vitest; no new dependency.

**Spec:** `../specs/2026-10-09-snack-claim-design.md`, approved by user on 9 October 2026.

## Global Constraints

- One claim per ticket/trip, only after boarding; no snack quantity/package/class configuration, inventory stock, reversal, offline sync or automatic scan mutation.
- Fresh ACTIVE CREW membership and ACTIVE assigned-trip access on every mutation/retry. Company derived from trip, actor from verified session, timestamp from DB.
- Same-company Admin reads only; no Super Admin/passenger mutation fallback. Suspended company permits existing-ticket operations.
- CONFIRMED booking and valid ticket/passenger/assignment required. No phone/email/account/token/ciphertext in operational payloads.
- Original actor/time/record survives concurrent requests and retries. No inventory lock or nested transaction; no retry masking a deadlock.
- Keep original main `next-env.d.ts` bytes and ignored credentials. No push/deploy. Do not mutate demo passengers without explicit selection.
- Primary implements inline; one final reviewer `gpt-6-luna`, reasoning `medium`, focused fork `none`.

## Review Focus

1. Snack clicked while boarding is still pending: reject if no boarding is visible after locks; permit after boarding commit (Task 1 barriers).
2. Two crew submit simultaneously: both receive one original claim/actor/time (Task 1 concurrency).
3. Access revoked while old profile remains open: reject even if a previous claim exists (Task 1 both revocation orderings).
4. Old claim response arrives after scanning another ticket: preserve the newly displayed profile (Task 3 unit).
5. Adjacent passengers share seat code: maintain separate ticket claims and minimum manifest projection (Tasks 1–2).

---

### Task 1: Database invariant and claim service

**Files:** Create `drizzle/0009_snack_claims.sql`, `modules/snack/{types,validation,repository,service}.ts`, `tests/unit/snack-validation.test.ts`, `tests/integration/snack-claim.test.ts`. Modify `drizzle/meta/_journal.json`, `lib/db/schema.ts`, `tests/integration/helpers/payment-cleanup.ts`. Reuse `tests/integration/helpers/boarding-fixture.ts`; add fixture helpers there only when shared.

**Interfaces:** `SnackClaim={id,companyId,tripId,ticketId,actorId,claimedAt}` (strings). `parseSnackInput(unknown):{ticketId:string}` strips actor/company/time. `createSnackRepository(Sql)` exposes `client`, `boarding(tx,tripId,companyId,ticketId)` guarded SHARE lookup, `existing(...)`, `insert(tx,{companyId,tripId,ticketId,actorId})`. `createSnackService(repo,boardingRepo).claim(actor:BoardingActor,tripId:string,input:unknown):Promise<{claim:SnackClaim;alreadyClaimed:boolean}>`; both repositories use the same Sql instance and transaction.

- [ ] Write validation units: malformed UUID rejected; forged actor/company/time stripped. Write real-service fixture assertions for before-board rejection/no event, successful claim, Admin/foreign-trip/foreign-company denial, suspension allowed, immutable retry, rollback-after-insert, adjacent same-seat independent claims and DB constraint rejection. Example core assertion:

```ts
await expect(snack.claim(crew,trip,{ticketId})).rejects.toMatchObject({code:'validation'});
await boarding.board(crew,trip,{ticketId,stopId:origin,source:'MANIFEST'});
const first=await snack.claim(crew,trip,{ticketId});
expect(await snack.claim(crew,trip,{ticketId})).toEqual({claim:first.claim,alreadyClaimed:true});
```

- [ ] Run targeted unit/DB files; record RED missing validation/service/schema, not a connectivity failure. Use 180-second per-fixture budget where multiple hosted checkout confirmations are required.
- [ ] Add `boarding_events` UNIQUE(ticket_id,trip_id,company_id). Add `snack_claims`: UUID/default gen_random_uuid, required company/trip/ticket/actor, DB clock claimed_at, UNIQUE(ticket_id,trip_id), composite ticket FK and boarding FK, actor users FK, all DELETE RESTRICT. Enable RLS/revoke anon/authenticated grants; mirror Drizzle schema and ordered journal index9. Cleanup fixture-owned snack rows before boarding rows.
- [ ] Apply migration with existing dev/TLS guard. Verify direct claim insert without boarding, cross-company/trip insert and duplicate insert fail with FK/unique constraints; do not relax grants for tests.
- [ ] Implement one guarded transaction: validate role/IDs; lock via boardingRepo.authorize then lockPassenger; recheck eligible passenger; boarding SHARE required; existing claim or DB-clock insert. Use lock_timeout5s/statement_timeout15s, safe DomainError mapping. Access guard must precede existing claim return.
- [ ] Add barriers: hold claim locks then start assignment revoke, claim commits before revoke and next retry denies; hold actual revoke writer's trip UPDATE lock then queue claim, release revoke and assert forbidden/no event. For board/claim order, hold board after passenger lock then queue claim and expect success after board commit; hold claim after passenger lock before boarding exists, queue board, release claim and expect validation/no claim then explicit retry succeeds. Bound gates with finally-release; don't use unbounded sleeps.
- [ ] Add second valid crew and Promise.all claim test: identical claim ID/actor/time, exactly one alreadyClaimed=false and one=true; disabled membership/assignment rejects retry. Force repository insert to write then throw and verify rollback zero rows.
- [ ] Run validation + snack integration + existing boarding files serially; require zero failures, then commit Task 1 only.

### Task 2: Minimum snack read state

**Files:** Modify `modules/boarding/{types,repository,ui-state}.ts`, `tests/unit/boarding-minimum.test.ts`, `tests/integration/{boarding-manifest,snack-claim}.test.ts`; update existing profile fixtures in unit tests for the added nullable property.

**Interfaces:** Add `snack:{claimedAt:string}|null` to PassengerProfile and ManifestView passenger rows. Boarding repository left joins snack by ticket/trip/company and returns claimedAt only; `manifestPassengers()` preserves that minimum state. Claim service response remains Task 1's record; list/profile reads do not expose actor metadata.

- [ ] Write RED: manual profile equals QR-resolved profile with snack null before claim and original timestamp after claim; Admin manifest same timestamp; read/resolve creates no claim; projection excludes claim actor/company IDs and QR/PII fields.
- [ ] Implement scoped LEFT JOIN and explicit projection; no global snack list, decrypt or broad TicketView. Preserve existing boarding fields/counters and adjacent rows.
- [ ] Run minimum-projection unit, manifest/snack DB files; update affected fixture objects and run full unit suite/typecheck. Require zero failures and commit Task 2.

### Task 3: Separate verified-session action and snack button

**Files:** Create `app/crew/snack-{action-core,actions}.ts`, `app/crew/components/snack-form.tsx`, `tests/unit/{snack-actions,snack-ui}.test.ts`. Modify `app/crew/components/{passenger-profile,manifest-list,qr-scanner}.tsx`, `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx`, `modules/boarding/ui-state.ts`, and `app/globals.css` only if existing form styles need a scoped extension.

**Interfaces:** `createSnackActions({getActor,claim}).claim(tripId,unknown)` returns `{ok:true,result:{claim,alreadyClaimed}}|{ok:false,message}`. Server `claimSnackAction(tripId,input)` obtains verified user, fixed CREW role then domain validates membership. `SnackForm({tripId,profile,onClaimed?})` renders state and invokes claim only on explicit submit. `applySnackToCurrentProfile(current:PassengerProfile|null,claim:SnackClaim)` updates only matching ticketId, mapping claimedAt minimum.

- [ ] Write action RED: session actor wins over forged input; unauthenticated/malformed input never mutates; general safe error; pre-board validation message. Write UI/helper RED: disabled before boarding, enabled after boarding, claimed timestamp/no second button, pending double-submit gate, retry after failure and old-response guard for null/mismatched profile.
- [ ] Implement action wrapper and form using existing submission gate, 44px controls, keyboard/focus/aria-live and WIB formatter. Exact copy: **Snack belum diserahkan**, **Serahkan snack**, **Mencatat…**, **Snack sudah diserahkan**. Do not optimistically mark success.
- [ ] Add SnackForm to manual and QR profile; QR callback uses functional ticket-ID guard. Boarding response enables snack on the same profile; manual route refresh obtains updated boarding. Shared profile/manifest display snack state/time; Admin gets no mutation control. Preserve camera controller and scan-read-only behavior.
- [ ] Run snack-action/UI and scanner/boarding units, full units, typecheck/lint/build; expect zero failures. Confirm dynamic routes/worker remain bundled. Commit Task 3.

### Task 4: Evidence, final review and integration

**Files:** Create `docs/setup/SNACK_CLAIM_SETUP.md`; update approved spec/plan status, `docs/seatpax/{00_INDEX,08_TICKET_QR_MANIFEST,09_END_TO_END_FLOWS,10_DATA_MODEL_DATABASE,11_API_PROJECT_STRUCTURE,19_DECISION_LEDGER}.md`.

- [ ] At execution start read using-git-worktrees, inspect attached worktrees, reuse suitable managed checkout from integrated main on `codex/snack-claim`; preserve ignored env without printing. Check current dependency baseline and dirty main file hash. Keep preview tied to attached worktree.
- [ ] Run full unit/DB suites serially with existing TLS CA, plus typecheck/lint/build; record exact counts, duration and any failures/reruns. Cleanup only generated fixture UUIDs.
- [ ] Start preview. If browser surface/auth is available, human logs in and explicitly selects a demo ticket; verify before-board state, explicit snack claim and reopen timestamp, Admin read-only, keyboard/390px. No OTP automation/mass claim. Physical camera/phone acceptance remains separate if unavailable; don't broaden webhook tunnel.
- [ ] One focused Luna medium reviewer checks whole diff/spec/plan, access/races/minimum data/UI callbacks; fix material findings with RED→GREEN regression and rerun affected checks.
- [ ] Record evidence and pending manual checks, commit docs, perform authorized local integration into main and rerun merged units/typecheck/lint/build while preserving original dirty next-env bytes. No push/deploy; keep active preview worktree attached.

## Self-review and execution handoff

All spec requirements map to Tasks 1–4, and the five Review Focus cases have explicit tests. Nullable `snack` shape is consistent across read projections and UI; internal claim preserves actor/time while operational reads do not leak actor identity. No unresolved product policy or placeholder remains. Worktree preparation in Task 4's first step is a prerequisite before Task 1, not an instruction to prepare isolation after implementation. Native inline execution preference is preserved; this plan awaits user approval before any implementation.
