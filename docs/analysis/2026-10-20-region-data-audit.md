# Region and demonstration data audit

Date: 20 October 2026, Asia/Jakarta. Target: existing Seatpax development Supabase project `slbkhdsfafcxaxqdxmet`.

## Authorization and limits

The user approved real city/regency reference data and asked to tidy the database. They confirmed that no real pilot PO or its locations have been identified. This audit performed SELECTs only. No schema, company status, stop, route, identity, transaction or ticket was modified or deleted.

## Observed records

| Area | Observed count | Interpretation |
| --- | ---: | --- |
| Companies | 10 | Two intentional demo POs and eight integration-test fixture companies |
| Master stops | 20 | Four demo stops; sixteen fixture stops labelled Stop 0–3 / City |
| Trips | 4 | All observed departures are in the past |
| Bookings | 5 | Three under Demo PO A; one each under two fixture companies |
| Payments | 5 | Same company distribution as bookings |
| Tickets | 1 | Under Demo PO A |
| Boarding events / snack claims | 0 / 0 | At audit time |

The `Trip fixture` name and exact `trip-<company UUID>` slug convention match `tests/integration/helpers/trip-fixture.ts`. This is provenance evidence, not permission to delete all records matching a name.

## Demo records to retain

- `00000000-0000-4000-8000-000000000001`: Demo PO A; four stops, one route, one published trip, three bookings/payments and one ticket.
- `00000000-0000-4000-8000-000000000002`: Demo PO B; retained for tenant-isolation exercises; no stops/routes/trips at audit time.
- Existing known internal users and memberships remain unchanged.
- Bandung Demo, Cianjur Demo, Sukabumi Demo and Bogor Demo are simulation stop names, not verified operational locations. Their city labels do not establish which municipality/regency was intended.

## Fixture maintenance candidates

| Company ID | Current status | Bookings / payments / tickets |
| --- | --- | --- |
| `1d9e8f7a-f6b7-42d3-a7b5-e38ecfb02bee` | ACTIVE | 0 / 0 / 0 |
| `5aa60dfe-aadf-423e-a863-11fe69e12422` | ACTIVE | 0 / 0 / 0 |
| `6f20f864-d10d-46cf-8183-e5b9b5dc51a1` | ACTIVE | 0 / 0 / 0 |
| `762a3201-19df-4b3d-a5c6-88983b52e1d9` | ACTIVE | 0 / 0 / 0 |
| `7e275bb1-739a-4e8e-80e2-17905e5344b1` | ACTIVE | 0 / 0 / 0 |
| `a0315534-d5b2-4e43-b3a0-5b2237f115a4` | SUSPENDED | 1 / 1 / 0 |
| `a123531d-143d-4e15-a4a5-9f0c5cf4775d` | ACTIVE | 1 / 1 / 0 |
| `c469c45d-da34-42fd-89bc-19a6bf1dbfd8` | ACTIVE | 0 / 0 / 0 |

Proposed treatment: an explicit allowlist, a fresh preflight/dry-run, then reversible company suspension through existing authorized/audited semantics for the seven ACTIVE candidates. Preserve the already suspended candidate and all related histories. Do not manufacture an audit event or increment a status revision for a no-op. No auth-user deletion, cascade cleanup, global name-based update or fictional rename.

## Application findings

- `stops.city` is free text; there is no province/regency reference table or foreign key in the implemented schema.
- `trip_stops` store published location snapshots. Updating a master stop cannot and should not rewrite those snapshots or old tickets.
- Passenger `locations()` currently reads all OPEN_FOR_SALE trip snapshots, including expired trips and suspended companies. This explains the visible fixture options; adding a city API alone will not remove them.
- Passenger choices should be derived from actual eligible published service intervals. A trip is eligible when some nonterminal origin still has time before its departure/sales cutoff, with an active company. Closed fixtures should not supply public search options.
- Fixture cleanup in the integration helper does not enumerate all newer booking/payment descendants. The records are consistent with retained fixture data; the audit did not establish exactly which failed run left each record. Hosted destructive test cleanup remains separate from this task.

## External reference verification

Direct HTTPS GETs succeeded on 20 October 2026:

- `https://www.emsifa.com/api-wilayah-indonesia/v2/provinces.json`: 38 records, metadata `updated_at=2026-10-18`.
- `https://www.emsifa.com/api-wilayah-indonesia/v2/regencies/32.json`: 27 records, same metadata date; sample `32.01`, Kabupaten Bogor.

This is a community static API. Its provider describes the source chain in https://github.com/emsifa/api-wilayah-indonesia. Availability checks do not independently certify the administrative dataset or verify every province. Record source/version and validate all imported records before enabling choices; do not import boundaries, population or unrelated fields.

## Next artifact

[Proposed reference-data and non-destructive cleanup design](../superpowers/specs/2026-10-20-region-reference-cleanup-design.md). Implementation and writes are not claimed by this audit.
