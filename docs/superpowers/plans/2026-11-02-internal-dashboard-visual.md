# Internal dashboard visual implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply the approved dashboard appearance while retaining current product behavior.

**Architecture:** Reuse the Super Admin shell, Brand and company controls. Scope Inter/tokens to the internal shell. Deliver shell styling independently; real staff cards/register depend on a separate guarded read-model design because the preview's data/actions are illustrative.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, existing Phosphor icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-02-internal-dashboard-visual-design.md`.

## Global constraints

- `ADM-DESIGN-05` visual approval recorded: **"acc deh"**, 2 November 2026. `ADM-UI-01` approved by the subsequent **"ok"** on 2 November 2026; `ADM-DATA-01` was subsequently approved; its reviewed contract and live implementation are recorded in the staff dashboard plan/setup.
- Preserve server authorization, redirects, existing routes and company-status confirmation/pending/result behavior.
- No schema migration, password login, staff CRUD, permission editing, SaaS or mobile rollout in this visual slice.
- No preview identities, counts or invented audit events in production. Passenger/public typography stays unchanged.
- Leave unrelated local changes and attachments untouched. After an approved task passes checks, commit only its files, push its `codex/` branch and verify the remote hash; never force-push.

## Review focus

- Unauthorized direct access retains denial/redirect and leaks no internal data.
- Long labels and emails wrap at 320px and 200% text zoom.
- Mobile navigation opens/closes with keyboard, restores focus and closes on Escape.
- Failed data loading never appears as a real zero count.
- Company status changes retain explicit confirmation and duplicate-submit protection.

### ADM-UI-01 — Internal shell, typography and action styling

**Goal:** Apply the accepted type hierarchy, cards and clear action affordances to the working Super Admin interface.

**Scope:** Presentation only. Existing company content remains functional; navigation exposes only implemented authorized destinations. Staff summary cards wait for ADM-DATA-01 rather than showing dummy numbers.

**Dependencies:** Approved visual spec; approval of this implementation task; current Super Admin regression tests.

**Files:** Modify `app/super-admin/components/super-admin-shell.tsx`, `app/super-admin/super-admin.css`, `tests/unit/super-admin-view.test.ts`; create `app/super-admin/components/internal-navigation.tsx` for mobile state and expandable navigation.

**Interfaces:** Preserve `SuperAdminShell({children}: {children: ReactNode})`, company actions and route URLs. Load Inter using `next/font/google` in the scoped server shell; apply its variable only inside the shell.

**Completion criteria:** Approved type/action styles visible; working navigation; no sample staff/permission changes; keyboard-operable phone navigation; current company/access behavior preserved.

- [x] Update shell assertions for skip target, account link, navigation semantics and preserved denied/empty/error content.
- [x] Implement the approved color/font/weight tokens, scoped Inter, sidebar/top bar and secondary action styles around existing children.
- [x] Implement mobile toggle with `aria-expanded`, controlled navigation ID, Escape close and focus restoration.
- [x] Run `npm run test -- tests/unit/super-admin-view.test.ts tests/unit/access-service.test.ts tests/unit/access-server.test.ts`; all pass.
- [x] Run `npm run typecheck` and `npm run lint`; both pass.
- [x] Inspect 320/390/768/1024/1440/1920px, CSS 200% zoom, keyboard/reduced motion, denied/empty/error views and company confirmation/pending/result contracts; no overflow or hidden content. Actual browser exercises request/cancel; pending/result states are covered by the existing unit contracts.
- [x] Commit verified task files, push approved branch, compare remote hash with local HEAD and report evidence.

### ADM-DATA-01 — Real staff dashboard contract

**Goal:** Define truthful, authorized staff cards/register before wiring them into the approved design.

**Scope:** Read-model design only; staff creation, login, archiving and editable RBAC remain separate tasks.

**Dependencies:** Review `lib/db/schema.ts`, `modules/access/service.ts`, `modules/access/repository.ts`, `modules/company/transaction.ts`, relevant database policies and `docs/analysis/SEATPAX_SPEC_REVIEW.md`; approve count/scope/legacy semantics before implementing reads.

**Completion criteria:** A reviewed spec defines staff identity/counts, active/disabled semantics, authorized scope, minimal fields and available audit sources; a subsequent plan names concrete route/service/repository interfaces and tests. No domain policy is treated as CSS.

- [x] Inspect membership constraints and read authorization without changing records.
- [x] Specify count identity and legacy multi-membership display explicitly.
- [x] Map every visible action to an implemented destination or a separately approved functional task.
- [x] Review the resulting read-model spec before implementing staff queries or adding a dashboard route.

## Self-review

Visual shell changes belong to ADM-UI-01 and are implemented; see [delivery evidence](../../setup/INTERNAL_PANEL_VISUAL_SETUP.md). Staff cards/register depend explicitly on ADM-DATA-01. No sample data, broadened Super Admin permissions, configurable RBAC or staff password login is silently included.

Subsequent delivery: ADM-DATA-01 contract was reviewed and ADM-DASH-01 explicitly approved, implemented and verified. See docs/setup/STAFF_DASHBOARD_SETUP.md.
