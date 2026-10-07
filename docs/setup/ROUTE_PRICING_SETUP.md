# Route and pricing implementation — 7 October 2026

Approved design and plan: `docs/superpowers/specs/2026-10-07-route-pricing-design.md` and `docs/superpowers/plans/2026-10-07-route-pricing.md`.

## Available functionality

Open `/admin` after signing in as an active ADMIN_PO. One company redirects automatically. Manage stops, service classes, routes, ordered stops, adjacent IDR fares and an origin/destination price preview. Company A and B are scoped independently. Global Super Admin without an ADMIN_PO membership has no template editing access.

Prices travel as decimal strings and are calculated exactly with bigint. Zero is valid; missing fare blocks preview. Routes have 2–50 unique stops and a revision counter. Structural changes require explicitly clearing fares for every class. Inactive endpoints/classes/routes block quote. This preview does not reserve seats or create trips.

On revision conflict, the draft stays in the form. The latest route data can be displayed for comparison. Adopting it replaces the draft; retaining the draft for overwrite requires explicit confirmation. A later concurrent edit still causes another revision conflict.

## Database

Additive `drizzle/0001_route_pricing.sql` was inspected and applied to the existing Seatpax development project through the session pooler. It adds five tables with tenant/route composite foreign keys, constraints, RLS and revoked browser grants. No Auth accounts or permanent demo seed were deleted.

Server actions verify Auth identity. Transactions recheck and lock active ADMIN_PO membership, lock referenced resources and the route, then check revision and eligibility. Integration tests use unique temporary company/Auth/resource IDs and cleanup only those IDs. Existing seed tests now inject a test catalog while the production seed CLI retains its fixed approved catalog.

## Verification

- Unit suite: 102 tests, including validation, bigint arithmetic and action identity/error boundaries.
- PostgreSQL suite: 10 tests, repeated. Covers cross-tenant denial, composite foreign key rejection, SELECT/INSERT/UPDATE/DELETE browser grant denial, exact large/zero totals, missing fare, inactive endpoints/classes, invalid-price rollback, fare clearing/reorder, concurrent revision writers and membership revocation serialization.
- Typecheck, lint and production build are checked separately from the preview server. Running dev and build together produced a corrupted generated validator; regenerating build output resolved it.
- Authenticated Chrome smoke passed as Admin A: four demo stops, Executive Demo class, four-stop route and fares 25000/0/35000. Full quote 60000 and subset quote 25000 verified; keyboard Tab/Enter calculation passed. Narrow 640px window and maximized desktop layout inspected. Admin A opening PO B routes returned 404. Actual phone viewport and reverse Admin B-to-A browser login check remain pending; both tenant directions are covered by database/service checks.

## Try it

1. Sign in as the existing `+admina` account and open `/admin`.
2. Create four stops and an active service class.
3. Create a route using those stops in order.
4. Enter three adjacent segment prices, save, and preview a subset of the route.
5. Sign in as `+adminb`; opening PO A's URL must deny access.

No GitHub push or production deployment is part of this implementation. Trips, inventory, booking and payment remain later tasks; six-digit OTP and individual digit boxes remain deferred.

Final Luna medium review found one Important stale-draft overwrite path. The fix displays the latest snapshot without advancing revision until the user adopts it or confirms overwrite. Reviewer rechecked and found no remaining Important issue. Full unit suite, typecheck, lint and production build passed in the isolated checkout before local integration.


Browser smoke found the quote action forwarding its command kind into UUID-only service validation. Fixed the action to pass only the four resource IDs. Regression failed before the fix and passed afterwards; full unit suite102, typecheck and lint passed. Real browser quotes then passed. Demo data remains available in development for the user.
