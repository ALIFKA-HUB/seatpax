# Seatpax passenger landing delivery

## Passenger navbar follow-up

The approved floating white/text-only active navigation is implemented in the shared passenger shell. See [navbar delivery and evidence](PASSENGER_NAVBAR_SETUP.md), including current live availability timeout and boundaries of the rendered verification.

## Verification follow-up

The user explicitly requested verification after the white photo implementation. See [21 October verification evidence](LANDING_VERIFICATION_2026_10_21.md) for passing quality commands, desktop/tablet/phone browser emulation, test fixture repairs and Computer Use helper failure/fallback. The earlier testing deferral statements below describe previous delivery status; physical-device and populated real-schedule acceptance remain pending.

## White photo revision, 21 October 2026

User approved the two-reference adaptation (D2026-10-21-03). Current source replaces the compact split hero with a wide road photograph and contrast scrim, concise copy, lightly overlapping desktop search, an explicitly empty route showcase, four-part booking explanation, supporting photo/benefits and FAQ. Background and semantic colors are locked light/white even under system dark preference. Actual logo/nav/query contracts remain; no dependencies or backend changes. Search location options still use the existing actual service. Showcase wording describes what is displayed, not whether inventory exists. No route examples or fabricated fares/reviews were added.

CSS explicitly defines desktop, tablet and phone layouts. A fresh GPT-6 Luna medium source reviewer requested removal of the phone panel's negative top margin; phone margin is now zero. Other reviewed areas had no high-confidence important source finding. This is source review, not rendered acceptance or proof of visual contrast/fit. Tests, build, lint, typecheck, Lighthouse and browser/device checks were not run because user deferred testing. Source changes are on the landing branch; no merge or push performed.

The earlier delivery notes below describe the previous composition and are historical where this revision differs (notably system dark palette and populated point showcase).

Date:21October2026. Branch:`codex/seatpax-landing`, base main689836f. Implementation commit:f9ee916.
Worktree:`C:/Users/ASUS/.codex/worktrees/seatpax-landing/SeatPax`.

## Scope delivered

User approved the in-chat bounded design and requested continuation. Homepage replaces oversized text-only introduction with a compact branded hero and two locally stored illustrative road photographs. Existing actual Seatpax logo and passenger navigation are retained. The landing modifier on PassengerShell scopes the styling and leaves other pages on their existing presentation.

Search uses existing `from`, `to`, `date` GET parameters for `/trips`, proper labels, native controls, same-origin/destination and partial-selection errors, stable client fields and pending feedback. Both points empty means existing date-based discovery; actual published-snapshot locations populate options. No fake city IDs, prices, reviews, fleet facilities, company statistics or phone/email contacts are added.

Available cities/points come from the existing availability service. Loading uses structural skeletons and Suspense; failed/missing source data has explicit states. Information sections cover current seat selection, payment-confirmed ticket/QR, departure preparation and SELF/OTHER booking. Fleet details are linked through existing journey pages; no original Seatpax fleet photographs/contact information were provided. Stock road photos are labelled illustrative and credited. See `public/landing/SOURCES.md` for license/source URLs.

CSS has desktop/tablet/mobile grids, phone stacked search, existing bottom navigation, scoped system dark palette, visible focus and reduced-motion-aware feedback. Header and query/path contracts preserved. Metadata is homepage-specific. No dependencies installed, migrations run, company selected, roles/data changed or SaaS feature enabled.

## Preview

Server on localhost3001 was moved from the billing worktree to this main-derived landing worktree. Run with Webpack because the shared node_modules junction points outside Turbopack's filesystem root. Trusted development CA is supplied to Node; credentials remain ignored in `.env.local`.

```powershell
$env:NODE_EXTRA_CA_CERTS='C:/Users/ASUS/Downloads/prod-ca-2021.crt'
node node_modules/next/dist/bin/next dev --webpack --port 3001
```

The initial page compile can take time. This delivery does not merge to main or alter the unrelated main `next-env.d.ts` change/attachments. Automatic merged/released claims are not made.

## Verification limits

One fresh GPT-6 Luna medium source reviewer reported no high-confidence important issue and confirmed search parameter compatibility/scoped styles. No tests added/run; no build/typecheck/lint/Lighthouse/browser/physical-device acceptance run because testing is still deferred. CSS source review is not proof of rendered dark-mode contrast, viewport fit or runtime behavior. Preview serving is not end-to-end acceptance.

Pending: real desktop/tablet/phone appearance, light/dark/focus/keyboard/date-picker fit; form validation/pending/back behavior; DB unavailable/empty/populated states; real image load/optimization and actual Core Web Vitals. Source-review findings are not a passing-test claim.

## Existing limitation retained

The earlier SaaS audit found main discovery spans all eligible active companies and no operational company has been designated. Landing reuses that service; it does not silently select a company or claim to solve tenant scoping. Database migration0012 Free already exists on development although main-derived journal ends0011; no migration action performed here. Keep the Free/billing branch separate, and resolve baseline/operational company under a later explicit plan. Preserve existing paid ticket access and security checks.
