# Staff dashboard read-model design

## Approval and evidence

- `ADM-DATA-01` investigation/design requested with **"sikat"** on 2 November 2026.
- The user selected **Demo PO A** as the initial testing company.
- The user approved: **one person counted once; active if any scoped staff role remains active; display legacy multiple roles without modifying them**.
- Read-only inspection of Demo PO A: 3 distinct staff, 3 active, 0 disabled, 0 multiple-membership profiles; 2 profiles have no name, all have email. These are observed development counts, never hardcoded production values.
- Visual reference remains approved v5 from `2026-11-02-internal-dashboard-visual-design.md`.

## Scope

A real read-only dashboard at `/super-admin`: three summary cards and a searchable, paginated staff register for one configured company. `/super-admin/companies` remains available. No user creation, role editing, deactivation, deletion, password login, tenant selector, schema migration or additional role permission is delivered in this slice.

The Super Admin entry destination may point to the new dashboard once it exists. Customer, Operasional, Helpdesk and Crew authorization/destinations remain unchanged.

## Identity and count contract

- Scope staff memberships by the single configured company ID and roles `ADMIN_PO`, `HELPDESK`, `CREW`. Display `ADMIN_PO` as **Operasional** without renaming the stored role.
- Group by `user_id`: a customer profile without one of these scoped memberships is excluded. A global-only `SUPER_ADMIN` membership is excluded. A legacy person with both a global membership and a company staff membership is counted once through their company membership; the global role is not imported into the staff list.
- `total` = distinct scoped staff people; `active` = people with at least one scoped `ACTIVE` membership; `disabled` = people whose scoped memberships are all `DISABLED`. Invariant: `total = active + disabled`.
- Show all of each person's scoped roles and each role's status. A legacy active/disabled mix has an active row and a visibly inactive role label. Do not pick a single role or rewrite records.
- Company `SUSPENDED` does not mean staff `DISABLED`; the directory remains readable to authorized Super Admin.
- Use trimmed public profile name; if missing, display the existing email, otherwise **Petugas tanpa nama**. Missing email displays **Email belum tersedia**. Do not create names or fetch Auth metadata/secrets to fill gaps.

## Company selection and authorization

- Production requires a valid server-only `SEATPAX_COMPANY_ID`; never select the first company or accept company IDs from browser query parameters.
- In development only, unset configuration may use the explicitly approved Demo PO A ID `00000000-0000-4000-8000-000000000001`. Invalid explicit configuration fails rather than falling back. Production never falls back to a demo ID.
- Verify identity server-side. Inside each directory transaction, require a current `ACTIVE`, global `SUPER_ADMIN` membership before reading staff. Reuse the existing shared-lock authorization pattern, not client state or editable user metadata.
- Keep current browser table grants revoked and RLS enabled. No new public Data API table/view or service key in client code. Server data adapters are `server-only`; page rendering is dynamic with no cross-user cache.
- Query only configured-company profiles/memberships after authorization. Missing company/configuration or DB failure yields an explicit unavailable state; never substitute sample rows or zero counts. A genuinely empty company yields zero cards and a clear empty register.

## Query and presentation contract

- Page size 25. Query parameters: `q` (trimmed, at most 80 characters), `status` (`all`, `active`, `disabled`), `page` (positive integer). Invalid parameters normalize safely; SQL is parameterized and search wildcard characters are treated literally.
- Search name/email; keep company-wide summary counts independent of search/status/page. Compute aggregate counts, filtered count and page rows from one SQL statement/snapshot, after authorization. Clamp an out-of-range page to the final available page; empty results use page 1.
- Stable order: case-insensitive display name/email, then user UUID. Bound response size. Never download every staff profile to the browser solely to implement filters.
- Three solid cards preserve blue/green/orange v5 styling and filter the actual register. Search/status changes reset page 1; pagination retains active filters.
- Only implemented actions appear. No fake **Tambah petugas**, **Kelola user**, **Role & hak akses** or activity actions. The secondary rail can show actual company context and the existing company management link.
- Existing audit sources do not provide a general staff-management event log. Do not label profile timestamps as audited role/account changes or invent activity; omit that preview card for now.
- Preserve scoped Inter, responsive rows, 44px mobile targets, keyboard focus and reduced-motion support.

## Acceptance

Count/group tests cover mixed and all-disabled memberships, pure global Super Admin, customer-only and another company. Authorization tests reject customer/Operasional/Helpdesk/Crew and revoked Super Admin before staff reads. Empty, unavailable and forbidden states remain distinguishable. Pagination/search tests cover 26+ users, duplicate names, literal `%`/`_`, zero matches and out-of-range pages. Browser checks cover all six approved widths, mobile navigation, filters, pagination, missing/long names and direct unauthorized URL access. No persistent staff mutation is part of verification.

## Source/security references

`lib/db/schema.ts`, `drizzle/0000_tenant_access.sql`, `drizzle/0012_helpdesk.sql`, `modules/access/service.ts`, `modules/company/repository.ts`, `modules/company/transaction.ts`, `modules/auth/entry-destination.ts`, `docs/analysis/SEATPAX_SPEC_REVIEW.md`. Existing grants/RLS and server-only access are retained; see [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
