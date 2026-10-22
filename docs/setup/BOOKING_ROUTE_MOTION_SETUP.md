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

## Follow-up composition refinement

Applied the user's approved five refinements: centered desktop steps, shorter copy, 3px icon halo, 44px heading-to-route gap / 80px desktop section rhythm and softer navbar shadow. Updated the existing passenger-entry expectation for the approved label **Bayar pesanan**; no new tests added and no suite run for this follow-up.

Fresh headless Chrome checks at 1440/1024/768/390/320px found no horizontal overflow and retained measured route geometry. Desktop outer icon gaps matched exactly (84.25px at 1440; 72.25px at 1024); desktop descriptions measured at most two lines. Desktop screenshot inspected. Evidence: ignored booking-balance-browser.json and booking-balance-*.png in the existing verification cache. Physical-device acceptance remains pending.

## Arrival motion refinement — 22 October 2026

Added vertical breathing room, an 800ms arrival ring synchronized with each measured route delay, and two 1.8s glyph motion cycles after activation. Only glyphs move locally; path anchors stay fixed. Motion settles after these cycles.

Fresh installed-Chrome checks at 1440/768/390/320px confirmed route playback, sequential ring delays (0 to 4.2s), the correct two-cycle icon animation, and no horizontal overflow. Reduced-motion checks confirmed animation-name none for both ring and glyph. git diff --check passed. No suite/build rerun for this CSS-only follow-up; physical-device acceptance remains pending.

Circle-motion correction: movement now applies to the entire circle (1-3px in both axes), with no independent glyph movement. Path geometry uses layout offsets to avoid incorporating transient translation. Fresh Chrome check measured circle translate 0.86px/-2.43px with arrival+idle animations, glyph animation none, and no horizontal overflow. Reduced motion: circle/glyph animation none and translate none. No full suite/build rerun.

## Continuous circle/glyph refinement — 22 October 2026

Supersedes finite movement: each circle rises/settles on arrival, then continuously floats vertically by 3px over 3.6s. Each glyph gives a 700ms scale response on arrival, then a separate 4.8s rotation loop of +/-2 degrees. A local pause/resume button freezes all animations without resetting progress. Reduced motion remains static and hides this control.

Fresh TypeScript check exit 0. Installed-Chrome checks at desktop 1440 and phone 390px confirmed finite arrival plus infinite circle/glyph loops, sequential arrival delays, no horizontal overflow, working pause/resume controls and paused states for circle/glyph/route reveal. Reduced-motion circle/glyph animation names none and pause control hidden. No full suite/build or physical-device acceptance claimed.
