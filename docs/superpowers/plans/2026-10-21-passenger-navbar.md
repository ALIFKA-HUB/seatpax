# Passenger Floating Navbar Plan

> Use executing-plans inline. Bounded design approved through the interactive preview and final text-only active-state correction.

**Goal:** Apply the approved white floating desktop navbar and text-only active navigation to passenger screens.
**Architecture:** Keep PassengerShell synchronous, with a small client account control using the existing browser Supabase factory and existing logout action. Presentation state grants no permissions. Existing focused login/checkout headers remain simple.
**Spec:** UI design document, approved navbar addition; in-chat preview accepted by user.

## Constraints and review focus

- Existing actual logo, Perjalanan/Pesanan saya/Akun labels and destinations remain.
- White floating desktop header with 20px corners, 72px height, centered two main links and right account action. Mobile retains fixed bottom navigation and compact top brand/account action.
- Active and hovered main links change text/icon color only, with no fill, underline, bottom stroke or selection box.
- Unknown auth status links safely to /account; verified guest shows Masuk; signed-in display shows accessible disclosure with Profil saya and existing logout.
- Supabase client getUser determines presentation only. Keep all server permissions unchanged; no auth tokens, identity or profile data is displayed/logged.
- Clean up auth subscription/timers, handle signout races, logout pending/errors, Escape, outside click and narrow viewport popover.
- No new packages, database changes, login automation, provider payments, merge or push.

## Tasks

- [x] Write and run failing account presentation tests, then implement the small client control and synchronous shell composition.
- [x] Apply scoped floating/text-only CSS including 768px/tablet and 639px/mobile behavior; keep focused flow unchanged.
- [x] Focused 8/8, full 295/295 tests, lint/typecheck/webpack build exit 0. Six rendered width/theme checks confirmed text-only active styles, sticky offset and no horizontal overflow. Guest runtime checked; authenticated disclosure has static unit coverage only.
- [x] Fresh focused review found no important/critical findings. Record evidence and stage only intended files; keep generated next-env.d.ts, main and remote untouched.

## Decisions

Client auth state affects navigation presentation only; no new authorization mechanism or API endpoint. The existing /account page remains the profile destination. Reuse logoutAction through a lazy action import, keeping server-only modules outside unit-render imports. Test authenticated presentation independently without logging a real user in.

## Execution ledger

Initial new tests failed on the missing component; after implementation all four new state tests and existing shell/page tests passed. Full suite 74 files / 295 tests passed, lint and typecheck exit 0; webpack production build exit 0. Source review found no important/critical issues. Minor deferred: runtime auth race/subscription/disclosure regression coverage. Real authenticated account/logout requires later session acceptance.

Ruling: normal availability navigation timed out and homepage showed location-source failure; test navbar active styling on the existing malformed-query /trips state instead of changing unrelated data logic. Cost: normal journey discovery remains unverified and needs separate investigation. This is explicit in the delivery report and final user update.

Successful browser run covered 1440/768/640/390/320 widths plus desktop dark mode; all active backgrounds transparent with blue text, no shadow/bottom border. Desktop top remains16px after scroll. Preview server restarted after unstable/slow dev navigation; current session72277. No merge/push.
