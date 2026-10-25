# Simple Seatpax Helpdesk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user chooses delegation. Implement task-by-task. Do not start application implementation until the user reviews this plan.

**Goal:** Deliver guest complaint submission/tracking and one staff helpdesk workflow inside Seatpax for the ujikom simulation.

**Architecture:** Reuse the Next.js application, PostgreSQL/Drizzle and verified staff identity. Keep rules in modules/helpdesk, thin public/staff adapters, private Supabase Storage and a durable email outbox. Public lookup and email-granted supplementation use separate capabilities; booking/payment services remain unchanged.

**Tech Stack:** Existing Next.js 16, React 19, TypeScript, Zod, postgres/Drizzle, Supabase JS, Node crypto and Phosphor. Resend HTTP API through native fetch for complaint email (builder choice, no new SDK).

**Spec:** docs/superpowers/specs/2026-10-25-simple-helpdesk-design.md, approved by user saying lanjut after the design handoff.

## Global constraints

- One company; public requests use server-configured HELPDESK_COMPANY_ID, never a client-selected company. No SaaS changes.
- Guest submission and tracking without login/OTP. No original descriptions, contacts, attachments or booking details in public tracking.
- One new company role HELPDESK; staff selects LOW/MEDIUM/HIGH, initially null. No assignment or escalation.
- MENUNGGU -> DIPROSES -> SELESAI; MENUNGGU/DIPROSES -> PERLU_DILENGKAPI -> MENUNGGU. Completion is terminal.
- Email on receipt, request for information and completion. Receipt includes the same complaint ID shown in the browser.
- Optional JPEG/PNG/WebP/PDF: three files maximum per submission/supplement, 5 MiB each. Private storage. No live chat, refund, seat or payment mutation.
- Existing white/blue Seatpax UI. Existing landing Bantuan plus floating Buat pengaduan, not an extra landing tab.
- No automatic data purge/delete UI in simulation. Production retention policy deferred. Never print secrets, tokens, contacts or email bodies in logs.
- Working checkout already isolated: C:/Users/ASUS/.codex/worktrees/seatpax-landing/SeatPax. Preserve unrelated next-env.d.ts changes. No merge/push in this plan.

## Review focus

1. Double submit/retry and concurrent staff actions must not duplicate cases, grants or email events; serialize case mutations. Task 2.
2. Knowing a tracking code must never permit edits/private evidence access or reveal booking ownership. Tasks 2 and 4.
3. Old supplementation links, completed cases, disabled staff and wrong-company requests must reject mutations. Tasks 2 and 6.
4. Email failure/provider timeout must preserve reports and give staff a retry without promising inbox delivery. Task 3.
5. Large/mislabelled files, blocked local storage and phone bottom navigation must not break submission or cover its actions. Tasks 4, 5 and 7.

## Repository findings and file map

- lib/db/schema.ts and drizzle/: current membership_role enum has ADMIN_PO/CREW/SUPER_ADMIN and a company-role check. Change both, preserving existing memberships and crew composite identities.
- modules/access/service.ts, server.ts and transaction.ts: reuse verified identity, active memberships and FOR SHARE membership locking. Extend explicitly, do not grant Helpdesk tenant.admin.
- modules/auth/entry-destination.ts, app/account/page.tsx and app/components/passenger-account-menu.tsx: add Helpdesk entry while preserving booking return-path policy and other destinations.
- No generic complaint email sender or object-storage adapter exists. Add focused adapters; Supabase login OTP templates are not the complaint sender.
- New modules/helpdesk/{types,validation,capabilities,repository,service,staff,attachments,notifications,mail-worker,transport}.ts own this domain. Do not build a generic workflow engine.
- New lib/env/helpdesk.ts and lib/supabase/admin-storage.ts parse server-only configuration and create the private storage client.
- New app/pengaduan pages/components, app/api/pengaduan route handlers, app/helpdesk pages/actions and helpdesk CSS adapt the domain.

### Task 1: Persistence and Helpdesk access foundation

**Files:** Modify lib/db/schema.ts, drizzle/meta/_journal.json, modules/access/service.ts and modules/access/server.ts. Create drizzle/0012_helpdesk.sql, modules/helpdesk/types.ts, validation.ts, capabilities.ts, lib/env/helpdesk.ts. Tests: tests/unit/helpdesk-validation.test.ts and tests/integration/helpdesk-schema.test.ts (follow the existing integration harness).

**Interfaces:** ComplaintStatus = MENUNGGU | DIPROSES | PERLU_DILENGKAPI | SELESAI; Priority = LOW | MEDIUM | HIGH; Category = PAYMENT | JOURNEY | BUG | OTHER. HelpdeskContext = {actorId:string;companyId:string}. SubmissionInput = {requestKey:string;name:string;email:string;category:Category;title:string;description:string;bookingReference?:string}. PublicCase excludes private fields by construction.

- [ ] Add focused failing checks for input bounds, priority rejection in guest input, role/company constraints and RLS/direct Data API denial; run only the named new files using existing unit/integration configuration.
- [ ] Add HELPDESK enum in migration 0012 and extend the company-role check using role::text comparisons so no newly added enum literal is used before migration commit. Do not seed HELPDESK membership inside that migration transaction. Recheck the latest migration number before writing.
- [ ] Create cases, immutable case events, attachment metadata, supplementation grants, mail jobs and bounded request-rate counters. Uniques: complaint code, request key, (case_id, revision), event mail identity; composite company/case relations prevent cross-company references. RLS enabled; no direct anon/authenticated table reads/writes.
- [ ] Cases store private reporter fields, original description, optional unverified booking reference, status/priority/revision, public information request/outcome. Events store server actor/time. Grants store random ID, digest, case/request revision and consumed/revoked timestamps. Mail jobs store immutable event payload and delivery status, not plain edit secrets.
- [ ] Validate lengths: name 2-120, email max254, title 5-160, description/supplement 10-5000, bookingReference max120, staff message 10-3000. Reject client priority/company/actor fields rather than trusting them.
- [ ] Generate complaint code SPX-ADU- plus 16 random bytes in base32, and separate 32-byte-strength supplementation capability. Derive the capability via HMAC-SHA256 of a random grant ID and case/request identity using HELPDESK_LINK_SECRET; persist only its digest. Mail worker can regenerate it without storing plaintext in jobs. Constant-time digest comparison.
- [ ] Parse HELPDESK_COMPANY_ID, HELPDESK_LINK_SECRET, HELPDESK_PUBLIC_ORIGIN, RESEND_API_KEY, HELPDESK_EMAIL_FROM and SUPABASE_SERVICE_ROLE_KEY as server-only values. Missing email/storage configuration must not crash unrelated Seatpax pages.
- [ ] Run focused checks and typecheck; record migration evidence against a disposable/explicit development database, never an assumed production target. Commit foundation.

### Task 2: Case lifecycle, public projection and atomicity

**Files:** Create modules/helpdesk/repository.ts, service.ts, staff.ts; extend modules/access/service.ts/server.ts. Tests: tests/unit/helpdesk-service.test.ts, tests/integration/helpdesk-workflow.test.ts.

**Interfaces:** createHelpdeskService(deps) exposes submit(input:SubmissionInput,files:ValidatedAttachment[]):Promise<{code:string;status:ComplaintStatus}>, track(code:string):Promise<PublicCase|null>, supplement(input:{code:string;grant:string;requestKey:string;description:string},files:ValidatedAttachment[]):Promise<{code:string;status:ComplaintStatus}>. Staff service exposes list(ctx,filters), detail(ctx,id), setPriority(ctx,id,priority,expectedRevision), start(ctx,id,expectedRevision), requestInformation(ctx,id,message,expectedRevision), complete(ctx,id,outcome,expectedRevision). All mutations return updated {id,status,revision}.

- [ ] Write/run focused failing checks for the five lifecycle transitions, invalid transitions, missing required notes, editing by code alone, cross-company access, disabled staff, token replay/replacement and terminal completion.
- [ ] Implement transactions locking active HELPDESK membership FOR SHARE then case FOR UPDATE for writes. Admin gets explicit helpdesk.read permission only; Helpdesk never gains tenant.admin. Case revision rejects stale forms with a reload message.
- [ ] Atomically persist submission/case event/receipt job. Same requestKey+same normalized payload returns the original code; different payload under the same key rejects conflict. Do not reupload evidence on a completed retry.
- [ ] Information requests require nonempty public explanation; issue a fresh grant, revoke older ones and enqueue email in the same transaction. Supplementation consumes that grant, appends private information, returns to MENUNGGU and preserves original evidence/history.
- [ ] Set priority independently; start processing requires reviewed priority. Completion requires DIPROSES and an outcome, revokes grants and enqueues its email. No automatic booking/payment action.
- [ ] Return a strict public DTO: code,title,category,status,priority,createdAt,updatedAt,publicRequest,publicOutcome. Never spread a repository row into this response. Mark public tracking no-store/noindex. Guest booking reference is not dereferenced.
- [ ] Run focused checks and typecheck; commit service.

### Task 3: Durable complaint emails

**Files:** Create modules/helpdesk/notifications.ts, transport.ts, mail-worker.ts, scripts/send-helpdesk-mail.ts; modify package.json and .env.example. Tests: tests/unit/helpdesk-notifications.test.ts and tests/integration/helpdesk-mail.test.ts.

**Interfaces:** renderComplaintEmail(event:MailEvent):{subject:string;text:string;html:string}; sendComplaintEmail(job:MailJob):Promise<{providerId:string}>; drainHelpdeskMail({limit:number}):Promise<{accepted:number;failed:number}>. Receipt, INFORMATION_REQUESTED and COMPLETED are the only automatic mail events.

- [ ] Add focused failing checks for escaped reporter text, receipt code/link consistency, request capability link, outcome inclusion, duplicate event retries and report preservation on transport error.
- [ ] Send through Resend POST /emails using native fetch and Idempotency-Key helpdesk/<job-id>. Origin comes from trusted configuration, never request Host. Email links go to tracking or private supplementation; no email attachment copies.
- [ ] Claim jobs with a short transaction/lease and SKIP LOCKED; release transaction before network I/O. Use 10s request timeout, stable body/key, 1m/5m/30m/2h backoff, max five attempts. Store provider acceptance separately from confirmed delivery; no claim of inbox delivery.
- [ ] On ambiguous timeout retain the same provider key/payload. Within Resend's 24h idempotency window retry safely; beyond it mark delivery unknown for staff review rather than automatically replaying an ambiguous send. Known permanent rejection/config errors show failed with safe reason. Never reset a successfully accepted job.
- [ ] Add db:send-helpdesk-mail script (bounded 20 jobs per run), best-effort post-commit dispatch for prompt simulation emails, and staff retry for failed eligible jobs. Recovery command remains necessary if the request/process stops. No scheduled automation is created by this plan.
- [ ] Document verified sender/API-key setup and how the worker runs for tomorrow's simulation. Credentials missing means email acceptance remains pending, not silently mocked success. No actual messages sent during development without the user's explicit testing destination/authorization.
- [ ] Run focused checks with fake transport, typecheck; commit mail.

### Task 4: Public endpoints, rate limits and private evidence

**Files:** Create modules/helpdesk/attachments.ts, lib/supabase/admin-storage.ts, app/api/pengaduan/route.ts, app/api/pengaduan/cek/route.ts, app/api/pengaduan/lengkapi/route.ts, app/api/helpdesk/attachments/[id]/route.ts, scripts/setup-helpdesk-storage.ts. Tests: tests/unit/helpdesk-attachments.test.ts and tests/integration/helpdesk-public-boundary.test.ts.

**Interfaces:** ValidatedAttachment = {originalName:string;mime:string;size:number;bytes:Uint8Array}; validateAttachments(files:File[]):Promise<ValidatedAttachment[]>; storage adapter uploadPrivate(caseId,eventId,file), deleteStaged(paths), downloadPrivate(path). POST /api/pengaduan and /lengkapi accept multipart; POST /cek accepts {code}.

- [ ] Write/run failing checks for wrong secret, ordinary code on edit endpoint, public projection omissions, fake MIME, 4 files, >5MiB/file, wrong-company downloads and absent verified staff.
- [ ] Use route handlers rather than Server Actions for 15MiB aggregate uploads. Enforce Content-Length when present and cap actual streamed body at 16MiB, including multipart overhead. Reject before unbounded formData buffering. Validate file signatures plus accepted MIME; normalize original filenames and use random storage paths. No HTML/SVG/inline PDF preview.
- [ ] Create private bucket seatpax-helpdesk with restricted MIME/size. Server-only service-role client owns storage operations; guest/direct authenticated clients get no bucket read/list/upload policies. Stream downloads through fresh staff authorization, Content-Disposition attachment and nosniff.
- [ ] Stage validated files with unique paths, commit metadata only with the case transaction, delete staged objects on failure and provide bounded orphan cleanup by prefix/age if a process dies. No storage failure may produce a case claiming nonexistent evidence.
- [ ] Persist limiter counters: submit 5/hour per HMAC client key and 5/hour per email; lookup 30/minute per client key; supplementation 10/hour per grant/client key. Deployment adapter must establish a trusted client IP; never trust arbitrary X-Forwarded-For. For local testing use socket/loopback identity. Return 429 with Retry-After, generic missing/invalid code errors. No raw IP retention.
- [ ] Reject cross-origin public mutations using configured origin, redact edit grants from logs, use Referrer-Policy no-referrer and no-store on edit/lookup views, and do not consume grants on GET/email scanner prefetch.
- [ ] Run focused checks and development storage verification; commit boundary.

### Task 5: Customer complaint centre and browser history

**Files:** Create app/pengaduan/page.tsx, buat/page.tsx, cek/page.tsx, lengkapi/page.tsx, components/{complaint-form,complaint-tracker,complaint-history,supplement-form}.tsx, history.ts and pengaduan.css. Tests: tests/unit/helpdesk-history.test.ts.

**Interfaces:** history helpers readHistory(), rememberCode(code), clearHistory(); stored value {code,lastAccessedAt,label}, maximum20, neutral label only. UI consumes Task4 endpoints and PublicCase. Query links use /pengaduan/cek?kode=... and /pengaduan/lengkapi?kode=...#grant=...; fragment read client-side and removed after loading into memory, never persisted.

- [ ] Add focused history checks: deduplicate, newest first, 20-record bound, corrupt/blocked localStorage fallback and no secrets/descriptions persisted.
- [ ] Build centre with two clear choices Buat pengaduan / Cek pengaduan and recent browser history. Explain history belongs to this browser. No login wall.
- [ ] Form labels: Nama, Email, Kategori, Judul, Uraian, Nomor pesanan (opsional), Lampiran (opsional). Do not expose priority. Categories: Pembayaran, Pelayanan perjalanan, Bug aplikasi, Lainnya. Show file limits and explain screenshots should avoid unnecessary private information.
- [ ] Successful submit displays/copies code and links to tracking even if email sending is pending. Preserve a stable requestKey across retries, prevent double click and retain entered values on errors.
- [ ] Tracking shows only PublicCase and neutral not-found response. PERLU_DILENGKAPI tells reporter to use their email link. Supplement form shows requested fields/message, accepts appended description/files and posts the separate grant. Show expired/replaced/used-link state without leaking private content.
- [ ] Inspect keyboard, inline validation, loading/empty/error states and widths320/390/768/1440. Run named history checks, typecheck and scoped lint; commit customer pages.

### Task 6: Staff workspace and simple staff management

**Files:** Create app/helpdesk/layout.tsx, app/helpdesk/page.tsx, app/helpdesk/actions.ts, app/helpdesk/data.ts, app/helpdesk/[id]/page.tsx, app/helpdesk/components/{case-list,case-detail,case-actions}.tsx, app/admin/companies/[companyId]/helpdesk/page.tsx and helpdesk-staff/page.tsx, app/admin/helpdesk-actions.ts. Modify modules/auth/entry-destination.ts, app/account/page.tsx, app/components/passenger-account-menu.tsx, app/admin/components/admin-navigation.tsx. Tests: tests/unit/helpdesk-access.test.ts and tests/integration/helpdesk-staff.test.ts.

- [ ] Write/run failing checks for active/disabled Helpdesk, admin read-only vs Helpdesk write, crew/global Super Admin without company membership, cross-company IDs and concurrent stale revisions.
- [ ] Add verified Helpdesk workspace destination and account link; unauthenticated /helpdesk redirects through existing login, post-login role selection returns Helpdesk naturally. Do not broaden booking return-path allowlist with arbitrary URLs.
- [ ] List shows code/title/category/status/priority/date, with bounded pagination25, search and filters. Detail shows private original/supplemental information, chronological events, safe evidence downloads and relevant actions. No conversational chat composer.
- [ ] Controls: set priority, Mulai proses, Minta kelengkapan with required explanation, Selesaikan with required result; show public-response warning. Hide/disable unavailable transitions but enforce them server-side. Delivery panel shows queued/accepted/failed/unknown and eligible retry action.
- [ ] Company admin monitoring lives under Pesanan > Pengaduan pelanggan, retaining the previously agreed menu grouping and unresolved count. Monitoring reuses the read-only case detail.
- [ ] Minimal staff administration: add/activate/disable HELPDESK membership for an already registered verified Seatpax account by exact email; no invitation subsystem, role builder or user deletion. Admin writes require fresh tenant.admin and preserve other memberships. Display helpful instruction if the account has not yet logged in.
- [ ] Run focused checks, typecheck and scoped lint; inspect Helpdesk and admin read-only states; commit workspace.

### Task 7: Entry points, full-flow acceptance and product docs

**Files:** Modify app/page.tsx, app/components/passenger-shell.tsx, app/components/passenger-footer.tsx, app/bookings/[bookingId]/page.tsx. Create app/components/complaint-entry.tsx and complaint-entry.css, docs/setup/HELPDESK_SETUP.md. Update docs/seatpax/{00_INDEX,02_MVP_SCOPE,03_ROLES_RBAC_AUTH,09_END_TO_END_FLOWS,10_DATA_MODEL_DATABASE,11_API_PROJECT_STRUCTURE,13_UI_UX_DESIGN,19_DECISION_LEDGER}.md.

- [ ] Extend existing Bantuan section with Buat pengaduan / Pengaduan saya (opens browser-history area). Keep existing FAQ and five landing tabs. Floating document/report control uses Buat pengaduan, no chat symbol/pulsing. Hide on complaint/staff/focused checkout/login routes; phone offset clears bottom nav/safe area.
- [ ] Add Laporkan masalah in authorized owned booking detail, prefilling its displayed reference without exposing guest booking lookup or changing payment/booking state. Keep navigation back to Seatpax catalogue/account.
- [ ] Run npm run typecheck, scoped ESLint and the named Helpdesk unit/integration files. Do not run an unrelated whole-repo suite without a concrete reason. Use a disposable/approved development database for migration/integration checks.
- [ ] Manually inspect guest submit -> receipt/code -> public lookup -> Helpdesk request -> email-link supplement -> process -> complete -> outcome email. Real inbox delivery requires user-supplied configuration and explicit test-recipient authorization; until then document fake transport evidence separately.
- [ ] Inspect screenshots at320/390/768/1440 and a short viewport; check form buttons, FAB/nav overlap, local history and keyboard. Inspect direct/public/foreign staff denials and verify helpdesk operations leave booking/payment/inventory unchanged.
- [ ] Record migration/worker/storage setup, actual commands/results, screenshots and pending provider/physical-device acceptance. Update source-of-truth docs to supersede older complaint assumptions; mark statuses as implemented only after evidence.
- [ ] Obtain one independent whole-change review, fix important findings, repeat affected verification, diff-check and commit intended changes. Preserve unrelated next-env.d.ts. No merge/push.

## External configuration and implementation references

These are configuration needs, not a request to paste secrets in chat: target development company, server-only Supabase storage credential, verified Resend sender/key, and public origin usable in email links. Implementation may proceed with adapters/fake transport while these are absent; actual mail/upload acceptance cannot be claimed. If a working configured transport already exists by execution time, reuse it rather than adding a second provider.

- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/emails/idempotency-keys (24-hour key retention; verified during planning)
- https://supabase.com/docs/guides/storage/security/access-control
- Refresh relevant Supabase changelog/docs before execution. Web reader could not parse changelog.md during planning; this is not evidence that no relevant change exists.

## Verification command conventions

For each task, run the explicitly named unit files with `node node_modules/vitest/vitest.mjs run tests/unit/<named-file>.test.ts` (pass multiple named paths in the same invocation). Run its named integration files separately with `node node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts tests/integration/<named-file>.test.ts`; these require the existing integration target guard/configuration. Typecheck: `node node_modules/typescript/bin/tsc --noEmit`. Scoped lint: `node node_modules/eslint/bin/eslint.js <changed-code-paths>`. Expected success is exit0 and all selected checks passing. Failed dependency/configuration is a pending check, never a pass. During task execution, write and run each focused failing check before its implementation, then rerun after the fix. Do not run checks while merely preparing this plan.

## Self-review

Spec coverage: guest flow Tasks2/4/5; permissions6; privacy2/4; files4; history5; lifecycle2/6; email3; navigation7; documentation7. Signatures are shared through Task1/2 interfaces. All five Review Focus conditions have owning focused checks. No application code, credentials, bucket or database has been changed by writing this plan.


## Execution status - local implementation delivered

Tasks1-7 application changes are implemented in this worktree. Focused checks were consolidated into six Helpdesk unit files plus three existing access/entry unit files, and tests/integration/helpdesk-workflow.test.ts instead of creating each originally suggested test filename. See docs/setup/HELPDESK_SETUP.md for actual commands/results and browser evidence. Public deployment limiter was corrected after independent review: fail closed unless trusted ingress identity is configured; loopback development remains usable. JSON serialization regression was reproduced with the runtime Drizzle adapter and fixed.

User explicitly deferred email/Storage configuration; their live provider checks and authenticated/physical device acceptance remain pending, not checked off as successful. The checklist above is the original intended task sequence; the setup record is the actual verification ledger. No real staff account was assigned automatically, and no external email was sent.
