# Helpdesk workspace refresh

Status: visual preview approved; autonomous implementation authorized on 29 October 2026. Implementation and verification limits: `docs/setup/HELPDESK_UI_REFRESH_SETUP.md`.

## Intent

Give Seatpax Helpdesk a recognizable staff workspace inspired by the structure of the local Skoolia reference, with fewer features. The earlier list-only workspace and initial plain preview did not satisfy the user. Keep Seatpax's existing logo, white surfaces, blue accent, navy text and blue-grey neutrals.

## Approaches

1. Keep a minimal list-first workspace and add a small sidebar. Lower implementation cost, but the user rejected the plain visual result.
2. Use a dashboard-first workspace with stronger hierarchy, a working queue, activity and compact tables. The user selected this direction and approved the revised interactive preview, including solid-blue active sidebar items.

References: Rakibul Ism's Helpdesk Ticket Management Admin Dashboard (https://dribbble.com/shots/27169872-Helpdesk-Ticket-Management-Admin-Dashboard-UI-UX-Design), Kravio (https://dribbble.com/shots/27571514-Kravio-Customer-Support-Helpdesk-Dashboard), and Smart Priority Filter (https://dribbble.com/shots/27156247-Smart-Priority-Filter-Helpdesk-Ticketing-Data-Table). Adapt composition, not their branding or additional business features.

## Approved presentation

- Sidebar: existing Seatpax logo; Dashboard and Pengaduan; Ke Seatpax and account/logout at the bottom. Remove the extra Helpdesk workspace card.
- Active sidebar item: solid Seatpax blue, white text and icon, no left stripe. Inactive hover: subtle blue-grey fill and blue text/icon; active hover: slightly darker blue. Short colour transitions, no movement; honour reduced motion.
- Dashboard: four clickable status summaries for Menunggu, Diproses, Perlu dilengkapi and Selesai. Summary selection opens the corresponding complaint filter.
- Main dashboard area: wide handling queue and narrower recent-activity column, with a recent-complaints table underneath. Do not add decorative charts.
- Queue: waiting reports, high priority first and oldest within priority. Reports awaiting an initial priority remain clearly visible. Exact ranking of the other priority values is a builder choice to state in the implementation plan; no AI-based sorting.
- Pengaduan: compact search/status/priority controls and readable table linked to case details. Preserve existing filtering and pagination.
- Details: clear report content, private evidence and handling history; adjacent priority/action controls and email status. Preserve separate priority persistence and existing lifecycle validation rather than copying the prototype's simplified combined action.
- Desktop uses the sidebar and multi-column layout. Tablet collapses columns when necessary. Phone uses an accessible collapsible menu, stacked content and fully usable actions without horizontal page overflow.

## Boundaries

Retain one Helpdesk handling role and existing company-scoped permissions. Operational administration remains separate. Existing complaint submission/tracking, completeness links, priorities, lifecycle, emails and private attachment protections remain authoritative. Do not introduce chat, assignment, escalation, SLA targets, extra handling roles, refunds or SaaS functionality.

The interactive preview contains sample data and simulated controls. Application implementation must use authorized real data, truthful zero/loading/error states and existing complaint identifiers. Do not copy sample counts, abbreviated identifiers, dates, activity or fake pagination into runtime pages.

Builder choices: retain existing Next.js/domain services; use bounded server-side summary/queue/activity queries rather than loading all reports in the browser. Apply active Helpdesk authorization to dashboard data just as to the case list. Define status totals independently of filtered/paginated row counts. Recent activity must come from persisted case events. Use current staff timezone conventions and do not hardcode the preview date. No database schema or provider configuration change is implied.

## Acceptance

Check dashboard totals and status links against data; deterministic queue order including unset priority and oldest reports; bounded activity; search/pagination/detail navigation; existing role denials and lifecycle rules; solid-blue active navigation and readable hover/focus states; desktop/tablet/phone layout and keyboard menu interaction. Preserve existing public pages. No production deployment or push is included.

Visual reference: C:/Users/ASUS/.codex/visualizations/2026/10/05/01a10c3f-c9b9-7ef1-9162-9c919ff61ab4/seatpax-helpdesk-refined.html.
