# Helpdesk staff UI delivery plan — 29 October 2026

## Goal

Complete the approved Helpdesk workspace shell, real-data dashboard, complaint list, and detail presentation while preserving existing staff authorization, company isolation, lifecycle actions, and email/private-evidence behavior.

## Scope

- P04: responsive staff navigation with Dashboard and Pengaduan, existing Seatpax brand, account and public-site links.
- P05: status totals, deterministic waiting queue, persisted recent activity, and recent complaints using bounded staff service reads.
- P06: readable filtered/paginated list and responsive case details, including Admin PO read-only monitoring details.
- Reuse existing Next.js pages, staff service, CSS conventions, and installed icon package; no dependencies, schema changes, or public-page redesign.

## Dependencies

- Existing P03 pagination normalizer and staff dashboard service contract.
- Approved visual preview and `2026-10-27-helpdesk-workspace-refresh-design.md`.
- Queue ranking choice: HIGH, unset, MEDIUM, LOW; oldest creation time first within each priority, then stable ID order from the domain query.

## Checkable completion criteria

- Navigation works at desktop and phone widths; phone menu closes with Escape and returns focus to its opener.
- Dashboard counts are independent of filters; status links open their matching list; zero and unavailable states are truthful.
- Queue, activity, and recent rows render only service-provided authorized data; queue order comes from the domain service.
- Legacy `/helpdesk` filter query URLs route to `/helpdesk/pengaduan`; list pagination uses the shared page normalizer and preserves filters.
- Staff details retain the current priority/action/email/evidence contracts; Admin company detail is read-only and company-scoped.
- Focused UI/service tests and typecheck pass; no unrelated files are staged or published by this worker.
