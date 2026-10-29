# Seatpax UI and Stabilization Roadmap

> **For agentic workers:** Use superpowers:executing-plans or superpowers:subagent-driven-development for each approved implementation package. The user authorized autonomous completion of P02–P11 on 29 October with “lanjut aja sampai selesai … pecah jadi beberapa agent”. Read each linked design and create a focused implementation plan before substantial UI work.

**Goal:** Finish the existing single-company Seatpax experience through UI refinement, reproducible flow testing and separately approved bug fixes.

**Architecture:** Keep existing Next.js screens, domain services and company-scoped permissions. Reuse the current brand and business logic. Database/provider mutations are not implied by a UI task.

**Tech Stack:** Existing Next.js/React/TypeScript, Vitest, Supabase/Postgres, Midtrans Sandbox and Resend.

**Spec:** `docs/seatpax/02_MVP_SCOPE.md`, `docs/seatpax/19_DECISION_LEDGER.md`, `docs/seatpax/13_UI_UX_DESIGN.md`; Helpdesk preview specification `docs/superpowers/specs/2026-10-27-helpdesk-workspace-refresh-design.md`.

## Global constraints

- User instruction on 29 October: preserve existing product behavior; desired changes are UI. The audited P03 bug fixes are included in this authorization; preserve product policies.
- Keep original Seatpax logo, white/blue/navy/blue-grey palette. Responsive desktop/tablet/phone; preview before application implementation for material design changes.
- No active SaaS scope, subscription billing, marketplace, extra staff roles, live chat, automated refund or destructive fixture cleanup.
- Flutter Crew is an earlier adopted future direction, not delivered and not automatically activated by this roadmap. Keep current Crew web usable; mobile implementation is outside this UI-only batch.
- Keep login testing shortcuts development-only. Do not weaken actual server authorization or private complaint evidence access.
- Do not copy fake preview data, dates, abbreviated complaint IDs or static counts into runtime pages.
- Task ACC authorizes its stated scope, verification, meaningful commits and push once checks pass. The subsequent explicit autonomous instruction authorizes this batch, its checks, commits, pushes and integration; incomplete external acceptance stays visible.

## Initial audit evidence, 29 October 2026 (historical baseline)

- Analysis/runtime baseline: `codex/seatpax-landing`, HEAD `6b84705` before audit documents. Main checkout HEAD `689836f`.
- Successful `git fetch origin`: local main is 175 commits ahead of origin/main (`08a3075`); landing is a descendant of main with another 36 commits. These are separate local/remote/integration states, not 211 new features.
- Main and landing have a pre-existing modified `next-env.d.ts`; main also has untracked remote attachments. Do not stage/revert those incidentally.
- Existing implementations: operational setup, trip snapshots, segment inventory/hold, logged-in SELF/OTHER checkout, Midtrans Sandbox, tickets/QR, Crew web manifest/boarding/snack, public complaint forms and staff handling. Presence in code is not current end-to-end acceptance.
- New Helpdesk dashboard/sidebar was approved visually in the conversation, but is still a standalone preview. Existing application is list-first. Its written design still needs confirmation for implementation.
- README is stale: claims login/booking/payment are unimplemented despite actual modules. Setup documents contain historically pending acceptance, not a fresh release status.
- No `.github` CI workflow directory exists in this baseline. UI browser scripts depend on an external `PLAYWRIGHT_MODULE`/installation; they are not proof Computer Use passed.
- Computer Use worker requested and spawned with GPT-6.1 Terra, medium. Tool stopped before first browser navigation because it could not reliably determine the browser URL for policy enforcement. All intended UI flows remain UNTESTED in this audit. Do not bypass that stop or substitute an automated browser result as Computer Use evidence.
- Fresh verification on the landing worktree: `npm run typecheck` passed; focused tests 4 files / 9 assertions passed; parent `npm test` completed with 82 files / 312 tests passed in 135.63 seconds, exit 0. `git diff --check` passed. No fresh build, full lint, hosted integration or browser/device acceptance is claimed. Generated `next-env.d.ts` remains a separately tracked pre-existing workspace change.
- Earlier 26 October session: real test report created, public status and authenticated Helpdesk listing/details observed; Resend accepted receipt and user confirmed inbox. Full supplementation/completion and private download were not accepted; IDM expiry intercepted download. This is historical limited evidence.

## Autonomous delivery outcomes — 29 October 2026

- P02: attempted again by GPT-6.1 Terra, medium; Computer Use blocked by unavailable coordinate geometry. No real flow pass claimed. See `docs/setup/FLOW_ACCEPTANCE_2026_10_29.md`.
- P03–P06: implemented retry feedback, bounded dashboard reads, page normalization, monitoring-context links and the approved Helpdesk shell/dashboard/list/detail design. See `docs/setup/HELPDESK_DOMAIN_2026_10_29.md` and `docs/setup/HELPDESK_UI_REFRESH_SETUP.md` for checks and limits.
- P07–P09: bounded responsive/source audit completed; actual public routes checked at five widths. No confirmed customer/admin/Crew CSS defect justified a runtime change. Authenticated setup, physical phone/camera and full interaction criteria remain pending, so these packages are not fully accepted. See `docs/setup/RESPONSIVE_AUDIT_2026_10_29.md`.
- P10: fresh provider/inbox/private-download and complete booking/complaint lifecycle acceptance remain pending. Unit tests and historical receipts do not replace these checks.
- P11: non-secret CI checks and a demo checklist added. Hosted CI and final verification results are recorded in the delivery report; deployment is outside this task.

## Review focus

1. Known-ID access and role changes: denied callers must never gain private report, ticket, attachment or Crew write access.
2. Refresh/back/double-submit and stale revisions: preserve existing idempotency, status and inventory contracts.
3. Empty data, long identifiers, unassigned priority, invalid filter/page input: truthful zero/results and recoverable errors without clipped UI.
4. Provider delay and connectivity loss: separate pending payment/email acceptance from actual settlement/delivery; no fake success.
5. Device and input differences: keyboard focus, touch, phone camera and mobile Safari must be explicitly checked or marked untested.

## Approval and delivery procedure for EVERY task

- [ ] User ACC recorded by task ID and exact deliverable, including any design decision needed.
- [ ] Inspect current branch/files and keep unrelated edits out of the task.
- [ ] Implement only the approved package. For actual logic defects: focused regression fails before fix, passes after.
- [ ] Complete task-specific acceptance and record observed versus untested results.
- [ ] Review staged diff for accidental changes, credentials, attachments and fixtures.
- [ ] Create a meaningful task commit; split only independently reviewable work. No empty commits, artificial timestamps, author rewrites or commits manufactured for contribution count.
- [ ] Push the approved branch and verify the remote SHA. Report branch, commit and check results. No force push.
- [ ] Integration into main is an explicit step: use the approved integration task, preserve original history and rerun appropriate checks before updating main. Failed checks/push are reported and never labelled completed.

GitHub commit contribution eligibility depends on a linked author email and default/gh-pages branch, not push frequency. Feature-branch backup is useful but is not a promise of contribution credit until eligible integration. Preserve truthful attribution. Official reference: https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference.

## Task queue

### P01 — Reconcile branch history and publish the existing baseline

Status: **complete, 29 October 2026**. User ACC received. Baseline publication was finalized at `249eec3` on landing/main and remote SHA equality verified. See `docs/setup/BASELINE_PUBLICATION_2026_10_29.md` for tests, build workaround and excluded local edits. P02–P11 were subsequently authorized as one autonomous batch; current delivery outcomes are recorded below.

**Goal:** Make GitHub reflect the actual approved application without losing existing history.

**Scope/files:** Git graph/status/remotes, tracked tree/history secret review, `README.md`, existing setup evidence. No SaaS branch integration.

**Criteria:**
- [ ] Confirm main/landing ancestry and exact unpublished range against fresh origin; inspect local-only content and commit metadata without printing secrets.
- [ ] Check tests/type/lint/build on the candidate baseline. Review excludes .env.local, local evidence files, remote attachments, generated files and deferred billing/free branches.
- [ ] Update README to actual role/route/start/setup and known-limit status, distinguishing development quick login from production auth.
- [ ] Once task ACC covers the reviewed historic range, push the landing branch, integrate approved landing into main without rewriting history, verify checks and remote refs. Stop if current graph differs or contains unintended content.

**Dependency:** First delivery step before routine per-task publishing; does not require adding features.

### P02 — Restore actual Computer Use flow verification

**Goal:** Obtain reliable observed pass/fail coverage of the existing app.

**Scope/files:** `docs/analysis/2026-10-29-computer-use-flow-audit.md`, `docs/setup/evidence/`; current desktop browser and known local server.

**Criteria:**
- [ ] Tool can reliably identify URL; confirm served worktree/revision before testing. If blocked, preserve UNTESTED status and record exact blocker.
- [ ] Observe public landing, guest complaint create/check validation, customer/staff login destinations and denied routes, Helpdesk priority/completeness/process/complete, private attachment handling.
- [ ] Use clearly marked test data and only user-approved notification recipients; no real payment or destructive cleanup.
- [ ] For each flow record precondition, steps, expected/actual, evidence and pass/fail/blocked. A browser-emulated width is not physical-device acceptance.

**Dependency:** Working Computer Use runtime. Requested worker model: GPT-6.1 Terra, medium. No unsafe tool-policy bypass.

### P03 — Fix Helpdesk retry feedback, navigation and pagination defects

**Goal:** Show truthful email retry feedback, keep monitoring context and handle malformed page input consistently.

**Scope/files:** `app/helpdesk/actions.ts`, `app/helpdesk/components/case-list.tsx`, `modules/helpdesk/staff.ts`, Helpdesk list callers and focused unit tests; review report `docs/analysis/2026-10-29-source-bug-audit.md`. These three findings can be accepted and delivered as independently reviewable P03a/b/c commits.

**Criteria:**
- [ ] P03a: retryable FAILED mail job reports queued; stale/ACCEPTED/unknown/nonretryable job does not claim a retry was scheduled. Check affected rows and map domain result to action feedback; do not widen email delivery scope or drain unrelated jobs.
- [ ] Reproduce hardcoded detail links ignoring admin monitoring context; define expected safe destination under the existing admin/read-only boundary before changing links. Do not assume an admin detail route already exists.
- [ ] Normalize page once as a finite integer in 1..10000; UI/query/SQL offset and previous/next links agree for missing, negative, fractional, nonnumeric and excessive values.
- [ ] Boundary tests fail before and pass after fix; preserve query filters, authorized company scope and existing read-only admin behavior.
- [ ] Report source-derived DB-error risk separately from any actual observed database exception.

**Dependency:** Separate bugfix ACC; do not hide these changes inside cosmetic work.

### P04 — Implement the approved Helpdesk sidebar and responsive shell

**Goal:** Give staff a recognizable workspace matching the accepted preview.

**Scope/files:** `app/helpdesk/layout.tsx`, new focused Helpdesk shell/style components; existing brand and account/logout entry.

**Criteria:**
- [ ] Dashboard/Pengaduan plus bottom account/website controls; no redundant Helpdesk workspace card.
- [ ] Active item solid Seatpax blue with white text/icon, no left stripe; subtle inactive hover and readable keyboard focus/reduced-motion support.
- [ ] Desktop/sidebar, tablet, 320/390px phone menu: no clipped navigation, page overflow or hidden main actions; menu supports keyboard/Escape/focus return.
- [ ] Public complaint/customer/admin shells and permissions remain unchanged; new navigation routes are specified and old links continue working.

**Dependency:** Confirm written Helpdesk design; P01 before push. Shell and list navigation must have a usable destination even before P05.

### P05 — Helpdesk dashboard using real authorized data

**Goal:** Show useful status totals, handling queue and recent events rather than sample cards.

**Scope/files:** `app/helpdesk/page.tsx`, dashboard view, `modules/helpdesk/staff.ts`/repository bounded reads and relevant tests; keep business reads inside domain modules.

**Criteria:**
- [ ] All four status totals independent of pagination/filter; clicking opens correctly filtered list.
- [ ] Queue is deterministic: waiting reports, HIGH first, then explicit agreed/default ranking and oldest creation time with ID tie-break; unset priority remains visible.
- [ ] Bounded queue/events/recent rows; events from real persistence; no contacts/evidence in dashboard payload without need.
- [ ] Same server-side authorization and company isolation as existing staff lists; zero/error/loading states truthful.
- [ ] Verify counts/sort/events and role-denial regressions; no chart, new workflow or schema expansion solely for appearance.

**Dependency:** P04; approve exact queue ranking in focused plan before coding.

### P06 — Helpdesk complaint list and detail layout

**Goal:** Make daily triage readable and actions easy to find.

**Scope/files:** `app/helpdesk/components/case-list.tsx`, `app/helpdesk/[id]/page.tsx`, `case-actions.tsx`, staff styles; existing actions/services remain authoritative.

**Criteria:**
- [ ] Compact list search/status/priority and working pagination; full real identifiers wrap safely.
- [ ] Details separate report/evidence/history from handling/email status; long content and multiple files fit phone/tablet/desktop.
- [ ] Priority persistence and transitions preserve current validation/revision behavior; completing a case still requires outcome and makes it read-only.
- [ ] No chat, public evidence leak, fake email delivery indicator or artificial sample data. Public complaint forms continue working.

**Dependency:** P03/P04 and approved detail preview; test existing flows after redesign.

### P07 — Customer UI consistency and perceived loading audit

**Goal:** Smooth the current landing → trips → seat → checkout → orders experience without changing its flow.

**Scope/files:** `app/page.tsx`, passenger components/styles and trip/checkout/order pages identified in the focused UI inventory.

**Criteria:**
- [ ] Preserve approved hero/search, blue palette/logo and existing booking illustrations; navigation active state follows the intended section/page without flicker.
- [ ] Existing empty/pending/failure states and loading recovery visible with useful next action; no indefinite skeleton presented as success.
- [ ] Before/after measurements distinguish dev compilation, network/database wait and animation cost; no performance claim from a screenshot alone.
- [ ] Responsive gaps/type/buttons and reduced motion reviewed at 320/390/768/1024/1440px; long trips and sold-out cases remain usable.

**Dependency:** UI inventory + preview ACC; any connectivity/data-loading logic fix becomes its own approved bug ticket.

### P08 — Operational admin visual consistency

**Goal:** Make existing route/fare/fleet/schedule setup less confusing.

**Scope/files:** `app/admin/components/`, company route/fleet/trip pages; existing location-directory design as visual baseline.

**Criteria:**
- [ ] List/create/edit actions clearly separated, labels and required fields readable, spacing/table/form hierarchy consistent.
- [ ] Existing stops/order/fares/layout/draft/publication and Crew assignment rules remain unchanged.
- [ ] Validation errors preserve inputs and focus; large layouts/tables fit tablet/phone without inaccessible actions.
- [ ] Preview ACC for each distinct screen family and an observed route → fleet → trip setup smoke test using labelled fixtures.

**Dependency:** Per-screen inventory/preview approval, no addition of schedule recurrence/business policies under a cosmetic task.

### P09 — Crew web UI and real-device acceptance

**Goal:** Keep the present online Crew flow reliable on phones.

**Scope/files:** `app/crew/components/`, `crew.css`, existing assigned-trip/manifest/scan/profile views.

**Criteria:**
- [ ] Assigned trips, manifest and manual search usable on phone; scanner permission/failure/manual fallback states clear.
- [ ] Boarding and snack remain separate explicit actions; repeated action does not duplicate records and stale scan responses do not target another passenger.
- [ ] Test an actual Android/iPhone where available; mark missing device/camera access untested. Existing role and assignment guards remain intact.
- [ ] No Flutter delivery, offline sync or new operational actions in this task.

**Dependency:** Approved UI preview plus authorized test itinerary/ticket; camera permission remains user-controlled.

### P10 — Complete core booking/payment and complaint lifecycle acceptance

**Goal:** Demonstrate existing flows end to end after UI work.

**Scope/files:** Existing acceptance tests and `docs/setup/evidence/`; no new product features.

**Criteria:**
- [ ] Customer SELF/OTHER → one seat hold → Sandbox payment → confirmed QR/My Tickets; pending/expiry/provider retry/late-conflict exercised with isolated approved test fixtures.
- [ ] Existing inventory/concurrency regressions and ownership/role denials pass; no real transactions or general provider maintenance queue drain.
- [ ] Complaint receipt → priority → request information → actual email link supplementation → processing → completion → public status/result; private attachment authorized/unauthorized behavior verified.
- [ ] Inbox receipt/completion confirmed separately from provider acceptance. Refresh/retry/back do not duplicate tickets/reports/events.
- [ ] Evidence distinguishes real browser/device/provider, mock tests and source review. Any real defect gets a separate fix task with regression/ACC.

**Dependency:** Working tools/provider fixture setup; run in bounded packages, not against arbitrary existing customer data.

### P11 — Reproducible checks and demo handoff

**Goal:** Make approved changes safe to publish and the ujikom demo easy to repeat.

**Scope/files:** `package.json` only if needed, `.github/workflows/verify.yml` as an optional approved CI addition, README/setup/demo checklist and evidence.

**Criteria:**
- [ ] Repeatable unit/type/lint/build commands; CI, if approved, runs non-secret checks without development quick-login/provider keys.
- [ ] Authenticated integration/provider/device checks remain explicit separately gated steps, not silently skipped as passed.
- [ ] Demo guide lists correct URLs/roles, startup order, labelled data prerequisites, known limitations and recovery; no credentials committed.
- [ ] Final approved branch/main SHAs and remote verification recorded. No unapproved SaaS/mobile/new features included.

**Dependency:** Accepted core flows; deployment/public URL is a separate explicit delivery decision.

## Recommended order

P01 → P02 recovery + P03 triage → P04/P05/P06 Helpdesk → P07 customer → P08 operational admin → P09 Crew web → P10 final flows → P11 handoff. Tests/bug triage may run in parallel with UI planning; only one agent operates the browser at a time. The explicit autonomous instruction authorizes this sequence without another approval gate.
