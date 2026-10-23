# Approved landing booking illustrations

The user approved the first and second motion studies, their revisions, and explicitly requested implementation ("oke. sikat"). This is a presentation change for the single-company landing.

## Composition

Preserve the photographic hero, overlapping search, actual query contracts, intentionally empty journey showcase, existing four-circle route animation, preparation/benefit section, FAQ, navigation and footer. Add a seat-to-ticket illustration after the journey showcase. Keep the preparation section as a static visual break. Add the card choreography after preparation, before FAQ. Do not include the third route-to-ticket study.

## Seat to ticket

Use the actual Seatpax logo and blue/navy on white. Show an illustrative seat map with seat 03 selected. The selected blue surface lifts, grows into the white ticket paper and retains a single continuous numeral. Keep the numeral inside the changing surface. Reveal confirmation, ticket stub and check badge. No actual fare, route, passenger or functioning QR is invented. Start once when visible, expose pause/replay and stop work offscreen.

## Card choreography

Show seat, payment and ticket cards. The first click advances to payment and pauses; the second advances to the ticket, then spreads the cards in seat/payment/ticket order. Cards travel along continuous side arcs and change depth only when separated. Keep the approved slight tilt, varying pace and eased settlement. Use real buttons for mouse, touch and keyboard. Final cards form a horizontal row where readable and a vertical stack in narrow containers. Do not reset or loop automatically.

## Runtime and accessibility

Use React client leaves and native Web Animations, with no new dependency, network call or per-frame React update. Pause when the field leaves the viewport or the document is hidden. Rebuild measured geometry after width/font changes while preserving progress. Clean up animations and observers on unmount. Reduced motion and unsupported animation APIs show a readable static final state; no-JavaScript markup remains useful. Native focus outlines and 44px controls remain available.

Only an intentional user-triggered mobile card spread may animate the local field height; other geometry uses transforms. Landing business behavior, authentication, inventory, payments and ticket issuance remain unchanged.

## Evidence boundary

Do not add or run automated test suites without the user's request. Compile/type and scoped lint checks plus local visual inspection cover this delivery; physical devices and real booking acceptance are separate.
