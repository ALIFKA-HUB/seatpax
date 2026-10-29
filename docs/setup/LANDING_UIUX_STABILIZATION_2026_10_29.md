# Landing UI/UX stabilization - 29 October 2026

Authorization: user explicitly requested LP-FIX-01, LP-FIX-02 and LP-FIX-03 from the supplied stabilization plan and audit. Goal: resolve deck overflow, mobile FAB interference, container/rhythm drift and component/token inconsistencies. Product/domain behavior is outside this package.

## Tasks and decisions

- LP-FIX-01: move compact illustration container query from 639px to 440px. Static/pre-hydration deck fields use intrinsic height with a 410px minimum, so cards remain visible rather than being clipped. Existing mobile ticket fallback and animation lifecycle remain intact.
- LP-FIX-02: use a specificity-safe 1216px landing container with the same outer width as navigation/footer. Short sections use content height and 56px vertical padding instead of a forced viewport minimum. Hero retains its viewport treatment.
- Mobile FAB ruling: dock the landing complaint button in document flow after main content on narrow phones. A different fixed offset only relocates the overlap as the page scrolls. Desktop stays floating; complaint links remain available in the landing/help/footer.
- LP-FIX-03: illustration colors inherit brand tokens; seat morph tween reads resolved chosen-seat and paper-border colors so its frames cannot reintroduce hardcoded blue/border drift. Normalize arrows, assistance actions, CTA casing, FAQ indicators and desktop heading scale. Preserve the explicitly approved preparation photo shape and accordion interaction.

## Evidence

Before fixes, the browser regression failed on the actual JavaScript-disabled desktop deck: a card extended 232px below its field. After fixes, the full test passed for animated, reduced-motion and JavaScript-disabled desktop modes, plus the isolated 620px static column. It samples the 12-second deck cycle. Five viewport widths (320/390/768/1024/1440) have no document overflow; desktop hero/navbar/footer outer edges align within 2px; section gap is under 250px; mobile search button and status have no intersection with complaint entry.

Existing preparation interaction regression and synthetic Helpdesk shell check also passed. These are headless layout/interactions and synthetic checks, not physical-device or Computer Use acceptance. No provider/data mutation was performed.

Commands: npm run build -- --webpack; npm run typecheck (after generated types); npm run lint; npm test -- --maxWorkers=2. Browser scripts require PLAYWRIGHT_MODULE and optionally SEATPAX_TEST_URL.

Fresh final code review found no blocking issue. Generated next-env.d.ts changes are excluded. Final local checks: 86 unit test files / 322 tests passed; full lint, production Webpack build and standalone post-build typecheck passed (exit 0). Browser layout regression passed again against the production build, including 390px no-JS fallback. The approved source plan and original audit are preserved in their existing local locations.
