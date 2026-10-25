# Local quick-login implementation plan

> **For agentic workers:** Use superpowers:executing-plans for this bounded inline task.

**Goal:** User-authorized local testing without waiting for email OTP; provide current roles/emails.
**Architecture:** Retain verified Supabase sessions and all membership checks. A server action permits only preset development accounts, NODE_ENV=development, explicit DEV_QUICK_LOGIN=true, the fixed dev Supabase project, and same-origin loopback requests. Generate/consume an admin magic-link hash entirely server-side without sending email. No tokens/keys returned to the browser. Production retains OTP.
**Stack:** Existing Next Server Actions, Supabase clients, native form.
**Spec:** User request and accepted local-testing direction in this conversation.

- [x] Add fail-closed guard/preset tests; prove failure before implementation.
- [x] Add server login and a select/form on /login only in explicit local mode. Logged-in local testers can switch accounts. Ordinary OTP remains available when mode is off.
- [x] Provision only the missing dedicated Helpdesk dev identity/membership in Demo PO A; no existing-role reassignment. Enable ignored local flag.
- [x] Run unit/type/lint checks, real-browser quick login/customer/admin/helpdesk routing and authorization denial, update role/setup docs.

**Review focus:** Production mode ignores flag; public origins rejected; arbitrary emails rejected; changed presets cannot generate arbitrary sessions; no auth secrets in responses/logs; actual membership remains authoritative.
