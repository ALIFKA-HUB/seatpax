# Seatpax Admin PO and Super Admin visual redesign

Date: 9 October 2026. Status: written specification approved by the user on 9 October 2026. Implementation plan approved; presentation implemented locally. Evidence: ../../setup/ADMIN_VISUAL_SETUP.md. Actual acceptance remains pending.

## Intent and authority

Make the implemented administrative workflows comfortable to use and visually consistent with the redesigned Passenger and Crew experiences. The user found the old interface unpleasant, supplied the adopted Seatpax logo, approved the visual delivery sequence, and approved the operational workspace direction for Admin PO and Super Admin.

Success means an operator can identify the current company, selected section, record status, relevant form and next action without struggling with oversized whitespace, tiny text or equally weighted buttons. Admin PO primarily serves desktop work; essential existing controls remain usable on a phone. Manual user acceptance remains deferred.

Authority: `docs/seatpax/00_INDEX.md`, active release in `02_MVP_SCOPE.md`, latest direction in `13_UI_UX_DESIGN.md`, adopted assets in `13A_BRAND_LOGO.md`, and decisions in `19_DECISION_LEDGER.md`. Reuse the visual foundation in `2026-10-09-passenger-visual-design.md`. Relevant route/pricing, fleet, Trip Engine, checkout/payment, manifest/boarding and Super Admin specifications continue to govern behavior. Historical dashboard, company creation and reporting examples do not expand the active release.

## Audit and chosen approach

Audit evidence is the current source tree and earlier user screenshots. This is not a new authenticated browser acceptance result.

| Existing area | Finding | Design response |
| --- | --- | --- |
| Company shell | Plain text brand; no selected menu marker; account link hidden below 900px | Adopted logo, company context, current-section marker, visible mobile account access |
| Typography | Table/form/helper sizes often 11–14px; global element styles can compete | Scoped readable type scale and explicit controls |
| Lists and forms | Similar panels and action weights; dense source editing | Clear page heading, list/editor sections and primary save action |
| Fleet builder | Small cell text, enum presentation, several equally styled controls | Clear cell editor, legible grid and separate save/destructive actions |
| Trip detail | Snapshot schedule/fare/layout mixed with internal inventory count | Operational summary first, schedule next, technical snapshot details secondary |
| Shared manifest | Existing Crew component with Admin readOnly flag | Admin-scoped presentation while retaining read-only behavior |
| Payment conflict | Raw booking/payment states; reason and resolution require careful interpretation | Known display labels and explicit financial consequences |
| Super Admin | Repeated authentication cards and large spacing | Compact company list with inline explicit confirmation |

Chosen approach: redesign the existing workspace compositions with small presentation components and scoped CSS. A color-only refresh would retain hierarchy problems. An analytics dashboard would need new queries and product scope. Use the existing native React/Next and CSS foundation; no enterprise component package or animation dependency is required.

## Scope

Admin: `/admin` company selection and all implemented `/admin/companies/[companyId]` pages for trips/detail/manifest, routes/editor, stops, service classes, seat templates/builder, vehicles/editor, and payment conflicts/detail.

Super Admin: `/super-admin/companies`, including empty, denied/unavailable, current-status, confirmation, pending and stale-result presentations.

Preserve existing URLs, query/form contracts, redirect destinations, source reads, validation, version conflicts, request identity, pending guards, confirmation mechanisms, server actions and authorization. There is no migration or domain-service change. No invented metrics, occupancy/revenue summaries, new filters/sorting, dashboard, bookings list, reports, company creation, invitations, role editing, drag-and-drop, duplication, refund integration, dark mode, offline operation, deployment or Figma deliverable.

## Visual foundation and structure

Reuse Geist, existing shared visual tokens, and the installed `public/brand/seatpax-horizontal.png` / `seatpax-icon.png`. Do not regenerate or recolor the mark. Place the horizontal navy/blue mark on a white inset in the navy sidebar so it retains contrast. It links to `/admin`; the Super Admin mark links to its existing companies route. Provide the accessible name Seatpax and decorative empty image alt text.

Canvas `#F5F7FA`, white surfaces, navy `#0A2144`, primary blue `#005BD1` and existing semantic warning/success/danger colors. Labels accompany every state; contrast must be checked before completion. Use 8px controls and 12px panel corners, restrained borders, 4/8px spacing increments and no decorative graphs or imagery.

Body and input text 16px; table text and helper labels at least 14px; page headings 32px desktop / 28px phone. Times, prices, versions and seat codes use tabular numerals. Main actions/inputs have at least 44px height, with sufficient gaps for touch. Selected grid cells also retain a visible non-color focus/selection outline. Functional color/border transitions only, approximately 150ms under no-preference motion; avoid sticky save controls obscuring content.

Desktop Admin uses a roughly 240px sidebar and a flexible content column, with content maximum 1200px excluding sidebar and 24–32px gutters. Below 900px, navigation becomes a wrapping header with company and account visible. No new drawer/menu interaction. Labels and long company names wrap. At 320px there is no page-level horizontal overflow; wide tables and seat grids scroll inside separately labeled keyboard-focusable regions. Forms stack at narrow widths; builder editor follows its grid.

Use an Admin-specific shell, active-navigation leaf and CSS namespace. Super Admin uses a smaller independent shell and namespace, reusing only safe presentation primitives. Do not wrap it in a tenant Admin shell. Existing global Passenger/Crew selectors must not change; shared SeatGrid and ManifestList receive Admin styles only through Admin ancestors. Presentation components receive existing safe view data and never fetch or decide access.

## Navigation and company context

Retain all seven current company destinations: Perjalanan, Rute & tarif, Daftar stop, Kelas layanan, Template kursi, Armada and Konflik pembayaran. Show company name and Admin PO role plainly. Mark the active section using `aria-current="page"`, a distinct surface and a visible edge/weight change; detail routes select their parent section. Match route segments exactly so unrelated prefixes cannot appear active.

Expose Akun & keluar on desktop and phone using the current `/account` destination. Add a skip link to the main content. Do not add a company switcher or mutate membership context. `/admin` retains its current single-company redirect to routes; when multiple companies exist it shows readable company links to their current route destinations. No-access and empty states remain honest.

## Lists and source editors

Use a concise page title and one relevant explanatory sentence. Existing list sections precede creation forms. Keep table semantics, explicit headings and meaningful record links, with local overflow for wide lists. Do not convert tables into duplicate phone-only markup. Empty states point to an existing relevant form/destination; do not invent unavailable actions.

Stops and service classes keep native labels, field order, validation and active-state actions. Route editor keeps stop ordering controls, adjacent fares, class selections, quote preview, and current revision conflict workflow. Currency input and zero/missing fare remain distinct. Highlight save as primary, ordering/preview as secondary, deactivation as cautionary. Messages stay adjacent to the affected form with existing live-region roles.

Conflict panels explain that input remains in the draft, then offer the existing refresh/adopt/explicit overwrite controls. Existing latest-data disclosure stays available; long JSON wraps or scrolls locally. Do not replace conflict handling with automatic refresh, overwrite or a new modal.

## Fleet and seat builder

Template and vehicle lists show their existing metadata and labeled statuses. Vehicle forms preserve inactive-reference rules and current options. Known source statuses may display Aktif, Nonaktif or Diarsipkan through view-only labels; unknown values remain visible rather than assumed safe.

Builder composition: template name and dimensions, actual capacity/status/version, grid with front label, selected-cell editor, then save and secondary actions. The grid preserves all positions, six cell types, seat codes and labels. Use Indonesian option labels with unchanged enum values. Cells are at least 44px in both dimensions, preferably current 60px width and 54px height; never shrink the layout into unreadable cells. Native pressed/disabled behavior and selected-cell state remain intact. Shared read-only snapshots must not become selectable.

Simpan template is primary; Terapkan ukuran and Nomori ulang kursi are secondary; archive/reactivate is separate. Preserve all current resize content-loss, renumber, archive/reactivate and conflict overwrite confirmations. Unsaved capacity remains derived from the current draft exactly as today; styling must not imply that it has been saved.

## Trips and manifest

Trip list retains order, real records, departure WIB, current draft/published status and revisions. Keep creation form inline after the list. No new counts beyond already available list/record data, and no occupancy calculation.

Draft detail keeps the editing form, explicit save, preview of the last saved draft, publication blockers and publication confirmation. Explain snapshot locking at Buka penjualan. Existing dirty/conflict/blocker/pending disabling remains authoritative. Publication is never triggered by navigation or an accordion toggle.

Published detail prioritizes existing route, vehicle/plate, class, departure and status data, then the ordered stop schedule. Tariff and full seat snapshot remain accessible in a native Rincian perjalanan disclosure. Technical inventory anchor count may sit inside that disclosure with a clear label that it is a technical snapshot quantity, not available seats or occupancy. Draft preview must be visibly distinguished from published locked data and must not present its synthetic zero inventory count as an operational metric. Preserve exact fare formatting and WIB rendering.

Manifest link and crew assignment remain separate from snapshot information. Assignment list labels active/revoked and membership state clearly; the existing explicit assign/revoke handlers stay unchanged. No new invite or membership action.

Admin manifest retains `readOnly`, current filters/counters/status/timestamps, same-company authorization, and no Crew profile or mutation controls. Use scoped Admin styles for shared rows/labels. Do not add contact/payment fields or make scan/boarding/snack available here.

## Payment conflict review

Keep existing tenant conflict list and detail data. Place booking state, route/departure, passenger and seat together; group amount/payment history and booking reference below. Use known existing Indonesian display labels; keep unknown/provider-review states explicit. Phone/contact data already authorized on this screen stays on this screen only.

Reason remains required with the current 1–500-character validation. Konfirmasi tiket is primary only while currently eligible; disabled/company-suspended/terminal/pending conditions remain unchanged. Catat refund simulasi is separate and explicitly says it records an internal decision without moving money in Midtrans. Underlying `MOCK_REFUND`, request keys, confirmations and handler contracts remain unchanged. Financial PAID history must not be relabeled as money returned.

Terminal state shows the existing resolution and retains disabled mutation controls. Do not expose ticket success until the current service returns the corresponding result, or conceal inventory/provider conflicts through visual success feedback.

## Super Admin companies

Independent compact header: supplied brand, Super Admin role, Perusahaan PO title and Akun link. Real companies are readable rows with name, slug, labeled current ACTIVE/SUSPENDED status and one existing status-change trigger. Narrow screens stack row content; confirmations expand inline rather than overflow a table or require an overlay.

Preserve CompanyList controller and reconciliation semantics, single pending operation, fresh status revision handling, request/cancel/confirm sequence, automatic focus on cancel, focus restoration to trigger and existing polite messages. Suspend is cautionary; activate is primary. Confirmation copy retains exact product consequences: suspension stops new sales while existing tickets/initiated payments follow adopted rules; activation only restores otherwise eligible sales.

Denied and unavailable states receive the same safe shell without exposing company rows. Empty state says there are no PO; no add-company button or fabricated overview. Do not show aggregate revenue, hidden audit data or tenant operational fallback.

## Verification and completion boundaries

Implementation plan must include regression coverage for shell/current navigation, responsive presentation, supplied brand, known/unknown display labels, read-only Admin manifest, and preserved publication/builder/payment/company confirmation boundaries. Existing automated controller/service suites remain relevant; presentation tests must not claim database authorization was exercised by mocks.

Run authorized unit tests, type checking, lint and production build, then review the final diff for accidental handler/guard changes. Browser inspection covers representative existing screens at 320, 390, 1280 and 1440px, long content, table/grid containment, keyboard focus, empty/error/pending states, and reduced-motion/200% zoom when available. Check Passenger and Crew for shared-component/CSS regressions.

Current known limitation: the preceding actual Crew preview failed database reads with `SELF_SIGNED_CERT_IN_CHAIN`. Treat that as a possible blocker for authenticated administrative inspection; do not bypass certificate validation. Synthetic fixtures can establish layout evidence only and must be labeled as sample data. Preserve manual acceptance as pending, including actual font, phone and real administrative mutation checks. No physical test or successful live transaction may be inferred from source assertions.

Local integration follows the eventual approved implementation plan. User-owned `next-env.d.ts` changes and `.codex-remote-attachments` must remain untouched. No secret values, external publication or unrelated cleanup belongs to this phase.
