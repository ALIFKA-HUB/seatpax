# Seatpax Documentation Index

Seatpax documentation is intentionally modular: **one context = one Markdown file**. Use this file as the entry point.

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

[30-day delivery calendar](../superpowers/plans/2026-10-05-seatpax-30-day-delivery.md) proposes a reduced release for 2–3 hours/day, starting 6 October 2026. It is a planning proposal; it does not override MVP scope or adopt its proposed deferrals.

Imported on 5 October 2026: 22 source Markdown files. The source folder `docs/seatpax_docs` was renamed to `docs/seatpax`. `14_BRAND_LOGO.md` was renamed to `13A_BRAND_LOGO.md` to group it beside UI/UX and remove duplicate `14` numbering without renumbering all engineering/delivery files.

Numbered section headings retain the original master section numbers for traceability. The master archive remains unchanged. Original file hashes are recorded in [import manifest](../analysis/SEATPAX_IMPORT_MANIFEST.json).
