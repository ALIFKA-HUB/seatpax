# Seatpax Crew visual redesign

Date: 9 October 2026. Status: conversational direction approved; written specification awaiting user review. No implementation plan or implementation is approved by this document alone.

## Intent and authority

Give assigned crew a clear, comfortable responsive web interface for working on a phone while standing or moving around a bus. Continue the supplied Seatpax identity already installed in the passenger phase. The user approved the direction: a dedicated Crew shell, assigned trip cards, prominent scanner access, searchable manifest, and an explicit boarding action followed by a separate snack handover action. Manual user testing remains deferred while the user is occupied.

Read `docs/seatpax/00_INDEX.md` first. Scope follows the active release in `02_MVP_SCOPE.md`; UI follows the latest direction in `13_UI_UX_DESIGN.md`. Authorization and operational behavior follow decisions D2026-10-07-04, D2026-10-08-02 and D2026-10-09-02 in `19_DECISION_LEDGER.md`, together with the implemented Trip Engine, manifest/boarding and snack specifications. D2026-10-09-04 establishes the identity and passenger → Crew → Admin/Super Admin redesign order. Recommendations in `docs/analysis/SEATPAX_SPEC_REVIEW.md` remain pending where not separately adopted.

This phase changes presentation and composition of existing Crew journeys. It does not introduce a native app, offline installation, cash sale, new operational permissions or new data projections. Older PWA and cash examples do not expand the active release.

## Audit and selected approach

Evidence is current source and the previous implementation documents; this is not fresh authenticated browser acceptance.

| Finding | Response |
| --- | --- |
| Crew layout imports Admin CSS and uses its sidebar | Separate Crew shell and scoped styles |
| Trip detail renders the shared Admin technical summary | Crew summary with clear route, departure and vehicle, plus expandable existing details |
| Manifest already provides search, status filters and counters | Preserve data and controls; improve hierarchy and touch size |
| Scanner resolves a profile with independent boarding/snack forms | Make camera state and next action clear; keep explicit operational steps |
| Profile repeats dense labels and timestamps | Strong seat/name hierarchy with textual boarding and snack states |

Selected approach: a dedicated Crew shell and small presentation components around existing services and handlers. A shared-CSS refresh is smaller but retains the desktop navigation structure. Redesigning all operational roles together would enlarge the review scope. Admin and Super Admin remain later phases.

## Scope

Existing URLs covered:

- `/crew`: assigned published trips.
- `/crew/trips/[tripId]`: trip summary and existing snapshot details.
- `/crew/trips/[tripId]/manifest`: passenger manifest.
- `/crew/trips/[tripId]/scan`: camera controls and resolved passenger profile.
- `/crew/trips/[tripId]/passengers/[ticketId]`: profile opened from the manifest.

Keep current destinations, guarded reads, not-found handling, form field semantics, query/filter behavior and mutation handlers. The account link continues to `/account`. No automatic choice of an active trip, new date filters, trip lifecycle controls, metrics dashboard, live polling, passenger contact data, QR token display, stock management, reversal, GPS, offline queue or camera permission request on page load is added.

## Visual foundation and layout

Use installed horizontal/symbol PNG assets from `public/brand`, Geist typography, navy `#0A2144`, blue `#005BD1`, white surfaces and canvas `#F5F7FA`. Use the adopted foundation's muted, border, success, warning and danger colors with readable contrast. The logo keeps its proportions and an accessible link name. Do not regenerate or alter its geometry.

The Crew shell has a compact white header with Seatpax identity, a visible Crew label, Perjalanan saya and Akun & keluar links, a skip link, and a centered main region. It replaces the desktop sidebar. On narrow screens, links wrap into a compact second row without clipping. Do not add a bottom navigation bar that duplicates these links.

Use a comfortable content width up to approximately 960px with 16px phone gutters and larger desktop gutters. Base text is 16px with clear heading hierarchy. Primary buttons and main form controls have a minimum 48px touch height; secondary links have sufficiently separated touch areas. Use visible focus outlines, labels, text alongside color states, restrained borders and modest corner radii. Avoid decorative gradients, excessive shadows and animation. Any optional transitions must respect reduced motion.

At 320px and 390px, stack content and action groups without page-level horizontal scrolling. At desktop widths, manifest controls and profile facts may use columns. Wide snapshot tables/layouts may scroll inside a clearly labelled region; that region must not force the entire page wider.

## Screen composition

### Assigned trips

Title Perjalanan saya with a short assignment explanation. Each card shows existing trip name, published route identity, vehicle/plate and departure in WIB, with one clear link to the trip. Preserve current service ordering rather than adding an assumed urgency sort. No fabricated counters appear on these cards. An empty state explains that no trip is assigned yet and that assignment is managed by Admin PO.

### Trip detail

Back link to Perjalanan saya, trip title, route, departure in WIB, vehicle/plate, and service class when available. Scan QR is the primary action and Manifest the secondary action. Show schedule stops from the published snapshot in a readable sequence. Existing fare segments, layout and snapshot information remain accessible under a native expandable Rincian perjalanan section; use simple presentation without internal inventory counts or source revision jargon in the primary summary.

Create Crew-specific presentation instead of changing the shared Admin `TripDetail`. Use the existing `TripDetail` data; do not fetch the manifest just to add booked or boarded counts to this screen. The seat layout remains the published snapshot, not the current editable template.

### Manifest

Trip name and departure, back link to the trip, and Scan QR access. Render the existing manifest counters from `manifestCounters(view)` without deriving new operational totals or changing their definitions. Preserve controlled name/seat search and the existing Semua / Belum naik / Sudah naik filters.

Each passenger row gives name, prominent seat code, origin → destination, boarding state/time and snack state/time, followed by Buka profil. Wrap long names, seat codes and routes. Distinguish an empty manifest from a filter with no matches. Keep result-count announcements concise. Avoid wrapping interactive passenger lists in a live region.

`ManifestList` also serves Admin read-only screens. Crew styling must be scoped to the Crew shell. Any shared markup adjustment must retain its `readOnly` behavior and must not add Crew actions to the Admin view or change the Admin shell.

### Scanner

Back link to the manifest, Scan tiket title and brief instruction that a scan opens the passenger profile for review. Use a bounded camera frame with explicit Mulai scan / Scan tiket berikutnya and Tutup kamera controls. Show starting, running, stopped and error feedback as text using the actual controller state. Keep the manifest fallback visible when camera access fails or is unavailable.

A resolved profile appears below the camera controls and uses the same passenger profile and operational forms as the manifest entry. A successfully resolved QR means Tiket ditemukan; it must not imply Sudah naik. Decoding never submits boarding, claims snack or navigates automatically. Preserve camera cleanup on close/unmount, duplicate handling, stale result checks, mounted-state checks and existing submission guards. Do not add automatic focus or scrolling that interrupts a running camera session.

### Passenger profile and operational forms

Make passenger name and seat the strongest facts, followed by origin → destination, trip, vehicle/plate and departure in WIB. Boarding and snack states include readable labels and their existing server timestamps. No phone, email, payment information or secret token is added.

For an unboarded passenger, preserve the current origin-stop selection, its label, and the server validation requiring the origin snapshot stop. The explicit button remains Tandai sudah naik. Pending submission disables the controls and communicates progress. Only a successful server result may show the immutable recorded boarding state/time. Already-boarded responses retain the original event.

Snack is a separate explicit Serahkan snack action. Before boarding, show the existing prerequisite and keep it disabled. After boarding succeeds, preserve current callback/refresh behavior so snack becomes available. After handover, show Snack sudah diserahkan and the recorded time. Preserve uniqueness, original-event retries and each form's submission gate. Do not combine boarding and snack into one action or add a new confirmation modal.

## Component and data boundaries

- `app/crew/layout.tsx` retains its guard and renders the dedicated shell, importing Crew styles rather than Admin styles.
- A scoped Crew stylesheet owns layout and component presentation. Shared brand artwork/formatting may be reused without importing the entire passenger shell or changing global selectors.
- A Crew trip summary consumes the existing `TripDetail` shape. Snapshot layout rendering may be reused with styles compatible with its current markup; Admin rendering remains intact.
- Existing manifest, scanner, profile, boarding and snack components retain their action/service contracts. Small presentation helpers are allowed when they reduce repetition; no parallel business state model is introduced.
- Server routes continue to use `crewData` / `boardingData`, `listMine`, `detailMine`, `manifest` and `profile` as appropriate. Services remain the authority for fresh membership/assignment checks, confirmed-ticket access and event recording.
- Preserve Admin manifest read-only access, assigned-trip restrictions and the existing suspension semantics for existing-ticket operations. No SQL, migration, authorization or provider change is required.

## Error and accessibility behavior

Preserve guarded not-found results for inaccessible trip/profile reads without exposing private context. Existing mutation errors remain inline and actionable with the current safe messages. A network failure does not manufacture a boarding or snack event. No service outage is represented as an empty success state.

All controls work by keyboard; select/input labels remain programmatically connected. Headings follow one page title and a logical hierarchy. Pending state uses `aria-busy` where appropriate. Status announcements are narrow text regions rather than whole forms or profiles. Camera preview remains labelled and does not become a keyboard trap. Focus remains visible in errors, camera controls, expanded details and operational forms.

## Acceptance and evidence

Implementation verification should cover layout and existing behavior together: assigned trip access, unchanged manifest filtering/counters, read-only Admin rendering, scan-only profile resolution, stale/duplicate scan safeguards, explicit boarding, snack prerequisite, duplicate submission guards, safe errors and recorded timestamps. The implementation plan will identify exact automated checks and source/browser evidence.

Visual acceptance targets are 320px, 390px, 1280px and 1440px, long content, keyboard navigation, readable text at 200% zoom and reduced-motion behavior. Verify actual routes where authenticated data is available. Fixtures may demonstrate presentation but must be labelled as fixtures and cannot prove real authorization or operational acceptance.

User testing on a physical phone, real camera permission/scan, and authenticated boarding/snack acceptance remain deferred until the user is available. Record these as pending even if automated checks pass. An unavailable authenticated backend remains an explicit limitation; do not claim that the live Crew flow passed based on source inspection.

## Review boundary

This is one presentation phase suitable for one implementation plan. There are no unresolved new product policies: existing domain contracts decide all operational behavior. If implementation would require a new projection, permission or workflow, record that conflict and return for a product decision rather than silently expanding this spec.

After written-spec approval, write the implementation plan. Product code changes begin only after that plan is reviewed and its execution is authorized.
