# Responsive UI audit — 29 October 2026

## Goal and scope

Review the existing passenger, operational admin and Crew presentation at 320, 390, 768, 1024 and 1440 CSS pixels. Preserve the approved routes, booking/operational behavior, Seatpax brand and existing page compositions. The audit found no confirmed responsive defect in the inspected CSS fixtures, so it made no production UI changes.

**Dependencies:** P07–P09 inventory and preview approval in `docs/superpowers/plans/2026-10-29-project-stabilization-roadmap.md`. This audit is source and layout evidence, not a substitute for the remaining authenticated flow, device or camera acceptance.

## Results

### Public passenger routes observed

The local development server used the current worktree on `127.0.0.1:3001` with webpack and system certificate trust enabled. Read-only GET requests and headless Chrome viewport checks were run for `/`, `/trips` and `/login`. All returned HTTP 200. At every requested viewport, `document.documentElement.scrollWidth` equaled `clientWidth`; no page errors were observed.

| Route | 320 | 390 | 768 | 1024 | 1440 | Headless page errors |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 320 / no overflow | 390 / no overflow | 768 / no overflow | 1024 / no overflow | 1440 / no overflow | 0 |
| `/trips` | 320 / no overflow | 390 / no overflow | 768 / no overflow | 1024 / no overflow | 1440 / no overflow | 0 |
| `/login` | 320 / no overflow | 390 / no overflow | 768 / no overflow | 1024 / no overflow | 1440 / no overflow | 0 |

Reduced motion was set to `reduce` for these browser renders. No login was submitted and no staff or customer account was used.

The first route requests compiled in the development server: `/` took 20.2s total (17.6s Next.js compilation), `/trips` 6.8s (5.7s compilation) and `/login` 7.3s (6.8s compilation). Later requests varied from 92ms to 8.2s total. These server logs separate compile time from the remaining request time, but the remaining time does not identify database/network waits or animation cost. No before/after performance claim is made; this audit changed no application code.

### Existing operational and passenger styles

Representative synthetic layouts were styled with the current application CSS and loaded in headless Chrome. The fixtures intentionally included long route/stop names, search controls, trip/seat layouts, a long admin table, and long manifest passenger names. They were authored only for layout checks; they are not application data or rendered application pages.

| Synthetic role fixture | Widths checked | Document overflow | Smallest visible control |
| --- | --- | --- | --- |
| Passenger trip/search/seat/footer | 320, 390, 768, 1024, 1440 | None | 44px |
| Admin navigation/location table/form | 320, 390, 768, 1024, 1440 | None; table remains internally scrollable | 46px |
| Crew manifest/profile | 320, 390, 768, 1024, 1440 | None | 48px |

The synthetic Crew and Admin fixtures do not test staff authentication, server data, keyboard completion of every control, camera permission, or the on-device scanner. P09 physical-device acceptance remains untested.

### Helpdesk shell fixture

`tests/browser/helpdesk-workspace.mjs` is a synthetic CSS-only check. It loads `app/helpdesk/helpdesk.css` and checks the desktop/mobile shell, status-card columns, visible navigation target sizes and document overflow at the five widths. It passed all five widths: no page overflow; mobile bar/menu displayed through 390px and were hidden by 768px; the visible minimum navigation target was 44px on phone and 46px on desktop; status cards used two columns on narrow layouts and four at 1440px. It performs no login, route request, API call or database read.

## Source review

- Passenger layout uses bounded containers and responsive layouts; the seat map has its own horizontal scroll region. Navigation/footer styles adapt below 640px and tablet widths.
- Admin styles provide a narrow-screen single-column shell and internally scrollable tables. Long table content wraps. The stop editor dialog has a viewport-bounded height and internal scrolling.
- Crew controls remain at least 48px high in the inspected stylesheet; manifest filters and profile status grids collapse to one column on phones. The seat region scrolls independently.
- Passenger navigation, landing animation, and booking motion transitions are gated behind `prefers-reduced-motion: no-preference` or have explicit reduced-motion rules. Admin and Crew transitions are also limited to no-preference.
- No spacing, keyboard, wrapping or overflow issue was confirmed that justified a runtime CSS change in this bounded audit.

## Acceptance limits and next checks

- Public render evidence covers only `/`, `/trips` and `/login`; it does not verify real trip availability, authenticated checkout, orders, sold-out/pending/error recovery, or booking navigation state.
- Admin and Crew results are synthetic CSS fixtures, not rendered authenticated application routes. Route → fleet → trip setup and assigned Crew trip/manifest/scan smoke tests remain outstanding.
- No Android/iPhone, mobile Safari, camera permission or physical scanner test was performed. Computer Use remained blocked as recorded in `docs/analysis/2026-10-29-computer-use-flow-audit.md`.
- Headless viewport checks are layout evidence only; they do not certify screen-reader behavior, all keyboard paths, performance, or real-device rendering.

## Reproduction

With the app's current local server and Chrome available, run `node tests/browser/helpdesk-workspace.mjs`. Set `PLAYWRIGHT_MODULE` to the installed Playwright module when it is not resolvable from the project. The public-route viewport observations above were performed as an ephemeral read-only check and did not add test fixtures or mutate application data.
