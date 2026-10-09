# Snack claim setup — 9 October 2026

## Contract and runtime

Assigned active CREW explicitly records one snack handover per boarded ticket/trip. Current membership and trip assignment are checked on every request, including retries. Confirmed booking, matching passenger/seat assignment and ticket are required. Suspended-company existing-ticket operations remain permitted. Admin PO sees snack state but has no claim control. Scanning only resolves the passenger profile.

Migration `0009_snack_claims.sql` was applied using the existing guarded development migration command with verified TLS. It adds database-clock claims, unique ticket/trip identity, composite ticket and boarding foreign keys, RLS and revoked browser-role grants. The existing boarding identity receives a matching unique constraint. The service locks membership, company, trip, assignment, booking and ticket before checking boarding and existing claim; it adds no inventory lock or nested transaction. No update/reversal endpoint exists.

No new dependency or credential is needed. Keep existing ignored environment files and ticket encryption configuration stable.

## Interface

Manual passenger profiles and QR-resolved profiles contain a separate **Serahkan snack** action. It is disabled before boarding and while submitting. A completed claim displays **Snack sudah diserahkan** with the original WIB timestamp and no second button. Network failure offers explicit retry; success is never optimistic. A late QR claim response cannot replace the next ticket's profile. List/profile snack payloads contain only `claimedAt`, excluding the claim actor and tenant metadata.

Stock, quantity/package configuration, offline synchronization, cash and reversals are outside this slice.

## Verification log

- Baseline: 44 unit files / 191 tests passed.
- Validation, action, minimum projection and form tests observed missing implementation / missing state RED, then GREEN.
- Current local checks: 47 unit files / 199 tests passed; typecheck, lint and production build passed.
- Initial combined DB run: 7 passed / 1 failed. The test created a new booking after suspending its company; the sale guard correctly rejected that setup. Booking creation was moved before suspension.
- First retry failed at DNS (`ENOTFOUND`), before reaching the database. The endpoint resolved again without credential/configuration changes.
- Targeted snack + existing manifest: 2 files / 5 tests passed, 97.81 seconds. Earlier existing boarding-write/manifest tests also passed in the initial combined run.
- Additional integration assertions now cover read-only QR/manual resolution before claim, original post-claim timestamp in both profiles and Admin manifest, and actor-free snack projection. Full regression result is recorded below when complete.
- One focused GPT-6 Luna / medium reviewer found no material implementation issue. Its noted read-projection coverage gap was addressed with the additional assertions.

## Pending manual acceptance

No physical camera, keyboard or 390px browser success is claimed by automated tests. Login requires the human user. In the preview, open one explicitly selected demo passenger as assigned crew, check the disabled pre-board action, record boarding, then explicitly record snack and reopen the profile. Check the original timestamp and Admin read-only state. Do not mass-claim demo passengers. Existing payment notification tunnel remains POST-only and is not a phone preview.

Local integration completed on 9 October 2026 (merge 2cfa8b4). Merged main passed 47 unit files / 199 tests, typecheck, lint and production build. Original next-env.d.ts bytes were restored and verified unchanged. Preview remains running from the attached worktree on port 3001. No push/deployment; manual acceptance remains pending.
Preview was restarted from the new production build on port 3001; server reported Ready. Current browser inventory contains no Seatpax tab/session, so authenticated visual/manual checks remain pending.

### Final regression and review

Full serial hosted database regression passed: 19 files / 73 tests, 703.10 seconds, zero failures, including the added QR/manual/Admin read assertions. The reviewer rechecked those assertions and reported no residual concrete coverage gap. Latest full unit suite remains 47 files / 199 tests passed; typecheck, lint and production build passed. All existing dynamic passenger/Admin/crew routes remain bundled.

Execution order deviation: local projection/UI work continued while DNS was unavailable, and implementation is shipped as one feature commit after full verification instead of separate task commits. The scope and contracts are unchanged. Manual camera/keyboard/390px acceptance remains pending.

