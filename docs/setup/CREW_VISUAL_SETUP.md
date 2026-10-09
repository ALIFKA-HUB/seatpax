# Crew visual redesign evidence

Date: 9 October 2026. Written spec and plan approved; inline implementation completed locally. This record distinguishes automated/software checks from deferred actual operational acceptance.

## Delivered

- Dedicated Crew header/navigation and scoped styles replace the Admin sidebar; supplied Seatpax assets are reused.
- Assigned trip cards, route/vehicle/WIB summary, primary scan and manifest actions, stop schedule and expandable published fare/layout details.
- Manifest counters/search/status filter, prominent seat/name, boarding/snack timestamps and distinct empty/no-match copy.
- Camera frame and actual-state controls, manual manifest fallback and the same profile in QR/manual journeys.
- Separate explicit boarding and snack actions, preserving existing handlers, guards, retries, origin validation, original event times and camera cleanup.
- No domain service, database, provider, dependency or authorization changes. Shared Admin manifest remains read-only; Admin TripDetail is unchanged.

Code commits: shell `8c1d1a6`, trips `d0d5f42`, manifest/profile `b5bc157`, scanner/actions (see Git history), final scoped-style contracts `8adfe51`. Base `5d38902`. Branch `codex/crew-visual` in the reused managed worktree.

## Automated verification

Fresh full run after all code changes:

| Check | Observed result |
| --- | --- |
| Unit suite | 62 files / 248 tests passed; exit 0 |
| Typecheck | Exit 0 |
| ESLint | Exit 0 |
| Production build | Exit 0; existing Crew and other routes built |
| Diff whitespace check | Clean |

RED → GREEN evidence: shell had 2 missing feature/boundary failures; trip summary 3 missing-component failures; manifest/profile 3 missing hierarchy/empty-state failures; scanner/forms 2 missing state/action-presentation failures; visual contracts 2 missing scoped-control/motion failures. Existing scanner stale/duplicate/cleanup checks, action validation and snack prerequisite/retry tests passed without changing their business implementations.

Fresh focused reviewer: GPT-6 Luna, medium, base `5d38902` → `8adfe51`; no actionable findings. Review was source/diff based and did not establish real camera/authenticated acceptance.

## Browser evidence and limits

Actual `/crew` on the local development preview returned HTTP 500. Observed cause: `SELF_SIGNED_CERT_IN_CHAIN` at the database membership read in `crewData`; digest `3424471289`. TLS checks were not weakened. This is not evidence of a successful live Crew workflow.

Temporary synthetic presentation preview was built outside the worktree at:
`C:/Users/ASUS/AppData/Local/Temp/seatpax-crew-visual-20261009/`.
It imports the actual Crew components/CSS, uses an Arial system-font fallback and mocks Next wrappers and actions. Its visible banner says synthetic data is not proof of access or transactions. It proves presentation/state wiring only, not backend authorization, persistence or Geist-specific layout.

| Synthetic browser check | Result |
| --- | --- |
| Trip/manifest/profile/idle scanner at 320, 390, 1280, 1440px | No page horizontal overflow; scroll widths were 305, 375, 1265, 1425px respectively, within viewport |
| Main controls | Visible primary buttons, inputs/selects and profile actions measured 48px high |
| Expanded 7-column snapshot at 320px | Seat region approximately 238px wide, content 476px; scrolling confined to region |
| Long name/seat/route | Text wrapped; full text retained |
| Manifest search + BOARDED filter | Query `02` displayed 1 passenger; no-match copy appeared for an unmatched query |
| Keyboard | Tab from origin select reached boarding button; computed outline was solid |
| Synthetic explicit boarding/snack | Snack disabled before boarding; enabled after mock boarding; mock handover showed original 08.03/08.04 WIB times |
| Shared Admin manifest | No Crew profile action links; no Crew shell applied; read-only copy retained |
| Reduced motion | Conditional CSS checked; browser reported reduce=false; OS reduce toggle not exercised |

Saved screenshot: `manifest-preview.png` in the temporary folder above. Viewport override was reset after inspection. Temporary fixture server is stopped after evidence capture.

### Still pending

- Actual authenticated Crew list/detail/manifest/profile/scanner acceptance after database certificate trust is restored.
- Physical phone, real camera permission, valid/invalid QR, and real boarding/snack writes.
- Browser zoom at 200%; the available viewport control resizes but does not provide a zoom override.
- Reduced-motion OS toggle and actual Geist-font layout acceptance.

These pending checks do not require the user to interrupt their meeting. Do not label them passed based on unit tests or fixtures.

## Execution rulings and preservation

1. Native PowerShell ledger/brief tracking replaced the skill's Bash-only helpers. Equivalent task bases, RED/GREEN outputs and completion records were retained. Cost if wrong: a bookkeeping omission; checked against the approved plan.
2. Source assertions are boundary checks; rendered measurements establish visual evidence. Cost if wrong: coverage gaps, retained as explicit pending acceptance rather than inferred success.
3. The reviewer declined rendered visual-quality judgment. The synthetic measurements and screenshot cover presentation provisionally; actual authenticated/phone/font acceptance stays pending. Cost if wrong: real-device differences may require a later correction.
4. Local integration follows the user's approved plan and established inline method; no additional integration menu was requested. Cost if wrong: recoverable local Git integration; nothing published or pushed.

Requested primary GPT-6.1 Sol medium could not be selected through the chat's tools; no model-switch claim was made. Reviewer overrides were applied explicitly.

The user's main-checkout `next-env.d.ts` was preserved with SHA256 `B8B3A344484B959AF5E4E3FC1A1609DAC3CB9ECE0CDEB6C145BE29BC4C491000`. Attachment directory remains untouched. Only the execution-owned generated worktree file was restored. Temporary files and environment values were excluded from commits.

## Post-integration check

Fast-forward integrated implementation through commit 123373e into local main. Fresh main-checkout unit run on 2026-10-09 at 17:20 WIB passed: 62 files, 248 tests. The production preview on port 3001 was restarted from the verified identical implementation build. No code changed during integration.

