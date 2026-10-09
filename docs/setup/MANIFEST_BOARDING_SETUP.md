# Manifest and boarding setup

## Implemented scope — 9 October 2026

Approved design: `../superpowers/specs/2026-10-08-manifest-boarding-design.md`.
Assigned active CREW can read confirmed passengers and explicitly record boarding from manifest or QR. Active same-company ADMIN_PO can read a manifest only. Every request checks current membership and crew assignment; company suspension permits existing-ticket operations. No Super Admin fallback is added.

Manifest capacity, passenger count and boarded count are separate. Adjacent passengers sharing a seat retain separate tickets. Profiles contain operational passenger/trip snapshots, excluding phone, email, account identity and QR secrets. Scan resolves a profile only; the operator must confirm boarding at the ticket's origin stop.

`drizzle/0008_manifest_boarding.sql` adds the immutable service audit event, ticket/trip uniqueness, composite ticket and stop foreign keys, database timestamp, RLS and revoked browser grants. Apply through the existing guarded `npm run db:migrate` process. It was applied to the development database during this implementation. No update/reversal endpoint exists. A retry retains the original event, actor, source and timestamp after fresh authorization.

## Pages and camera

- Crew trip detail links to manifest and scan.
- Manifest supports name/seat search and boarding-state filters, with manual passenger detail and origin-stop confirmation.
- Admin published trip detail links to its read-only manifest; URL company must match the trip's derived company.
- QR decoding uses exact `qr-scanner` 1.4.2, dynamically imported in the client with a bundled local worker. No remote decoder, upload or QR URL navigation is used.
- Start is explicit. Close/unmount and late camera startup stop and destroy the scanner. Repeated frames resolve once. Permission/network failures direct the operator to the manifest; scanning again is explicit.

Online only. Snack claims, cash, offline sync, no-show, reversal, reseat and GPS remain outside this slice.

## Verification

Task 1 manifest integration passed (1 combined fixture test, 34.08s). Task 2 boarding-write and payment-confirmation regression passed (9 tests, 171.41s). Cases cover pending exclusion, adjacent reuse, tenant isolation, current access revocation, suspended-company reads/boarding, wrong stop, rollback, concurrent crew, immutable retry, uniqueness and composite foreign keys.

Task 3 full unit suite: 44 files / 191 tests passed. Typecheck, lint and production build passed. All four new page routes are included in the production build. Local package source and emitted production chunks contain the decoder module/worker; this is bundling evidence, not a physical-camera test.

Full serial database regression passed: 18 files / 69 tests, 940.55 seconds, zero failures. This includes checkout/payment regression and the revoke-first barrier. A final targeted boarding rerun after review is recorded below.

## Manual acceptance pending

The available Windows surface inventory had no Chrome/browser window. Previous Browser Use rejected localhost by tool policy, and Windows window geometry/capture failed. These checks were not bypassed and no successful camera/browser evidence is claimed.

1. Login manually as assigned Crew A at `http://localhost:3001/login`. Open its trip, manifest and one explicitly selected demo passenger.
2. Verify keyboard search/filter/profile navigation and stop selection; confirm only that passenger. Reopen to see the original boarding time. Never mass-board demo passengers.
3. Check 390px width, visible focus, readable counters, and camera-denied manifest fallback.
4. On an explicitly configured HTTPS phone preview, grant camera permission manually and scan a valid ticket. Confirm scan itself does not board; close/navigation stops the camera; explicit rescan works.

The current payment callback tunnel exposes POST notification only. Do not broaden it for phone preview without a separate setup decision. Physical phone camera, keyboard and 390px acceptance remain pending until actually observed.

Final reviewer: one focused GPT-6 Luna / medium review identified manifest overfetch and missing concurrent revoke-first test. Both were addressed; the same reviewer inspected the fixes and found no residual actionable issue. Unit minimum-projection and manifest WIB-render tests observed RED then GREEN; revoke-first database test result is recorded with final integration evidence.

### Runtime prerequisites and current preview

Use the existing server database connection and migration configuration. No additional credential is required for boarding. Keep the approved ticket encryption key stable; QR resolver hashes the existing opaque token and does not decrypt it into a manifest payload. Do not paste secrets into setup documentation.

The production preview was started on port 3001 from the attached manifest worktree. Login and camera permissions require the human user. The implementation introduces no production deployment or background scheduler.

Final targeted boarding regression: 2 files / 4 tests passed in 85.33s after review changes. Latest full units: 44 files / 191 tests passed; typecheck, lint and build passed. The same reviewer accepted the additional ticket-ID guard against a late response from the previously scanned passenger. Local integration into main is the authorized final action; no push/deploy. Physical camera, keyboard and 390px acceptance remain pending.
