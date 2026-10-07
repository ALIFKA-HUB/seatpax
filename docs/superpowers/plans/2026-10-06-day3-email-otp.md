# Email OTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passenger dapat login Email OTP, membuka akun dengan sesi terverifikasi, dan logout.

**Architecture:** Server actions memanggil service auth melalui adapter Supabase SSR; cookie ditulis hanya pada actions/proxy. Proxy memperbarui sesi, private page memverifikasi user melalui getUser. UI email/kode berada pada satu halaman dan tidak bergantung pada tabel tenant.

**Tech Stack:** Next 16 App Router, React 19, TypeScript, Supabase JS/SSR, Zod, Vitest yang sudah terpasang; tidak menambah dependency.

**Spec:** [Approved Email OTP design](../specs/2026-10-06-email-otp-design.md).

## Global Constraints

- Email maksimal 254 karakter; trim sebelum validasi. Panjang kode mengikuti konfigurasi hosted yang dibaca pada Task 1.
- Cooldown UI kirim ulang 60 detik; Supabase menjadi authority rate limit/expiry.
- Verify type `email`, request `shouldCreateUser: true`, logout scope `local`.
- Sukses selalu `/account`; tidak ada arbitrary redirect atau role privilege otomatis.
- Tidak menaruh email/kode/session di URL/localStorage/log. Private response tidak masuk shared cache.
- Computer-use hanya membaca konfigurasi Auth; pengguna mengubah template/settings dan memasukkan OTP sendiri.
- Semua spawned agents/reviewers GPT-6 Luna medium, focused context, sesuai AGENTS.md.
- Migration, membership/RLS, booking, custom SMTP dan OAuth di luar slice. Tidak push ke GitHub.

## Review Focus

1. OTP pertama pada email baru: template Confirm signup juga memberi kode, bukan hanya login existing user (Task 1/4).
2. SDK refresh menulis beberapa batch cookie: jangan kehilangan cookie/header batch sebelumnya (Task 2).
3. Provider throw/rejection membawa data sensitif: tampilkan pesan aman, tanpa raw payload (Task 1).
4. Ganti email saat request masih berjalan: hasil lama tidak mengubah state email baru (Task 3).
5. Session expired/revoked: private page menolak identitas yang gagal diverifikasi walau cookie masih ada (Task 2/4).

## Persiapan eksekusi

- [ ] Gunakan using-git-worktrees; periksa artifacts dan buat/reuse worktree `codex/day3-email-otp` dari main lokal yang memuat setup. Perubahan setup docs saat ini harus dipertahankan, jangan reset.
- [ ] Salin ignored `.env.local` ke checkout eksekusi tanpa menampilkan isinya. Pastikan git check-ignore berhasil. Pada terminal yang menjalankan app/DB gunakan `NODE_EXTRA_CA_CERTS` sesuai setup guide.
- [ ] Baca spec, plan, AGENTS dan source files; install lockfile dengan npm ci bila worktree belum punya dependencies.

## Task 1: Kontrak service OTP dan template provider

**Files:** Create `modules/auth/service.ts`, `modules/auth/email-templates/magic-link.html`, `modules/auth/email-templates/confirm-signup.html`, `tests/unit/auth-service.test.ts`; Modify `docs/setup/SUPABASE_DEV_SETUP.md`.

**Interfaces:**
- `AuthResult = {ok:true} | {ok:false; code:'invalid_email'|'invalid_code'|'rate_limited'|'verification_failed'|'provider_unavailable'; message:string}`.
- `AuthGateway`: async `request(email:string)`, `verify(email:string,token:string)`, `logout()`; each returns `{error:null|{code?:string;status?:number}}`. SDK adapter implementing these methods lives in Task 3 actions.
- `requestOtp(gateway:AuthGateway,email:unknown):Promise<AuthResult>`.
- `verifyEmailOtp(gateway:AuthGateway,input:{email:unknown;token:unknown},otpLength:number):Promise<AuthResult>`.
- `logoutSession(gateway:AuthGateway):Promise<AuthResult>`.

- [ ] Read-only inspect hosted Email provider length/expiry and current templates via Computer Use. Record actual values and delivery limits; keep settings unchanged. If length is not observable, clarify with user before hardcoding it. Later plan steps refer to this recorded integer.
- [ ] Write failing service tests: whitespace email normalized; invalid format/length255 rejects without gateway call; invalid token characters/length rejects; success request is not session; verify returns success only when gateway succeeds; unknown error/throw yields safe provider error; status429 yields rate_limited; invalid/expired provider code yields verification_failed; logout failure not success. Assert returned JSON excludes a fake secret embedded in thrown errors.

```ts
expect(await requestOtp(gateway, 'bad')).toMatchObject({ok:false,code:'invalid_email'});
expect(gateway.request).not.toHaveBeenCalled();
expect(await requestOtp(gateway, ' user@example.com ')).toEqual({ok:true});
expect(gateway.request).toHaveBeenCalledWith('user@example.com');
```

- [ ] Run `npm.cmd test -- tests/unit/auth-service.test.ts`; confirm RED due missing implementation.
- [ ] Implement interfaces/validation/error mapping in service.ts. Map only documented SDK codes/statuses observed from official reference; unknowns use generic safe message. Never log raw errors.
- [ ] Write the two reviewed templates with subject instructions in setup docs. Body includes `{{ .Token }}` and Indonesian text; no magic-link redirect or external content. Document user application of both templates and provider length/expiry evidence.
- [ ] Run service tests; expect GREEN. Commit task files only: `feat: add email OTP service contract`.

## Task 2: Sesi SSR dan identitas server

**Files:** Create `lib/supabase/proxy.ts`, `proxy.ts`, `modules/auth/identity.ts`, `tests/unit/auth-identity.test.ts`, `tests/unit/auth-proxy.test.ts`.

**Interfaces:**
- `updateSession(request:NextRequest):Promise<NextResponse>` in lib/supabase/proxy.ts.
- Root `proxy(request:NextRequest):Promise<NextResponse>` forwards updateSession; matcher excludes `_next/static`, `_next/image`, favicon and static image extensions, includes login/account/actions.
- `getVerifiedUser():Promise<User|null>` server-only helper uses existing createServerSupabaseClient read-only and SDK getUser. Missing/error/throw returns null, no raw logs.

- [ ] Write identity RED tests using mocked adapter: valid user returned; missing user/error/throw denied; never calls getSession as identity authority.
- [ ] Write proxy RED tests using mocked SDK, real NextRequest/NextResponse: refreshed cookies applied to forwarded request and response with options; two setAll batches preserve prior cookies; SDK cache headers preserved; anonymous/error/throw response never grants access (private page checks helper); no user/session output.
- [ ] Run focused tests and confirm RED.
- [ ] Inspect installed SSR CookieMethodsServer setAll signature and current official SSR example. Implement updateSession calling getUser immediately after client construction. Accumulate cookie/header updates rather than replacing the response and losing earlier batches. Preserve response cache directives; never return a cached response shared by users.
- [ ] Implement identity helper and root proxy. Proxy network failure permits public navigation; private pages remain guarded independently.
- [ ] Run focused tests; GREEN plus existing Supabase adapter tests remain green. Commit: `feat: refresh Supabase sessions and verify identity`.

## Task 3: Actions, login UI dan akun

**Files:** Create `app/login/actions.ts`, `app/login/page.tsx`, `app/login/login-form.tsx`, `modules/auth/login-state.ts`, `app/account/page.tsx`, `tests/unit/auth-actions.test.ts`, `tests/unit/auth-login-state.test.ts`; Modify `app/page.tsx`, `app/globals.css`.

**Interfaces:**
- `sendOtpAction(email:string):Promise<AuthResult>`.
- `verifyOtpAction(input:{email:string;token:string}):Promise<AuthResult>`: successful path calls redirect('/account') outside service catch.
- `logoutAction():Promise<AuthResult>`: success redirects('/login').
- Actions construct writable SDK gateway with request signInWithOtp options shouldCreateUser true, verifyOtp type email, signOut scope local.
- `LoginState = {email:string;stage:'email'|'code';pending:boolean;message:string;resendAt:number;requestId:number}`.
- `loginReducer(state:LoginState,event:LoginEvent):LoginState`, event union covers editEmail, startRequest, requestResult (id,email,result,now), edit/reset, and clearError; timestamps/request ids are supplied by UI, no network in reducer.

- [ ] Write actions RED tests: writable adapter used; exact SDK options; malformed input never calls SDK; service error returned; redirect outside catch on success; logout failure stays visible.
- [ ] Write reducer RED tests: accepted request sets code stage/resendAt now+60000; changing email clears errors/code and increments requestId; stale completion ignored by id/email; pending blocks duplicate submission; resend wait respects timestamp and resets only on successful request.
- [ ] Run focused tests, confirm RED; implement actions/reducer with Task 1/2 interfaces and recorded provider code length as a named module constant shared by server/UI (not client-supplied verify rule).
- [ ] Build client login form with one token input (inputMode numeric, autocomplete one-time-code), proper labels, pending buttons, live error/status and resend remaining seconds. Stop timers on unmount. Never persist token or email outside component state. Provide changing email only when safe and discard stale outcomes.
- [ ] Implement login/account server pages using getVerifiedUser. Account force-dynamic; render verified email and logout, no role claims. Add home login/account link and correct setup status.
- [ ] Scope auth CSS selectors to avoid global section/h1 rules distorting forms; navy/off-white/blue, visible focus, mobile widths, reduced motion, system font. No extra design dependencies or promotional copy.
- [ ] Run focused tests, lint/typecheck/build; expect GREEN. Commit: `feat: add email OTP login and account pages`.

## Task 4: Integration review và hosted evidence

**Files:** Modify `docs/setup/SUPABASE_DEV_SETUP.md`, this plan and approved spec implementation status; no new product features.

- [ ] Run `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`; record exact counts/results. These checks are part of this plan's implementation verification, pending user review of plan.
- [ ] Start dev server on port3000 with CA environment; use Computer Use to inspect login mobile/desktop layout, tab order, labels, resend, wrong-code message and anonymous account redirect. Do not automate entry/submission of OTP or authentication dialog. User performs credential steps.
- [ ] Present exact template source and guide user to apply hosted Auth changes, Site URL localhost3000 and confirm signup/Magic Link token templates. Agent must not change those security settings through UI automation.
- [ ] User uses their authorized org email, requests real OTP and enters code directly in browser. Verify first-login delivery, account email, refresh retains login, local logout, and protected-page redirect after logout. Record results only, never OTP/cookies. If SMTP blocks delivery, preserve code and explicitly mark hosted login unverified.
- [ ] Fresh review by GPT-6 Luna medium with focused context of spec/plan/diff; address correctness issues under review workflow. Full branch review required before integration.
- [ ] Update docs with local vs hosted evidence, provider actual length/expiry and CA launch requirement. Correct historical setup pending wording by labeling its date, no false claim tenant/RLS implemented.
- [ ] Commit documentation; use finishing-a-development-branch for integration decision. No implicit push, PR or deployment.

## Self-review / handoff

Coverage: provider templates/new-user delivery Task1/4; errors/validation Task1; cookies/identity/cache Task2; UI/actions/redirect/logout Task3; hosted verification and manual security changes Task4. Five Review Focus cases have an explicit owner/check. Existing contracts read-only/read-write stay intact. No dependency or migration introduced.

Recommended execution: **Native/inline**, preserving the method selected earlier, with one final independent Luna medium reviewer. Tasks share the same service/session interfaces; per-task fresh implementers would add coordination cost for this small slice. Implementation begins only after user reviews this plan.

## Status eksekusi — 7 Oktober 2026

Tasks 1–3 complete; commits 38012ae, 4267913, 735d2de. Task4: local tests/build passed on6October; hosted delivery/verify visible on user screenshot, refresh/logout confirmed by user. Reviewer Luna medium found no issues. Full visual/keyboard QA and hosted expired/revoked-session checks remain deferred before staging; do not read unchecked historical steps as proof they were performed. OTP6digit + per-digit boxes explicitly deferred by user.
