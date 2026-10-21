# White photo landing verification

Date: 21 October 2026. Branch: `codex/seatpax-landing`. UI source under test: `3879acb`. The user explicitly requested plan, immediate inline execution, verification and Computer Use. This supersedes the earlier test deferral for this landing slice.

## Automated evidence

| Check | Result |
| --- | --- |
| `npm test` initial baseline | Exit 1: 4 failed files, 3 failed tests, 68 passed files / 282 passed tests. One suite could not import due to server-only dependency. |
| Focused recheck after test repairs | Exit 0: 5 files / 20 tests passed. |
| `npm test` final | Exit 0: 73 files / 291 tests passed. |
| `npm run lint` | Initial and final runs exit 0, no ESLint diagnostics. |
| `npm run typecheck` | Initial and final runs exit 0. |
| `npm run build -- --webpack` | Exit 0: compilation, type checking, prerendering and build trace collection completed. Homepage is dynamic. |

Webpack was used deliberately: this managed worktree shares node_modules through a junction, which the existing Turbopack setup cannot follow. No package changes or SSL bypass were introduced. Build used the existing trusted development CA.

## Root causes and repairs

- The old passenger-entry test expected the retired headline and imported the new async database-backed planner through Home. Isolate that planner in the page composition test and update the approved headline/booking-flow assertions. New separate planner tests cover actual component rendering with empty, populated, failed and loading source states.
- The stop-validation test still supplied the retired city-string shape without `regionRegencyId`. Update the fixture to the current nullable reference contract. Production validation is unchanged.
- The Admin stop view now reads region options, so its old view test inadvertently reached server-only DB imports. Mock only the DB/region catalogue boundaries; retain rendered row/form assertions.
- Cold dynamic imports of the large UI/icon graph inside two Admin test bodies exceeded the 5-second test budget. Move Shell/Stops imports to module setup, leaving behavioral assertions and timeout configuration unchanged.
- A new planner-test setup initially returned the mock function from `beforeEach`. Vitest interpreted it as cleanup and invoked a configured rejection. Make setup explicitly void. Its error-state assertion then passed.

No production UI or domain code changed during this verification slice. No database, provider, authorization or inventory policy was changed.

## Computer Use and rendered fallback

Read the Computer Use guidance, API and confirmations policy. Initialized `@oai/sky` via node_repl and called list_apps. The native pipe was unavailable: `failed to connect native pipe: The system cannot find the file specified. (os error 2)`. Retried, reset the JS session, initialized again and retried once; same failure. No Windows inputs or authentication actions were issued.

Used the bundled Playwright library with installed Google Chrome in headless mode as a fallback. The library's default headless-shell executable was absent; selecting the already installed Chrome channel worked without downloads or installations. This is browser emulation, not a successful Computer Use session.

## Browser evidence

| Viewport | Page width | Canvas | Hero / search |
| --- | --- | --- | --- |
| 1440 x 900 | 1440 | White | Hero bottom 500px; panel top 444px, intentional 56px overlap. |
| 768 x 1024 | 768 | White | Tablet panel overlaps photograph; compact form grid. |
| 390 x 844 | 390 | White | Hero bottom 322px; panel top 362px, no overlap. |
| 320 x 812 | 320 | White | Hero bottom 336.66px; panel top 376.66px, no overlap. |
| 1440 x 900, dark preference | 1440 | White | Same desktop geometry. |

All five cases asserted no horizontal overflow, three loaded images (actual logo and two photos), and no example cities in the route showcase. Plus Jakarta Sans loaded. Full-page desktop and phone screenshots were inspected. No pageerror events were recorded in these cases.

- FAQ opened successfully.
- Blank search navigated to `/trips?from=&to=&date=2026-10-21`.
- Current location option count was zero. Partial/same-point validation was therefore checked with explicitly synthetic options added only to an isolated browser document, without touching app files or the database. Partial selection showed the expected instruction; equal points showed `Asal dan tujuan harus berbeda.`.
- A past date produced native rangeUnderflow and prevented navigation.
- The phone search button's center was unobstructed after scrolling into view.
- Sampled button text contrast was 8.29:1 in its observed hover state, input text 15.98:1. This is not a full accessibility audit of every state or photo pixel.
- Phone dark preference plus reduced-motion emulation retained the white canvas.

Local ephemeral artifacts: `node_modules/.cache/seatpax-landing-verification/` contains command logs, browser scripts, JSON assertions and screenshots. They are ignored; this report records the durable results.

## Review and limits

One fresh GPT-6 Luna medium source reviewer found no important or critical issue and confirmed the mocks do not weaken production domain/security validation. The author inspected actual diffs and command results separately.

Still unverified: physical Android/iPhone/tablet behavior, populated real schedule search, authenticated booking/payment, pixel-level photo contrast, full keyboard/screen-reader audit and production Core Web Vitals/Lighthouse. No merge, push or publish is part of this slice. No manual edit to next-env.d.ts was made; Next build refreshed this generated file and it is clean against the branch. The unrelated main checkout is untouched.
