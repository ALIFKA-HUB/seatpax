# Seatpax fleet and seat-template implementation

Date: 7 October 2026. Development project only; no production deployment.

## Delivered

- Admin PO pages list/create/edit seat templates and vehicles under `/admin/companies/[companyId]`.
- Seat builder supports a complete rectangular grid (1–30 × 1–8), six cell types, normalized manual codes, first-unused numeric suggestions, confirmed row-major auto-numbering, confirmed destructive resize, and capacity derived from seat cells.
- Template replacements and status changes are atomic and versioned. Stale saves preserve the local draft and offer latest-state adoption or explicitly confirmed overwrite.
- Vehicle plate normalization and per-company uniqueness, status/revision, active source validation, same-company template/class associations, archive/deactivation race locks, and source-derived capacity are implemented.
- Verified identity and active ADMIN_PO checks run inside server transactions. The three fleet tables have RLS enabled, no `anon`/`authenticated` table grants, and tenant-scoped composite FKs.

## Database

Drizzle migration `0002_fleet_seat_templates.sql` was inspected and applied to the existing verified **development** Supabase session-pooler target on 7 October 2026. It adds `seat_templates`, `seat_template_cells`, and `vehicles` plus enums, checks, FKs, uniqueness, RLS and explicit browser-role revocation. It does not create trips or inventory. Browser grant checks and negative malformed/cross-tenant writes are in `tests/integration/fleet.test.ts`.

## UI evidence

Tested in Chrome as Admin PO A at 90% zoom and a 640×746 viewport, then at a 1280×752 desktop viewport:

1. Created and reopened `Demo Layout A`, initially 4×5 with one seat `01` and capacity 1.
2. Added a door in row 1, column 4. Cancelling a shrink to 3 columns preserved the 4×5 draft and door. Confirming the shrink produced a 4×3 grid and preserved the seat.
3. Changed the manual seat code to `A9`; cancelling auto-number preserved `A9`. Confirming auto-number changed it to `01`; saved state showed version 4 and capacity 1.
4. Created and reopened `Bus Demo A` (`B 1234 DEM`) with `Demo Layout A` and `Executive Demo`, ACTIVE, revision 1.
5. The user-provided final screenshot independently shows the 4×3 grid, code `01`, capacity 1, ACTIVE, version 4, and “Template tersimpan.”

## Automated verification

The approved fleet plan requires a fresh final run of `npm run db:test` twice, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`, each sequentially. The two DB runs also exercise tenant and route regressions. Commands/results are recorded in the execution ledger `.superpowers/sdd/2026-10-07-fleet-seat-template/progress.md`.

## Deferred work

Trip scheduling/publication, immutable copied trip-layout snapshots, inventory, booking/payment, and tests of the later trip renderer remain future work. Source layout edits update the current capacity shown by a vehicle; this is not a published-trip snapshot.
