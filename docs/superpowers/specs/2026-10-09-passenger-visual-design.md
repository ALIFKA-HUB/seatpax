# Seatpax visual foundation and passenger experience

Date: 9 October 2026. Status: written specification approved by the user on 9 October 2026. Plan approved and passenger presentation implemented locally. Automated evidence and deferred acceptance: `../../setup/PASSENGER_VISUAL_SETUP.md`.

## Intent and authority

Make the working passenger journey clear, recognizable as Seatpax, and comfortable on a phone. The user finds the current presentation unpleasant and supplied a generated logo identity board. They approved a shared navy/blue visual foundation, followed by passenger screens, then separate Crew and Admin/Super Admin phases. Manual acceptance is deferred while the user is in a meeting.

Authority: `docs/seatpax/00_INDEX.md`, active release in `02_MVP_SCOPE.md`, latest direction in `13_UI_UX_DESIGN.md`, `13A_BRAND_LOGO.md`, and `19_DECISION_LEDGER.md`. Existing availability, checkout/payment and authentication contracts remain authoritative. Earlier examples of guest, group, cash, refunds and operational dashboards do not expand this phase.

This is a redesign preserving the existing product journeys and URLs. Success means a user can identify route, departure, seat, fare, booking state and next action without interpreting internal enum names or development setup text.

## Audit and chosen approach

Audit evidence is the source tree and user-supplied screenshots, not a fresh authenticated browser acceptance run.

| Area | Current finding | Design response |
| --- | --- | --- |
| Brand | Plain uppercase SEATPAX; uploaded board not installed as assets | Consistent supplied horizontal mark and compact symbol |
| Typography | Arial, global large headings and broad section spacing | Scoped type scale and compact journey headings |
| Rhythm | Repeated large cards, loose gaps, global element rules | Shared spacing tokens, intentional page sections |
| Actions | Similar outlined controls for different priorities | One primary action, quiet secondary actions, clear pending state |
| Status | Some internal enum strings exposed directly | Central display labels with semantic badges and explanatory text |
| Home | Development foundation/setup copy | Passenger entry with a clear route to actual search |
| Passenger flow | Search, dynamic seat map, hold, SELF/OTHER, payment and QR work | Preserve handlers, validation and verified state boundaries |
| Role shells | Crew shares Admin shell; Super Admin uses auth cards | Later role-specific phases; isolate passenger CSS now |

Existing visual reading: low variation, minimal motion, inconsistent low density. Target passenger values: DESIGN_VARIANCE 4, MOTION_INTENSITY 2, VISUAL_DENSITY 4. These express clarity and restrained transport branding, not cinematic marketing.

Recommended approach: establish small shared tokens/components and apply them through the passenger journey. A CSS-only refresh would leave inconsistent hierarchy and state presentations. Redesigning all four roles in one pass would increase review scope and operational regression risk. Passenger-first provides a complete coherent journey before the other role layouts change.

Preserve: route slugs and query parameters, existing navigation destinations/labels, form field names/order and autocomplete behavior, real content/data, focus and live-region behavior, domain guards and idempotent actions. Retire development-only home copy and raw presentation of known enum states. There is no measured search-ranking or analytics baseline available; preserve existing metadata and routing, add no SEO claims or fabricated tracking migration.

## Scope and boundaries

This phase covers `/`, `/login`, `/account`, `/trips`, `/trips/[tripId]`, `/holds/[holdId]`, `/checkout/[holdId]`, `/bookings/[bookingId]`, `/tickets` and `/tickets/[ticketId]`, including their existing unavailable, empty and error presentations.

Foundation tokens may be available globally, but redesigned passenger components/styles must be scoped. Admin, Crew and Super Admin retain their layouts and mutations. Their later redesigns reuse the foundation through separate specs/plans.

Excluded: new profile editing, new search filters/sorting, new data projections, guest/group checkout, changing seat/hold/payment rules, new refund behavior, provider-popup redesign, role changes, offline/PWA installation work, dashboards/analytics, maps, reviews, promotions, dark mode, external publication and Figma deliverables.

## Supplied logo and asset preparation

Reference: `.codex-remote-attachments/01a10c3f-c9b9-7ef1-9162-9c919ff61ab4/141d8967-baed-477a-bbec-679290c2cab1/1-1000615956.jpg` in this workspace. This is a raster identity board, not an existing SVG asset bundle.

Use its seat/route/ticket symbol and exact Seatpax wordmark as the identity. Prepare separate horizontal and square raster assets from this supplied reference for the website header and favicon/app metadata. Do not place the entire presentation board in the app, redraw the mark as a different logo, stretch it, recolor its internal geometry or claim raster output is vector artwork. Use an image-editing workflow to prepare assets; inspect fidelity against the reference before adoption. If separation cannot preserve the supplied identity, record the asset problem and request the original individual export rather than invent a replacement.

Primary treatment: navy/blue horizontal mark on white, about 132–160 CSS px wide, with intrinsic dimensions and sufficient clear space. Compact symbol may be used where the full wordmark cannot fit. Linked logo has accessible name Seatpax; decorative duplicate artwork has empty alternative text. Small-size icon legibility is checked at 16, 24 and 32 px. Production vector export remains a later asset improvement, not a promised result of this phase.

## Visual foundation

Use a light theme and the supplied navy/blue direction. Proposed functional tokens:

| Token | Value / use |
| --- | --- |
| Ink / brand navy | `#0A2144` headings and main text |
| Primary | `#005BD1` primary controls and links |
| Primary hover | `#0049AA` |
| Canvas | `#F5F7FA` |
| Surface | `#FFFFFF` |
| Muted text | `#526078` |
| Border | `#D5DFEA` decorative separators; controls need stronger visible boundaries |
| Success | `#166534` text with `#F0FDF4` surface |
| Warning | `#92400E` text with `#FFFBEB` surface |
| Danger | `#B91C1C` text with `#FEF2F2` surface |

These UI colors are chosen for hierarchy and contrast; they are not asserted to be exact pixel samples of the raster logo. Verify text/control contrast before shipping and strengthen borders where needed. State always includes a label or icon, never color alone.

Typography: Geist sans, locally served through the existing Next font mechanism, with system sans fallback. No remote font request required during normal page visits. Body 16px/1.5; small helper text 14px; desktop page headings 32–40px and mobile 28–32px. Use tabular numbers for fares, departure times, seat codes and countdowns. Avoid all-caps body headings and oversized marketing typography in transactional pages.

Spacing uses 4/8px increments. Radius: controls 8px, cards 12px. Shadows limited to a restrained raised panel; borders and spacing provide most structure. Passenger container max 1120px, horizontal gutter 16px mobile / 24px larger screens. Main controls minimum 44px tall. Mobile uses one column; wider checkout/detail screens can use content plus a roughly 320px summary column. No horizontal page overflow at 320px. Wide seat layouts alone can scroll inside their labeled container.

Functional transitions only: color/border/opacity around 120–180ms, honoring reduced motion. No scroll hijacking, parallax, animated payment countdown decoration or large animation dependencies.

## Shared presentation architecture

Keep domain modules/services and server authorization intact. Add a small presentation layer for Brand, PassengerShell, button styles, StatusBadge, journey summary and empty/error panels. Components take only existing safe page data; no database access or business decision is moved into a styling component.

Keep the existing native React/Next forms and CSS/Tailwind foundation. This phase does not adopt an unrelated enterprise component system or add a broad UI dependency. Scope passenger styles so global `section`, heading, anchor and button rules do not reshape Admin/Crew screens. Root fonts/tokens require a visual smoke check of those existing screens.

Server components retain data reads and redirects. Existing client components retain state, busy guards, request keys, polling visibility rules, server-derived deadlines and Snap callbacks. Share display formatters/labels where useful, without turning them into a second domain state machine.

## Screen design

### Home, shell and account

Home becomes a compact passenger entry: supplied logo, concise journey headline, one primary Cari perjalanan link to `/trips`, and existing Tiket saya/Akun destinations. Remove the setup checklist and Development framing. No invented destinations, operators, prices, reviews or usage statistics. Search remains the existing `/trips` form rather than a second form with different behavior.

Passenger navigation consistently exposes home through the linked brand, Cari perjalanan, Tiket saya and Akun saya using existing routes. Mobile wraps into a compact accessible header rather than hiding actions behind an unimplemented menu. A selected-route indication is visible without color alone. Login remains a focused form; account displays verified email, My Tickets, existing membership-dependent operational links and logout. No editable profile form is introduced.

### Login

Preserve the email step, code step, resend cooldown, change-email action, safe return destination, busy guard, focus transfer and accessible result messages. Improve labels, visual hierarchy and spacing.

The configured OTP is currently **8 digits** in `modules/auth/service.ts`. The earlier request for six digits and one box per digit is recorded as deferred auth work. This phase preserves the configured length and single semantic input; it must not render six boxes over an eight-digit contract. Any later six-digit/segmented-input change needs aligned provider configuration and an independently approved auth change.

### Search and results

Keep origin → destination → date order and existing query parameter contract. Show the date timezone clearly as WIB. On wide screens the search form sits in a horizontal panel; on mobile fields stack in the same order. Each real TripCard prioritizes route, departure, operator/class, fare and available-seat count, with Lihat kursi as its main action. No artificial urgency or live-data claim.

Distinct initial state, valid search with no results, invalid/unavailable search and results. Preserve entered values on existing recoverable failures. Do not hide errors behind a blank results area.

### Trip detail and seat selection

Use route/departure summary, ordered stop schedule and the full immutable layout snapshot. Preserve every cell's row/column position and existing non-seat types; no fixed bus illustration substituted for the actual layout. Label the front and render seat code clearly. Legend shows available, selected, held and booked states with text and visual differentiation.

Only available seats are selectable while sale is open. Selection is visibly distinct and keyboard accessible with current pressed/disabled semantics. Selecting a seat does not imply a successful hold. Show selected seat/fare and the existing Tahan kursi 10 menit action; unauthenticated users retain the login-and-return path. A seat becoming unavailable disables continuation under existing rules and presents the current service message. Wide layouts scroll within the seat region without shrinking touch targets below 44px.

### Hold and checkout

Hold view places seat, segment, fare, expiry and remaining time together. Countdown remains based on server-derived time, not a new client extension. Primary action is Lanjutkan checkout; release and refresh are secondary. Expired/released states explain the next existing route back to seat selection. No automatic release/checkout is added.

Checkout shows summary and total alongside the existing SELF/OTHER choice. SELF keeps the profile-populated name/phone fields; OTHER keeps the actual traveler fields and existing validation. Preserve field order and the distinction between booker and traveler. Explain that another traveler's information does not alter the account profile. Continue explicitly to payment; neither choosing SELF nor closing Snap implies payment success or issues a ticket.

Disable controls during the existing pending/initiated states and retain safe retry messaging for unknown results. Once booking exists, show its current status and existing reopen-payment/booking links. Never add a second active submission control or reset request identity for cosmetic rerenders.

### Booking/payment state

Render known states in Indonesian: PENDING_PAYMENT → Menunggu pembayaran; CONFIRMED → Dikonfirmasi; PAYMENT_CONFLICT → Pembayaran perlu ditinjau; EXPIRED → Waktu pembayaran habis; REFUNDED → Refund simulasi tercatat. Keep unknown/provider-review messages honest and do not map them to success.

Pending shows Buka pembayaran and a secondary refresh. Confirmed with a real ticket exposes Buka tiket dan QR. Conflict states explicitly say ticket is not issued yet. Mock refund continues to state that money was not returned by the provider. Polling/server reconciliation stays authoritative; Snap's UI callback alone never displays confirmed success. The third-party Snap dialog is not restyled or replaced.

### My Tickets and ticket QR

My Tickets lists actual owned tickets with route, departure, passenger, seat and status, each linking to its existing detail URL. Empty state links to Cari perjalanan. Preserve booker ownership for OTHER purchases and do not expose traveler claim/sharing functionality.

Ticket detail prioritizes route, departure/WIB, passenger, seat and vehicle information already returned by the service. Show the issued QR at a comfortable readable size with its quiet zone and white background intact; no decorative logo overlay, gradients or altered token. Keep the boarding instruction and existing ticket lifecycle restrictions. QR remains accessible only through the existing verified ownership checks.

## Accessibility, state and privacy

Every relevant screen includes the existing loading, empty, success, failure, disabled, permission-denied and network-recovery paths. Use visible labels, proper heading order, focus rings, accessible status regions and errors associated with their fields. Keyboard operation and 200% zoom must remain usable. Do not continuously announce the countdown every second or remount inputs during pending state. Recovery must not create an accidental duplicate action.

No added sensitive-data projection, client secret, log of passenger/QR content or third-party analytics. Client presentation hides no server authorization requirement. Preserve logout and protected-route redirects. Do not take authenticated screenshots exposing another user's data for a design artifact.

## Acceptance and verification

Implementation verification, after plan approval: existing unit regression suite, lint, type checking and production build; focused presentation/state tests where labels/components introduce behavior. No database/schema migration is needed for this visual phase. Domain integration verification is rerun only if implementation actually touches those contracts.

Visual coverage: 320/390px mobile and 1280/1440px desktop for search, seat selection, checkout, payment pending/confirmed/conflict and ticket QR; logo small-size inspection; keyboard/focus/contrast and 200% zoom checks. Review existing operational shells after global font/token changes. Record which checks were actually performed and any missing authenticated state coverage.

User testing on a physical phone, physical QR/camera acceptance and manual payment acceptance remain deferred until the user is available. This deferral is a recorded limit, not a passing result. No deployment or external publication follows from approval of this spec.

## Decisions and handoff

The user approved the written specification, including tokens, screen composition and implementation boundaries, on 9 October 2026. Crew and Admin/Super Admin visual redesigns follow separate cycles. The outstanding six-digit OTP request stays explicit and separate. The implementation plan covers asset preparation, scoped foundation, passenger pages and verification in that order; implementation awaits its review.
