# Helpdesk workspace UI refresh — 29 October 2026

## Delivered

- The staff workspace uses the existing Seatpax logo and white, blue, navy, and blue-grey palette. Navigation provides Dashboard, Pengaduan, Ke Seatpax, and account access; active navigation uses a solid blue fill.
- The waiting status summary is highlighted with solid Seatpax blue and readable white text, matching the accepted dashboard preview.
- The phone navigation opens from a labelled button, closes after route selection or Escape, and returns focus to the opener on Escape. Main content remains visible below the menu.
- `/helpdesk` reads real company-authorized status totals, a bounded waiting queue, recent cases, and persisted events through the Helpdesk staff domain service. Queue ordering is HIGH, unset, MEDIUM, LOW, oldest first, then ID.
- `/helpdesk/pengaduan` provides search, status, priority, pagination, and detail links. Legacy `/helpdesk` query links redirect to the list with their filters intact.
- Server loading uses a labelled, reduced-motion-aware skeleton; zero-data and load-failure messages remain distinct.
- Staff detail and Admin company monitoring detail share one presentation. The Admin route verifies the Admin PO permission and company ID and forces read-only controls. Existing attachment download authorization remains in its API route.
- Existing priority, lifecycle, email retry, and private evidence contracts remain in the domain and action layers. The priority selector reflects the case's stored priority.

## Checks

- `npm run typecheck` — passed.
- Focused tests — 3 files / 7 tests passed (`helpdesk-case-list-ui`, `helpdesk-staff-domain`, `helpdesk-retry-action`). The rendered-list check verifies full case IDs, Admin detail destinations, and filter-preserving pagination.
- Scoped ESLint — passed for the changed UI routes, components, and focused rendered-list test.
- Synthetic CSS review — no document overflow at 320, 390, 768, 1024, or 1440 px; visible navigation targets were at least 44 px. This checks the shell styles with synthetic markup, not an authenticated application route.
- Browser, physical-device, and authenticated role-denial acceptance — not performed in this setup record.
- No production data was changed and no email provider was contacted.
