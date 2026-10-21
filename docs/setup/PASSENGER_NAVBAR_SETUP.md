# Passenger floating navbar delivery

21 October 2026, branch codex/seatpax-landing, base b82ff17. User accepted the desktop/phone preview and specifically requested text-only blue active main links.

## Implementation

Shared synchronous PassengerShell preserves logo and /trips, /tickets, /account destinations. Desktop has a white 72px floating surface, 20px corners, 16px sticky offset, centered main links and right account control. Phone retains 64px compact top header and fixed three-item bottom navigation. Active/hover main items have transparent background, no selection shadow/border, and blue text/icons. Focused login/checkout shell remains simple.

Small client account control uses existing browser Supabase client getUser for presentation only. Unknown identity offers the guarded /account link; guest offers /login; signed-in state has native details/summary, /account profile link and lazy call to existing logoutAction. Subscription, pending timer and in-flight result generations are cleaned up. Outside pointer, Escape and focus exit close the disclosure. Logout retains pending/error feedback. No server role permissions, DB, provider or auth endpoint was changed. No credentials or session data are displayed or logged.

API references checked: [getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange). Changelog markdown fetch was rejected by browser tooling's content-type handling; no Supabase package/API migration was performed.

## Evidence

- Failing new test run before implementation: missing account component. After implementation, focused 3 files / 8 tests passed.
- Full npm test: exit 0, 74 files / 295 tests passed.
- npm run lint: exit 0, no diagnostics.
- npm run typecheck: exit 0.
- npm run build -- --webpack: exit 0, production routes and types generated.
- Fresh GPT-6 Luna medium source review: no critical/important findings. Minor coverage gap retained: auth race/unsubscribe and native disclosure interactions have source review and static state tests, not runtime regression coverage.
- Browser fallback with bundled Playwright and installed Chrome: 1440x900 light/dark, 768x1024, 640x900, 390x844 and 320x812. No horizontal overflow in these cases. Header height 72 desktop/tablet, 64 phone; desktop sticky top measured 16px after scroll.
- Rendered Perjalanan active style: rgb(0,91,209), rgba(0,0,0,0) background, no box shadow and 0px bottom border in all six cases. Guest Masuk destination /login present. No JavaScript pageerror events recorded in the successful navbar run. Actual desktop and phone screenshots inspected.

Artifacts remain ignored in node_modules/.cache/seatpax-landing-verification/ under navbar-* names. No browser packages were installed. Prior Computer Use native helper was unavailable; this slice uses browser fallback and does not claim Windows Computer Use acceptance.

## Observed data issue and limits

Normal /trips navigation timed out while waiting for live availability; the homepage source also displayed its location-load error fallback. Restarted only the owned dev preview after build and did not change database/service code. Data failure persisted, so active navbar styling was measured on /trips?date=a&date=b, whose existing malformed-query state skips availability reads. Home navbar was checked without waiting for the async location source. This establishes navbar rendering, not a passing normal journey search.

Current preview server session is 72277 on localhost:3001, with existing trusted CA and webpack configuration. Physical-device acceptance, authenticated real-session account/logout behavior, normal populated schedule reads and provider/booking flows are not verified by this slice. No automated real login, reservation, payment, DB write, merge, push or publish occurred. Generated next-env.d.ts remains outside the intended commit.
