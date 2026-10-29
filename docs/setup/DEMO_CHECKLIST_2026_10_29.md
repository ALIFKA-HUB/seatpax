# Seatpax demo and verification checklist

## Goal and boundary

Repeat the existing single-company demo with truthful evidence. No SaaS onboarding, billing, Flutter, offline sync, real refunds or new product policy. The user authorized autonomous execution of remaining roadmap tasks and verified per-package push on 29 October.

## Start

1. Node >=26, `npm ci`; preserve an existing ignored `.env.local`.
2. Follow SUPABASE_DEV_SETUP, CHECKOUT_PAYMENT_SETUP and HELPDESK_SETUP for development configuration. Do not migrate/seed/reset merely to view the UI.
3. Start `npm run dev -- --webpack --port 3001` only if no listener exists. Use the trusted CA where required; do not disable TLS.
4. `/login`: existing testing presets only on development localhost with explicit DEV_QUICK_LOGIN opt-in. Public/production keep OTP. Account list and limits: LOCAL_QUICK_LOGIN_SETUP.md.

## Demo order

| Role | Entry | Demonstration | Actual acceptance needed |
| --- | --- | --- | --- |
| Customer | `/` then `/trips` | Hero/search, discovery, seat, SELF/OTHER checkout, Pesanan saya | Configured test trip, hold, Midtrans Sandbox and confirmed QR |
| Admin operasional | `/admin` | Locations, ordered route/fare, fleet/layout, draft/published schedule | Labelled fixtures; no invented real company locations |
| Helpdesk | `/helpdesk` | Totals/queue/events, Pengaduan filters, details, priority and lifecycle | Helpdesk handles; admin monitoring stays read-only in admin context |
| Guest reporter | `/pengaduan/buat`, `/pengaduan/cek` | Submit, track, email-bound supplementation | Approved recipient; inbox acceptance distinct from provider acceptance |
| Crew web | `/crew` | Assigned trip, manifest/manual lookup, separate boarding/snack | Authorized ticket and real phone-camera checks |

## Automated gate

`npm test -- --maxWorkers=2`, `npm run lint`, `npm run build -- --webpack`, `npm run typecheck` (after generated route types exist).

GitHub Actions runs non-provider checks without credentials. A pushed workflow is not evidence its hosted run passed; inspect Actions. Default Turbopack may reject the managed worktree's external node_modules symlink; Webpack is an explicit verification path.

Database/provider tests require documented isolated development fixtures. Never run global payment reconciliation, email drains or cleanup as a smoke test. Mocks/source checks do not prove provider delivery, camera or a complete real browser flow.

## Evidence and recovery

Use FLOW_ACCEPTANCE_2026_10_29.md for blocked/observed flows and RESPONSIVE_AUDIT_2026_10_29.md for layout coverage. Record device/browser/date/SHA/expected/actual per check.

- Missing trips: inspect configured company/date/published fixtures; do not manufacture production journeys.
- Database delay: verify connectivity and existing recovery states; do not blame animation without measurement.
- Pending payment: use existing provider verification; never mark paid for presentation.
- Email delay: inspect job state; retry an eligible failed job, preserving case/event. Inbox delivery requires independent confirmation.
- Expired external download manager: leave acceptance blocked instead of changing security/licensing.
- Computer Use geometry/URL-policy failure: stop input, record blocker. Headless layout tests are not Computer Use or physical-device acceptance.

## Delivery

Review staged files, run checks, commit meaningful changes and push approved branch. Integrate verified changes into main without rewriting history, verify refs, preserve local secrets/generated/user-attachment edits. Deployment remains a separate decision.
