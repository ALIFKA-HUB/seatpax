# Pro Sandbox Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans for the user's selected inline execution. Steps use checkbox syntax. User explicitly requested writing this plan and immediately executing it without another approval pause.

**Goal:** Implement isolated Sandbox Pro invoice/payment/30-day periods, reminders, policy versions and development billing-clock advancement.

**Architecture:** Private billing schema references existing companies/users but never passenger booking/hold/ticket records. Domain services reuse the authenticated Sandbox provider transport with explicit invoice expiry; the existing webhook routes verified subscription orders separately. Sandbox subscription state does not unlock production or change Free operational quotas.

**Tech Stack:** Existing Next.js/TypeScript/Zod/Postgres.js/Drizzle/Supabase Auth; no new dependencies. Email is captured outbox only.

**Spec:** [Pro Sandbox billing](../specs/2026-10-20-pro-sandbox-billing-design.md), accepted for planning/execution by the user's explicit handoff. Dependencies: Free branch `codex/po-free-simulation` and current main documentation; integrate only in a new local worktree, not main.

## Global Constraints

- Rp299,000/30 days (720 hours), initial vehicle allowance 30, grace 7 days. UTC storage/WIB display.
- Early/within-grace renewal extends from old end; post-grace reactivation starts at first verified recognition. Quote/version paid history immutable; policy notice >=30 days.
- Invoice H-7; reminders -7/-3/-1/0/+3/+6 days. No reminders after settled/superseded. No real email or production charging.
- 1 unresolved payment attempt/workspace; 60-minute real-time expiry; max20 attempts/invoice. Exactly one purchased period/invoice. Financial excess/unknown outcomes go to review.
- Clock offsets only allowlisted development Sandbox workspaces; monotonic, <=366 days, >=5 seconds between advances, no advance with pending/unknown attempt. Never change OTP/trip/provider clocks.
- Feature gates default off. User defers testing: do not add/run tests, build, typecheck or lint unless requested. Source review and operational migration evidence do not prove runtime acceptance.
- Preserve user's main changes, secrets, legacy payments and all passenger obligations. No merge to main, push, production activation, financial override or Free reset.

## Review Focus

1. Duplicate/out-of-order receipts cannot grant twice or downgrade paid; Task3.
2. Two payment actions cannot open multiple unresolved attempts or bypass changed quote; Task2/3.
3. Early renewal, exact grace_end and delayed receipt use correct anchored periods; Task1/3.
4. Test clock cannot affect other tenants, provider leases or production; Task4.
5. Settled invoice never sends queued reminders; capture is not reported as real delivery; Task4.

## Files and shared interfaces

Create `lib/db/billing-schema.ts`; extend Drizzle config schema list. New module files: `modules/subscription/billing-{types,transaction,repository,service,payment,worker,clock}.ts`. Keep existing Free quota policy/service unchanged except safe composition if required. Create `lib/env/billing.ts`, CLI `scripts/process-subscriptions.ts`, Admin PO `app/admin/billing-{actions,data}.ts`, company subscription pages, platform billing/plan/audit pages and responsive components. Extend existing authenticated webhook router; do not duplicate booking confirmation.

Shared interfaces: `BillingContext=Context`; `BillingInstant={realNow:string;now:string}`; `Period={id,startsAt,endsAt,versionId}`; `BillingView={companyId,state,period,futurePeriod,invoices,now,realNow,offsetSeconds}`. Monetary values are integer strings at SQL boundaries. `withBillingTransaction(client,companyId,work)` locks subscription row and reads clock once; user-facing services acquire fresh actor membership/company guard before it, provider settlement uses trusted order lookup and does not restore revoked roles.

### Task 1: Private storage, clock and period contract

**Files:** billing schema/types/transaction/repository, `lib/env/billing.ts`, Drizzle config and generated migration/journal/snapshot.
- [ ] Define plan versions (draft/published, immutable), per-company Sandbox subscriptions with offset/advance audit time, invoices/version snapshots, payment attempts, durable events, purchased periods, reminder captures and admin audit. Add tenant/environment composite keys, unique order/transaction, unique invoice→period and bounded states.
- [ ] Create seed version 299000/30 via idempotent migration; no subscriber/backfill or company-state modification. Enable RLS and revoke browser/Data API table/schema/function grants.
- [ ] Export pure `subscriptionState(period,now)` and `periodForPayment(previous,recognizedAt)` with exact 30/7-day durations and half-open boundaries. Cap clock offset/revision values to safe integer domains.
- [ ] Implement database clock snapshot: recognized_at_real uses DB now; recognized_at for business uses same real now plus locked workspace offset. Serialization order: actor membership/company (user requests) → subscription → invoice → attempt; plan publish serialized by plan-family advisory lock.
- [ ] Generate migration through existing Drizzle tooling after reading help; inspect additive SQL. Audit target/Free migration presence before optional authorized development apply; never alter existing financial rows.
- [ ] Commit storage/core. Acceptance later: exact interval edges, FK isolation, RLS/grants and two-worker serialization.

### Task 2: Versioned plans and quote/invoice lifecycle

**Files:** billing repository/service and plan-validation; add no UI business rules.
- [ ] Implement `getBillingView(ctx)`, `createOrRefreshInvoice(ctx,requestKey)` and `publishPlan(actor,input)` with fresh authorization. Initial purchase explicit, renewal issued once per source period at H-7; at most one paid future period.
- [ ] Select published version eligible at target period start; store immutable price/cap/duration snapshot in invoice. Proposed change >=30 real days after publish. Published rows cannot be updated/deleted; capture actor/reason and old/new values in audit.
- [ ] Unpaid quote without open attempt becomes SUPERSEDED if its eligible version or renewal/reactivation purpose changes; replacement is a new invoice. Existing paid/in-flight quote remains untouched. Current/future paid snapshot is never changed by catalogue edits.
- [ ] Prevent annual/multi-period accumulation: one source period invoice chain, one OPEN replacement and one granted successor. Amount/plan/status ignored from client. Published values positive bounded integer IDR <=safe integer and allowance1–1000.
- [ ] Commit. Acceptance later: concurrent invoice creation, plan boundary quote refresh and prepaid period protection.

### Task 3: Sandbox payment, webhook and reconciliation

**Files:** billing-payment, existing `modules/payment/midtrans-provider.ts`, existing `app/api/payments/midtrans/route.ts` with billing branch, environment parser and receipt repository.
- [ ] Reuse provider auth/status/mapping but make Snap expiry explicit configurable with legacy default11 minutes and billing60 minutes; keep ticket behavior/key requirements intact. Billing env parses only merchant/server/client credentials and rejects non-Sandbox.
- [ ] Implement `prepareInvoicePayment(ctx,invoiceId,requestKey)` with 30-second real-time lease and same-order recovery. New order prefix `spxsub-`+UUID. Reconcile unresolved orders before allowing another; max20 attempts/invoice; never auto-create a second order on timeout.
- [ ] Authenticate receipt before durable insert; verify order's stored billing purpose/company/amount/merchant against GET Status. Unique event key differentiates status updates. Existing ticket webhook path remains unchanged for ticket orders; unknown orders create no financial resources.
- [ ] Implement `confirmBillingObservation(orderId,observation)` with subscription→invoice→attempt locks, immutable recognition times, paid attempt and invoice/period atomicity. Repeat identical success no grant; second successful attempt for settled invoice is recorded REVIEW without another period. FAILED/EXPIRED never downgrade paid.
- [ ] Billing has no seat hold: provider success for a legitimately initiated immutable quote can be recognized after its local initiation window; choose start via current early/grace/post-grace rule. Suspended company/disabled payer does not discard settlement or restore authorization.
- [ ] Commit. Acceptance later: fake callback, out-of-order status, webhook retry, create uncertainty, expiry/renewal boundary and duplicate provider success.

### Task 4: Reminder worker and development time advance

**Files:** billing-worker/clock, `scripts/process-subscriptions.ts` and environment gate.
- [ ] `processSubscriptions({limit:1..100,companyId?})` uses bounded scan and cursor/result counts, materializes renewal invoices and latest relevant reminder stage once/channel/source period. Skip older missed stages; recheck settled/superseded before capture.
- [ ] Persist email preview as CAPTURED, never DELIVERED; recipient from verified registering owner, active membership required for email capture. Missing/disabled owner yields visible held status. No SMTP send implementation/key or dependency in this slice.
- [ ] `advanceBillingClock(ctx,stage,expectedOffset)` checks feature flag, NODE_ENV development, Sandbox env, allowlisted company, membership, no unresolved attempt/lease, monotonic offset<=366days and5-second real cooldown. Audit previous/new offset; target next H-7/expiry/grace3/grace6/after-grace boundary. No global clock mutation.
- [ ] CLI default dry-run, explicit `--apply` for processing; no fake pay/mark-paid flag. Errors/logs redact personal contact/secrets. Commit. Acceptance later: reminder dedupe/paid race, missing transport honestly captured, forbidden clock changes and pending attempt block.

### Task 5: Admin PO subscription UI

**Files:** billing actions/data, `app/admin/companies/[companyId]/subscription/{page.tsx,invoices/[invoiceId]/page.tsx}`, components for payment/clock and Admin nav.
- [ ] Show Pro Sandbox clearly, interval with WIB time, expiry/grace, current/future version, invoice details/history and benefit preview. Explain Free operational limits remain until production activation slice; no real sales unlock.
- [ ] Actions create/refresh invoice, pay with Sandbox Snap and refresh verified status. Use existing script loader pattern; never activate from Snap callback. Keep request keys stable on retries, preserve inputs on validation errors, disable duplicate submits.
- [ ] Render dev clock controls only when gates/allowlist apply; require confirmation and expected offset. Show reminder previews and CAPTURED status. UI has no price/paid/clock authority.
- [ ] Desktop/tablet/mobile, semantic tables/labels, keyboard/focus/dialog errors and shared Seatpax palette; no new logo/illustrations. Commit. Acceptance later: session loss, altered IDs/price, responsive viewport and retry.

### Task 6: Platform plan/billing overview and audit UI

**Files:** `app/super-admin/{billing-actions,billing-data}.ts`, pages `plans`, `subscriptions`, `history`, minimal `page.tsx` overview, nav component/shared CSS.
- [ ] Fresh global SUPER_ADMIN guards; display bounded paginated company invoice/state summaries, minimal attention counts, audit events and Sandbox plan-version publish form with effective date/reason.
- [ ] Preserve existing Companies activate/suspend behavior and operational separation. No passenger payment data or manual payment/refund override added.
- [ ] Error states honest: provider uncertainty REVIEW, capture not sent; protected PII only on needed invoice detail. Commit. Acceptance later: tenant Admin cannot load platform views, concurrent publish/cutover and minimal exposure.

### Task 7: Whole-branch source review and delivery

**Files:** setup guide and modular index/scope/payment/data/API/UI/ledger updates.
- [ ] Review source coverage and package final diff; dispatch one fresh-context GPT-6 Luna medium reviewer per workspace preference. Do not ask it to run prohibited tests/build/typecheck or write data.
- [ ] Fix important findings in one source-based pass; record rulings, limitations and not-verified evidence. Verify credentials ignored and user's main changes untouched.
- [ ] Optional development migration apply is authorized by this execution only after additive SQL/preflight and target check; record actual applied/prepared status. Never send email, charge production, seed real paid state, reset data or turn gates on.
- [ ] Commit setup evidence and progress checkpoints. Keep worktree/branch unmerged and feature gates off while tests are deferred. No final passing/production-ready claim. Testing can be done tomorrow on explicit request.

## Self-review and execution handoff

Spec sections4–8 map Tasks1–3; section9–10 Task4; section11 Tasks5–6; migration/reliability/source review Task7. Review Focus cases map to their owners. Technical mechanisms are those in the reviewed draft; no new production package quotas or tax policy invented.

The user explicitly instructed: write the plan, then execute directly while they sleep, without another approval question. Proceed inline, track progress durably, and do not configure shutdown/automation on their behalf.
