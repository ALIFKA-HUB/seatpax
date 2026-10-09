# Passenger Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Preserve the established inline execution method; one final focused reviewer.

**Goal:** Apply the supplied Seatpax identity and a coherent mobile-first visual system to the existing passenger journey from home to issued QR ticket.

**Architecture:** Small reusable presentation components consume existing safe page data; scoped passenger CSS owns layout and controls. Existing server reads, domain services, action inputs, client state machines, request identities and payment reconciliation remain intact. Prepare faithful raster brand assets before using them.

**Tech Stack:** Existing Next.js/React, TypeScript, native forms, CSS/Tailwind and Vitest; Geist through Next fonts. No broad UI/animation dependency, schema migration or new data projection.

**Spec:** `../specs/2026-10-09-passenger-visual-design.md`, approved by the user on 9 October 2026. Plan approved by the user; implementation and automated checks completed. See `../../setup/PASSENGER_VISUAL_SETUP.md` for evidence and deferred acceptance.

## Global Constraints

- Existing route slugs, query parameters, form field names/order, autocomplete, redirects, current domain contracts and operational layouts are preserved.
- One passenger/seat, logged-in booker, SELF/OTHER and booker-owned My Tickets remain the active release contract.
- OTP remains one semantic input using `EMAIL_OTP_LENGTH = 8`; six-digit/segmented OTP remains a separate change.
- Colors: ink `#0A2144`, primary `#005BD1`, hover `#0049AA`, canvas `#F5F7FA`, white surface, muted `#526078`, decorative border `#D5DFEA`, success `#166534/#F0FDF4`, warning `#92400E/#FFFBEB`, danger `#B91C1C/#FEF2F2`.
- Geist with system sans fallback; body 16px/1.5, helper 14px, desktop heading 32–40px, mobile 28–32px, tabular journey numbers.
- Controls radius 8px, cards 12px, spacing multiples of 4/8px, container max 1120px, gutters 16px mobile/24px larger, main targets minimum 44px, transitions 120–180ms with reduced-motion support.
- At 320px no page overflow; wide actual seat layouts scroll in their own labeled region with 44px minimum seat targets.
- Image edits use image generation/editing tooling with the supplied local reference. No invented logo/SVG, no board-as-header, no QR overlay or altered opaque token.
- Native inline work in an isolated managed worktree; reuse a suitable attached worktree after inspection. Never include existing `next-env.d.ts` edits, user attachments, ignored environment secrets or temporary previews in a commit.
- Local integration follows existing authorization; no push, deployment or external publication. Automated implementation checks are separate from deferred physical-phone/camera/user payment acceptance.
- Any reviewer uses `gpt-6-luna`, medium reasoning, focused context; the requested primary setting is `gpt-6.1-sol`, medium, with any runtime limitation reported honestly.

## Review Focus

1. Long names/email/seat codes and a wide bus grid at 320px: text wraps and only the seat region scrolls (Tasks 2, 4, 6).
2. Unknown status/provider review or a confirmed booking missing its ticket: never present success or an invented ticket link (Tasks 2, 5).
3. Cosmetic rerender while checkout result is unknown: preserve request key/busy guard and the same retry semantics (Task 5).
4. Selected seat becomes held/booked after refresh: disable continuation and retain correct cell order/state labels (Task 4).
5. Global font/token changes reach Admin/Crew/Super Admin: keep their control/layout rules and check their rendered shells (Tasks 2, 6).

## File Map and Interfaces

- `public/brand/seatpax-horizontal.png`, `public/brand/seatpax-icon.png`: faithful raster assets; dimensions inspected after editing.
- `app/components/brand.tsx`: `Brand({compact?:boolean,href?:string})`, linked image named Seatpax, defaults `/`.
- `app/components/passenger-shell.tsx`: `PassengerShell({children:ReactNode,active?:'search'|'tickets'|'account',focused?:boolean})`; stable navigation and scoped root class.
- `app/components/status-badge.tsx`: `StatusBadge({label:string,tone:'neutral'|'success'|'warning'|'danger'})`; accessible visible text.
- `app/components/journey-summary.tsx`: `JourneySummary({fromName:string,toName:string,departureAt:string,seatCode?:string,fare?:string,operator?:string,className?:string})`; presentation only.
- `app/components/state-panel.tsx`: `StatePanel({title:string,children?:ReactNode,action?:ReactNode,tone?:'neutral'|'danger'})`; empty/error recovery presentation.
- `app/presentation.ts`: `formatIdr(amount:string):string`, `formatDepartureWib(iso:string):string`, `bookingPresentation(status:string):{label:string,tone:BadgeTone}`, `holdPresentation(status:string):{label:string,tone:BadgeTone}`. `BadgeTone` is exported here. Unknown states return neutral `Status perlu diperiksa`.
- `app/passenger.css`: passenger/auth presentation scoped under `.passenger-shell`; shared `.sp-*` component classes; no global operational selectors.
- `app/globals.css`, `app/layout.tsx`: tokens and font variable/icon metadata, keeping existing metadata/lang and operational CSS compatible.
- Existing page/client component files below: consume those interfaces while retaining their reads, hooks, actions and validation.
- Unit rendering tests use `react-dom/server` and `React.createElement` in `.test.ts`, compatible with the existing node Vitest configuration; no new DOM test framework is needed.

## Task 1: Brand assets and accessible brand component

**Files:** Create `public/brand/seatpax-horizontal.png`, `public/brand/seatpax-icon.png`, `app/components/brand.tsx`, `tests/unit/passenger-brand.test.ts`; modify `app/layout.tsx` for icon metadata only.

**Consumes:** Supplied local reference `.codex-remote-attachments/01a10c3f-c9b9-7ef1-9162-9c919ff61ab4/141d8967-baed-477a-bbec-679290c2cab1/1-1000615956.jpg`.
**Produces:** `Brand` and raster assets from File Map.

- [x] Inspect the existing worktree/artifacts and clean baseline; record the user's existing `next-env.d.ts` hash and attachment status before edits. Read using-git-worktrees and reuse/register a suitable isolated checkout at current main; environment values remain ignored and unprinted.
- [x] View the local logo, then use the image editing tool to isolate the supplied horizontal lockup and square icon onto appropriate clean backgrounds, preserving exact wordmark/symbol identity. Save only inspected outputs under `public/brand`; do not create a new design. If fidelity fails, continue independent foundation work but leave brand adoption explicitly incomplete pending original individual assets.
- [x] Write `brand_has_named_link_and_intrinsic_image_dimensions`: static-render default/compact `Brand`, assert link `/`, accessible name Seatpax, correct corresponding asset path and positive intrinsic width/height. Assert decorative image inside named link has `alt=""`, no repeated board or arbitrary external image URL.
- [x] Run `npm test -- tests/unit/passenger-brand.test.ts`; expect RED for absent component, not unrelated tool failure.
- [x] Implement `Brand` with measured raster dimensions, display width 132–160px for horizontal, compact square and aspect ratio preserved. Set metadata icon path without replacing existing title/description.
- [x] Run the focused test; require PASS. Inspect source/output side-by-side and icon at 16/24/32px; record fidelity/small-size findings. Commit explicit Task 1 files: `feat: prepare Seatpax brand assets`.

## Task 2: Scoped foundation, display helpers and shared components

**Files:** Create `app/presentation.ts`, `app/components/passenger-shell.tsx`, `app/components/status-badge.tsx`, `app/components/journey-summary.tsx`, `app/components/state-panel.tsx`, `tests/unit/passenger-presentation.test.ts`, `tests/unit/passenger-components.test.ts`; modify `app/globals.css`, `app/passenger.css`, `app/layout.tsx`.

**Consumes:** Task 1 `Brand`; existing CSS and native controls.
**Produces:** Remaining File Map interfaces and scoped design tokens/classes.

- [x] Write helper tests: `formatIdr('60000') === 'Rp 60.000'`; `formatIdr('9007199254740993') === 'Rp 9.007.199.254.740.993'` (no Number precision loss). For `2026-10-09T01:00:00.000Z`, assert formatted output contains `08.00` and `WIB`. Assert each spec booking label/tone; unknown `UNRECOGNIZED` is neutral `Status perlu diperiksa`. Assert hold ACTIVE/EXPIRED/RELEASED have honest Indonesian labels and unknown is neutral.
- [x] Write static component tests: active nav has `aria-current="page"` and existing `/trips`, `/tickets`, `/account` links; focused shell still has named brand and content. Journey summary renders supplied long route, `01`, exact fare and departure as text, without truncating data or injecting HTML. StatePanel exposes its title and supplied recovery link. StatusBadge has visible label independent of tone.
- [x] Run `npm test -- tests/unit/passenger-presentation.test.ts tests/unit/passenger-components.test.ts`; expect RED for missing interfaces.
- [x] Implement exported helpers/components from File Map; IDR uses bigint with Indonesian formatting, time explicitly uses Asia/Jakarta, statuses map only display labels and never determine booking actions.
- [x] Add exact spec tokens/font scale/radius/spacing and scoped controls. Use `#7D8FA8` for control boundaries where decorative border lacks contrast; verify focus and actual contrast. Override global heading/section/anchor rules inside passenger shell; preserve operational selectors and existing legacy variables. Install no broad UI/motion library.
- [x] Load Geist through `next/font` with font variable on root; preserve system fallback and metadata. If font build download fails, resolve deterministic font delivery before completion rather than claiming success with changed typography.
- [x] Run focused tests, typecheck and lint; require PASS. Inspect CSS diff to ensure no new unscoped passenger element selector changes operational control behavior. Commit explicit files: `feat: add scoped passenger visual foundation`.

## Task 3: Passenger entry, authentication, account and search

**Files:** Modify `app/page.tsx`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/account/page.tsx`, `app/account/logout-form.tsx`, `app/trips/page.tsx`, `app/trips/components/search-form.tsx`, `app/passenger.css`; create `app/components/trip-card.tsx`, `tests/unit/passenger-entry.test.ts`.

**Consumes:** Task 2 shell/presentation/components. **Produces:** `TripCard({trip:SearchResult})`, importing the existing exported `SearchResult` from `modules/inventory/types.ts` without creating a second domain shape.

- [x] Inspect actual availability result type and current form fields. Write static entry/TripCard tests with synthetic data: primary home CTA `/trips`, existing ticket/account links, no Development/setup checklist. TripCard displays real operator/class, seat count including zero, precise fare and preserves `/trips/{id}?from={fromStopId}&to={toStopId}`.
- [x] Run `npm test -- tests/unit/passenger-entry.test.ts`; expect RED against current entry or absent component.
- [x] Replace home setup content with exact headline `Perjalanan Anda, mulai dari satu kursi.` and primary `Cari perjalanan`, plus existing destinations. Use Brand/Shell without fake marketing data or duplicate search logic.
- [x] Apply focused shell/forms to login and account, maintaining verified-email/role links and logout. Preserve code input length, current label association/autocomplete, focus ref, cooldown and safe return path; keep operational membership checks on the server.
- [x] Apply search shell/form/results using TripCard; field order origin/destination/date and existing IDs/names retained. Recoverable unavailable search still renders the entered controls and an explicit error panel; initial/no-results states remain distinct.
- [x] Run new tests plus `npm test -- tests/unit/auth-login-state.test.ts tests/unit/auth-actions.test.ts tests/unit/auth-service.test.ts`; require PASS. Check rendered HTML input order and OTP maxLength 8. Commit explicit files: `feat: redesign passenger entry and trip search`.

## Task 4: Trip seat selection and hold presentation

**Files:** Modify `app/trips/[tripId]/page.tsx`, `app/trips/components/seat-selection.tsx`, `app/holds/[holdId]/page.tsx`, `app/holds/components/hold-detail.tsx`, `app/passenger.css`; create `tests/unit/passenger-seat-view.test.ts`.

**Consumes:** Existing AvailabilityView/HoldView, Task 2 display helpers. **Produces:** Restyled existing SeatSelection/HoldDetail interfaces, unchanged action contracts.

- [x] Write static SeatSelection tests with a complete fixture containing available/held/booked cells and DRIVER/AISLE/DOOR/EMPTY/FACILITY. Assert each snapshotted position is rendered in order, unavailable seats disabled, meaningful labels and pressed state retained; sale closed disables continuation. Assert unauthenticated login return includes the existing trip interval. Pin long seat-code text and wide grid wrapper label without clipping semantic content.
- [x] Run `npm test -- tests/unit/passenger-seat-view.test.ts`; expect RED for new accessible legend/wrapper presentation assertions. Run existing `inventory-ui-state.test.ts` to record polling/request-identity/deadline baseline. These existing tests do not exercise browser selection after refresh; that case requires rendered interaction evidence in Task 6.
- [x] Apply trip summary/schedule/seat legend and selection summary using the full actual layout. Maintain existing busy/requestKey/polling/selection behavior and 64px layout cells or equivalent targets at least 44px; use an isolated scroll container, not a fixed illustration.
- [x] Apply HoldDetail summary/badge/server countdown and existing checkout/release/refresh actions. Preserve deadline helper and expiry read; do not announce each tick or create an extra checkout trigger. Expired/released views expose the existing recovery route.
- [x] Run new tests and `npm test -- tests/unit/inventory-ui-state.test.ts tests/unit/inventory-deadline.test.ts tests/unit/inventory-actions.test.ts`; require PASS. Check no inventory/service/guard file changed. Commit explicit files: `feat: polish seat selection and hold screens`.

## Task 5: Checkout, booking states and issued tickets

**Files:** Modify `app/checkout/[holdId]/page.tsx`, `app/checkout/components/checkout-form.tsx`, `app/bookings/[bookingId]/page.tsx`, `app/bookings/components/booking-status.tsx`, `app/tickets/page.tsx`, `app/tickets/[ticketId]/page.tsx`, `app/passenger.css`; create `app/components/booking-outcome.tsx`, `app/components/ticket-card.tsx`, `tests/unit/passenger-payment-view.test.ts`, `tests/unit/passenger-ticket-view.test.ts`.

**Consumes:** `BookingView` from `modules/booking/types.ts`, `TicketView` from `modules/ticket/service.ts` through a type-only import, and Task 2 helpers. **Produces:** `BookingOutcome({booking:BookingView})` renders the explanatory state and valid existing ticket link only; `TicketCard({ticket:TicketView})` uses the existing ticket data type without projecting new fields. Existing BookingStatus continues to own pay/refresh/polling and renders BookingOutcome.

- [x] Write BookingOutcome static tests: pending lacks ticket link; CONFIRMED+real ticket links to `/tickets/{id}`; CONFIRMED+null ticket lacks link; PAYMENT_CONFLICT says ticket not issued; REFUNDED states simulation does not return money; unknown status remains neutral and lacks ticket link. Use exact fixture shapes from existing types, not new domain enums.
- [x] Write TicketCard tests for actual passenger/seat/departure/fare where provided, long names, owned detail URL and refunded label. Inspect QR source and pin existing opaque token/error-correction generation and lifecycle gate; tests must not log real tokens or use a fake QR in production.
- [x] Run focused tests; expect RED for missing presentation components. Record existing checkout-ui-state test PASS before cosmetic edits.
- [x] Apply checkout two-column/stacked layout and existing SELF/OTHER fields, retaining hook ordering, busyRef, intent fingerprint/request key, retry behavior, field disable rules and Snap client. All submit/reopen controls retain one active path. Profile fields remain editable as currently supported; add no account editor.
- [x] Apply booking summary and BookingOutcome, map all displayed known enums through helpers, preserve exact simulation warning and server reconciliation/polling. Leave Snap UI/client callback semantics intact.
- [x] Apply My Tickets and ticket detail shell/components, including actual departure timestamp already available in snapshot. Maintain server ownership/confirmed QR gate and white quiet zone. Do not alter QR token, add decorative overlays, download/share features or expose traveler claim.
- [x] Run new tests plus `npm test -- tests/unit/checkout-ui-state.test.ts tests/unit/checkout-actions.test.ts tests/unit/ticket-crypto.test.ts`; require PASS. Review diff for changed request identity, callbacks, redirects, reads or projections and undo any unapproved behavioral change. Commit explicit files: `feat: redesign passenger checkout and ticket views`.

## Task 6: Verification, review and local integration

**Files:** Create `docs/setup/PASSENGER_VISUAL_SETUP.md`; update approved spec/plan statuses, `docs/seatpax/00_INDEX.md`, `13_UI_UX_DESIGN.md`, `13A_BRAND_LOGO.md`, `19_DECISION_LEDGER.md` with actual outcomes only. Any fixes stay in the owning Task files/tests.

- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, then `npm run build` against the final worktree state; record commands, counts and actual output. If a domain/service contract changed, stop and resolve scope before required focused integration tests. Do not run database migrations for styling.
- [ ] Preview build on the existing agreed local port after checking ownership of the running process. Inspect search/seat/checkout/payment/ticket at 320/390 and 1280/1440px; check 200% zoom, long content, keyboard/focus, semantic status, contrast, reduced motion and image aspect ratio. Specifically verify an availability refresh changing a selected seat to HELD/BOOKED disables hold continuation, and an uncertain checkout rerender retains the same retry identity. Authenticated coverage uses an available authorized session; unavailable states are recorded pending without asking the meeting user to log in. A clearly labeled local synthetic component preview may provide visual layout evidence, but never counts as service/payment/authorization acceptance and adds no fixture route to the product.
- [ ] Inspect Admin/Crew/Super Admin shells for inherited font/token regressions; verify their layouts, navigation/controls and business code are unchanged. Record any inaccessible authenticated state rather than inventing a pass. Physical phone/camera and user payment acceptance remain deferred.
- [x] Request one focused final code reviewer with `gpt-6-luna`, medium reasoning and repository/spec/plan/diff context. Review focus: scoped CSS, faithful assets, accessibility, preserved actions/request identities, lifecycle labels and verified ticket gates. Resolve findings with regression evidence; no review-per-task fan-out.
- [x] Write setup evidence and deferred checks. Mark only finished checkboxes, synchronize actual brand asset status and latest visual direction, and commit explicit implementation/docs files.
- [x] With existing local-integration authorization, merge into local main only after required verification passes. Preserve original user dirty-file bytes and attachments; run merged unit/type/lint/build verification and record results. Leave a usable local preview, no push/deploy.

## Plan Self-Review and Handoff

Coverage: Task 1 brand; Task 2 tokens/components/font/state labels; Task 3 entry/auth/account/search; Task 4 seat/hold; Task 5 checkout/payment/ticket; Task 6 responsive/accessibility/operational regression/review/evidence. Review Focus items are pinned in helper/static tests, existing behavior tests and explicit rendered inspection; static markup tests do not prove browser focus interaction or payment correctness.

Execution used the preserved native inline method through executing-plans, followed by one focused reviewer. User approved this plan before execution. Six-digit OTP, Crew/Admin redesigns and deferred manual acceptance remain distinct follow-up work.

Rendered checks above are partially complete: synthetic responsive/keyboard/QR evidence passed; 200% zoom, actual authenticated role rendering and physical/user acceptance remain pending as recorded in setup. Unchecked acceptance boxes are intentional.
