# Real regional reference data and safe database tidying

> Execution update: the user approved execution. Regional catalogue is delivered/applied; fixture cleanup code and backup are prepared only. See ../../setup/REGION_REFERENCE_SETUP.md and ../../setup/FIXTURE_CLEANUP_SETUP.md.

Status: the user requested implementation planning on 20 October 2026 after this written design was presented. [Package A](../plans/2026-10-20-region-reference.md) and [Package B](../plans/2026-10-20-fixture-cleanup.md) await plan review. User-approved intent: use real Indonesian city/regency references and tidy existing data. User confirmed no actual PO or verified terminal/pool locations are available yet. No implementation or hosted write is claimed.

## Outcome

Admin selects an actual province and city/regency when creating or correcting a service point. The shared catalogue is independent of tenant-owned operational stops. Existing demonstration data remains explicitly simulated until a real PO and verified locations are supplied. Passenger search offers real configured service points from eligible trips, not every city in Indonesia or stale fixture snapshots.

## 1. Regional catalogue

Use the Emsifa static API v2 as the initial community reference provider, verified in the linked audit. Import only province codes/names and regency codes/names/parent relationships. Preserve the provider's codes as text, including dots; never treat them as numbers or mix BPS and Kemendagri-style identifiers.

Add shared, RLS-enabled `region_provinces` and `region_regencies` tables and an import-run record containing provider identifier, source URLs, retrieval time, upstream metadata date, payload digest and success/failure status. Use a unique provider/code pair for catalogue identity, indexed parent references and foreign keys. Public clients receive only the small location DTO through a server adapter; no browser writes, imported raw payload access or service-role secrets.

Synchronization is an explicit server maintenance command, initially manual. Validate shape, duplicate codes, parent links and a complete fetch before promoting a dataset in one transaction. A failed/partial import keeps the last successful catalogue usable. Retain codes already referenced by a stop; codes absent from a later validated import become unavailable for new selection rather than being deleted. No scheduler/automation is created by this design.

## 2. Existing stop compatibility

Add a nullable catalogue-regency reference to `stops`. Keep existing `city` text as the compatible display field. New/edited verified stops select a valid current reference; server derives the display name from that reference rather than trusting submitted city text. The nullable legacy path is shown as **Wilayah belum dipetakan** in Admin and can be corrected explicitly.

Do not guess that “Bandung” means Kota Bandung rather than Kabupaten Bandung, or that “Bogor” means Kota Bogor rather than Kabupaten Bogor. None of the four demo stops is automatically mapped. Legacy city labels remain until an explicit choice is made. Published `trip_stops` and ticket histories retain their original snapshot labels; future publication takes the corrected master-stop label.

Admin UI uses province and searchable city/regency selections in the existing Add/Edit point dialog. Name and address still describe a PO-operated terminal, pool or pickup/drop-off location; the regional API does not certify that location or create a PO route. Catalogue unavailable/empty states explain retry or sync; no silent fallback to fictional names.

## 3. Existing-data cleanup manifest

Use the exact eight-company allowlist in the [audit](../../analysis/2026-10-20-region-data-audit.md). Before applying any write, reread statuses/revisions, active holds, recent payment activity and transaction counts; stop on unexpected new activity or changed identities. Produce a dry-run showing expected status changes and preserved dependent records.

Proposed apply operation: suspend the seven currently ACTIVE fixture companies through existing Super Admin authorization, optimistic status revision and audit semantics. The already suspended company remains a no-op. Record only actual transitions. Retain all companies, identities, memberships, master records, published snapshots, bookings, payments and tickets. No hard deletes, auth-user deletions, fictional replacements or inventory rewrites.

Retain Demo PO A and Demo PO B for current login/payment exercises and tenant-isolation verification. They remain simulation companies; no actual PO name, address or verified stop is invented. Introducing a new public PO portal or hiding company rows from Super Admin is outside this cleanup.

This write manifest requires explicit approval of this concrete operation before application because it changes company access state. Before applying, make a restorable backup of the target records and define rollback via the same authorized status transition flow. Reactivation restores only otherwise eligible sales, as required by existing rules; it does not reverse payment history or manipulate transactions.

## 4. Passenger location choices

Correct the existing inventory repository location read to exclude suspended companies and trips with no remaining sale-open interval. Honor middle-stop departures after the first departure where a later interval is still available; do not filter solely by the trip's first departure. Include only origin/destination snapshot points participating in an eligible ordered interval. Keep source-stop IDs in search fields and snapshot-stop IDs in seat-selection URLs.

Source-stop status or catalogue refresh must not rewrite a published snapshot. This is a read-filter correction; hold, booking, payment, ticket and assigned-Crew authorization rules remain unchanged. No new cross-PO marketplace or automatic current-PO selection is introduced.

## 5. Scope and safety boundaries

- Real province/city data, compatible master-stop references, Admin selection and an audited reversible fixture suspension manifest are included.
- No real pilot company or service point is provisioned while those details are unknown.
- SaaS subscription billing, native Crew implementation, national terminal catalogue, map/geocoding, production launch and physical-device acceptance remain separate.
- No tests are added or run unless the user requests testing/verification. Before completion, schema/import application still requires the explicitly agreed verification necessary to establish that the operation succeeded; testing authorization will be recorded in the implementation plan.

## Acceptance to carry into the implementation plan

1. A complete validated import supplies actual region names; failed refresh leaves the previous version available.
2. Kota and Kabupaten with similar names remain distinct choices; legacy ambiguous city text is never guessed.
3. No credentials reach clients; browser roles cannot alter the reference tables.
4. Admin tenant checks stay enforced; no arbitrary city label can override the selected reference.
5. Suspended/expired fixtures no longer populate passenger location choices; valid middle-stop sales still do.
6. Cleanup targets only reviewed IDs/revisions and preserves transaction/ticket counts; no-op suspension does not create duplicate events.
7. Published snapshots and old tickets are unchanged after a master-location correction.

## Approval handoff

The user requested the implementation plans after the written design and scope summary were presented. Review Package A/B before execution; the actual fixture-status dry-run still requires its explicit operation approval before application. No database changes have been made in this preparation.
