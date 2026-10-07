# Fleet and seat template design

Date: 7 October 2026. Status: **IMPLEMENTED LOCALLY — design approved by the user with “spec oke”; branch `codex/fleet-seat-templates`, locally merged after verification**. The user approved the conversational design: click-cell grid, automatic/manual seat codes, vehicle association and tenant authorization. Numeric bounds and detailed persistence rules below were accepted in the written-spec approval. Evidence: `docs/setup/FLEET_SETUP.md`.

## Intent and scope

Admin PO can create a reusable seat layout and associate it with a vehicle, preparing the source data for the next trip scheduling slice. Success is a four-type-or-more layout saved/reopened through the admin UI, correct derived capacity, an assigned vehicle, and rejection of foreign-company access.

Authorities: `docs/seatpax/02_MVP_SCOPE.md`, `06_FLEET_SEAT_TEMPLATE.md`, `10_DATA_MODEL_DATABASE.md`, latest direction in `13_UI_UX_DESIGN.md`, foundation design F02/F11 and decision ledger. Review R02 requires complete independent trip layout snapshots; that decision has already been adopted in the foundation. This slice supplies source layouts only and does not claim snapshot publication is implemented.

Included: template list/create/edit/archive/reactivate, smart grid cell editor, automatic numbering/manual override, derived capacity, vehicle list/create/edit/status and template/class association. Excluded: drag/drop, free rotation, duplicate-template polish, photos, maintenance scheduling, trip scheduling/publication, inventory, booking/payment and replacement of sold-trip vehicles.

## Selected approach

Use a rectangular smart grid with explicit cell types, saved atomically with its template. Vehicles reference reusable templates; service class is a vehicle default to be shown to the later trip editor. A class override on a trip is a future trip-slice decision, not permission granted by this spec.

Alternative fixed presets would speed initial entry but limit the existing dynamic-layout requirement. Free-position drag/drop adds interaction and validation work outside the active release. Click-cell editing fulfills the selected demo scope and reuses the current guarded server action/domain service pattern.

## Template and grid contract

- Template name: trimmed 1–120 characters. Status `ACTIVE|ARCHIVED`; no hard-delete UI.
- Dimensions: rows 1–30, columns 1–8. Front of vehicle is above row 0; coordinates are zero-based. The grid contains exactly one cell at every coordinate, at most 240 cells. No free pixel coordinates, rotation or seat spanning.
- Types: `SEAT`, `DRIVER`, `AISLE`, `DOOR`, `EMPTY`, `FACILITY`. FACILITY is a visual label only; it does not establish a snack entitlement or booking rule.
- At least one SEAT is required for a saved template. No mandatory driver/door count is inferred; arbitrary physical layout can be represented within the grid.
- SEAT code: trimmed uppercase ASCII letters/digits/hyphen, 1–8 characters, unique within the template after normalization. Required only for SEAT; non-seat codes must be null. Optional label: trimmed, at most 40 characters, empty becomes null.
- Capacity is the count of SEAT cells, derived by the server and previewed locally. Browser-supplied capacity is not authoritative. No arbitrary cell metadata or window/extra-legroom settings in this slice.
- New grid starts EMPTY. Clicking a cell opens its type/code/label controls; keyboard activation is supported. Changing type away from SEAT clears its seat code. Choosing SEAT proposes the first unused numeric code, while the user can override it.
- Auto-numbering visits SEAT cells row-major and assigns `01..N` (100 and above retain all digits). It renumbers all current seat cells only after confirmation; it never silently overwrites manual codes. Save revalidates the entire layout.
- Resize preserves overlapping coordinates and creates EMPTY cells in new space. Shrinking that removes any non-EMPTY cell needs explicit confirmation; cancellation preserves the draft. Resulting seat codes and minimum capacity are validated before save.
- Template version starts at 1 and increments exactly once for each successful save or status change. Updates require expectedVersion; a stale write returns conflict without partial cell replacement.
- Archive preserves existing vehicle references. Archived templates cannot be newly assigned to a vehicle. Existing associations may remain for maintenance/metadata editing, and reactivation makes the template selectable again. Eligibility for later trip publication must recheck active source status.

## Vehicle contract

- Vehicle belongs to one company and references a template and default service class from that same company through composite FKs.
- Required name: trimmed 1–120 characters. Plate: trimmed uppercase, collapse whitespace, 1–24 characters, ASCII letters/digits/spaces/hyphen; unique per company after normalization. Optional fleet number: trimmed 1–32 characters when present, empty becomes null; no uniqueness rule is invented for it.
- Status `ACTIVE|MAINTENANCE|INACTIVE`; all three are editable source states, no physical vehicle deletion.
- New or changed template/class references must be active. An unchanged inactive class or archived template reference can remain on a metadata/status edit; the UI displays its state clearly. No automatic remapping or capacity copying.
- Vehicle revision starts at 1 and increments per successful edit/status change. Stale expectedRevision conflicts. Capacity and layout shown for a vehicle come from its current template, so source template changes affect future use of the vehicle.
- Template/class reassignment is explicit. Published trip snapshots will remain independent under the already adopted foundation contract; this slice creates no trips.

## Schema and boundaries

Add `seat_templates`, `seat_template_cells`, `vehicles`. Template has company/name/rows/cols/version/status/timestamps. Cell has company/template/row/col/type/label/seat_code. Vehicle has company/template/default_service_class/name/normalized_plate/fleet_number/status/revision/timestamps.

Compound `(id,company_id)` keys support tenant FKs. Cells reference their template/company, unique coordinate and seat code; vehicles reference template/company and class/company. RESTRICT deletion protects references. Database checks enforce numeric bounds, positive versions, recognized states and seat-code/type consistency. Whole-grid completeness, bounds relative to its template, minimum seat count and normalized codes are enforced by the single transactional domain write, not by a claim that independent row CHECKs inspect other rows.

Browser roles have all direct table grants revoked, RLS enabled and no direct write policies. Verified server identity is required; existing active ADMIN_PO membership on the target company is rechecked/locked inside transactions. Crew, passengers and a global Super Admin without that tenant membership cannot manage these resources. Company suspension does not revoke source-template management, following the current route slice policy.

Business logic belongs in `modules/fleet` (template/vehicle validation, services and repositories). UI actions validate command shape, verify identity, call services and return sanitized errors; client actor/role/company claims are not authority. Existing admin navigation gains Seat Templates and Armada pages.

## Transaction and conflict rules

Reads are tenant scoped and guarded with fresh membership. Writes use membership `FOR SHARE` first. Template edits lock the template `FOR UPDATE`, check expectedVersion, validate complete layout and atomically replace cells plus update metadata/version. No cell-by-cell network saves.

Vehicle assignment locks referenced old/new templates in UUID order `FOR SHARE`, then old/new service classes in UUID order `FOR SHARE`, then vehicle `FOR UPDATE`. Recheck expectedRevision, ownership and referenced source eligibility after locks. A concurrent reassignment invalidates the revision read before acquiring dependencies and returns conflict; do not mutate using a different dependency set. Master template edits never acquire a vehicle lock, avoiding an opposite dependency order.

Membership revocation waits for a write holding its share lock, then subsequent operations deny. Server timestamps apply. Exceptions roll back complete layout/vehicle mutation. Duplicate plate or seat code returns a safe field-oriented error. No network calls while transaction locks are held.

Draft input survives failed submits. Conflict refresh shows latest server data without silently advancing expected version. User can adopt the latest state or explicitly confirm retaining their draft for overwrite. A later concurrent write still causes a new conflict. Pending state prevents duplicate submission.

## UI and snapshot readiness

Indonesian labels, navy/blue admin styling, visible focus, labels/icons with colors, front orientation and a cell legend. Template list shows name/dimensions/capacity/status/version. Builder has name/dimensions, grid, selected cell controls, numbering and Save. Vehicle form shows template capacity/status and service class.

Desktop is the primary admin surface. On narrow viewports, cell controls stack; grid may horizontally scroll within its own labelled region rather than force page overflow. Every cell is a button with row/column/type/code in its accessible name and can be activated by keyboard. No automatic destructive grid resize or numbering.

Provide a pure validated layout projection `{rows,cols,cells:[{rowIndex,colIndex,type,label,seatCode}]}` for preview and future publication. Published trip renderer/inventory will use a complete copied snapshot built atomically from the same input, not the live template. Future schema must not require old trips to retain mutable cell rows after template replacement.

## Acceptance and verification plan

1. Admin A builds/reopens a grid with SEAT/DRIVER/AISLE/DOOR/EMPTY/FACILITY, manual codes and computed capacity; invalid/duplicate codes and incomplete/out-of-bounds cells fail atomically.
2. Auto-numbering is deterministic; resize preserves retained cells, cancellation preserves draft, and removed nonempty cells require confirmation.
3. Admin assigns same-company active template/class to a vehicle, edits and changes status; duplicate normalized plate and cross-company references fail.
4. Archive/inactive references preserve existing vehicle data, block new assignment and remain visible. Reassignment to an eligible source works explicitly.
5. Two writes with the same version/revision have one winner; revocation and template archive versus vehicle assignment follow locks without partial writes.
6. Admin B cannot list/read/write A resources; browser anon/authenticated cannot SELECT/INSERT/UPDATE/DELETE any new table.
7. UI create/edit/reopen, desktop/narrow layout and keyboard flow are actually exercised; user enters OTP when needed. Mocks are not browser evidence.
8. Opt-in PostgreSQL tests use unique fixtures/exact cleanup and preserve demo data. Run unit/typecheck/lint/build plus database tests; one fresh Luna medium final review under the user's inline execution preference.

## Review status

Self-review: scope stays in the fleet source slice; snapshot publication is deferred explicitly; completeness is transactional rather than overstated database enforcement; stale overwrites and tenant FK invariants have explicit rules. Numeric limits, normalization, vehicle class-default semantics and archive/reference behavior were approved with this written spec. No product code or migration has been created for this slice.
