# Passenger discovery refresh — 20 October 2026

## Delivered scope

- Approved passenger preview implemented without the decorative bus or a replacement image; original Seatpax logo and navy/blue light palette retained.
- Compact greeting/search header, actual date-specific discovery before search, route search, class/maximum-fare popup filtering, departure/price sorting and real route-specific seat-selection links.
- Desktop/tablet top navigation; phone bottom navigation: **Perjalanan**, **Pesanan saya**, **Akun**. Focused checkout/login shells retain their focused flow.
- Verified ordinary login routes passengers to `/trips`, Admin PO to `/admin`, Crew to `/crew`, Super Admin to `/super-admin/companies`. Multiple work-role destinations use `/workspaces`. Valid explicit `/trips` and `/holds` intent takes precedence; destination guards remain authoritative.
- **Pesanan saya** currently opens existing `/tickets`; combined pending-payment/history and a detailed account redesign are not delivered by this change.

## Discovery contract

Default date is today in WIB. Blank origin/destination discovers published first-to-last trip intervals on that date. Both endpoints select interval search using source stop IDs; the resulting seat-selection URL retains snapshot stop IDs. A partial pair retains daily discovery and displays a validation prompt. Invalid dates and repeated query parameters receive an explicit recoverable error, not silently substituted results.

Discovery reads at most 50 candidates, fetching one extra row to determine truncation and displaying an explicit limit note. Actual pricing/seat availability reuses the existing service, effective holds and database-clock sales cutoff; company suspension remains enforced. No schema migration, provider configuration, seed or operational write was made. Arrival/duration are shown only when supplied by actual valid snapshot timestamps.

## Verification

Implementation targeted checks: discovery 5/5, initial presentation/navigation 8/8, entry/auth 14/14, final repeated-query regression 5/5.

Final fresh commands after the review fix:

- `npm test -- --maxWorkers=2 --testTimeout=30000`: **72 files, 287 tests passed**.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; `/trips`, `/login` and `/workspaces` appear in the production route output.
- Actual final build: repeated `date` query shows **Periksa pilihan perjalanan**; **Reset pencarian** returns to normal discovery.

Preview server: `http://localhost:3001/trips`, bound to loopback. It is not a public/phone URL. Existing development TLS CA configuration was preserved. [Implemented UI screenshot](screenshots/passenger-discovery-2026-10-20.png).

Baseline full unit execution exposed two existing Admin test assumptions: missing next/font test stub and a stop-creation label/order assertion predating the directory redesign. Only those test assertions/stub were repaired; Admin production behavior was not changed. Default 5-second timeouts also timed out during cold Phosphor module imports; full-suite runs use `--maxWorkers=2 --testTimeout=30000` on this laptop.

Browser inspection of the actual production page confirmed no horizontal document overflow at 360×800, 768×1024 and 1440×900. Phone navigation measured fixed at the bottom; desktop navigation is static at the top. Filter maximum fare apply, clear, Escape dismissal and focus return to the Filter button were exercised. The viewport override was reset afterward.

A read-only query returned no upcoming published trips in the connected development database. Consequently real populated-card browser/physical-phone acceptance and authenticated role-by-role login remain pending; unit tests cover real DTO rendering and destination contracts without fabricating application data. No payment, camera, hosted integration mutation or physical-device test is claimed.

## Execution decisions

- Reused the existing managed worktree on `codex/passenger-discovery-refresh`, based on `00aae71`; preserved the user's main-checkout changes.
- Used native PowerShell ledger updates for Windows compatibility. Cost if wrong: bookkeeping portability, not product behavior.
- Repaired the two stale Admin unit-test assumptions described above. Cost if wrong: reduced regression coverage, mitigated by preserving row/create-control and scoped-font assertions.
- Root next/font registration defines a passenger-only CSS variable; typography is applied only under `.passenger-shell`.
- Fresh static review by GPT-6 Luna, medium, identified the repeated-query issue; it was fixed with a failing-then-passing regression. No minor review findings were deferred.

## Remaining work

Physical phone/tablet acceptance, populated-card and role-login browser checks, separate account/orders detail design, Crew native mobile delivery and national city/terminal catalogue work remain separate. Do not treat this interface refresh as delivery of those features.
