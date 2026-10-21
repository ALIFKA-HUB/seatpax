# Landing booking route motion — 21 October 2026

Implemented the accepted dashed route in the actual landing page on codex/seatpax-landing. Native SVG path/mask and a CSS motion-path marker follow measured icon centers; distinct upward/downward bends connect desktop steps. Tablet/phone use a vertical path. IntersectionObserver starts a single 4.2-second animation; ResizeObserver updates geometry and cleanup disconnects both. Existing server-rendered content and fallback connectors remain. Reduced-motion preference skips playback, including a preference change during playback. No package, booking, auth or database changes.

## Fresh verification

- Lint and TypeScript: exit 0.
- Actual localhost page, installed Chrome: 1440, 768, 390 and 320px. Paths measured, intermediate and final reveal recorded, final icon blue, no horizontal overflow.
- Reduced motion: static state, no animation. No JavaScript: four steps readable.
- Visually inspected desktop and phone screenshots.
- Independent GPT-6 Luna medium source review: no important findings.
- Ignored local evidence: node_modules/.cache/seatpax-landing-verification/booking-route-browser.json and booking-route-*.png.

The first browser probe reached server-rendered content before hydration; it did not establish playback. The successful rerun explicitly waited for data-route-ready. Full tests/build were not rerun for this bounded presentation slice. Physical-phone acceptance remains pending. Existing intermittent live journey-data availability is a separate issue; motion evidence does not establish search/payment correctness.
