# P01 baseline publication

User approved P01 after the 29 October roadmap handoff. Scope: review and publish the existing application baseline, correct README drift and fast-forward main; no SaaS branch integration, runtime feature changes or deployment.

## Preflight

- `origin/main`: `08a30758124e0ac971177153a5ce1f28a5a31749` after fetch; main `689836f`, landing `6b84705`.
- Verified origin/main -> main -> landing ancestry; 175 main commits plus 36 landing commits unpublished. Existing history is preserved rather than rebased or manufactured.
- Independent reviewer inspected main and landing ranges. Credential-pattern candidates were limited to example environment and test fixtures; no high-confidence credentials or deferred SaaS runtime surfaced. This is a bounded review, not proof all secrets/security issues are absent.
- Nine committed setup screenshots inspected as a contact sheet: synthetic/demo operational UI, no visible credential screens. Brand and landing assets remain tracked with their existing source attribution. Untracked user attachments/local evidence/environment files excluded.
- README updated to actual single-company scope, implemented flows, startup/configuration, roles, guarded development quick login and remaining acceptance limits.
- Roadmap P01 approval does not approve P02-P11 implementation. Helpdesk visual design remains pending written-design confirmation.

## Verification

- Existing application tree passed 82 unit files / 312 tests in the immediately preceding audit; P01 changes documentation only.
- Fresh full ESLint passed, exit 0.
- Default `npm run build` failed because Turbopack rejects this worktree's node_modules symlink outside its filesystem root. No dependency/configuration rewrite was made to conceal this environment limitation.
- Alternate production verification: `npm run build -- --webpack` passed, exit 0, including TypeScript, static generation and route registration. Default Turbopack command remains limited by this local symlink layout.
- Pre-existing generated `next-env.d.ts` edits and main-checkout remote attachments are not staged. Build may regenerate the worktree declaration file; no intentional product-source change is included.

## Publication record

P01 completed. Baseline/documentation commit `0467f9123872f0ff84e668b92dc1bac761da69e3` was pushed to `origin/codex/seatpax-landing`; local main was fast-forwarded to the identical tracked tree. Main typecheck and diff checks passed, then `origin/main` was pushed without force. `git ls-remote --heads origin main codex/seatpax-landing` confirmed both refs at that baseline SHA. This follow-up documentation commit records the verified publication and is published by the same procedure. No production deployment, database migration, fixture reset or SaaS branch integration was performed.

Remaining main-checkout edits: pre-existing `next-env.d.ts` and untracked `.codex-remote-attachments/`. They remain outside the published commits. Computer Use flow verification remains blocked as recorded separately; P01 does not close product acceptance or approve later tasks.
