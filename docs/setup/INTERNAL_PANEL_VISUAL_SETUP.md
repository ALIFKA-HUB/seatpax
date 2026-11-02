# Internal panel visual delivery — 2 November 2026

## Approved scope

`ADM-DESIGN-05` approved preview v5; the user's subsequent **"ok"** approved `ADM-UI-01` from [the implementation plan](../superpowers/plans/2026-11-02-internal-dashboard-visual.md).

Implemented in `codex/internal-panel-ui` from `ded4392`:

- Panel-scoped Inter, 400/500/600/700 weight hierarchy, Seatpax blue/ink/muted tokens and white company list cards.
- Sidebar with expandable Administrasi group and the existing Perusahaan destination; compact top bar and bordered account action.
- Mobile navigation with explicit toggle, `aria-expanded`, focus on opening, Escape close and focus restoration.
- Consistent buttons, hover/focus treatment, responsive company rows, long-text wrapping and reduced-motion behavior.

The working URL remains `/super-admin/companies`. No new dashboard/staff route is claimed. All current company status actions, confirmations, pending protection, redirects and server authorization are retained.

## Verification

- Baseline targeted tests: 12 passed.
- New shell contract failed against the old shell, then passed after implementation.
- A full-suite pass exposed CSS selectors outside the panel root; all selectors are now rooted at `.super-admin-shell`. The old shared size/breakpoint contract was updated for approved Inter sizing and the 960px panel breakpoint while retaining the original Operasional expectations.
- Final targeted suite: 16 passed.
- Final full unit suite: **86 files, 323 tests passed** using `npm run test -- --maxWorkers=2`.
- `npm run typecheck`: passed. `npm run lint`: passed. `git diff --check`: passed.
- Actual browser against the development server: local Super Admin login; guest redirect with no company rows; actual Inter and heading weight; 320/390/768/1024/1440/1920px without horizontal document overflow; long synthetic text plus confirmation at 320–1440px; mobile open/link/Escape and restored focus; CSS 200% zoom; reduced motion; account link; no JavaScript errors.
- Existing status UI was opened and cancelled only. No activation/suspension request was submitted, and no user, company, membership or payment records were changed by acceptance testing.
- Read-only final review found no critical/important defects. Its incidental generated `next-env.d.ts` concern is handled by excluding that file from the commit.

The initial local browser request hit a stale main-checkout server; verification was repeated against the actual worktree server before recording these results. An initial typecheck raced development type generation; the final typecheck above completed successfully after generation settled.

## Pending work and limits

- `ADM-DATA-01` remains pending its read-model design: staff identity/count semantics, legacy memberships, company scope and actual audit sources.
- The three coloured staff summary cards and staff register remain preview-only until live data can be connected truthfully.
- Staff creation, password login, archival deletion, configurable RBAC and unified access to other internal modules are separate functional work; no capability is granted by this styling change.
- This task does not remove historical company fixtures or activate deferred SaaS features.
- Browser checks used desktop Chrome with emulated viewports, not physical phones. Production build/deployment and database integration suites were not run for this presentation-only change.

Development server: `http://localhost:3001/super-admin/companies`. The task branch is pushed after the verified commit; it is not automatically merged into main.
