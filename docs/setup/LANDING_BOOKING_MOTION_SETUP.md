# Landing booking illustration delivery

## Scope delivered locally

Branch: `codex/seatpax-landing`, based on `dc67861` for this slice.

- Seat-to-ticket section after the journey showcase, preserving one numeral and a continuous blue-surface-to-white-paper transition.
- Three-card section after the static preparation section. First click stops at payment; second opens ticket and spreads seat/payment/ticket in order. Side arcs retain clearance at depth changes.
- Desktop row and narrow-container vertical stack, keyboard/touch controls, replay, reduced-motion/static fallback, viewport/document visibility pause and cleanup.
- Width, initially ready fonts and later font-load completion remeasure geometry while preserving progress.
- The original photographic hero, search/query contract, intentionally empty showcase, old route animation, preparation section, FAQ, shared navigation and footer are retained. No third study, backend/domain change, dependency or database mutation.

## Fresh evidence on 23 October 2026

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js app/page.tsx app/landing/booking-motion.tsx app/landing/booking-motion-timeline.ts`: exit 0.
- Local Chromium rendering at `http://localhost:3001/`: no page errors. Landing section headings and unchanged hero were inspected.
- Actual pointer input on the card field: first stop read **Tekan kartu lagi untuk membuka tiket.**; second stop read **Pilih kursi, bayar, lalu buka tiket.**
- Actual keyboard Enter on the persistent action button reached the same two stops.
- While the seat section was offscreen, two samples of every local animation's current time remained identical over 350ms.
- Screenshots inspected at 1440px, 768px, 390px and 320px; no document horizontal overflow at those widths. Final cards form a desktop/tablet row where readable and a phone stack.
- `prefers-reduced-motion: reduce`: zero running animations in the two new illustrations and zero visible playback control groups; readable final content.
- JavaScript disabled, at 390px and 320px: both illustrations and all three cards remained present, no playback controls and no horizontal overflow.
- Focused independent review (GPT-6 Luna, medium) reported no important issue and one late-font remeasurement gap; the `loadingdone` listener and matching cleanup were added. Final source pass addressed local button hover specificity, constrained seat-map width and centered the hidden fallback paper.

Browser screenshots are task-local inspection outputs, not repository assets. The phone bottom navigation appearing over long element screenshots is the pre-existing fixed navigation.

## Limits

No automated test suite was added or run, following the developer instruction. This slice does not claim production-build, Lighthouse, physical Android/iPhone/Safari, authenticated booking/payment acceptance, or a measured FPS guarantee. Hidden-document pause is implemented and source-reviewed; the recorded runtime pause sample specifically covers offscreen visibility. The local feature branch has not been merged or pushed by this delivery. The pre-existing generated `next-env.d.ts` modification remains outside the commit.

## Follow-up: temporary demo journey showcase

The user subsequently requested dummy trips to fill the journey showcase (D2026-10-23-02). Three static cards now show clearly labelled example Cianjur/Bandung, Bandung/Jakarta and Bogor/Bandung journeys, times and fares. They are not database inventory, cannot be checked out and do not restore suspended fixtures. The separate catalogue action links to `/trips`.

`FeaturedTrips` renders synchronously after the planner's Suspense boundary, so actual location loading cannot delay or duplicate the demo cards. The search skeleton and async planner now render only the search panel. The four existing planner test cases were adjusted to this separation; no test cases were added and the suite was not run.

Fresh typecheck passed. Scoped ESLint covers the changed page/planner/showcase. Local Chromium inspection showed three cards and one section heading, `/trips` as the catalogue destination, no page errors and no horizontal overflow at 1440px, 768px, 390px and 320px. This supersedes the earlier intentionally empty showcase for the current landing preview only.

## Follow-up: seat illustration plays once, 25 October 2026

At the user's request, the first illustration now has no manual pause/continue/replay controls or reserved control row. It starts once at 35% field visibility and remains at the final ticket when returning to the section. Offscreen/tab pausing still preserves unfinished progress. No intersection/native animation support and reduced motion retain static final content. The card choreography keeps its existing interaction.

Local Chromium inspection recorded the first animation clock at 0ms before scrolling, approximately 1200ms after entering, and 8000ms on completion, on a subsequent scroll visit and after resizing to phone width. The first illustration had zero buttons and zero running animations after completion; the second retained its control group. No page errors were observed. Typecheck passed; no automated test suite was added or run.
