# Super Admin: company list and status control

Date: 9 October 2026. Status: conversational design approved by user; written spec awaits review. This document does not authorize implementation or migration.

## Intent and scope

Provide the seeded Super Admin with an application page to list existing PO companies and explicitly activate or suspend them. This completes the retained platform administration slice before the separate visual design phase. Manual browser acceptance is deferred at the user's request while they are in a meeting.

Authority: docs/seatpax/00_INDEX.md, active 02_MVP_SCOPE.md, 03_ROLES_RBAC_AUTH.md, 19_DECISION_LEDGER.md and adopted 2026-10-06-foundation-design.md. SEATPAX_SPEC_REVIEW recommendations remain pending unless already adopted. Suspension policy reuses the adopted foundation; this slice does not redefine fulfillment or tenant access.

Excluded: company creation/onboarding, invitations, role/membership editing, deletion, tenant operational fallback, platform analytics, passenger data, new payment/refund rules and visual redesign. The uploaded Seatpax logo is a reference for the later design phase; asset conversion/adoption is not part of this slice.

## Approach and application boundary

Use a dedicated /super-admin/companies page and verified-account link. It clearly exposes platform controls to active global SUPER_ADMIN membership only. Existing Admin PO and crew navigation remain role-specific. An Admin PO dashboard section would mix platform and tenant controls; a broad administration suite would exceed active scope.

Create modules/company with validation, repository and service; business authorization and transitions stay inside its transactions. The server action verifies the session, passes only its user ID, and validates untrusted input. React renders the list and explicit confirmation. No new dependency is needed.

## Authorization and minimum data

Every list request and mutation checks a fresh ACTIVE membership with role SUPER_ADMIN and company_id NULL. A client role flag, metadata, tenant membership, known company UUID or stale page grants no authority. Mutation authorization holds the matching membership FOR SHARE until commit so disabling access serializes against an in-flight change. A request after membership revocation commits is denied, even for a no-op/retry. Super Admin status controls grant no implicit tenant route/trip/manifest/payment access.

List projection: company id, name, slug, status, statusRevision and updatedAt, sorted by name then id. No users, email, phone, booking/QR/payment secrets or tenant operational joins. Server failures return safe messages; unauthenticated page redirects to login, unauthorized page is denied without company data. The account navigation checks current global membership and exposes the dedicated link, but the destination and action independently authorize.

## Status transition and concurrency

Input: company UUID, target ACTIVE or SUSPENDED, expected nonnegative integer statusRevision. Actor, audit fields and timestamps are stripped from browser input.

One transaction: validate input and verified actor; set local lock_timeout 5s and statement_timeout 15s; lock active global membership FOR SHARE; lock target company FOR UPDATE; check expected revision; perform transition and insert audit atomically. No inventory/trip/booking bulk update or nested transaction.

Add status_revision integer NOT NULL DEFAULT 0 with nonnegative check to companies. Only an actual status change increments it by one and updates updated_at from database clock. A stale expected revision conflicts, including a changed-then-restored status; return a safe instruction to refresh rather than silently overwrite. If the current revision matches and status already equals the target, return the current state as an unchanged result with no audit/revision increment. A network retry with an old revision can conflict; refreshing reveals the committed state and never duplicates an audit event. Two simultaneous changes from one revision allow at most one transition; the other request must refresh.

Lock ordering is global membership SHARE → company UPDATE. Existing publish/hold/initiation writers lock company SHARE before checking sales eligibility. If a sale writer holds that lock first, it can commit before suspension; suspension waits. If suspension commits first, a queued sale rechecks SUSPENDED and fails. This is commit-order semantics, not a retroactive cancellation. The service does not retry deadlocks silently.

## Suspension and reactivation policy

SUSPENDED blocks new trip publication, new holds and new checkout initiation. A previously initiated valid payment flow can still reconcile and fulfill according to existing deadline/occupancy rules. Existing tickets remain readable and assigned crew can perform boarding/snack; tenant source management retains its adopted behavior. Suspension does not revoke memberships, cancel bookings/trips, delete holds, alter fares or issue refunds.

ACTIVE restores sales eligibility only where existing trip/time/source guards allow it. It does not reopen expired holds, terminal bookings/payments or closed sales windows. No bypass of confirmation/conflict guards is introduced.

## Audit storage

Migration 0010_company_status_control adds company_status_events with UUID/default, company FK RESTRICT, actor users FK RESTRICT, from_status, to_status, resulting status_revision and database-clock changed_at. Constrain ACTIVE/SUSPENDED, require from_status != to_status and revision > 0; UNIQUE(company_id,status_revision) prevents duplicate audit identity. The event records each real transition, with actor from the verified session. No free-form sensitive metadata or new reason-entry policy is added. Status update and event insert roll back together if either fails.

Enable RLS and revoke anon/authenticated grants on the new audit table. Existing companies remain protected by their current grants and guarded services. Mirror migration in Drizzle schema and ordered journal. Update only fixture-owned cleanup for audit FK ordering; do not delete demo companies/accounts. No browser audit update/delete endpoint exists. Audit-list UI is deferred; recording remains mandatory.

## User interface

Existing page shell and accessible components provide a small company list with name, slug and textual status badge. ACTIVE rows offer Suspend; SUSPENDED rows offer Aktifkan. No company creation button or unrelated metrics.

Confirmation names the selected PO and explains the action: suspension stops new sales while existing tickets and initiated payments continue under their existing rules; activation restores eligible sales. Both actions require explicit confirm; cancellation changes nothing. Pending disables repeated submission; success uses the server-returned status/revision. Errors preserve the displayed row and provide retry/refresh guidance. No optimistic success. A revision conflict reloads current list state and requires a new explicit decision rather than resubmitting stale data.

Use 44px targets, visible focus, keyboard-operable confirmation, labelled controls and aria-live result messages. Reuse existing colors/layout; substantial typography, spacing, logo and component polish belong to the subsequent design phase. Empty, access-denied and network-error states must be understandable.

## Verification and delivery

Automated tests target behavior: active global Super Admin access versus anonymous/disabled/tenant roles; stripped forged actor fields; minimum list projection; transition audit and database time; unchanged no-op; stale/ABA conflict; concurrent transitions; rollback after audit failure; access-revocation orderings; suspension/sales lock order in both directions; initiated payment/existing ticket operations remain valid; reactivation does not resurrect expired resources. Use real database fixtures/services for lock and FK/RLS assertions, unit tests for parsing/action and rendered UI states. Never relax browser grants for testing.

Use isolated managed worktree, preserve main's existing dirty next-env.d.ts and ignored secrets/remote attachment files. Run full unit/database regression, typecheck/lint/build before completion; one focused final reviewer GPT-6 Luna medium, primary implements inline. Local integration to main follows the established authorized workflow; no push/deploy or demo-status mutation during testing.

Manual acceptance remains explicitly pending: human login as the seeded Super Admin, select a demo PO, confirm suspend/activate, check fresh-session role denial, keyboard and narrow-width presentation. No authentication/OTP automation. The implementation can be completed with automated evidence while these manual checks are separately recorded.

## Self-review and next gate

No unresolved product policy or placeholder remains. Existing suspension semantics are preserved; revision/audit are technical protections for the approved status controls. No company lifecycle, membership, financial or visual scope is expanded. Written-spec approval is the next gate; afterwards write and review the implementation plan before product code or migration.
