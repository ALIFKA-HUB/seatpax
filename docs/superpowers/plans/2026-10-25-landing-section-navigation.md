# Landing Section Navigation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. The user confirmed the single-page section design and requested the layout; do not repeat the approval gate.

**Goal:** Present each landing section as its own screen and navigate between them using the landing navbar.

**Architecture:** Keep the existing server-rendered content in eight minimum-height frames. Add a small client navigation component for the active anchor and disclosure closing; retain native anchors and native disclosure behavior. Switch navigation only when PassengerShell has `landing=true`.

**Tech Stack:** Existing Next.js/React, CSS dynamic viewport units, Phosphor and IntersectionObserver. No dependency or business/backend changes.

**Spec:** `docs/superpowers/specs/2026-10-25-landing-section-navigation.md`.

## Constraints and review focus

- Preserve the hero photograph/brand, all content and legacy heading anchors, search contract, actual order/account destinations, animations and labelled demo cards.
- No forced snapping, fixed-height clipping, nested page scroll or per-frame React scroll updates.
- Eight anchors on landing only; regular booking navigation stays unchanged.
- Inspect 1440/1024/768/390/320px, short screens, deep links, keyboard, mobile menu and reduced motion.
- No test suites are added/run under the developer restriction.

### Task 1: Section frames

**Files:** `app/page.tsx`, `app/landing/journey-planner.tsx`, `app/landing/landing.css`.

- [x] Add eight stable frame IDs; move `cari-perjalanan` from the async panel to the permanent wrapper.
- [x] Remove the overlapping search composition. Apply viewport minimums with header offsets and adaptive phone heights; preserve content and inner component layouts.
- [x] Verify typecheck and inspect first-screen boundaries, overflow and frame dimensions.

### Task 2: Landing navigation

**Files:** Add `app/landing/section-navigation.tsx`; modify `app/components/passenger-shell.tsx` and `app/landing/landing.css`.

- [x] Render the eight section anchors, desktop order utility and native compact menu with order access.
- [x] Observe current section, retain text-only active state plus underline, close disclosure on selection/outside/Escape/focus exit and clean up.
- [x] Keep other PassengerShell modes unchanged. Verify compiler, scoped lint and native pointer/keyboard navigation.

### Task 3: Review and delivery

**Files:** `docs/seatpax/13_UI_UX_DESIGN.md`, `19_DECISION_LEDGER.md`, `docs/setup/LANDING_SECTION_NAVIGATION_SETUP.md`.

- [x] Inspect real responsive page, anchored offsets, all eight IDs, first-screen separation, motion preferences and catalogue navigation.
- [x] Obtain focused independent review; fix important findings and repeat affected checks.
- [x] Record actual evidence/limitations and commit intended files locally. Do not merge or push.
