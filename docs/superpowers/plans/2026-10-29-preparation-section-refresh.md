# Preparation section refresh

Goal: redesign the screenshot's Persiapan section into a compact, readable Seatpax landing composition.

Design read: consumer shuttle landing, preserve white/blue/navy and Jakarta type; variance 5, motion 2, density 4. Existing oversized tinted container and tall photo compete with the text. Keep section anchor, real photo attribution, accessible alt text, feature meaning and /tickets destination. Choose heading above a balanced photo/list composition over another large tinted card or decorative motion; this changes presentation only. The user previously delegated UI design choices and now explicitly requests this section redesign.

- [x] Inspect existing section, brand CSS and neighbouring layouts.
- [x] Recompose app/page.tsx and replace section CSS, including tablet/mobile rules; use installed icons and CSS, no dependency.
- [x] Check TypeScript/lint/build and actual rendered section at 320/390/768/1024/1440px with screenshots and no horizontal overflow.
- [ ] Review diff, publish verified change and integrate main according to standing user instruction.

Evidence: scoped ESLint passed; production Webpack compilation and TypeScript build passed. Actual headless-rendered section checked at 320, 390, 768, 1024 and 1440px with no document overflow; /tickets link retained. Desktop and phone screenshots inspected. The first standalone typecheck overlapped Next generated-type cleanup; rerun sequentially after build rather than changing type configuration. No unit test added for a presentation-only change.
