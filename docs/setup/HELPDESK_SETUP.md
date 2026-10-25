# Simple Seatpax Helpdesk

## Scope and pages

Single-company module for the ujikom simulation. No live chat or assignment/escalation system.

- /pengaduan: guest centre with Buat pengaduan / Cek pengaduan and browser-local recent codes.
- /pengaduan/buat: guest submission; /pengaduan/cek: tracking by opaque code; /pengaduan/lengkapi: email capability grants only.
- /helpdesk: authenticated Helpdesk workspace; /helpdesk/[id]: report details/actions.
- /admin/companies/[companyId]/helpdesk: admin monitoring under Pesanan > Pengaduan pelanggan.
- /admin/companies/[companyId]/helpdesk-staff: activate/disable a Helpdesk membership by registered, verified account email. The future petugas logs in once via existing OTP first, then an active company admin assigns the role. No real staff account is assigned automatically.

Landing Bantuan, footer and floating document button enter the centre/form. Owned booking detail includes Laporkan masalah with its reference. Complaint numbers are separate from journey tickets.

## Local configuration

Use ignored .env.local; never send keys through chat or commit them. The local development company is the existing Demo PO A, not a newly created real company.

- HELPDESK_COMPANY_ID: configured single development company UUID.
- HELPDESK_LINK_SECRET: server-only random secret (at least32 characters); preserve it to keep pending supplementation links valid.
- HELPDESK_PUBLIC_ORIGIN: actual browser origin used in email links and same-origin POST checks. Local example http://localhost:3001.
- RESEND_API_KEY and HELPDESK_EMAIL_FROM: verified Resend sender; not the Supabase OTP service.
- SUPABASE_SERVICE_ROLE_KEY: server-only private Storage credential for the existing project.
- HELPDESK_TRUST_PROXY=true only behind a configured ingress that overwrites x-real-ip with the actual client IP. Public deployment fails closed without this configuration or a valid IP. Local Next development on loopback has a shared test-only limiter. Do not use the local fallback for public deployment.

User confirmed email/storage credentials are not available and asked to continue. Submission without attachments and public tracking work independently of those credentials. Email jobs persist with a configuration-failure status and can be retried after configuration. Upload attempts return an inline unavailable message; no fake upload or fake delivery claim.

## Persistence and recovery

Migration0012 adds HELPDESK membership, cases, immutable events, private attachment metadata, grants, email jobs and rate counters. Tables have RLS and no direct anon/authenticated privileges. Development migration uses the existing guarded DATABASE_MIGRATION_URL allowlist. Runtime uses existing DATABASE_URL through Drizzle's postgres client.

Important: this client has transparent JSON serializers configured by Drizzle. Raw SQL JSON payloads must use typed serialized text cast to jsonb, matching existing payment/trip modules, not postgres tx.json(object). Integration tests instantiate Drizzle to exercise the runtime adapter too.

Commands after environment setup:

```text
node --import tsx scripts/migrate-db.ts
npm run helpdesk:storage
npm run db:send-helpdesk-mail
npm run helpdesk:cleanup-storage
```

For hosted development TLS, set NODE_EXTRA_CA_CERTS to the existing local CA certificate before commands/server startup. No TLS validation bypass. The mail command processes at most20 jobs; run it for recovery after interrupted requests. Best-effort after-response processing provides prompt simulation email. Continuous production scheduling is not configured by this work.

Private storage bucket seatpax-helpdesk accepts JPEG/PNG/WebP/PDF, up to3 files per submission,5MiB each. Request body cap16MiB. Cleanup checks at most1000 objects under its fixed staged prefix and deletes only unreferenced objects older than24h in the explicitly guarded development project. Never run cleanup against an arbitrary project.

## Behavior and limits

- Staff alone determines priority LOW/MEDIUM/HIGH. MENUNGGU -> DIPROSES -> SELESAI; incomplete reports go to PERLU_DILENGKAPI and supplements return to MENUNGGU. Completed cases are read-only.
- Public projection excludes descriptions, contacts, booking data, internal history and files. Public staff notes/outcomes must not contain private data.
- Tracking codes have128 bits of randomness. Supplementation uses a separate signed capability with stored digest, consumed on successful POST and revoked on replacement/completion. GET does not consume it. No automatic calendar expiry in the simulation.
- Browser history holds only neutral labels, codes and access dates, max20. Clearing it does not delete cases. LocalStorage can be unavailable without preventing tracking.
- Same requestKey and payload returns the original result; changed payload rejects conflict. Case revision/membership locks protect staff transitions.
- Receipt, completeness and completion notifications use stable event jobs. Obsolete completeness jobs are skipped after their grant is consumed/revoked. Acceptance by an email provider is not proof of delivery. Unknown network results are not blindly resent after the provider idempotency window.
- No automated refund, payment confirmation, inventory or booking mutation is performed. Guest booking reference is unverified input. No automatic case deletion or production retention policy.

## Verification record

See final execution evidence appended after verification. Physical mobile, authenticated staff browser acceptance, real email inbox and private Storage upload/download remain separate checks.


### Final local verification

- Migration0012 applied successfully through the existing development project allowlist.
- TypeScript no-emit and scoped ESLint passed. Nine selected unit files passed,23 assertions, including existing access/entry regressions and new validation, capability, file-type, history, email-template and rate-identity checks.
- Three development integration cases passed using the same Drizzle-configured postgres client as runtime. They exercise idempotent submissions, privacy projection, staff-only lifecycle/priority, supplements/token replay, terminal completion, browser-role RLS denial, wrong/disabled membership, email durability/retry and no booking creation. Fixtures roll back.
- Initial browser API testing caught JSON serializer mismatch that bare-postgres tests missed. Integration was changed to instantiate Drizzle, observed failing, then raw JSON encoding was fixed to typed serialized text; tests and public HTTP submission now pass.
- Actual guest HTTP submission succeeded, browser tracking displayed Menunggu pemeriksaan with no email/contact data, and temporary email-capability supplementation through the phone UI succeeded. Capability removed from URL, status returned to Menunggu. No real email was sent; test transport/failure recording used.
- Inspected centre, form and tracking screenshots. Widths320/390/768/1440: no horizontal overflow in tracking; phone form and centre inspected. Complaint pages hide floating CTA. Anonymous /helpdesk redirects to /login.
- One independent source review found deployment-wide shared rate-limit identity; fixed by fail-closed public configuration and tested with RED/GREEN. Shared limiter remains loopback-development-only.
- Final real-provider upload/download/email-inbox checks and authenticated staff browser/physical-device acceptance remain pending. Domain staff authorization/lifecycle is covered by database checks. No production build, merge or push is claimed.

Temporary browser fixtures and their generated staff identity are cleaned after inspection; screenshots retain only example report content. Local development rate counters used by QA are reset so the user can try the form.


## Public UI refinement evidence

Complaint portal now has its own white shell and two primary navigation links. Duplicate subnav removed; homepage/logo and Ke Seatpax return work. Centre uses headline/choices split with history underneath; form/tracker guidance collapses below768px. No business-layer/API/database changes were needed.

Fresh TypeScript no-emit, scoped ESLint and diff check passed. Headless Chrome inspected widths320,390,768,1024,1440,1920: no horizontal overflow; computed page/header background both rgb(255,255,255). Both main choices end at y472 desktop and y732 on390x950, visible early. Active form/tracking links verified; active background transparent, desktop header72px. Name/email inputs both49px after alignment fix. Phone320x650 uses in-header links instead of fixed passenger bottom nav. Regular /trips navigation and client-side return to landing verified unchanged. No page errors observed.

Screenshots: helpdesk-refresh-centre-1440.png, helpdesk-refresh-centre-390.png, helpdesk-refresh-form-1440.png, helpdesk-refresh-track-390.png in the task visualization directory. No new test suite or email/Storage provider operations were run for this UI-only refinement. Real inbox/private storage and physical device checks remain pending as previously recorded.
