# Seatpax source bug audit — 29 October 2026

Target: `C:/Users/ASUS/.codex/worktrees/seatpax-landing/SeatPax`, branch `codex/seatpax-landing`, HEAD `6b84705`. Read-only review. Product logic is treated as frozen; findings below are observations and proposed acceptance tests, not authorization to change behavior.

Parent evidence clarification: the setup documents' blanket pending inbox status is stale. In the 26 October Computer Use session, a receipt was accepted by Resend and the user confirmed it reached alifkaareiga@gmail.com. This proves that one receipt only, not completion/completeness emails or authenticated attachment download. Today's Computer Use run was blocked before testing. The pagination database-error risk below is source-derived and was not reproduced against the hosted database in this audit. The admin-link finding is a navigation-context mismatch; an admin detail route must be explicitly designed/verified before substituting the base into a link.

## Summary

- No high-severity source defect was confirmed in Helpdesk authorization, public tracking privacy, supplementation capabilities, quick-login guards, or the inspected payment/hold transaction paths.
- One low-severity Helpdesk feedback defect is confirmed: the retry action reports success even when its conditional update changes no job.
- External mail inbox and authenticated attachment-download acceptance are documented as pending provider/browser work, not source defects.
- SaaS subscription billing, guest claims, group checkout, real refunds, and other deferred scope are not counted as bugs.

## Confirmed source bug

### P3 — Helpdesk email retry can report success when no retry was queued

- **Evidence:** `modules/helpdesk/staff.ts:12` performs a conditional `UPDATE` for jobs in `FAILED` with retryable error codes, but ignores the affected-row count and returns normally even if zero rows match. `app/helpdesk/actions.ts:8` therefore responds “Percobaan pengiriman dijadwalkan.” for a stale/already-processed job ID.
- **Trigger:** A staff detail page is left open while a worker or another request changes the job out of `FAILED`; the staff member then submits the stale retry action. A repeated request for the same UUID has the same result after a successful first retry.
- **Impact:** The UI claims a retry was scheduled when no job was queued. This can delay staff follow-up because the operator believes delivery recovery is underway. It does not expose data or alter case state.
- **Focused regression test:** Set up a Helpdesk actor and a mail job in `ACCEPTED` (and separately a non-retryable `FAILED` state); call `retryMail`; assert the result distinguishes “not retryable/already changed” from a queued retry. Also retain the existing retry test for a retryable `FAILED` job.
- **Coverage limit:** `tests/integration/helpdesk-workflow.test.ts` covers the valid failed-configuration retry, but not zero-row/stale-state outcomes. No change was made.

## Suspicions checked; not confirmed as bugs

- **Public tracking privacy:** `modules/helpdesk/service.ts:11` queries only title/category/status/priority/timestamps/public request/outcome, and `publicCase` in `modules/helpdesk/validation.ts:13` constructs a fixed projection. The integration workflow test asserts contact, original description, and booking reference do not appear. No source leak found in this path.
- **Staff authorization:** `modules/helpdesk/repository.ts:3` rechecks active company membership inside the transaction; it allows Helpdesk writes and Admin PO read-only monitoring. Attachment download uses `helpdesk.read` and a company-scoped lookup. Existing Helpdesk access/integration tests cover disabled and foreign staff plus browser table privileges.
- **Supplement capability:** The track code is separate from the HMAC-backed grant; supplementation locks the case/grant, verifies case/status/digest, consumes the grant, and handles request-key replay. No bypass found in the inspected service.
- **Quick login:** `modules/auth/dev-login-policy.ts:12-18` requires development mode, explicit opt-in, the configured development Supabase project, and loopback host; `quickLoginAllowed` additionally requires exact same-origin. `tests/unit/auth-dev-login.test.ts` passed these host/environment/origin guard cases. No production exposure found in source.
- **Payment/hold spot check:** The reviewed confirmation flow checks provider order, amount, currency and merchant; serializes inventory changes through `inventoryTransaction`; rechecks overlapping assignments/holds before confirmation; and issues the ticket in the confirmation transaction. Manual conflict resolution rechecks trip/company eligibility. No defect was confirmed in this limited source pass.

## Deferred acceptance and coverage limits (not bugs)

- The approved Helpdesk setup record explicitly leaves real inbox delivery and authenticated staff attachment-download/browser acceptance pending. These require configured provider credentials and a real authenticated browser path; current source audit did not perform network/provider actions.
- Existing checks are strongest for module-level rules and database workflow. UI automation was assigned to another agent and is outside this audit. No test suite beyond the focused existing checks was run.
- This was a focused source pass, not a full security review, hosted integration run, or exhaustive payment-provider contract verification. The spec review also says current provider mapping requires official contract verification at integration time.

## Verification performed

- `npm run typecheck` — passed (`tsc --noEmit`, no diagnostics).
- Focused Vitest run — 4 files passed, 9 tests passed. The command named five paths; only four corresponding files exist/ran, so this result does not claim coverage for a nonexistent capabilities test path.
- No source or test files were changed. Typecheck updated generated `next-env.d.ts` references to `.next/dev/types`; this workspace change should be reviewed separately before cleanup because the checkout is shared.

## Proposed focused goal

Parent final verification: full `npm test` completed successfully, 82 files / 312 tests, 135.63 seconds, exit 0. `git diff --check` passed. These existing assertions do not cover the newly identified stale-retry, monitoring-context and malformed-page gaps and do not replace actual provider/device/browser acceptance. No fix was applied.

**Goal:** Make Helpdesk mail retry feedback accurately reflect whether a retry was actually queued.

**Acceptance:** A retryable failed job returns queued/success; an accepted, unknown, or non-retryable job returns a clear no-op/conflict result; the server action shows matching feedback; tests cover both branches and retain existing recovery behavior. This is a presentation/recovery feedback correction; it must not change complaint or payment policy.

## Additional confirmed low-priority gaps

### P3 — Admin monitoring complaint links leave the admin route

- **Evidence:** `app/admin/companies/[companyId]/helpdesk/page.tsx:5` passes an admin URL as `base` to `CaseList`, but `app/helpdesk/components/case-list.tsx:5` hardcodes each row link to `/helpdesk/${id}`. The Admin PO is still authorized for read-only detail, so this is not a data-access bypass; it leaves the admin monitoring context and lands in the global Helpdesk workspace.
- **Trigger/impact:** An Admin PO opens Pesanan > Pengaduan pelanggan and selects a case. The case page is shown under `/helpdesk/...`, rather than the corresponding admin route. This can confuse navigation and requires returning to admin manually.
- **Focused regression test:** Render/use the list with an admin `base` and assert both row and pagination links remain under that base; verify staff list retains `/helpdesk/...` paths.

### P3 — Malformed/deep page query can fail or disagree with displayed page

- **Evidence:** `app/helpdesk/components/case-list.tsx:5` accepts any numeric `page` via `Number()` and displays it without integer/range normalization. `modules/helpdesk/staff.ts:9` clamps the supplied page to 10,000 but does not round it before calculating SQL OFFSET.
- **Trigger/impact:** A direct URL with `?page=1.5` can send a fractional SQL OFFSET and fail the query. A URL above `?page=10000` is clamped for the DB query while the UI still reports/links from the larger page, so pagination can repeat the same database slice. This needs an unusually edited URL or very large dataset; low priority.
- **Focused regression test:** Exercise page values `1.5`, negative, empty, and `10001`; require integer normalization, a stable displayed page, and deterministic SQL offset behavior.

### Documentation drift — README describes delivered foundations as absent

- **Evidence:** `README.md:7,18,48` says login/session refresh and domain tables/booking/payment have not been implemented, while source includes OTP actions (`app/login/actions.ts`), booking modules (`modules/booking/`), payment modules (`modules/payment/`), and current scope/setup evidence. The README also refers to a state before hosted Supabase verification, which conflicts with current setup evidence.
- **Impact:** A developer following the README can misunderstand the current implementation and repeat setup or assume core flows are missing. This is documentation drift, not a runtime defect.
- **Focused acceptance:** Reconcile README status and setup links against current scope and latest setup evidence; preserve explicit caveats for anything still pending.
