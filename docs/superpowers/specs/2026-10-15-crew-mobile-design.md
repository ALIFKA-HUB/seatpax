# Seatpax Crew — Flutter Android and iPhone

Date: 15 October 2026. Status: written specification awaiting user review. The user approved a dedicated mobile Crew app and explicitly selected Android **and** iPhone. This document does not claim implementation or device acceptance.

## 1. Outcome and scope

Crew can install Seatpax, log in with their existing email account, open assigned trips, scan passenger tickets and explicitly record boarding and snack handover. Passenger, Admin PO and Super Admin remain web clients. Existing Crew web pages remain usable during the mobile transition; removing them is outside this change.

Use the current online domain rules, published trip snapshots, active memberships and trip assignments. This is a new client and API adapter, not a rewrite of ticketing. No offline mutations, cash sale, reseating, reversal, GPS, push notifications or administrative functions are introduced. Passenger/Admin visual revisions and the city/terminal catalogue remain separate work.

Authority: `docs/seatpax/00_INDEX.md`, active scope and decision ledger, and approved Trip Engine, manifest/boarding and snack specifications. The pending recommendations in `docs/analysis/SEATPAX_SPEC_REVIEW.md` do not add scope. Its assignment and exactly-once concerns are already enforced by the current services and must remain enforced for mobile.

## 2. Selected architecture

Use one Flutter application in `apps/crew_mobile`, with Android and iOS projects. Use native camera scanning through a maintained Flutter scanner plugin; `mobile_scanner` is the initial candidate, subject to SDK compatibility during implementation. Keep simple screen controllers, typed models and one HTTP client; no separate backend, WebView shell, new state-management framework or duplicated SQL in Dart.

Alternatives considered: improving the existing PWA would keep deployment simplest but would not deliver the requested installed mobile client; separate Kotlin and Swift apps would duplicate delivery effort. Flutter shares the UI and operational flow while retaining platform camera integration. Platform configuration and physical-device acceptance are still required independently.

Add versioned JSON Route Handlers under `app/api/crew/v1`. Put shared API identity/error/DTO adapters in `modules/crew-api`. Call `createCrewService`, `createBoardingService` and `createSnackService` directly. Preserve their transactions, locks and uniqueness constraints. Do not call Next.js Server Actions from Flutter. No database migration is expected for this slice; discovering a necessary schema change requires explicit review of that change.

## 3. Authentication and authorization

- Flutter uses the project's public Supabase URL and publishable key to request and verify email OTP for an existing account (`shouldCreateUser: false`). No mobile signup flow. Preserve the implemented eight-digit provider contract; changing OTP length is separate work.
- Persist the Supabase session through a secure-storage adapter backed by platform credential storage. Refresh through the SDK, clear local credentials and passenger state on logout, and prevent session material from entering logs, backups or crash reports. Return to login on expired/revoked sessions. A network failure does not silently erase an otherwise recoverable session.
- Send the current access token only as `Authorization: Bearer ...` to the configured HTTPS API origin. Never use query strings for credentials or accept arbitrary API hosts from scanned data. Native configuration contains no database URL, service-role key, Midtrans secret or ticket encryption key.
- Server identity uses Supabase `auth.getUser(token)` with a request-scoped client, not unverified JWT decoding, cookie fallback or client-supplied actor/role/company fields. Invalid credentials return 401; identity-provider failure returns a recoverable 503.
- Every endpoint checks current active CREW membership. Every trip read/mutation additionally uses the existing same-company active assignment and published-trip guards. An active Crew account with no assignments receives an empty trip list. Passenger/Admin/Super Admin sessions without active Crew membership are denied.
- Services continue to allow existing-ticket boarding/snack for a suspended company under the adopted policy. Revoked membership/assignment denies new calls and retries, regardless of cached UI or a still-valid access token.

## 4. API contract

All endpoints require verified bearer identity and return JSON with `Cache-Control: no-store`. Success uses `{data: ...}`; failures use `{error: {code, message}}`, without stack traces, SQL or provider details. Validate UUIDs, JSON shape and payload size before service calls. Limit JSON request bodies to 2 KiB. Never log request bodies, bearer values, QR tokens or manifest contents.

| Method/path under `/api/crew/v1` | Request | Successful data |
| --- | --- | --- |
| GET `/me` | None | Current user ID and Crew access confirmation; no membership editor |
| GET `/trips` | None | Assigned published trip summaries with ID, name, route label, departure instant, vehicle and plate |
| GET `/trips/{tripId}` | None | Minimal trip summary and ordered published stops needed for operations; exclude fares/inventory internals |
| GET `/trips/{tripId}/manifest` | None | Existing minimal manifest DTO, counts and stops |
| GET `/trips/{tripId}/passengers/{ticketId}` | None | Minimal passenger trip profile and current boarding/snack state |
| POST `/trips/{tripId}/resolve` | `{token}` | Same profile DTO; read-only, token never echoed |
| POST `/trips/{tripId}/boarding` | `{ticketId, stopId, source}` | `{boarding, alreadyBoarded}` mapped to minimum event identity/time/source |
| POST `/trips/{tripId}/snack` | `{ticketId}` | `{claim, alreadyClaimed}` mapped to minimum event identity/time |

Manifest includes name, seat, origin, destination and operation timestamps, never email, phone, token/hash or ciphertext. Profile includes origin-stop ID, journey/vehicle identity and operational state, but strips other staff actor IDs. Mutation responses omit unnecessary staff identity fields. API maps explicit DTOs instead of serializing raw trip/repository records.

Use 400 for malformed input; 401 for invalid/missing session; 403 for no Crew access; 404 with one generic message for a trip/ticket unavailable to this crew; 422 for valid input violating an operational rule, such as the wrong boarding stop or snack before boarding; 503 for infrastructure failure. Current services sometimes use `unavailable` for both missing tickets and infrastructure failures: adapters must not infer transport status from message text. Introduce a narrow internal error distinction if necessary, preserving web behavior and all guards. Do not leak foreign-ticket existence through responses.

Boarding and snack return 200 both for the first successful write and an authorized repeat. Existing ticket/trip uniqueness and locked service transactions provide idempotency; no new client event ledger is needed. An invalid origin stop still fails before a boarding retry, as in the current service. Do not claim arbitrary repeat payloads are equivalent.

## 5. Mobile screens and visual direction

Use the supplied Seatpax icon/wordmark from `public/brand`, preserving their proportions. Carry navy and bright blue identity into a compact, contemporary operational UI: white surfaces, restrained borders, clear type hierarchy, generous spacing and 48 logical-pixel action targets. Avoid a compressed desktop sidebar, excessive cards and dense setup forms. Platform safe areas, keyboard overlap, dynamic text and screen-reader labels are required.

1. **Login:** email, OTP entry/paste, resend cooldown and clear provider/network errors. Existing-account guidance; no role selector.
2. **Perjalanan saya:** assigned trip cards in service order, pull-to-refresh, loading/error/empty states and account/logout access. Selecting a trip is explicit.
3. **Perjalanan:** route, WIB departure, vehicle/plate and stops, with prominent **Scan tiket** and secondary **Manifest**. Do not invent an active-trip lifecycle.
4. **Scanner:** native rear camera, clear scan frame, permission explanation, torch when supported, close/back and manual manifest fallback. Request permission only when opening the scanner. Denied/permanently denied permissions have actionable guidance without repeated prompts.
5. **Passenger profile:** large seat and passenger name, origin/destination, operational status, explicit origin-stop selector and **Konfirmasi naik**. Show original boarding time for repeats. **Serahkan snack** is separate and enabled only after confirmed boarding. No scan automatically performs either mutation.
6. **Manifest:** local name/seat search and clear boarded/snack labels, selectable rows opening the same profile. Only data already authorized by the API is searched. No contacts or QR credentials in lists.

Format all operational times explicitly in WIB, independent of the phone's local timezone. Each state has text as well as color. UI copy uses Indonesian. Screen layout adapts to small Android phones and iPhones without clipped actions.

## 6. Scanner and request lifecycle

Accept only the existing opaque token format: exactly 43 base64url characters. Never launch a URL, deep link or arbitrary action from scanned content. Decode locally, stop scanning while resolving, and process at most one result at a time. Keep the token only in memory for that request; do not put it in navigation URLs, local storage, analytics or diagnostics.

Pause/dispose the camera when leaving the scanner, changing trip, logging out or backgrounding the app. Resume deliberately only on the foreground scanner with permission. Tag in-flight work with current session/trip generation so a late response cannot populate a different trip or a logged-out screen. After the profile closes, the crew chooses to scan again; duplicate camera frames do not create parallel resolves or writes.

Disable duplicate submits while boarding/snack is pending. Mutations have a bounded timeout. If the response is lost, show that the result needs checking and reload the profile before offering retry. Never announce success from a timeout or local optimistic state. Service idempotency preserves the original event on retry and concurrent devices. Refresh the profile after success; stale visible data never replaces server-side authorization.

No offline manifest persistence or background write queue. On network failure, keep only in-memory context with a visible stale/unverified state, disable mutations until refreshed, and offer retry. Clear passenger data on logout, access denial or trip change.

## 7. Delivery and environment

Configuration supplies API HTTPS origin, public Supabase URL and publishable key through documented build settings. Use the existing trusted server database configuration; never disable TLS validation. Development may use a configured HTTPS tunnel, but a phone's `localhost` is not the laptop and temporary tunnel uptime is not production hosting.

Installed local tooling observed on 15 October: Flutter 3.41.9 / Dart 3.11.5; Android SDK 36 present, with outstanding Android license acceptance. Do not silently upgrade Flutter or accept SDK legal terms. Select and lock compatible package versions during the implementation plan.

Deliver source for Android and iOS, a reproducible development runbook and an Android development APK if local build prerequisites permit. iOS source/configuration is part of this work; building, signing and validating an iPhone binary requires a macOS/Xcode runner and device access. This Windows laptop cannot establish iOS build success. Store publication, signing identities, paid accounts and TestFlight distribution are not included or claimed. Use development application identifiers; final distribution identifiers are a later release decision.

## 8. Verification and acceptance

The implementation plan must cover API authentication and invalid/missing bearer; provider outage; wrong role/PO/unassigned trip; revoked membership/assignment; suspended-company existing tickets; token/UUID/body validation; absence of sensitive fields/cache/logging; correct origin boarding; concurrent/repeated boarding and snack; snack-before-boarding rejection; and original event preservation. Keep existing web regression checks.

Flutter coverage must exercise auth/session transitions, DTO/error handling, loading/empty/retry states, scanner single-flight and disposal, stale response suppression, explicit boarding/snack controls and uncertain mutation recovery. Automated fake-camera tests are not physical camera acceptance.

Real acceptance on **both Android and iPhone** must cover email OTP, permission denied/recovery, native QR from another screen, background/resume, manual manifest lookup, network interruption, repeated scans, duplicate submit across two devices, logout and revoked access. Record unavailable build/device checks as pending with their exact prerequisite. Do not mark the whole mobile feature complete from Android alone.

## 9. Official references checked

- Flutter iOS setup: https://docs.flutter.dev/platform-integration/ios/setup
- Supabase Flutter email OTP: https://supabase.com/docs/reference/dart/auth-signinwithotp
- Supabase server identity verification: https://supabase.com/docs/reference/javascript/auth-getuser
- Scanner plugin documentation: https://pub.dev/packages/mobile_scanner

These references inform platform/API feasibility. Installed SDK and package compatibility still need explicit checks during implementation.
