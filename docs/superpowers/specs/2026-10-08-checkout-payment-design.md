# Checkout, Midtrans Sandbox, and ticket issuance

Date: 8 October 2026. Status: written design for user review; implementation is not authorized by this document alone.

## Intent and accepted product decisions

Extend the implemented search/seat hold flow into a demonstrable payment and ticket flow. One logged-in booker purchases one seat for one passenger. The user accepted Snap popup, checkout name/phone with account email, and subsequently explicitly accepted purchasing for a friend. Preserve the 30-day release and existing inventory correctness.

Checkout offers `SELF` and `OTHER`:

- SELF prefills the account's saved name/phone. Missing values must be completed; show the information for review before payment. Save the booker's own name/phone on an explicit successful SELF checkout submission.
- OTHER collects the passenger's name and phone. It must not overwrite the booker's profile. Booking contact email comes from the verified booker account; there is no email-to-account matching or automatic claim.
- The booker owns the booking and accesses its ticket through My Tickets. The passenger snapshot supplies the name/phone used by authorized crew. OTHER has no passenger account association in this release. A QR can be presented by the traveler, but does not grant anonymous access to private data.
- One seat/passenger per booking remains enforced. Ticket issuance requires verified payment confirmation, including SELF checkout.

This explicitly supersedes the foundation's requirement that every passenger account equals the checkout account. Guest checkout, claims, group purchases, cash, general cancellations/rescheduling and real provider refunds remain outside this design.

## Architecture and delivery boundary

Implement one coordinated checkout/payment slice: booking initiation, Snap adapter, durable notifications/reconciliation, confirmed inventory, ticket issuance/My Tickets, and minimal late-conflict administration. Boarding/snack and a complete crew manifest/scanner interface are subsequent work; passenger records and authorization contracts must be compatible with them.

Domain services own booking/payment/ticket rules. Route handlers/actions validate input, obtain verified identity and call services. Provider-specific HTTP/signature/status parsing stays in the Midtrans adapter. Use the existing privileged server database pattern, tenant authorization, RLS and browser grant revocation.

Deliver the slice in internal dependency order. Do not expose a usable payment button before notification processing, inventory confirmation and ticket issuance are installed together.

## Checkout and initiation

Show immutable trip/seat/endpoint snapshots, server-calculated IDR fare, passenger mode/contact and the server deadline. Browser amounts, owner/account IDs and company IDs are not authority. Name is trimmed, 1–120 characters; phone is required, normalized to an international number with 8–15 digits. SELF and OTHER snapshots cannot be changed after initiation.

POST initiation uses an owner-scoped UUID request key and payload fingerprint. Same key/same payload returns the existing booking; different payload conflicts. `seat_hold_id` is unique, so another key cannot create a second booking for the same hold. Existing booking retrieval must still validate booker ownership.

Lock company SHARE → trip SHARE → ordered full-interval inventory anchors UPDATE → hold → booking → payment. Recheck eligibility and actual database time after lock acquisition. New initiation requires active company, sale-ready trip, owner ACTIVE hold, now before both base expiry and interval sales cutoff, and no competing confirmed occupancy.

Atomically persist booking/contact/passenger/fare snapshots, one payment/order identity, initiation timestamp, and effective expiry = base expiry +60 seconds. This grants grace exactly once; later requests cannot extend it. Commit before any provider network call. Release is denied after initiation, while expiry remains effective without a worker.

The provider request is derived entirely from persisted data. A finite creation lease prevents concurrent requests from racing unnecessarily; losing requests return pending. Lease expiry allows recovery after a crash. Every recovery uses the same provider order ID and immutable request. Persist the returned Snap token before serving it to the authorized booker.

Provider timeout is an unknown outcome. Reconcile the same order and retry its creation only according to Midtrans's documented same-order behavior; never create a replacement order or mark money paid from an HTTP timeout. Persist attempts and safe error classification. If the provider order exists but the Snap token cannot be recovered, show a pending/reconciliation state rather than inventing a new order.

Use explicit provider expiry start time/duration derived from the persisted effective deadline; provider expiry does not replace Seatpax's database deadline. Existing Snap token display cannot resurrect an expired hold. Unexpected provider success remains observable through notifications/reconciliation after local expiry.

## Midtrans adapter and financial truth

Sandbox endpoints only for this release. Server Key is server-only, never a NEXT_PUBLIC variable. Client Key may be delivered for the Snap browser script. Merchant ID is validated against notifications/status responses. Store credentials only in ignored local environment or deployment secrets. Use bounded network timeouts and redact keys, tokens and customer payloads from logs.

Snap popup callbacks only trigger a refresh of the server booking state. Closing the popup leaves the order pending; it does not cancel a payment or issue a ticket. The booker can reopen an eligible stored token from the booking page.

Notification authentication uses constant-time comparison of SHA512(order_id + status_code + original gross_amount string + Server Key). Because that signature does not cover all fulfillment fields, obtain authoritative status from Midtrans's authenticated GET Status API before financial processing. Validate expected order, merchant, transaction identity, exact amount and IDR; contradictory or unknown results require reconciliation. An absent currency is accepted only where the documented endpoint fixes amounts to IDR; a supplied non-IDR value is rejected.

Success is settlement, or card capture with accepted fraud status. Pending remains pending; challenge requires review; deny/cancel/failure and expire record their provider outcome without downgrading PAID. Refund/partial-refund/unknown statuses require manual review and do not trigger undocumented inventory cancellation. The integration plan must enumerate the exact supported provider response shapes against official documentation.

## Durable event processing

Persist authenticated notification receipts before acknowledging durable acceptance. Store only allowlisted fields required for reconciliation/audit, not unrestricted customer payloads. A signature alone does not authorize inventory mutation. Retryable database errors return a retryable response; invalid signatures are rejected.

Event identity hashes a versioned canonical tuple containing provider, order, transaction ID, transaction status, fraud status, status code and amount. Deduplicate identical transitions while allowing changed statuses for the same order. Store an independently authenticated status observation with its verification time; process that observation rather than trusting mutable notification fields. Unknown orders are rejected without exposing booking data.

Processing is restartable: durable RECEIVED events are claimed with a finite lease, reconciled outside inventory transactions and finalized under the common lock protocol. Failed/retryable events remain recoverable by a bounded maintenance command. Unresolved provider outcomes use capped retries/backoff and remain visible to administration.

## Inventory confirmation and expiry

All availability/hold creation checks must include ACTIVE confirmed assignments in addition to unexpired holds. Create one assignment and per-segment occupancy rows referencing the immutable trip anchors. A unique inventory-anchor key on confirmed occupancy provides a database barrier against overlapping confirmed seats; adjacent intervals remain reusable.

Confirmation locks in the existing company → trip → anchors → hold → booking → payment order. Read actual DB time after waits. Verified success can auto-confirm only with the booking's ACTIVE hold, now before effective expiry, and no competing occupancy. A legitimately initiated order may complete during company suspension and after sales cutoff while its effective hold remains valid.

In one database transaction: record PAID, convert hold, confirm booking, create assignment/occupancy, and issue exactly one ticket. Existing confirmed booking replay returns its existing result. Unique hold/booking/passenger/payment order/assignment/ticket constraints and composite company/trip foreign keys enforce consistency.

Verified success processed after expiry, release or loss of occupancy records payment PAID and booking PAYMENT_CONFLICT with no valid ticket/assignment. Received/provider timestamps are audit only. Expiry cleanup may change a pending booking to EXPIRED, but cannot erase later financial success; late success moves it to PAYMENT_CONFLICT. Failed payment does not extend the hold, and unexpired inventory protection remains until its existing deadline.

## Ticket access and cryptography

Generate a 32-byte cryptographically random opaque token. Persist its unique hash and AES-256-GCM encrypted token with nonce/tag and key version, using a server environment key. Persist ticket, ciphertext and assignment atomically. Stable ciphertext permits the same QR to reopen on another device after booker login. No PII is encoded in the QR.

My Tickets and booking detail authorize the booking's booker, regardless of SELF/OTHER. Confirmed tickets show passenger snapshot, seat, endpoints, trip schedule/vehicle snapshot and QR. Tenant Admin PO and active assigned crew may resolve operational ticket data; public/foreign-account requests cannot reveal it. Super Admin has no automatic tenant PII access. No traveler claim/account transfer or anonymous private-ticket page is introduced.

## Late-conflict administration

Admin PO lists only its company's conflicts. Manual confirmation requires active company, eligible trip, now before interval cutoff and vacant interval after common locks/recheck. It uses the existing PAID payment, creates assignment/ticket atomically and records actor/reason.

Alternatively record a terminal MOCK refund resolution with original paid amount, actor and reason. Booking becomes REFUNDED, payment retains the historical PAID fact, and no assignment/ticket is created. Clearly label that no provider money movement occurred. Resolution retries return existing results; conflicting terminal actions are rejected. Suspended companies still permit conflict reading and mock-refund recording.

## UI and operational setup

Routes: owner `/checkout/[holdId]`, `/bookings/[bookingId]`, `/tickets` and `/tickets/[ticketId]`; guarded Admin PO conflict list/detail/actions; a dedicated Midtrans notification POST endpoint. Names are design routes and may adapt to established repository conventions without changing contracts.

Checkout preserves input on safe retry and communicates pending, provider-unavailable, expired, confirmed and payment-conflict states. Countdown uses server time and is informational. Snap failure/closing never displays a confirmed ticket without server confirmation. Snapshot passenger fields remain immutable after initiation; server polling is the baseline.

For development, configure a public HTTPS tunnel to the dedicated notification endpoint; localhost alone is unreachable by Midtrans. Document the callback URL setup and bounded event-replay/reconciliation command. External tunnel setup and Sandbox test credentials are prerequisites for end-to-end evidence, not evidence obtained by this design.

## Acceptance and verification plan

Meaningful unit/database tests must cover amount/status/signature validation; owner isolation including OTHER; profile not overwritten by OTHER; request-key reuse/different payload; one booking/order per hold; provider timeout/creation lease recovery; grace once; cutoff/expiry after lock waits; event retry/out-of-order/crash recovery; exact amount and merchant mismatch; one assignment/ticket; confirmed occupancy blocking/reuse; late success after reassignment; suspension during initiated payment; mock refund/manual confirmation race and tenant authorization; stable encrypted QR and wrong-owner denial.

Browser evidence: SELF missing-profile completion, OTHER snapshot, keyboard/mobile checkout, Snap popup, Sandbox success with actual notification, refreshed My Tickets on a second authenticated session, popup close/pending, and late-conflict handling. Record unavailable evidence explicitly. Run typecheck, lint, build and relevant regressions once implementation is ready.

## Primary references

- [Adopted foundation](2026-10-06-foundation-design.md), with passenger ownership superseded by the accepted OTHER decision.
- [Scope](../../seatpax/02_MVP_SCOPE.md), [review findings](../../analysis/SEATPAX_SPEC_REVIEW.md), and [existing hold design](2026-10-07-availability-hold-design.md).
- [Midtrans Snap integration](https://docs.midtrans.com/docs/snap-snap-integration-guide).
- [Midtrans notifications](https://docs.midtrans.com/docs/https-notification-webhooks) and [status endpoint](https://docs.midtrans.com/reference/get-transaction-status).
- [Midtrans expiry and same-order behavior](https://docs.midtrans.com/docs/snap-advanced-feature).

Documentation inspected on 8 October 2026. No payment implementation, key storage or Sandbox transaction has been performed by this design work.
