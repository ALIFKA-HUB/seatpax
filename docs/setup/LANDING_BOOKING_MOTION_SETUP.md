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
