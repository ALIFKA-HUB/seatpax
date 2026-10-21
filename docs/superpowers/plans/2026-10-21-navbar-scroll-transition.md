# Navbar Scroll Transition Plan

> Inline executing-plans. User approved the bounded description and 250-300ms transition after 24-40px scroll.

**Goal:** At the page top the passenger desktop navbar blends into the white background; after 32px it reveals the existing floating outline/shadow over 300ms and reverses on return.
**Architecture:** Small client header wrapper observes an invisible position marker with IntersectionObserver. Only a threshold boolean enters React state. A pseudo-element fades the existing floating shadow without changing header size, positions, links or text-only active state. Focused flows and phone navigation remain unchanged.
**Spec:** Approved in-chat transition; append to latest UI direction.

- [x] Implement wrapper and scoped opacity/transform transition. No scroll event listener, animation library, layout animation or new dependency.
- [x] Browser verified top -> 100px -> top: opacity0 -> intermediate0.237 -> 1 -> 0, duration0.3s at1440/768, no document layout shift. Phone390 unchanged and reduced motion0s.
- [x] Lint/typecheck exit0; fresh GPT-6 Luna medium source reviewer found no concrete issue. Source/diff inspected. Generated files and unavailable journey data excluded; no DB/auth operations, merge or push.

Reduced motion disables the transition and transform while keeping the floating state functional. Unavailable IntersectionObserver leaves a usable static flat header. Observer disconnects on unmount. Normal availability reads remain the previously reported separate limitation.

Evidence is recorded under the scroll follow-up in docs/setup/PASSENGER_NAVBAR_SETUP.md. This slice did not rerun the unit suite or production build; claims are limited to fresh lint, typecheck, rendered motion checks and source review.

## Visibility refinement

User reported insufficient visible change. Applied a 450ms transition, stronger shadow and inner navbar transform translateY(4px) scale(.98) above640px with no-preference motion. Marker/mobile/reduced-motion remain unchanged. Fresh browser probe verified transform values and complete opacity reversal at1440/768, stable hero document position, reduced-motion0s and phone static layout. Only CSS changed; no new unit/build claim.
