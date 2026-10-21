# Seatpax Landing Verification Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. The user explicitly requested writing, immediate execution, verification-before-completion and Computer Use; no additional plan approval is needed.

**Goal:** Verify the already implemented white photographic landing and fix demonstrated defects.

**Architecture:** Continue existing isolated branch codex/seatpax-landing at 3879acb. Run current quality commands, inspect the local page through Computer Use, and record exact evidence. Use the browser automation fallback only if the native Computer Use runtime is unavailable.

**Tech Stack:** Existing Next.js/React, Vitest, TypeScript, ESLint, Computer Use sky runtime; no dependency additions.

**Spec:** `docs/seatpax/13_UI_UX_DESIGN.md`, Approved white photo revision; D2026-10-21-03.

## Global Constraints

- Latest request authorizes verification for this landing slice, superseding the earlier testing deferral for this slice only.
- Preserve white canvas, actual logo/nav, empty route showcase, existing search query contract, security and actual inventory.
- No transactions, login automation, database writes/migrations, merge, push or publish.
- Preserve the unrelated generated next-env.d.ts change. Do not print environment secrets or auth logs.
- Scope any fix to a reproduced defect; record unresolved baseline/tool failures honestly.

## Review Focus

- Desktop/tablet/mobile viewport must not overflow or obstruct controls.
- System dark preference must leave white page and readable text/controls.
- Search empty/partial/same-point and date handling must retain usable feedback.
- Photo loading, font loading and FAQ/nav interactions must work on actual rendered page.
- Runtime/helper failures must not be reported as a successful visual check.

### Task 1: Automated baseline

**Files:** Record results in `docs/setup/LANDING_VERIFICATION_2026_10_21.md`; existing commands from package.json.
**Interfaces:** Consumes existing source, emits exit codes and concise failure evidence.

- [x] Run npm test and npm run lint, preserving output in ignored local verification artifacts. Final: 73 files / 291 tests passed; lint exit 0.
- [x] Run npm run typecheck then npm run build sequentially to avoid generated Next type races. Typecheck and webpack build exit 0; final typecheck after test repairs also exit 0.

### Task 2: Rendered acceptance and demonstrated fixes

**Files:** Inspect existing app/page.tsx, app/landing/{landing.css,search.tsx,journey-planner.tsx}; edit only after evidence.
**Interfaces:** Browser consumes localhost:3001 homepage and GET /trips from/to/date.

- [x] Attempt sky initialization and bounded recovery. Native pipe absent; no window selected or Windows input issued. Fallback used below.
- [x] Document exact Computer Use error and use bundled Playwright with installed Chrome (no download/install).
- [x] Inspect and assert 1440x900, 768x1024, 390x844, 320x812 and desktop dark preference. White canvas, loaded images, no horizontal overflow, intended overlap behavior confirmed.
- [x] FAQ and blank search passed. Partial/same-point and invalid date passed with explicit synthetic browser options because current real option count is zero. No reservation/payment.
- [x] Initial unit failures reproduced before test fixture/import repairs. Focused 20/20 and full 291/291 subsequently passed. No production change needed.

### Task 3: Final review and evidence

**Files:** Create setup report and update previous delivery limitations with current evidence.
**Interfaces:** Consumes Task 1 command results and Task 2 observations.

- [x] Fresh GPT-6 Luna medium focused source review: no important/critical findings.
- [x] Record exact results and limits in docs/setup/LANDING_VERIFICATION_2026_10_21.md.
- [x] Prepare only intended tests/report/plan files for the verification commit; main/remote unchanged.

## Execution ledger

Base 3879acb. Previous visual implementation already exists; do not repeat its tasks. Pre-flight: automated checks and browser consume the same existing app; build and typecheck are sequential due generated types. The new user request authorizes verification now; it does not authorize provider transactions or DB integration runs.

Task 1 complete: final unit 73/73 files and 291/291 tests, lint/typecheck exit 0, production webpack build exit 0. Initial failures and test-only repairs are documented in the report; default timeouts and production validation remain unchanged.

Task 2 complete within browser emulation: five viewport/theme cases and explicit interaction assertions passed. Computer Use native connection failed despite bounded recovery. Actual schedules unavailable in the current dropdown; synthetic document-only options were used for validation assertions. These do not establish physical-device or populated-schedule acceptance.

Task 3: fresh review found no important/critical issues. git diff --check exit 0. No production code changed. Next build regenerated next-env.d.ts to its tracked state, with no manual edit or staging. Review and test evidence recorded in the verification commit.
