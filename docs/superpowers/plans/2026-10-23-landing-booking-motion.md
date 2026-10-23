# Landing Booking Motion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. The user approved the interactive studies and explicitly requested execution; do not introduce another approval gate.

**Goal:** Integrate the two accepted booking illustrations into the real landing while preserving its hero and existing route animation.

**Architecture:** Render static, readable JSX in a client leaf. A local native-animation controller owns measured timelines and lifecycle; React only receives interaction/phase transitions. Keep the marketing composition in the existing server page.

**Tech Stack:** Existing Next.js/React/TypeScript, Phosphor icons, native Web Animations, IntersectionObserver and ResizeObserver; no added dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-landing-booking-motion.md`.

## Global constraints

- White, actual Seatpax logo and existing Jakarta typeface, navy text and blue actions.
- Preserve hero, journey planner/showcase, route animation, benefits, FAQ, footer and booking/auth contracts.
- Only the two accepted studies are implemented. No dummy route, fare, passenger or active QR.
- Native controls, reduced-motion/static fallback, hidden/offscreen pause, font/width remeasurement and effect cleanup.
- No test suites are added/run in this slice, following the developer instruction. Use typecheck, scoped lint and visual inspection; state physical-device limitations.

## Review focus

1. Leaving the viewport or hiding the tab pauses an unfinished illustration without losing its intended stop.
2. Width/font changes and unmounts do not duplicate native animations or observers.
3. Reduced motion and no animation APIs expose useful static content.
4. Rapid taps/keyboard input cannot skip the payment stop or create overlapping playback.
5. Container widths 320px through desktop keep cards readable, interactive and non-intersecting at depth crossover.

### Task 1: Native illustration components

**Files:** Create `app/landing/booking-motion.tsx`, `booking-motion.css`, `booking-motion-timeline.ts`.

**Interfaces:** `BookingMotion({kind: 'seat' | 'deck'})`; `mountBookingMotion(field, kind, onChange)` returns `toggle()`, `advance()`, `restart()`, `dispose()`.

- [x] Render the accepted seat map/ticket and three cards using existing brand/icons; keep static fallback useful.
- [x] Port the approved morph and continuous side-arc timelines; preserve a single numeral and side clearance.
- [x] Add visibility, reduced-motion, resize/font, pause/replay and two-click controls with full cleanup.
- [x] Run `node node_modules/typescript/bin/tsc --noEmit` and scoped ESLint. Expected: exit 0.

### Task 2: Integrate landing composition

**Files:** Modify `app/page.tsx`, `app/landing/landing.css`, `docs/seatpax/13_UI_UX_DESIGN.md`, `docs/seatpax/19_DECISION_LEDGER.md`.

**Interfaces:** Import `BookingMotion` from Task 1; existing route retains `booking-title` anchor.

- [x] Add seat section after journey showcase and choreography after preparation, before FAQ; preserve existing sections.
- [x] Adapt responsive copy/visual layout, rhythm and illustration labels. Document accepted design decision.
- [x] Repeat typecheck and scoped lint. Expected: exit 0, only intended files changed.

### Task 3: Inspect and review

**Files:** Add `docs/setup/LANDING_BOOKING_MOTION_SETUP.md`.

- [x] Serve the existing landing worktree and inspect desktop, tablet, phone, reduced-motion and both deck interactions. Record actual results and limits; do not run a test suite.
- [x] Request one focused independent code review. Fix important findings, then repeat affected static/visual checks.
- [x] Record delivery evidence, commit only intended changes, and provide the local preview URL. Do not merge or push without a further request.
