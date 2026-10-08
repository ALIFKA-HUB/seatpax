# Checkout and Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A logged-in booker purchases one seat for SELF/OTHER through Midtrans Sandbox and receives exactly one authorized QR ticket after verified confirmation, with late-conflict administration.

**Architecture:** Domain booking/payment/ticket services use the existing PostgreSQL anchor lock protocol. Persist initiation and durable events before external calls; reconcile Midtrans status outside inventory transactions and finalize inventory/ticket atomically. UI consumes owner-authorized server state.

**Tech Stack:** Existing Next.js App Router, TypeScript, postgres/Drizzle, Zod, Vitest and Supabase Auth. Native fetch/crypto for Midtrans and AES-GCM; add `qrcode` and its TypeScript definitions only for QR rendering.

**Spec:** `docs/superpowers/specs/2026-10-08-checkout-payment-design.md` (approved by user with “spec oke”).

## Global Constraints

- One logged-in booker, one passenger and one seat per booking remain the release boundary.
- OTHER must not overwrite the booker's profile. No email-to-account matching or automatic claim.
- Ticket issuance requires verified payment confirmation, including SELF checkout.
- Effective expiry = base expiry +60 seconds; grant grace exactly once.
- Commit before any provider network call. Every recovery uses the same provider order ID and immutable request.
- Server Key is server-only, never a NEXT_PUBLIC variable. Sandbox endpoints only for this release.
- Confirmation uses actual DB time after waits; received/provider timestamps are audit only.
- Generate a 32-byte cryptographically random opaque token; AES-256-GCM with key version; no PII in QR.
- Preserve existing dirty `next-env.d.ts`; do not stage it. Do not print local environment credentials or provider tokens.
- Existing execution preference: inline `executing-plans`, with one focused final GPT-6 Luna/medium reviewer. No automatic push/deploy.

## Review Focus

- Two distinct initiation keys racing on one hold return one immutable booking/order, not a raw uniqueness error (Task 2).
- A forged notification's unsigned status field cannot grant inventory, even if its signed order/amount fields match (Task 4).
- A timeout followed by a provider duplicate-order response retains the same order and a visible unresolved state (Task 3).
- OTHER checkout cannot mutate profile fields or infer traveler ownership from their contact details (Tasks 2/6).
- Database cleanup fixtures must delete new dependent rows before old hold/trip teardown, without broad data deletion (Tasks 1/7).

## File map and shared interfaces

Create `modules/booking/{types,validation,repository,checkout-service,query-service}.ts`; `modules/payment/{types,midtrans-provider,creation-service,notification-service,event-service,reconciliation-service,confirmation-service,conflict-service,repository}.ts`; `modules/ticket/{crypto,repository,service}.ts`. Keep repositories focused on their domain; transaction order is coordinated by services. Reuse `modules/inventory/transaction.ts` and deadline precision helpers.

Create `lib/env/payment.ts`, migration `drizzle/0006_checkout_payment.sql`, owner checkout/booking/ticket pages, payment notification handler and admin conflict pages. Modify existing inventory repository/availability for confirmed occupancy, cleanup for pending-booking expiry, existing account/home/hold links, schema and fixture teardown. Each task below lists exact tests and adapter files.

Shared contracts, defined in Tasks 1–3:

```ts
type CheckoutInput = {holdId:string; requestKey:string; mode:'SELF'|'OTHER'; name:string; phone:string};
type BookingView = {id:string; bookerId:string; status:'PENDING_PAYMENT'|'EXPIRED'|'CONFIRMED'|'PAYMENT_CONFLICT'|'REFUNDED'; mode:'SELF'|'OTHER'; passenger:{name:string;phone:string}; email:string; amount:string; orderId:string; effectiveExpiresAt:string; serverNow:string; ticketId:string|null; paymentStatus:'PENDING'|'PAID'|'FAILED'|'EXPIRED'; creationState:'NOT_STARTED'|'CREATING'|'READY'|'UNKNOWN'};
type InitiationActor = {userId:string; verifiedEmail:string};
type ProviderOrder = {orderId:string;amount:string;name:string;phone:string;email:string;initiatedAt:string;effectiveExpiresAt:string};
type ProviderObservation = {orderId:string;transactionId:string;merchantId:string;amount:string;currency:'IDR';status:string;fraudStatus:string|null;paymentType:string;verifiedAt:string};
type SnapResult = {token:string;redirectUrl:string};
interface PaymentProvider {create(order:ProviderOrder):Promise<SnapResult>;status(orderId:string):Promise<ProviderObservation|null>;authenticate(raw:unknown):AuthenticatedReceipt;}
type AuthenticatedReceipt = {orderId:string;eventKey:string;fields:Readonly<Record<string,string|null>>};
type TicketView = {id:string;bookingId:string;passengerName:string;phone:string;qrToken:string;tripId:string;seatCode:string;fromName:string;toName:string;departureAt:string};
```

Booker-only query returns `BookingView`; Snap token requires a separate owner/eligibility-gated call. IDs are UUIDs except provider order identity. Monetary strings are exact integer IDR; adapter formats expected gross amount without floating-point comparison. Repository-local DTOs may extend these contracts without changing consumer meanings.

### Task 1: Schema, constraints and configuration

**Files:** Create `drizzle/0006_checkout_payment.sql`, `modules/booking/types.ts`, `modules/payment/types.ts`, `lib/env/payment.ts`; modify `lib/db/schema.ts`, `.env.example`, `tests/integration/helpers/inventory-fixture.ts`, `tests/integration/helpers/trip-fixture.ts`; create `tests/unit/payment-env.test.ts`, `tests/integration/payment-schema.test.ts`.

**Interfaces:** Produces the shared types and `parsePaymentEnv(input):PaymentEnv` with Sandbox Server Key, Client Key, Merchant ID and versioned 32-byte ticket encryption key. Domain services consume migration tables.

- [ ] Write failing configuration/DB tests: production config rejected; malformed encryption key rejected; duplicate hold→booking/order/passenger/ticket and occupancy anchor rejected; cross-company/trip FK rejected; browser table privileges revoked; invalid state/timestamp rows rejected. Assert `OTHER.account_id === null`, `SELF.account_id === booker_user_id` through an enforced constraint/relationship.
- [ ] Run `npm test -- tests/unit/payment-env.test.ts` and `npm run db:test -- tests/integration/payment-schema.test.ts`; expect missing module/table failures.
- [ ] Implement bookings, one booking passenger, payments with finite creation lease, receipts/observations/processing leases, assignments/unique anchor occupancy, tickets, mock refunds and audit tables. Add profile name/phone only if missing; represent immutable fare/trip/contact snapshots. Add composite FKs and status/check constraints, RLS/revokes and minimal indexes for owner queries/replay. Keep unknown notification status text representable.
- [ ] Extend fixture-specific teardown in reverse FK order and prove existing fixture cleanup still works. Add ignored-env placeholders only; safely collect actual keys during execution, with the user entering secrets locally if UI automation is unavailable.
- [ ] Apply migration through `npm run db:migrate` using existing verified TLS CA and run targeted tests; expect pass. Commit only task files.

### Task 2: Atomic checkout initiation and ownership

**Files:** Create `modules/booking/{validation,repository,checkout-service,query-service}.ts`, `tests/unit/checkout-validation.test.ts`, `tests/integration/checkout-initiation.test.ts`; modify inventory repository only to expose existing guards/anchors and compatible grace operations.

**Interfaces:** `createCheckoutService(repo).initiate(actor:InitiationActor,input:CheckoutInput):Promise<BookingView>`; `createBookingQueryService(repo).readMine(userId:string,id:string):Promise<BookingView>` and `.listMine(userId:string):Promise<BookingView[]>`. Repository owns exact server quote and persisted provider order retrieval.

- [ ] Write failing tests: trimmed names 1–120, normalized phone 8–15 digits, invalid mode/UUID; owner denial; exact snapshot fare; grace delta equals 60 seconds; SELF profile update and OTHER profile preservation; immutable retry payload; simultaneous same/different keys on one hold; cutoff/base expiry after lock wait; suspension; release denied after initiation.
- [ ] Run `npm test -- tests/unit/checkout-validation.test.ts` and `npm run db:test -- tests/integration/checkout-initiation.test.ts`; expect missing service failures.
- [ ] Implement validation, safe owner reads and transaction using company→trip→sorted anchors→hold→booking→payment. Generate/persist one deterministic provider identity derived from payment UUID. Handle unique collisions after rollback with ownership/fingerprint lookup. Reject new initiation at base expiry even if grace exists; return existing booking safely on retries.
- [ ] Run targeted tests; expect one booking/order and unchanged grace across retries. Commit task files.

### Task 3: Sandbox provider and recoverable Snap creation

**Files:** Create `modules/payment/{midtrans-provider,creation-service,repository}.ts`, `tests/unit/midtrans-provider.test.ts`, `tests/integration/payment-creation.test.ts`; complete `lib/env/payment.ts` server construction.

**Interfaces:** `createMidtransProvider(env,fetchImpl):PaymentProvider`; `createPaymentCreationService(repo,provider).prepareMine(userId:string,bookingId:string):Promise<{state:'READY';token:string}|{state:'PENDING'|'UNAVAILABLE'|'EXPIRED'}>`. Use `ProviderOrder` exclusively from persisted booking.

- [ ] Pin official response shapes, auth, status mapping, explicit expiry, original-string signature and amount handling with recorded nonsecret fixtures. Test accepted capture/settlement, pending/challenge, failures, unknown/refund review; merchant/transaction/currency mismatch and unsafe redirect URL rejection. Set HTTP timeout 10 seconds, creation lease 30 seconds, server-side UTC-to-provider timezone conversion and explicit persisted-start expiry.
- [ ] Run `npm test -- tests/unit/midtrans-provider.test.ts`; expect missing adapter failures.
- [ ] Implement Sandbox fetch endpoints, Basic server auth, constant-time signature authentication, allowlisted fields and canonical event SHA256 tuple. Require authenticated GET status before fulfillment. Use a 30-second creation lease without holding inventory locks across HTTP; compare lease identity when saving token. Recovery checks same order status; retry creation only when provider reports no transaction and remains eligible. Duplicate-order/timeout returns unresolved state, never replacement identity.
- [ ] Write and run DB tests for concurrent prepare, crash/lease expiry, slow response after lease replacement, timeout then duplicate order, stored token reopening, local expiry and no extra grace. Expect one persisted identity and no token served after eligibility expiry. Commit task files.

### Task 4: Durable verified events and atomic confirmation

**Files:** Create `modules/payment/{notification-service,event-service,reconciliation-service,confirmation-service}.ts`, `modules/ticket/{crypto,repository}.ts`, `app/api/payments/midtrans/route.ts`, `scripts/reconcile-payments.ts`, `tests/unit/payment-notification.test.ts`, `tests/unit/ticket-crypto.test.ts`, `tests/integration/payment-confirmation.test.ts`; modify `modules/inventory/repository.ts`, `modules/inventory/types.ts`, `modules/inventory/availability-service.ts`, `modules/inventory/cleanup-service.ts`, `package.json`.

**Interfaces:** `.receive(raw:unknown):Promise<{receiptId:string;duplicate:boolean}>`; `.process(receiptId:string):Promise<'PROCESSED'|'IGNORED'|'RETRY'>`; `reconcilePayments(limit:number):Promise<{processed:number;retry:number}>` with limit 1–100. `createConfirmationService(repo).apply(observation:ProviderObservation):Promise<BookingView>`. `encryptToken(token,keyVersion,keys)` and `decryptToken(record,keys)` use AES-256-GCM; issue repository is transaction-only.

- [ ] Write failing tests: notification body limit 64 KiB, malformed/invalid signature rejection; status forgery cannot confirm; changed fraud/status tuple differs while exact retry deduplicates; receipt survives crash; provider failure preserves retry; encryption tamper/wrong key rejected and stable token reopens.
- [ ] Run targeted unit tests, expect missing modules. Implement dedicated POST body parsing, durable receipt acceptance and response mapping (invalid 400/401; unknown order 404; durable acceptance 200; storage failure 503). Processing lease 30 seconds; bounded command retries eligible events with exponential backoff 5/10/20/40/80/160/300 seconds, max 8 automatic attempts, then visible manual review. Run maintenance without printing PII/keys/tokens.
- [ ] Write DB tests for duplicate/out-of-order events; exactly one confirmation/ticket/assignment; pending→expired→late PAID conflict; event processing delayed past deadline; reassignment/adjacent reuse; PAID cannot downgrade; accepted initiation during later suspension; rollback on ticket failure; 32-byte token hash/ciphertext uniqueness and stable replay.
- [ ] Implement locked confirmation and occupancy union in both snapshot availability and hold creation. Expand availability status to `BOOKED` and update consumers coherently. Add atomic pending-booking expiry to existing hold cleanup with consistent lock order. Use exact microsecond deadline helpers and shared audit uniqueness. Verify no unsigned fields are promoted into authenticated observations.
- [ ] Run `npm test -- tests/unit/payment-notification.test.ts tests/unit/ticket-crypto.test.ts` and `npm run db:test -- tests/integration/payment-confirmation.test.ts tests/integration/inventory-hold.test.ts tests/integration/inventory-availability.test.ts tests/integration/inventory-release.test.ts`. Expect pass. Commit task files.

### Task 5: Tenant-scoped conflict resolution

**Files:** Create `modules/payment/conflict-service.ts`, `app/admin/payment-actions.ts`, `app/admin/payment-data.ts`, `app/admin/companies/[companyId]/payment-conflicts/page.tsx`, `app/admin/companies/[companyId]/payment-conflicts/[bookingId]/page.tsx`, `app/admin/components/payment-conflict-form.tsx`, `tests/integration/payment-conflicts.test.ts`, `tests/unit/payment-admin-actions.test.ts`; modify company layout navigation.

**Interfaces:** `.list(actor:{userId:string;companyId:string})`, `.resolve(actor,bookingId:string,input:{action:'CONFIRM'|'MOCK_REFUND';requestKey:string;reason:string}):Promise<BookingView>`. Reason is trimmed 1–500 characters; server obtains actor through `requireAccess('tenant.admin',companyId)` and rechecks membership inside mutation transaction.

- [ ] Write failing tests for tenant foreign resource denial, revoked admin, Super Admin no tenant fallback, suspended mock refund allowed/manual confirm denied, cutoff/occupied interval, concurrent opposite resolutions, same resolution retry and exact paid amount. Assert one audit/refund or one ticket, no mixture, financial fact remains PAID.
- [ ] Run targeted tests, expect missing service/action. Implement common lock protocol/recheck and terminal resolution idempotency. Add concise Admin PO forms showing paid conflict and explicitly labeled mock refund.
- [ ] Run `npm test -- tests/unit/payment-admin-actions.test.ts` and `npm run db:test -- tests/integration/payment-conflicts.test.ts`; expect pass. Commit task files.

### Task 6: Owner checkout, Snap popup and My Tickets

**Files:** Create `modules/ticket/service.ts`, `app/checkout/actions.ts`, `app/checkout/data.ts`, `app/checkout/[holdId]/page.tsx`, `app/checkout/components/checkout-form.tsx`, `app/bookings/[bookingId]/page.tsx`, `app/bookings/components/booking-status.tsx`, `app/tickets/page.tsx`, `app/tickets/[ticketId]/page.tsx`, `app/tickets/data.ts`, `tests/unit/checkout-actions.test.ts`, `tests/unit/checkout-ui-state.test.ts`, `tests/integration/ticket-access.test.ts`; modify hold-detail/account/home links and passenger CSS; add `qrcode` dependency/lockfile.

**Interfaces:** `createTicketService(repo,keys).readMine(userId:string,ticketId:string):Promise<TicketView>`; `.resolveOperational(actor:{userId:string;companyId:string;tripId:string;role:'ADMIN_PO'|'CREW'},token:string):Promise<Omit<TicketView,'qrToken'>>` with fresh membership/assigned-trip validation. Actions consume Task 2/3 interfaces with verified user and email, never browser actor IDs.

- [ ] Write failing tests: OTHER prefill/reset never mutates profile, missing SELF fields required, safe request-key retention on uncertain retry, callbacks merely refresh, popup close stays pending, ownership denied for matching traveler email/phone, QR contains token only, foreign owner and unassigned crew rejected, same booker token reopens.
- [ ] Run targeted unit/DB tests, expect missing modules. Implement accessible SELF/OTHER form, reviewed prefilled data, server-derived quote, Snap script loader scoped to Sandbox URL/client key and guarded token preparation. Preserve key/input on uncertain failure; no success from callback alone. Poll server state every 5 seconds while visible/pending, stop at terminal state; expiry refresh once.
- [ ] Implement booking and My Tickets/detail pages with stable QR rendering server-side, authorized booker reads and minimum operational resolution. Render BOOKED cells disabled. Add safe return-path links for expired sessions and label refunded/conflict states clearly.
- [ ] Run `npm test -- tests/unit/checkout-actions.test.ts tests/unit/checkout-ui-state.test.ts` and `npm run db:test -- tests/integration/ticket-access.test.ts`; expect pass. Commit task files.

### Task 7: End-to-end evidence and integration

**Files:** Create `docs/setup/CHECKOUT_PAYMENT_SETUP.md`; modify `docs/seatpax/00_INDEX.md`, `02_MVP_SCOPE.md`, `07_BOOKING_PAYMENT.md`, `08_TICKET_QR_MANIFEST.md`, `10_DATA_MODEL_DATABASE.md`, `11_API_PROJECT_STRUCTURE.md`, `19_DECISION_LEDGER.md` and this plan's completion boxes.

**Interfaces:** Installed notification endpoint, `npm run db:reconcile-payments -- --limit=100`, owner/admin UI and prior inventory regression suite. Actual Midtrans credentials and public HTTPS callback are execution prerequisites for provider evidence, not prerequisites for local code/test progress.

- [ ] Run typecheck, lint, production build, full unit suite and full integration suite with the existing TLS CA. Expected all pass; record exact counts and failures honestly. No broad cleanup of hosted demo/auth data.
- [ ] Configure an available HTTPS tunnel and Midtrans Sandbox callback via authorized tools; if unavailable, provide concrete endpoint instructions and continue independent verification. Keys stay in ignored `.env.local`; never request their values in chat. Confirm disabled/production config cannot expose payment UI.
- [ ] Browser-check SELF/OTHER at desktop and 390px width, keyboard navigation, Snap success using Sandbox simulator and actual callback, pending popup close, second authenticated session My Tickets and late-conflict admin resolution. Record any unavailable evidence explicitly rather than claiming an end-to-end pass.
- [ ] Run one focused GPT-6 Luna medium final reviewer with `fork_turns:'none'`; supply spec, plan, worktree path, diff and evidence. Fix material findings and rerun only affected checks plus justified regressions.
- [ ] Synchronize modular docs with implemented behavior/limits, commit task files, integrate approved local branch into main without overwriting pre-existing edits. Leave push/deployment for a separately authorized action and report local URL, evidence and remaining setup requirements.

## Self-review and handoff

The seven tasks cover approved product/ownership, initiation, provider uncertainty, durable verified processing, inventory/ticket atomicity, admin resolution, UI and evidence. Financial fulfillment pieces are coupled, so one coordinated plan is intentional. Each task has a testable domain boundary; payment UI remains unavailable until the full dependent confirmation path exists.

Execution method is preserved from the user's prior inline preference. This written plan requires user review before implementation. No tests, dependencies, migration or product code were changed while writing it.
