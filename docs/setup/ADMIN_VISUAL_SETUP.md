# Admin PO and Super Admin visual redesign evidence

Date: 9 October 2026. Written spec and plan approved. Inline presentation implementation completed; local integration authorized by the plan. Manual user acceptance remains deferred.

## Delivered

- Branded Admin shell, company context, seven existing destinations with exact current-section matching, skip link and visible phone account access.
- Readable source tables/forms, Indonesian status labels with safe unknown-code fallback, preserved revision conflict choices.
- Fleet lists and seat builder with Indonesian cell labels, original enum values, immutable readonly grids and distinct save/archive actions.
- Published trip identity, visible schedule, expandable fare/layout and explicitly technical inventory count; saved draft preview does not invent availability.
- Admin manifest remains readonly. Assignment membership labels and actions preserve existing eligibility and handlers.
- Payment conflicts separate booking/passenger context from financial history; refund simulation explicitly does not move Midtrans money. Underlying MOCK_REFUND, reason validation, request identities and confirmation gates remain.
- Independent Super Admin shell and company rows retain inline confirmation, pending protection, reconciliation, cancel autofocus and trigger focus restoration.
- No domain service, authorization, database, dependency, provider or scope changes.

Code base e3a4196; implementation branch codex/admin-visual. Tasks committed separately (06ff05f, f51134a, e2c95d3, 0eaffc9, cb5fe73, 65d2a18); scoped contract f65dc73 and readability fix 637f382.

## Fresh automated evidence

| Check | Observed result |
| --- | --- |
| Unit suite after review fix | 69 files / 271 tests passed, exit 0 |
| Typecheck | Exit 0 |
| ESLint after final code | Exit 0 |
| Production build after final code | Exit 0; existing routes compiled |

TDD evidence: task 1 had 3 RED failures; task 2 had 3 failures with existing conflict contract already green; task 3 had 3; task 4 had 2 with existing draft/published branch already green; task 5 had 3; task 6 had 3; scope contract had 1; final readability regression had 1. All passed after their owning implementation. Existing behavioral suites cover request/revision/eligibility/readOnly regressions; mocked component tests do not prove live authorization.

One focused GPT-6 Luna medium reviewer inspected e3a4196..f65dc73. No safety/behavior regression found. Its small-text finding was regraded Important because repeated 13px rules defeated the approved readability contract; the header/quote helper override was verified RED→GREEN and the full suite passed. No deferred minor findings. No second review was dispatched.

## Browser evidence: clearly labeled synthetic data

The current session on the execution-owned local dev preview returned guarded 404 for the Admin PO trip route. Historical real Crew database inspection also encountered SELF_SIGNED_CERT_IN_CHAIN. No TLS weakening or live administrative mutation was attempted.

Temporary fixtures outside the tracked repository rendered the actual Admin/Super Admin components and shared Crew grid/manifest with synthetic inputs and harmless action stubs. They do not establish authorization, financial correctness or user acceptance.

| Viewport | Document clientWidth/scrollWidth | Result |
| --- | --- | --- |
| 320px | 305 / 305 | No page horizontal overflow |
| 390px | 375 / 375 | No page horizontal overflow |
| 1280px | 1265 / 1265 | No page horizontal overflow |
| 1440px | 1425 / 1425 | No page horizontal overflow |

Measured route editor, builder, published trip, draft, readonly manifest, payment form, Super Admin rows and shared Crew regression at each width. Admin/Super Admin visible controls measured at least 44px high, account links visible. Open trip details and expanded Super Admin confirmation also fit at 320px. PassengerShell regression at 320/1440 retained its own brand/navigation and no page overflow. Large payment/reference fixtures and long company/passenger/stop names wrapped locally.

Keyboard skip activation focused admin-main; exactly one current section was present. Opening company confirmation focused Batal; cancel restored focus to the originating Suspend button. The synthetic fixture served an installed Next font asset, but real authenticated font/device acceptance is pending. Empty/error/pending states were covered in component/controller tests, not claimed as live browser transactions.

Screenshots: [desktop builder](admin-visual/builder-desktop.png), [phone builder](admin-visual/builder-phone.png). Both visibly identify synthetic preview data.

## Deferred actual acceptance

- Authenticated Admin A/B and Super Admin walkthrough with real source/payment/company data.
- Physical phone, native 200% browser zoom and reduced-motion preference. The exposed browser controls provided viewport sizing, not those native preferences; source media-query checks are not a substitute.
- User visual approval and real administrative mutations. No new live financial action was needed for this phase.

## Execution rulings

1. Native PowerShell tracking replaced Bash-only helpers while retaining per-task RED/GREEN evidence. Cost if wrong: bookkeeping omission; recorded results and Git task commits provide recovery.
2. Reviewer set authenticated acceptance aside. Current-session guarded 404 and historical certificate failure leave it pending; synthetic measurements establish layout only. Cost if wrong: live role/data defects remain undetected until actual acceptance.

Managed worktree is retained; local integration preserves main next-env.d.ts and .codex-remote-attachments. No push or deployment. Execution-owned preview alone may be restarted.
## Local integration result

Fast-forwarded main locally to the identical implementation/docs tree. Fresh merged-main unit run passed 69 files / 271 tests. The preserved user next-env.d.ts SHA256 remains B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000; .codex-remote-attachments remains untracked. Production preview restarted from the execution-owned worktree on port 3001 and its Passenger home was visibly verified. Temporary viewport override was reset. Closing the old failed dev tab was blocked by the browser URL policy on its internally generated error page; no bypass attempted.
