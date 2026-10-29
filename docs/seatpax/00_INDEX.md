# Seatpax Documentation Index

## Current audit and approval queue — 29 October 2026

The user requests preservation of existing product behavior, UI-focused forward work, explicit task goals/criteria and commit/push after each approved verified task. See [task approval roadmap](../superpowers/plans/2026-10-29-project-stabilization-roadmap.md), [source findings](../analysis/2026-10-29-source-bug-audit.md) and [blocked Computer Use evidence](../analysis/2026-10-29-computer-use-flow-audit.md). The Helpdesk dashboard is still an approved visual preview, not application implementation; its [written design](../superpowers/specs/2026-10-27-helpdesk-workspace-refresh-design.md) awaits confirmation. This queue does not activate deferred SaaS or mobile implementation.

> **Arah proyek terbaru — 21 Oktober 2026:** Seatpax digunakan hanya untuk satu perusahaan shuttle. Keputusan D2026-10-21-01 menggantikan arah SaaS untuk lingkup proyek saat ini. Pendaftaran PO mandiri, paket Free/Pro, kuota dan billing langganan serta pengelolaan banyak perusahaan ditunda. Pembayaran tiket dan operasional perusahaan tetap menjadi fokus. Fondasi company/access dan kode cabang SaaS disimpan; tidak ada penghapusan database atau perubahan akses otomatis melalui keputusan dokumentasi ini.

> **Platform decision — 15 October 2026:** The user adopted a dedicated Flutter Crew client for Android and iPhone. Existing web clients remain available; mobile implementation is not yet delivered. Read D2026-10-15-01 and the [mobile specification awaiting review](../superpowers/specs/2026-10-15-crew-mobile-design.md) before starting the mobile/API work.

> **Implementation update — 9 October 2026:** Manifest and explicit once-only boarding are implemented for assigned active crew, with same-tenant Admin read-only access, minimum passenger data, origin-stop validation and immutable event retries. QR resolves only; snack is the subsequent slice recorded below, and offline remains deferred. See `../setup/MANIFEST_BOARDING_SETUP.md` for evidence and pending physical-camera acceptance.


> **Implementation update — 8 October 2026:** Checkout/payment implementation: read `../setup/CHECKOUT_PAYMENT_SETUP.md` together with the approved checkout spec/plan before changing initiation, provider reconciliation, conflict resolution or ticket access.

Seatpax documentation is intentionally modular: **one context = one Markdown file**. Use this file as the entry point.

**Current release:** The user adopted the 30-day demo subset on 6 October 2026. Read the active release section in `02_MVP_SCOPE.md` and decision D2026-10-06-01 in `19_DECISION_LEDGER.md` before using older guest/group-booking/cash/reschedule examples. The technical foundation was separately adopted as D2026-10-06-02; read its design before implementing retained flows.

## Product & scope

- [Product Vision & Positioning](01_PRODUCT_VISION.md)
- [MVP Scope & Product Boundary](02_MVP_SCOPE.md)
- [Roles, RBAC, Tenant Isolation & Authentication](03_ROLES_RBAC_AUTH.md)
- [Domain Glossary & Core Business Rules](04_DOMAIN_BUSINESS_RULES.md)

## Ticketing domain

- [Route, Segment, Seat Inventory & Concurrency](05_ROUTE_SEAT_INVENTORY.md)
- [Fleet, Vehicle & Seat Template](06_FLEET_SEAT_TEMPLATE.md)
- [Booking & Payment](07_BOOKING_PAYMENT.md)
- [Ticket, QR, Entitlements & Manifest](08_TICKET_QR_MANIFEST.md)
- [End-to-End Product Flows](09_END_TO_END_FLOWS.md)

## Engineering

- [Data Model & Database](10_DATA_MODEL_DATABASE.md)
- [API Boundary & Project Structure](11_API_PROJECT_STRUCTURE.md)
- [Tech Stack, Third Parties & Scaling](12_TECH_STACK_ECOSYSTEM_SCALING.md)
- [Security, Reliability & Offline Strategy](14_SECURITY_RELIABILITY_OFFLINE.md)
- [Testing & Non-Functional Requirements](15_TESTING_NFR.md)

## Design

- [UI/UX & Visual Design](13_UI_UX_DESIGN.md)
- [Brand & Logo Direction](13A_BRAND_LOGO.md)

The passenger discovery refinement was approved on 20 October 2026 and implemented locally on its feature branch: [design](../superpowers/specs/2026-10-20-passenger-discovery-design.md), [plan](../superpowers/plans/2026-10-20-passenger-discovery-refresh.md), [scope and verification](../setup/PASSENGER_DISCOVERY_REFRESH_SETUP.md). It removes the decorative bus, adds real initial discovery and popup filters, and routes verified users to their work area. Physical-device and populated/authenticated browser acceptance remain pending.

The user adopted real city/regency references and requested data tidying on 20 October 2026, with no real pilot PO identified yet. Read the [database audit](../analysis/2026-10-20-region-data-audit.md) and [catalogue/cleanup design](../superpowers/specs/2026-10-20-region-reference-cleanup-design.md) before any related database changes. The user approved implementation of: [A: regional references and location choices](../superpowers/plans/2026-10-20-region-reference.md), then [B: reversible fixture cleanup](../superpowers/plans/2026-10-20-fixture-cleanup.md). The catalogue is imported (38 provinces / 514 regencies); see [regional delivery](../setup/REGION_REFERENCE_SETUP.md). The approved seven-fixture suspension is applied and verified; see [manifest, backup and operation evidence](../setup/FIXTURE_CLEANUP_SETUP.md).

## Delivery

- [Demo Data & Presentation](16_DEMO_PRESENTATION.md)
- [Development Roadmap](17_DEVELOPMENT_ROADMAP.md)
- [Risks & Future Backlog](18_RISKS_BACKLOG.md)
- [Decision Ledger & Historical Direction](19_DECISION_LEDGER.md)

## Source of truth policy

- Files are organized by context so a design change does not require editing an unrelated database document.
- `19_DECISION_LEDGER.md` records important product decisions and changes of direction.
- `02_MVP_SCOPE.md` is the authority for what is currently in/out of MVP.
- `13_UI_UX_DESIGN.md` is the authority for application interface design.
- `13A_BRAND_LOGO.md` is the authority for logo exploration and brand mark direction.
- [Archived master specification](99_ARCHIVE_MASTER_SPEC.md) is historical reference. Its original “Master source of truth” header does not override this index or the current modular documents. New changes belong in the modular files.

## Reading by task

| Task | Read first | Supporting documents |
| --- | --- | --- |
| Product scope | `02_MVP_SCOPE.md`, `19_DECISION_LEDGER.md` | `01_PRODUCT_VISION.md`, `18_RISKS_BACKLOG.md` |
| Schema and migrations | `04_DOMAIN_BUSINESS_RULES.md`, `10_DATA_MODEL_DATABASE.md` | `03_ROLES_RBAC_AUTH.md`, `05_ROUTE_SEAT_INVENTORY.md` |
| Seat holds and booking | `05_ROUTE_SEAT_INVENTORY.md`, `07_BOOKING_PAYMENT.md` | `04_DOMAIN_BUSINESS_RULES.md`, `10_DATA_MODEL_DATABASE.md`, `15_TESTING_NFR.md` |
| Payment and webhook | `07_BOOKING_PAYMENT.md` | `05_ROUTE_SEAT_INVENTORY.md`, `10_DATA_MODEL_DATABASE.md`, `14_SECURITY_RELIABILITY_OFFLINE.md` |
| Auth and tenant access | `03_ROLES_RBAC_AUTH.md` | `10_DATA_MODEL_DATABASE.md`, `14_SECURITY_RELIABILITY_OFFLINE.md`, `15_TESTING_NFR.md` |
| Crew, QR and manifest | `08_TICKET_QR_MANIFEST.md`, `09_END_TO_END_FLOWS.md` | `03_ROLES_RBAC_AUTH.md`, `04_DOMAIN_BUSINESS_RULES.md`, `13_UI_UX_DESIGN.md` |
| Fleet and seat builder | `06_FLEET_SEAT_TEMPLATE.md` | `10_DATA_MODEL_DATABASE.md`, `13_UI_UX_DESIGN.md` |
| UI or branding | `13_UI_UX_DESIGN.md`, `13A_BRAND_LOGO.md` | Relevant domain flow and `02_MVP_SCOPE.md` |
| Project setup | `11_API_PROJECT_STRUCTURE.md`, `12_TECH_STACK_ECOSYSTEM_SCALING.md` | `17_DEVELOPMENT_ROADMAP.md` |
| Demo and verification | `15_TESTING_NFR.md`, `16_DEMO_PRESENTATION.md` | Acceptance criteria in `02_MVP_SCOPE.md` |

## Handling differences

- Scope boundaries follow `02_MVP_SCOPE.md`; final decisions are recorded in `19_DECISION_LEDGER.md`.
- Within `13_UI_UX_DESIGN.md`, “Latest Design Direction” supplements and takes precedence over older design suggestions where they differ.
- Domain documents and schema describe intended behavior and a proposed model; the schema is not an implemented migration.
- Unresolved domain/schema differences must be recorded and resolved explicitly. Do not silently change a FINAL decision to match a missing schema field.
- [Documentation review](../analysis/SEATPAX_SPEC_REVIEW.md) records gaps and recommendations. Recommendations do not become product decisions until adopted in the relevant specifications and decision ledger.

## Local organization

[Tenant access design](../superpowers/specs/2026-10-07-tenant-access-design.md) and [implementation plan](../superpowers/plans/2026-10-07-tenant-access.md) were approved on7October2026. The initial three tables, server guards and seed tooling are integrated locally; development migration/database tests passed. The five approved internal accounts have been mapped and seeded persistently. See [tenant setup evidence](../setup/TENANT_ACCESS_SETUP.md).

[Adopted foundation design](../superpowers/specs/2026-10-06-foundation-design.md) refines the retained-flow contracts. It was adopted as D2026-10-06-02 and takes precedence over earlier technical proposals for retained flows.

[Day 2 setup implementation plan](../superpowers/plans/2026-10-06-day2-app-supabase-setup.md) defines app/environment/database/Supabase adapters. The user approved the written plan on 6 October 2026 and selected inline execution through executing-plans.

[30-day delivery calendar](../superpowers/plans/2026-10-05-seatpax-30-day-delivery.md) schedules the reduced release adopted on 6 October 2026 for 2–3 hours/day. Scope authority remains `02_MVP_SCOPE.md` and `19_DECISION_LEDGER.md`; foundation adoption and specification synchronization complete D01; local setup and Email OTP are integrated into main. Hosted database connectivity was verified; the user reported successful OTP login, refresh, and logout. See [setup evidence](../setup/SUPABASE_DEV_SETUP.md) for remaining verification limits.

Imported on 5 October 2026: 22 source Markdown files. The source folder `docs/seatpax_docs` was renamed to `docs/seatpax`. `14_BRAND_LOGO.md` was renamed to `13A_BRAND_LOGO.md` to group it beside UI/UX and remove duplicate `14` numbering without renumbering all engineering/delivery files.

Numbered section headings retain the original master section numbers for traceability. The master archive remains unchanged. Original file hashes are recorded in [import manifest](../analysis/SEATPAX_IMPORT_MANIFEST.json).

[Route/pricing design](../superpowers/specs/2026-10-07-route-pricing-design.md) and [plan](../superpowers/plans/2026-10-07-route-pricing.md) were approved on 7 October 2026. See [implementation evidence](../setup/ROUTE_PRICING_SETUP.md); Admin A browser create/quote/keyboard and cross-PO URL denial passed; actual phone and Admin B browser direction remain pending.

[Fleet/seat-template design](../superpowers/specs/2026-10-07-fleet-seat-template-design.md) and [plan](../superpowers/plans/2026-10-07-fleet-seat-template.md) were approved and implemented locally on 7 October 2026. Schema, guarded template/vehicle services and Admin PO forms are integrated. See [fleet setup evidence](../setup/FLEET_SETUP.md).

[Trip Engine design](../superpowers/specs/2026-10-07-trip-engine-design.md) and [implementation plan](../superpowers/plans/2026-10-07-trip-engine.md) were approved on 7 October 2026. The implemented slice creates revisioned drafts, atomically publishes immutable route/fare/schedule/layout snapshots with seat×segment inventory anchors, and manages assigned-crew read access. Availability, holds and sales are excluded. Verification and pending browser/build/integration checks are recorded in [Trip Engine setup evidence](../setup/TRIP_ENGINE_SETUP.md).

[Availability and seat hold setup](../setup/AVAILABILITY_HOLD_SETUP.md) records the implemented passenger search/selection and owner hold slice, database concurrency evidence, and browser limitations. Payment/booking conversion remains a subsequent slice.

[Snack claim design](../superpowers/specs/2026-10-09-snack-claim-design.md) and [plan](../superpowers/plans/2026-10-09-snack-claim.md) were approved on 9 October 2026. Explicit once-only handover after boarding is implemented; verification and manual acceptance are recorded in [snack setup evidence](../setup/SNACK_CLAIM_SETUP.md).

[Super Admin company controls](../setup/SUPER_ADMIN_COMPANY_SETUP.md) implement the approved minimum list and explicit activate/suspend slice; automated final verification and deferred manual acceptance are recorded there.

[Visual foundation and passenger redesign specification](../superpowers/specs/2026-10-09-passenger-visual-design.md) was approved on 9 October 2026. The [implementation plan](../superpowers/plans/2026-10-09-passenger-visual.md) is approved and passenger screens are implemented locally. [Visual setup evidence](../setup/PASSENGER_VISUAL_SETUP.md) records automated checks and deferred acceptance. Crew and Admin/Super Admin redesigns follow separately.

[Crew visual redesign specification](../superpowers/specs/2026-10-09-crew-visual-design.md) is approved and defines the dedicated Crew shell and phone-friendly operational screens. The [implementation plan](../superpowers/plans/2026-10-09-crew-visual.md) is approved and presentation is implemented locally. [Crew visual evidence](../setup/CREW_VISUAL_SETUP.md) records automated results, synthetic layout checks and deferred actual acceptance.

[Admin PO and Super Admin visual specification](../superpowers/specs/2026-10-09-admin-visual-design.md) was approved on 9 October 2026. The [implementation plan](../superpowers/plans/2026-10-09-admin-visual.md) is approved and presentation is implemented locally, preserving existing operations and company-control contracts. [Admin visual evidence](../setup/ADMIN_VISUAL_SETUP.md) records fresh automated checks, synthetic measurements and pending actual acceptance.

## SaaS restructuring discussion — 20 October 2026

Next billing slice: [Pro 30-day Sandbox billing draft awaiting review](../superpowers/specs/2026-10-20-pro-sandbox-billing-design.md). The user approved Sandbox-only initial billing plus a development time-advance facility. This draft proposes invoice/payment/version cutover, reminder capture and isolated billing clocks; those technical mechanisms await written-spec review and an implementation plan. Free code remains on its separate unmerged branch.

First technical slice: [approved PO onboarding and Free simulation specification](../superpowers/specs/2026-10-20-po-onboarding-free-simulation-design.md) and [implementation plan awaiting review](../superpowers/plans/2026-10-20-po-onboarding-free-simulation.md). The user approved the full spec after reset-cooldown clarification, including separate simulation tables, secondary limits and private preview. It is not delivered functionality; plan review/execution-method selection still precede implementation.

Read D2026-10-20-03 in `19_DECISION_LEDGER.md` and the [consolidated SaaS draft for review](../superpowers/specs/2026-10-20-shuttle-saas-design.md) before SaaS/onboarding/payment work. Adopted product decisions now include permanent bounded simulation-only Free, manually paid monthly Pro at Rp299,000 with 30 operationally eligible vehicles, seven-day grace, direct-to-PO ticket proceeds, and delayed mandatory benefit changes. The earlier 14-day trial was superseded. Exact billing/notice rules and other technical policies remain open in the draft. The current single-Sandbox-merchant implementation has not been converted; specifications and plans per subsystem still require review before implementation.


## Simple Helpdesk module - 25 October 2026

Approved single-company complaint module: [design](../superpowers/specs/2026-10-25-simple-helpdesk-design.md), [plan](../superpowers/plans/2026-10-25-simple-helpdesk.md), [setup/evidence](../setup/HELPDESK_SETUP.md). Guest submission and code lookup are distinct from booking tickets; one HELPDESK role handles reports. Email/private Storage provider acceptance is pending configuration.
