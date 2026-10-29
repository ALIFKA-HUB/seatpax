# Helpdesk domain stabilization — 29 October 2026

## Goal
Complete the approved Helpdesk domain slices P03a, P03 pagination, and P05 using bounded, company-scoped reads and truthful retry feedback.

## Scope
- `modules/helpdesk/staff.ts`: normalize list pages, report retry scheduling only when an eligible row updates, and expose typed dashboard counts/queue/recent cases/events.
- `app/helpdesk/actions.ts`: drain mail only when a job was actually queued; report stale/nonretryable jobs truthfully.
- Focused unit tests for normalization, retry outcomes/action behavior, dashboard access boundary, counts, ordering, limits, and data projection.
- This evidence file records the implementation and checks.

## Dependencies
Existing Helpdesk authorization transaction and persistence only. No schema, provider, dependency, or UI changes. Dashboard ranking follows the accepted builder choice: HIGH, unset, MEDIUM, LOW; oldest first, then ID.

## Checkable completion criteria
- Invalid pages normalize to finite integers in 1..10000; fractions floor.
- Retry returns whether an eligible company-owned FAILED job was updated; no-op does not drain unrelated jobs or claim success.
- Dashboard uses authorized `staffTransaction`, returns all four company status totals, bounded queue/recent/events, deterministic ordering, and no contact/evidence fields.
- Focused unit tests observe expected SQL projections and reject unauthorized access; typecheck and scoped test command pass.

## Domain stabilization — 29 October 2026

Implemented P03a/P03 pagination and P05 domain reads within the approved Helpdesk scope. `retryMail` now returns whether `UPDATE ... RETURNING` changed an eligible company-owned FAILED job. The server action reports a no-op as not queued and does not invoke the delivery worker in that case. The existing worker still handles prompt delivery only after a retry is actually queued.

`normalizeHelpdeskPage(value)` accepts string/number input, falls back to page 1 for malformed or non-finite values, floors fractions, and clamps to 1–10000. Staff list offset uses this shared helper.

`staff.dashboard(ctx)` reuses the existing read-only staff transaction and company authorization. It returns all four status counts; at most six waiting reports ordered HIGH, unset, MEDIUM, LOW, then oldest and ID; six newest cases; and six newest persisted events joined through company-owned cases. Dashboard projections contain no reporter contacts, description, booking reference, or attachment metadata. No schema, provider configuration, or dependency changes were made.

Verification: the focused domain/action unit tests pass (6 tests). They cover malformed pagination, changed-row retry/no-op results, dashboard status defaults, scoped/bounded SQL projections, deterministic queue order, access denial, and ensuring a no-op retry does not drain mail. TypeScript no-emit passed. Scoped ESLint initially found one unused mock parameter; it was corrected and the final focused lint/diff checks are recorded by the coordinating task. No integration DB mutation, provider email, full suite, or live database operation was run in this slice.
