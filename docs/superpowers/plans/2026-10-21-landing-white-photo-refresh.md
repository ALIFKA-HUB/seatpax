# Seatpax White Photo Landing Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation. User approved the bounded visual revision in chat; continue without another approval round.

**Goal:** Make the passenger landing visually richer on a white background, using the two supplied travel references while keeping route showcase content empty.

**Architecture:** Recompose the existing homepage and its scoped stylesheet. Reuse local licensed road photos, PassengerShell, Phosphor and the existing search contract; leave services, data and other screens intact.

**Tech Stack:** Next.js Server Components, existing client search, native CSS, Plus Jakarta Sans, Phosphor.

**Spec:** `docs/seatpax/13_UI_UX_DESIGN.md`, latest white photo revision, approved 21 October 2026.

## Global constraints

- White landing background regardless of system theme, matching the supplied actual logo.
- Navy text, Seatpax blue actions; white text only over a photograph with a dark contrast scrim.
- Preserve Perjalanan / Pesanan saya / Akun, routes and from/to/date query contracts.
- No fictional routes, fares, reviews, customers, amenities, fleet images or SaaS sections.
- Empty landing route showcase is intentional presentation only, without deleting or changing inventory.
- Reuse the two existing licensed illustrative photographs, credited truthfully.
- DESIGN_VARIANCE 7, MOTION_INTENSITY 3, VISUAL_DENSITY 4. No new dependencies.
- User deferred testing: do not add/run tests, build, lint, typecheck, Lighthouse or device acceptance. Record source review separately.

## Review focus

- System dark mode must not leak navy canvas or light text into the white landing.
- Mobile search must stay in normal flow with no overlap/touch obstruction.
- Tablet form and long location labels must shrink without horizontal overflow.
- Empty showcase must not falsely report database or inventory state.
- Existing partial/same-point validation, accessible labels and pending state must remain.

## Tasks

### 1. Recompose page and empty showcase

- [x] Replace split hero with a wide photo and concise left-aligned copy; retain reserved dimensions, priority, illustrative alt and credits.
- [x] Keep search server service/error handling; remove city showcase rendering and use the explicit empty presentation message.
- [x] Add a compact four-part booking flow with verbs as labels; recompose benefits with the second photo and existing product facts.
- [x] Preserve FAQ and functional anchors/navigation; update button trailing icon enclosure.

### 2. Scope white theme and responsive layout

- [x] Replace landing CSS with white semantic tokens, wide photo hero, overlapping white search shell, mixed section layouts and subtle elevation.
- [x] Explicit 768/1024 breakpoints: phone one column without overlap, tablet compact search, desktop horizontal search.
- [x] Keep focus, readable native date/select controls, fixed phone bottom navigation, safe-area spacing and reduced-motion feedback in source. Rendered acceptance deferred.

### 3. Source review and documentation

- [x] Review source against the five focus points and approved content constraints; obtain one focused fresh source review.
- [x] Record approved direction in UI spec/decision ledger and update setup evidence with deferred testing.
- [x] Inspect changed paths/diff and prepare only intended files for commit. Preserve generated next-env.d.ts. No merge or push in this slice.

## Execution evidence

Inline source implementation. Testing remains deferred by explicit user preference, which overrides default skill test steps. Fresh source reviewer raised phone negative margin; removed it for an explicit zero-margin phone flow. Final source/diff inspection performed; git diff --check returned exit 0 (line-ending notices only). Existing preview server session 53074 remains active. No runtime verification, merge or push is claimed. This plan is included with the source commit.
