# Checkout and payment setup

Date: 8 October 2026. Approved design and implementation plan:

- `docs/superpowers/specs/2026-10-08-checkout-payment-design.md`
- `docs/superpowers/plans/2026-10-08-checkout-payment.md`

## Implemented flow

Logged-in booker holds one seat, reviews SELF or OTHER passenger details, and initiates one immutable booking/payment order. OTHER starts with empty passenger details and never changes the booker's profile. SELF saves reviewed name/phone. My Tickets belongs to the booker; matching a traveler's contact information grants no access.

Initiation atomically grants the existing hold one 60-second grace period. Retry preserves order, fare, passenger and deadline. Snap creation uses a finite lease and checks the same provider order after uncertainty. Local expiry prevents token reopening. Zero-total intervals currently reject initiation; a free-ticket flow is not defined by this release.

Webhook receipts are persisted before acknowledgment. Signed fields do not directly authorize fulfillment: an authenticated Midtrans status request supplies financial truth. Valid success atomically records PAID, assignment, segment occupancy and encrypted QR ticket. Paid after expiry becomes PAYMENT_CONFLICT without a ticket. PAID cannot downgrade on older provider failures. Company suspension after valid initiation does not cancel an otherwise eligible confirmation.

Admin PO can confirm a paid conflict only before interval cutoff with an active company and an available seat, or record MOCK_REFUND. MOCK_REFUND changes booking status and records exact paid amount; it does not transfer money. Unknown/challenge/refund statuses and exhausted retries appear in a separate read-only provider review queue. This slice does not implement provider refunds, boarding/snack actions or a full scanner interface.

## Environment

Keep these values in ignored `.env.local`; never commit or paste real values into documentation:

```env
MIDTRANS_ENVIRONMENT=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_MERCHANT_ID=...
TICKET_ENCRYPTION_KEY=...
```

The encryption key is a base64-encoded random 32-byte key, version `v1`. Preserve it when restarting, moving checkouts or copying configuration: changing it makes existing ticket ciphertext unreadable. The Client Key is delivered to the Sandbox script; Server Key and encryption key remain server-only. Missing or production configuration disables payment initiation.

Existing database environment and TLS setup remain required. On this laptop:

```powershell
$env:NODE_EXTRA_CA_CERTS='C:/Users/ASUS/Downloads/prod-ca-2021.crt'
npm run db:migrate
npm run build
npm run start -- --port 3001
```

Migrations `0006_checkout_payment` and `0007_ticket_assignment_identity` are applied to the development database. Browser roles have no grants on payment/ticket tables and RLS is enabled. Application services use the existing privileged server connection with explicit ownership and fresh tenant membership checks.

## Notification endpoint and maintenance

Endpoint: `POST /api/payments/midtrans`, JSON body at most 64 KiB. Invalid body/signature returns 400/401; unknown order 404; durable acceptance 200; storage/configuration failure 503. Immediate processing is best effort after persistence; failed processing is recovered by maintenance.

```powershell
npm run db:reconcile-payments -- --limit=100
npm run db:expire-holds -- --limit=100
```

Reconciliation has a maximum batch of 100. Provider HTTP timeout is 10 seconds; creation/event lease is 30 seconds. Failed processing backs off at 5/10/20/40/80/160/300 seconds, with at most eight automatic attempts per event. Review events stop automatic recovery synthesis. The command also checks older pending orders without callbacks, bounded by the remaining batch budget. Running maintenance periodically is an operational prerequisite; this change does not install a scheduler.

Midtrans expiry supports whole minutes. The adapter derives its explicit start from persisted effective expiry minus the fixed eleven-minute hold-plus-grace interval, formatted in WIB. Second truncation can end the provider window less than one second earlier; database time remains authoritative.

For local callbacks, expose only the notification endpoint:

```powershell
npx tsx scripts/payment-webhook-proxy.ts
ngrok http http://127.0.0.1:3002
```

The proxy binds to loopback port 3002 and forwards only `POST /api/payments/midtrans` to port 3001. Other routes return 404; oversized bodies return 413. Configure the resulting HTTPS URL plus `/api/payments/midtrans` as the Midtrans **Sandbox** payment notification URL. Tunnel hostnames are temporary; update the setting after a hostname changes. Stop ngrok and the proxy when the demo ends.

## Manual acceptance remaining

Use an authenticated passenger session at `http://localhost:3001/trips`:

1. Choose a sale-open interval and seat; proceed from the hold to checkout.
2. Check SELF profile prefill and OTHER blank fields. Submit one passenger, open Snap and use Midtrans Sandbox simulation only.
3. Confirm the actual callback reaches the endpoint, server state becomes CONFIRMED, and My Tickets shows a stable QR on reopening in a second authenticated session.
4. Close a pending popup and verify it remains pending. Check desktop, 390px width and keyboard use.
5. For a late paid conflict, use Admin PO's conflict page and verify confirm/refund simulation results and tenant isolation.

Automated provider tests use a fake external HTTP transport with real domain/SQL services; they do not prove actual credentials, simulator, callback delivery or browser layout. Browser Use was blocked by tool URL policy; Windows automation failed window geometry/state capture. An attempted read-only Sandbox credentials check was rejected by automatic tool review. User-provided screenshots on 8 October 2026 demonstrate a real Sandbox QRIS simulator payment, Seatpax CONFIRMED booking, rendered ticket QR, and the same ticket in My Tickets after the notification URL was saved. This proves that happy path in the user session; phone camera, second authenticated session, 390px and keyboard checks remain unverified.

## Verification evidence

Latest verified unit suite: 38 files / 172 tests passed (9 October rerun). Typecheck, lint (no warnings) and production build passed. Initial full database run: 63 passed / 1 failed; the failure exposed a JSON audit UUID cast rollback at retry attempt eight. The cast was fixed and the confirmation file passed all seven tests, including added suspension/cutoff, PAID monotonicity and adjacent occupancy checks. A fresh full database rerun is in progress; its final result and integration status will be appended below. Review found literal quote characters in three dynamic route directories and missing visible provider REVIEW outcomes; both were corrected. Production build now registers `/checkout/[holdId]`, `/bookings/[bookingId]`, `/tickets/[ticketId]` and the notification/admin routes.


Dashboard credential correction: Sandbox dashboard supplied Mid-server-/Mid-client- keys without SB-. Local parsing now accepts both formats and keeps MIDTRANS_ENVIRONMENT=sandbox and fixed Sandbox endpoints. Prefix alone is not proof of environment; Midtrans API authenticates the values. Merchant ID is a distinct dashboard value, not the server key. Three configuration tests passed; no secret values are recorded here.

9 October follow-up: unit suite now passes 39 files / 174 tests, including two fixture-scope checks; typecheck, lint and build pass. The first database rerun exceeded the former 30-second test timeout: the same confirmation test passed in 55.88 seconds with a diagnostic 120-second allowance, and database inspection showed no lock wait. Integration timeout now allows 120 seconds for hosted fixture round trips; application SQL timeouts are unchanged. Two maintenance assertions also selected existing demo orders from the global queue. A test-only SQL wrapper scopes those selectors to the generated fixture company; both original failing cases passed (2 tests, 73.87 seconds). Full serial database rerun remains pending. No production order cleanup was performed.
Final 9 October database evidence: full serial run 16 files / 64 tests passed / 1 ticket-identity timeout (1621.38s), concurrent with a transient diagnostic connection failure. The unchanged ticket-identity file then passed independently (1 test, 57.05s). All 65 database cases have passing evidence across these runs; this is not a claim of a single clean full run. Local checkout integration is authorized; no push/deployment.

9 October manifest follow-up: the integrated checkout dependency passed the fresh full serial database regression together with boarding (18 files / 69 tests, 940.55s, zero failures). This supersedes the earlier split-run automated limitation; the physical browser/phone acceptance limitations above remain unchanged.
