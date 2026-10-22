# Passenger footer — 22 October 2026

Implemented the accepted interactive preview as a server component shared by non-focused passenger pages. Uses actual Brand asset, tagline/description, Jelajahi links (/trips, /tickets, /account), Panduan links to existing homepage heading anchors and current-year copyright. Focused login/checkout retains the minimal footer. A separate scoped stylesheet avoids collisions with the older sp-footer layout. Anchor scroll margins account for the sticky header. Phone footer stays above the existing bottom-navigation safe area.

## Fresh verification

- TypeScript and scoped ESLint: exit 0.
- Installed Chrome at 1440/768/390/320px: five correct navigation targets, responsive columns and no horizontal overflow.
- Visually inspected actual desktop/phone screenshots with the logo loaded. Initial immediate image-complete probes on smaller viewports ran before lazy image loading; screenshots subsequently show the logo.
- Clicked Cara memesan from the trips page; reached /#booking-title and its existing heading.
- Screenshot evidence in ignored node_modules/.cache/seatpax-landing-verification/footer-1440.png and footer-390.png.
- No new tests/full suite/build run or physical-device acceptance claimed.
