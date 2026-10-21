# Booking route motion implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this approved preview inline.

**Goal:** Apply the accepted dashed, asymmetrically curved booking route to the existing landing section.
**Architecture:** Keep the four-step ordered list server rendered. A small client wrapper measures icon centers, draws an SVG route and starts a single 4.2-second CSS animation after entering the viewport. No dependency or domain changes.
**Tech Stack:** React, native SVG, CSS, IntersectionObserver, ResizeObserver.
**Spec:** Latest booking-route refinement in docs/seatpax/13_UI_UX_DESIGN.md and the accepted conversation preview.

## Constraints and review focus

- Preserve all four labels, copy, Phosphor icons and actual booking links.
- Alternate upward/downward curves; both inactive and completed paths are dashed.
- Desktop horizontal; tablet/phone vertical to retain an unbroken reading order.
- SSR/no-JS retains readable content and fallback connectors. Reduced motion shows the final static route.
- Cleanup observers, support resize and font settlement, and never announce animation frames.
- Ruling: the continuing UI verification authorization covers lint/typecheck and focused browser verification. Do not add a test suite for this presentation-only slice.

## Task 1: Implement and inspect

- [x] Create app/landing/booking-route.tsx, wrapping the existing server-rendered list.
- [x] Update app/page.tsx and app/landing/landing.css with dashed route, single playback and responsive styling.
- [x] Check lint/typecheck and browser rendering at desktop, tablet and phone widths, including reduced motion and no JavaScript.
- [x] Update UI specification, decision ledger and delivery evidence. Keep unrelated generated files out of the commit.

## Execution evidence

`npm.cmd run lint` and `npm.cmd run typecheck`: exit 0. Headless installed Chrome verified actual localhost rendering at 1440/768/390/320px: measured path exists, intermediate reveal offset approximately 0.885 and final offset 0, final icon brand blue, no horizontal overflow. Reduced-motion state static/animation none; JavaScript disabled retains four steps. Desktop/phone screenshots visually inspected. Initial probe ran before hydration and was inconclusive; rerun explicitly waited for data-route-ready=true before recording motion evidence. Independent Luna review found no important issues. No full suite/build or physical-device acceptance claimed for this slice.
