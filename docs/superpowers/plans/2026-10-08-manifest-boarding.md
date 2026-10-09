# Manifest and Boarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Assigned crew can read confirmed passengers and record boarding once through QR or manifest.

**Architecture:** A server-only boarding domain supplies tenant-authorized manifest/profile reads and transactional boarding. One immutable boarding event is the audit record. Camera decoding runs locally; server validates every operation.

**Tech Stack:** Existing Next.js App Router, React, TypeScript, Zod, postgres-js/Drizzle, Vitest; `qr-scanner` 1.4.2 for camera decoding, bundled locally.

**Spec:** `../specs/2026-10-08-manifest-boarding-design.md`, approved by user on 8 October 2026.

## Global Constraints

- Online manifest + boarding only; snack later. No cash, offline sync, no-show, reversal, GPS or reseat.
- Scan only reads; stop selected for boarding must equal ticket origin snapshot.
- Fresh active membership + assigned CREW required for mutation. Same-tenant ADMIN_PO may read only; no Super Admin fallback.
- Company suspension permits existing-ticket operations; pending/conflict bookings absent from manifest.
- QR opaque 43-character base64url token; no tokens/PII in logs or URL. Manifest excludes email, phone, account identity and ciphertext.
- Unique ticket/trip event; original actor/time/source retained on retry. No automatic boarding from camera callback.
- Preserve existing dirty `next-env.d.ts` and ignored credentials. No push/deploy. Primary implements inline; one final reviewer GPT-6 Luna medium with focused fork, as requested.

## Review Focus

1. Camera start resolves after component unmount: stop/destroy stream, never update unmounted state (Task 3).
2. Access revoked while profile is open: mutation denied and no event written (Task 2).
3. Adjacent intervals share seat code: manifest retains separate tickets and counts (Task 1).
4. Pending HTTP retry or two crew actions: exactly one event with unchanged actor/time (Task 2).
5. Malicious QR contains URL or oversized text: reject locally/server-side, no navigation/echo (Task 3).

### Task 0: Finish checkout dependency and isolate work

**Files:** Existing checkout setup/plan docs and `lib/env/payment.ts`, `tests/unit/payment-env.test.ts` on `codex/checkout-payment`; no boarding code yet.

- [x] Collect final result of existing DB test session, inspect current branch/status and commits; record actual Sandbox screenshots: confirmed booking, QR detail and My Tickets. Keep mobile/second-session evidence explicitly pending.
- [x] Commit outstanding checkout fix/docs after typecheck, lint, build, full unit/integration checks; finish approved local checkout integration while preserving main's dirty file bytes. No fabricated test counts or silent removal of failures.
- [x] Use using-git-worktrees to create/reuse attached isolation from integrated main on `codex/manifest-boarding`; copy ignored env only as needed without printing secrets. Include this spec/plan and repository instructions.

### Task 1: Immutable boarding schema and authorized reads

**Files:** Create `drizzle/0008_manifest_boarding.sql`, `modules/boarding/{types,repository,service}.ts`, `tests/integration/boarding-manifest.test.ts`, `tests/integration/helpers/boarding-fixture.ts`; modify `lib/db/schema.ts` and `drizzle/meta/_journal.json`. Adapt migration number if an existing migration already uses 0008. Execution inspection confirmed the existing migrator reads `drizzle/`.

**Interfaces:** `BoardingActor={userId:string;role:'CREW'|'ADMIN_PO'}`. `BoardingRecord={id,ticketId,tripId,stopId,actorId,source:'QR'|'MANIFEST',boardedAt:string}`. `PassengerProfile={ticketId,name,seatCode,fromStopId,fromSequence,fromName,toName,tripName,vehicleName,plateNumber,departureAt,boarding:BoardingRecord|null}`. `ManifestView={tripId,companyId,tripName,departureAt,capacity,passengerCount,boardedCount,stops:Array<{id,name,sequence}>,passengers:Array<{ticketId,name,seatCode,fromName,toName,boarding:{boardedAt}|null}>}`. All unspecified scalar fields are strings except sequences/counts/capacity (numbers).

`createBoardingService(repo).manifest(actor,tripId):Promise<ManifestView>`, `.profile(actor,tripId,ticketId):Promise<PassengerProfile>`, `.resolve(actor,tripId,token):Promise<PassengerProfile>`. Company derived by trip lookup; permission role checked against actual membership.

- [x] Write fixtures using real checkout/confirmation services and isolated UUID resources. Tests: pending excluded; confirmed present; adjacent same-seat passengers length=2; counts separate from capacity; wrong tenant/trip and revoked membership/assignment denied; suspended company allowed; Admin read allowed; no phone/email/token properties; resolve produces zero events.
- [x] Run `npm run db:test -- tests/integration/boarding-manifest.test.ts`; require failure because boarding service/schema absent.
- [x] Add event table UUID PK, composite ticket/trip/company FK (add matching ticket UNIQUE), composite trip-stop FK, actor user FK, CHECK source, UNIQUE(ticket_id,trip_id), DB clock default, RLS and revoked anon/authenticated grants. Match declarative schema. Event itself is immutable audit, avoiding redundant audit table.
- [x] Implement scoped reads joining ticket → passenger → CONFIRMED booking → matching assignment and trip snapshots. Manifest sort seatCode/fromSequence/ticketId, return all eligible trip passengers for client filters; no global list. Reuse hash lookup from ticket repository without calling decrypt or returning broad TicketView containing phone.
- [x] Run migration through existing dev/TLS guard, then targeted test; expect pass. Commit Task 1 files only.

### Task 2: Transactional once-only boarding

**Files:** Extend `modules/boarding/{repository,service}.ts`; create `modules/boarding/validation.ts`, `tests/unit/boarding-validation.test.ts`, `tests/integration/boarding-write.test.ts`.

**Interfaces:** `.board(actor:BoardingActor,tripId:string,input:{ticketId:string;stopId:string;source:'QR'|'MANIFEST'}):Promise<{boarding:BoardingRecord;alreadyBoarded:boolean}>`. No caller-supplied actor/time/company. UUID validation, token exact format and source enum.

- [x] Write tests: wrong-origin stop gives validation error/no event; two valid concurrent crew writes return same ID and timestamp/count=1; retry keeps source/actor; Admin mutation denied; revoked access after profile denied; suspension allowed; rollback leaves zero events. Verify unique event and composite FK with deliberately invalid inserts.
- [x] Run unit/DB targeted tests and capture expected missing board implementation failure.
- [x] Implement locks: active membership SHARE → company SHARE (no active-status requirement) → trip SHARE → active crew assignment SHARE → booking UPDATE → seat assignment SHARE → ticket UPDATE → existing boarding/insert. Ticket lookup for IDs before locking is a hint only; recheck after locks. This matches assignment writer membership→trip UPDATE→crew assignment UPDATE and payment company→trip→booking; boarding never requests inventory locks. Ticket order serializes concurrent writes; revoked actor checked before returning existing event. Use DB timestamp after waits; same stop/trip/company and CONFIRMED booking required.
- [x] Test revocation serialization with barriers: hold boarding lock and start revoke, boarding commits then revoke; reverse order denies board. Bound lock wait tests so a deadlock fails clearly. Treat unexpected deadlock/authorization disagreement as stop-and-debug, not retry masking.
- [x] Run `npm test -- tests/unit/boarding-validation.test.ts` and `npm run db:test -- tests/integration/boarding-write.test.ts tests/integration/boarding-manifest.test.ts tests/integration/trip-crew.test.ts tests/integration/payment-confirmation.test.ts`; all pass. Commit.

### Task 3: Crew manifest, profile and camera scanner

**Files:** Create `app/crew/boarding-{data,actions,action-core}.ts`, `app/crew/trips/[tripId]/manifest/page.tsx`, `app/crew/trips/[tripId]/passengers/[ticketId]/page.tsx`, `app/crew/trips/[tripId]/scan/page.tsx`, `app/crew/components/{manifest-list,passenger-profile,boarding-form,qr-scanner}.tsx`, `modules/boarding/scanner-controller.ts`, `tests/unit/{boarding-actions,boarding-ui,boarding-scanner}.test.ts`; modify crew trip page, Admin trip detail page/navigation for read-only manifest route, `app/globals.css`, package/lock. Add `app/admin/companies/[companyId]/trips/[tripId]/manifest/page.tsx` for Admin read with company URL/context equality validation.

**Interfaces:** Verified-session actions call Task 1/2; `.resolve` accepts token in POST/action body and returns sanitized PassengerProfile. Camera result renders same component as manifest detail, with `source='QR'`; manifest detail uses `MANIFEST`. Scanner controller injects factory exposing `start():Promise<void>,stop():void,destroy():void` to test lifecycle without camera. Source is audit context, not authorization proof.

- [x] Write action tests asserting server-derived actor, malformed/oversized URL QR rejected with no navigation, safe general error, wrong company URL denied. UI tests assert filters/counters separate, manual and QR share profile, scan never calls board, duplicate decoded frames cause one resolve, and pending board prevents double submit.
- [x] Write lifecycle tests: late start after unmount destroys scanner; rejection shows manifest fallback; close/unmount destroys worker/stream; failed resolve allows explicit rescan. Run targeted units and observe missing modules failure.
- [x] Install exact `qr-scanner@1.4.2`; import dynamically only inside client scanner. Bundle worker locally via supported module dynamic import and verify production build worker availability. Use environment-facing camera, start button, stop button, success/error aria-live and >=44px controls. No CDN decoder, QR upload or automatic navigation.
- [x] Implement forms/filter UI, stop selector and shared profile; refresh manifest/profile after successful board. Do not expose phone from existing ticket resolver. Server rechecks access even when UI button remains visible.
- [x] Run targeted unit commands, `npm run typecheck`, `npm run lint`, `npm run build`. Expected zero failures/errors. Commit.

### Task 4: Evidence, review and local integration

**Files:** Create `docs/setup/MANIFEST_BOARDING_SETUP.md`; update spec approval status, this plan, modular `00_INDEX.md`, `08_TICKET_QR_MANIFEST.md`, `09_END_TO_END_FLOWS.md`, `10_DATA_MODEL_DATABASE.md`, `11_API_PROJECT_STRUCTURE.md`, `19_DECISION_LEDGER.md` with adopted stage and evidence.

- [x] Run full unit/integration suites serially with existing TLS CA, typecheck/lint/build. Report exact counts. Preserve fixtures and demo/auth records; cleanup only test-owned UUID data.
- [ ] Start preview and check assigned crew manual manifest/profile/stop/board/retry using explicitly selected demo ticket; don't mark all existing passengers boarded. Check wrong-trip and revoked fixtures, keyboard, 390px, camera-denied fallback. Ask user for authentication/camera permission when tooling requires; no OTP automation.
- [ ] Test actual QR scanning on HTTPS phone if available. Current webhook tunnel exposes POST webhook only; do not broaden it silently. When HTTPS phone is unavailable, record camera test pending while completing automated/manual manifest evidence. Record tool policy/geometry failures honestly.
- [x] One focused final reviewer with model `gpt-6-luna`, reasoning `medium`, fork `none`, receives spec, plan, diff, checks and limitations. Fix findings and rerun affected tests.
- [x] Update docs and commit approved files; integrate locally into main preserving unrelated changes. No push/deployment. Report evidence and remaining camera checks explicitly; leave active preview worktree attached until no longer needed.

## Self-review and handoff

Tasks cover approved scope/access, minimum data, stop matching, audit uniqueness/retries, scanner lifecycle, fallback, suspension and independent verification. Five Review Focus items have explicit tests in Tasks 1–3. Inline execution preference is preserved; subagent override applies to the final reviewer only. User approved execution. Tasks 0–3 are implemented; migration and local dependency installation completed on 9 October 2026. Final review found manifest overfetch and missing revoke-first race coverage; both are addressed with regression checks. Task 4 full database verification passed (18 files / 69 tests). Final targeted regression passed (2 files / 4 tests). Code/docs integrated locally into main; merged unit/typecheck/lint/build verification passed. Physical camera, keyboard and 390px browser acceptance remain pending; see setup evidence.

Scanner reference inspected: https://github.com/nimiq/qr-scanner (local worker, start/stop/destroy lifecycle); pin version 1.4.2 and verify bundling during Task 3.
