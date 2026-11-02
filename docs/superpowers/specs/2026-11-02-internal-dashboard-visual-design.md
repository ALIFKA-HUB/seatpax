# Internal dashboard — approved visual direction v5

**Approval:** `ADM-DESIGN-05`, 2 November 2026, user: **"acc deh"**. This approves the preview appearance; application implementation is not yet delivered.

**Delivery update:** The subsequent **"ok"** approved the bounded `ADM-UI-01` shell implementation. See [delivery evidence](../../setup/INTERNAL_PANEL_VISUAL_SETUP.md). The staff dashboard/data work remains pending; approval of the appearance does not mean every feature in the preview exists.

**Reference:** `C:/Users/ASUS/.codex/visualizations/2026/10/05/01a10c3f-c9b9-7ef1-9162-9c919ff61ab4/.superpowers/brainstorm/653-1793632322/content/seatpax-dashboard-type-v5.html`.

## Accepted appearance

- White sidebar and content cards on a pale cool canvas; compact top bar; grouped expandable navigation; original Seatpax logo.
- Three solid summary cards: blue `#005bd1`, green `#087f5b`, orange `#bd4b12`, with white text. Ink `#0a2144`, muted `#526078`, border `#d5dfea`.
- Inter scoped to the internal panel. Body/descriptions weight 400; navigation/labels/statuses 500; actions/staff names/section headings 600; page heading/summary numbers 700.
- Page heading 32px desktop / 28px mobile; summary numbers 46px desktop / 38px mobile.
- Secondary actions have a pale blue background, border and separate chevron. Summary actions have a translucent white background and border. Hover strengthens contrast; focus is visible immediately. Static status/activity text must not look clickable.
- Desktop register and secondary rail; stacked phone layout, readable rows, 44px touch targets, no horizontal document overflow and reduced-motion support.

## Boundaries and implementation gap

The preview contains labelled sample staff, counts, activity and simulated actions. Never copy these into production as real information.

Current source provides `/super-admin/companies`, an independent Super Admin shell, company status controls and fixed access guards. The proposed shared all-role panel, staff password login, staff CRUD, archived deletion and editable RBAC are separate functional workstreams. This visual approval does not silently implement them or broaden authorization.

The future staff summary needs a reviewed read-model contract: current records allow multiple memberships, while the agreed future model is one staff role per account. Resolve count identity, company scope, active/disabled semantics and legacy display before implementing real staff queries. Do not mutate legacy records to fit the preview.

Production actions must execute a working authorized operation or clearly indicate unavailable functionality. No dead links or simulation dialogs presented as live management. Real empty, denied and failed-load states must be distinct. Keep booking/payment/Helpdesk/Crew rules and explicit company-status confirmation unchanged.

## Preview verification

v5 passed widths 320/390/768/1024/1440/1920 without horizontal overflow, Inter loading and weight checks, status filtering, search/empty state, simulated form and mobile navigation checks. Hallmark rendered sweep: 0 FAIL, 0 REFLEX, 0 WARN. These results cover the preview, not production acceptance.
