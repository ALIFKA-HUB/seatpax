# Simple Seatpax Helpdesk Design

Status: approved for implementation planning by the user saying lanjut after the written-design handoff. Application implementation follows plan review.

## Intent and boundaries

Provide a simple complaint workflow for the ujikom simulation within the existing single-company Seatpax application. Cover payment, journey service and application bugs. This is form submission, review and outcome tracking, not live chat. Borrow the core complaint lifecycle from local Skoolia; do not copy its architecture or complex role-routing system.

## Approaches considered

1. Module inside Seatpax, with /pengaduan for reporters and /helpdesk for staff. Reuses application, identity and styling; directly connects to booking context where authorized. **Chosen by user.**
2. Separate application. More independent but duplicates hosting, staff authentication and integration work; not chosen.

## Confirmed decisions

- One new staff role: Petugas Helpdesk. Handles completeness checks, priority, requests for additional information and completion. Existing company admin manages staff and monitors cases. Crew retains existing operational duties.
- No login required to submit or check a complaint. No email verification or OTP for tracking.
- /pengaduan offers Buat pengaduan and Cek pengaduan. Tracking accepts the complaint ticket number and offers browser-local history of submitted/previously checked tickets. History is device/browser dependent, not a claim of account ownership.
- Reporter provides name, email, category, title, description, optional attachment and optional booking reference. Reporter never sets priority.
- Staff selects Rendah, Sedang or Tinggi priority.
- First receipt email includes complaint ticket number, title, initial status and tracking link. Email also goes out when more information is needed and when the complaint is completed.
- Insufficient reports return to the reporter with an explicit explanation. Reporter supplements the same case using a special email link. Tracking code alone cannot authorize editing.
- Public tracking shows status, staff response and information requests, not reporter contact data or private attachments.
- Landing uses existing Bantuan section and a floating lower-right entry. No extra top-level landing tab. Booking detail keeps Laporkan masalah as a contextual entry.

## Proposed lifecycle

MENUNGGU -> DIPROSES -> SELESAI
MENUNGGU or DIPROSES -> PERLU_DILENGKAPI -> MENUNGGU

Initial status is Menunggu pemeriksaan. Staff may set priority and start processing, or request more information with a required explanation. Initial priority may remain unset until reviewed; unset is not a fourth priority tier. Supplementation appends reporter information and a history event, rather than silently replacing original evidence. Completion requires a result summary. Completed reports are read-only in this first version; a further issue is a new report. No automatic closure, SLA timers, escalation or reopening in this version. These lifecycle details are proposed builder defaults for user review.

## Customer experience

/pengaduan is an independent page in the same Seatpax site. Buat pengaduan opens the form; Cek pengaduan accepts an opaque, unpredictable complaint code. Successful submission displays the same code used in emails and a tracking link. Browser history stores only code, last-access timestamp and a neutral display label, not descriptions, contacts, evidence or editing credentials; bounded to 20 records with a clear-history control (builder defaults). Do not enumerate cases by email.

Use distinct complaint wording and codes so journey tickets cannot be confused with helpdesk tickets. Existing Bantuan links to the centre. Use Buat pengaduan consistently for its action. Floating entry uses a document/report icon rather than chat, does not pulse, and stays clear of phone bottom navigation and form actions. Hide it within helpdesk/report pages to avoid a redundant action. Keep white/blue brand and existing responsive components.

## Staff experience and authorization

Staff log in through existing verified Seatpax authentication, with fresh active company-scoped Helpdesk membership required server-side. /helpdesk lists complaints with search, status and priority filters, and detail/history actions. No assignment, department handoff, custom roles, live chat or internal discussion threads. Authorized staff can inspect original descriptions/contact/evidence. Company admins can monitor without silently gaining Helpdesk write permission. Implement new permission explicitly; neither crew nor public code possession grants staff access.

## Public lookup and private editing

Use cryptographically random complaint codes, not sequence-only identifiers, plus bounded rate limits. Lookup is bearer-code access to a minimal projection: title, category, status, reviewed priority, created/updated timestamps, sanitized staff outcome and information request. Do not expose original description, contacts, uploads, booking/payment details or internal events in lookup. Staff response UI warns against including personal/financial details in public text. Local history contains bearer lookup codes and should be clearly described as belonging to this browser.

Supplementation uses a separate high-entropy secret from the email, stored hashed and checked server-side. It permits only that case's requested additional information and optional evidence while PERLU_DILENGKAPI. It grants no original private evidence/contact access. Link is invalidated on successful submission, completion or replacement by a new information request. Reload/retry must not duplicate history. Builder default: no calendar expiry in this version, so no resend-token workflow is needed; status-scoped revocation remains mandatory.

Optional booking references in guest submissions are unverified reporter input, not proof of booking ownership. Public APIs must not resolve/expose private booking details. An authenticated booking entry may attach owned context after normal authorization. Complaint completion never confirms payments, issues tickets, releases seats or performs refunds. Existing payment verification/conflict tools remain authoritative.

## Technical boundary and delivery reliability

Implement business behavior in modules/helpdesk with thin Next.js page/action/API adapters. Reuse existing database/access/email/storage facilities after inspecting them; do not add a separate service or copy Skoolia code wholesale. Minimum persisted concepts: cases, immutable events, private attachment metadata, hashed supplementation grants and durable email jobs. Staff identity/company comes from verified server context; public submissions use the configured single company, not client company selection.

Case/event persistence and email job creation are atomic. Failed email delivery does not discard the report or generate a new ticket. Retry jobs with bounded backoff and stable event identifiers to prevent duplicate jobs; provider delivery remains at-least-once where provider idempotency is unavailable. Show submission success separately from email delivery and keep code visible. Staff see delivery failure and can retry the same failed job. No bulk email or notification preferences. Receipt/completeness/completion emails only; normal processing changes need no email.

Builder defaults: optional JPEG/PNG/WebP/PDF uploads, max three files of 5MB each, private storage, server-side type/size checks, safe download headers and authorized staff access only. Never serve HTML/SVG or active previews. Reject invalid submissions with inline errors, cap form lengths and request rates, prevent duplicate cases on retry using a submission key. Do not store editing secrets or private payloads in logs/browser history. Submission response must avoid leaking whether a booking reference exists.

## Scope exclusions

No live chat, multiple handling roles, assignments, escalation, automatic SLAs, satisfaction scoring, custom workflow designer, reporter priority, public case list, refund automation, SaaS billing, account registration or booking auth changes. No destructive migration of existing role/account data.

## Review and acceptance intent

Validate guest submission/receipt, code lookup, browser history, completeness email and single-case supplementation, staff-only priority/process/complete, completion email, failed delivery retry and no duplicate cases on repeat requests. Check public projections cannot return private data, editing requires its separate grant, completed cases reject edits, existing booking navigation remains intact and layouts work on desktop/tablet/phone. Specific verification commands belong to the implementation plan.

## Reference

Local Skoolia reference inspected read-only: admin backend complaint model/service and landing complaint DTO under C:/Users/ASUS/Documents/ALIFKA/PROJECT-PKL/skoolia. Seatpax prior complaint entry decisions are in 19_DECISION_LEDGER.md; this written proposal expands those with the agreed guest workflow and one new handling role, pending approval.


## Builder check disposition

Independent builder check raised evidence/case retention only. For the bounded ujikom implementation, proposed builder default is no automatic purge and no delete button: preserve cases, events and private attachments so the demonstrated history does not disappear. A production retention period and deletion-request procedure are deferred policy work, not implied by this proposal. This does not authorize indefinite retention for a production rollout. All other consequential workflow choices were sufficiently specified for planning.
