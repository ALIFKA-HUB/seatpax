# Regional reference delivery

Date: 20 October 2026. Branch: `codex/region-reference-cleanup`, base `281899a`.

## Delivered

- Shared server-only province/regency catalogue from [Emsifa API v2](https://github.com/emsifa/api-wilayah-indonesia), a community source, separate from PO service points.
- Manual validated sync, four fetch workers, request timeouts, atomic promotion, stable UUIDs, version conflict checks, failed-run records and retained retired references.
- Admin province plus exact searchable city/regency selection. New stops require an active reference; server derives the city label. Unmapped legacy stops retain their city until explicitly selected. Retired mapped references support unrelated edits.
- Passenger locations require an active company and an eligible ordered sale-open interval, including middle-stop origins. Display fields remain published snapshots and IDs remain source-stop IDs.
- No fictional pilot PO, terminal directory or automatic legacy mapping.

## Applied to development

Target: `slbkhdsfafcxaxqdxmet`, guarded migration URL and verified TLS with existing CA.

Migration `0011_region_reference` applied through `npm run db:migrate`. Dry-run fetched all province/regency pages and validated:

| Item | Result |
| --- | --- |
| Provider/version | emsifa-v2 / 2026-10-18 |
| Provinces / regencies | 38 / 514 |
| Canonical dataset SHA256 | `5a48db39e552f66ccfad3cc57cd1da9571c3c469954bab568f34d8bf04f5bbbe` |
| Import | SUCCEEDED, same digest as dry-run |
| Missing/cross-provider parents | 0 |
| Old stops | 20, all retain NULL region mapping |
| Reference tables with RLS | 3 |
| Browser/PUBLIC grants on reference tables | 0 |
| Protected operational tables | 32, before/after counts and digests identical |
| Booking/payment/ticket totals | 5 / 5 / 1, unchanged |

Normal rendering reads the local catalogue and does not call upstream. For later refreshes, from this worktree with the existing environment and CA:

```powershell
node_modules/.bin/tsx scripts/sync-regions.ts
node_modules/.bin/tsx scripts/sync-regions.ts --apply --expected-digest <reviewed-dry-run-sha256>
```

The default command writes nothing. Unknown arguments are rejected. Review a new digest before applying it. Never use reset/seed to refresh regions.

## Verification and limits

Fresh reviewer (GPT-6 Luna, medium) found no critical/important defects before migration. Typecheck, lint and production build passed. Explicit read-only SQL established the operation results above; these checks are not a test suite. No tests were added/run, per current instruction. Browser/keyboard/360px and physical-device acceptance, import failure/concurrency tests and isolated tenant tests remain deferred.

## Execution rulings

- Tests deferred under developer instruction and approved plan; cost: behavioral acceptance remains pending.
- Optional `--expected-digest` binds apply to reviewed upstream content; changed content stops safely.
- The custom Drizzle migration snapshot was regenerated from current schema with the installed Drizzle API, retaining generated IDs; this prevents subsequent generation from treating current tables as missing. No independent migration history was introduced.
- Stop directory reads do not join reference tables. If the catalogue read fails, the directory remains available and the editor explains catalogue unavailability.

Fixture status cleanup was subsequently approved, applied and verified: see [the concrete review, backup and operation evidence](FIXTURE_CLEANUP_SETUP.md).
