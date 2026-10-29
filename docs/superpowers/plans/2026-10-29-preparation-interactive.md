# Approved interactive preparation section

Goal: implement the user's selected Panduan interaktif preview, replacing the rejected earlier layout. Approval: user chose "opsi 1" after reviewing the standalone two-variant preview.

Design: white/blue/navy Seatpax, heading and three-item accordion on the left, morning-road photo on the right with the preview's curved upper-left corner. First item starts expanded; opening another closes it. /tickets action, existing #persiapan anchor and actual photo credit remain. Phone order: copy, accordion, action, then photo.

Implementation: native details/summary with shared name, server-rendered JSX, existing Phosphor icons and local CSS. No client library or business-rule changes.

- Implement selected copy, placement, spacing, photo and accordion.
- Verify real render at 320/390/768/1024/1440, mouse and keyboard accordion exclusivity, CTA destination, overflow and reduced-motion behavior.
- Run scoped lint and production build/type checks, review diff, then commit/push and integrate main under standing publication authorization.

Verification: actual browser test passed pointer and Space-key toggling, one-open-item exclusivity, preserved /tickets link and no page overflow at 320/390/768/1024/1440px. Desktop screenshot inspected against the approved preview. Initial tablet overflow from aspect-ratio sizing was corrected with explicit photo width before rerunning all viewport checks. Scoped ESLint passed. Production build includes TypeScript verification. No new dependencies or database writes. Reproduce browser test with PLAYWRIGHT_MODULE and SEATPAX_TEST_URL pointing to a running local app.
