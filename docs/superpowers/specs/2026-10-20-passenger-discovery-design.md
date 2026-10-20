# Passenger discovery refresh

Status: visual direction approved in conversation on 20 October 2026; implementation plan approved and implemented locally. This records the approved preview with the user's final correction: remove the decorative bus illustration.

## Approved experience

- Passenger navigation: **Perjalanan**, **Pesanan saya**, **Akun**. Desktop/tablet use top navigation; phones use bottom navigation with safe-area clearance.
- Perjalanan immediately shows actual trips without requiring a search first. Origin, destination and date search narrow the list. Filter is a button opening a dialog on desktop/tablet and a bottom sheet on phones.
- Keep the Seatpax logo and light palette: ink `#0a2144`, primary `#005bd1`, hover `#0049aa`, canvas `#f5f7fa`, muted `#526078`, border `#d5dfea`, control `#7d8fa8`, white surfaces and light-blue `#edf4ff` header.
- Compact header: a personal greeting only when an actual profile name is available, “Perjalanan berikutnya ke mana?”, and “Pilih perjalanan yang cocok untuk Anda.” Search sits in a white surface within this header.
- No bus illustration, replacement stock image, reserved illustration column or oversized empty hero. Preserve the approved compact composition on phones.
- Real trip cards show operator, class, route, departure, actual arrival when available, fare, remaining seats and **Pilih kursi**. Never invent arrival times, duration, amenities, ratings or counts.
- Sort by departure or price. Filter by actual service-class names and maximum fare; provide apply/reset and a clear filtered-empty state.
- Responsive at phone, tablet and desktop sizes; keyboard controls, visible focus, labelled fields and dialog focus restoration are required.

## Entry flow

After ordinary login, passengers land on `/trips`; internal users land in their existing authorized work area. Preserve explicit validated journey/hold return paths. Multiple work-role destinations require a workspace choice rather than an arbitrary priority. This is navigation convenience; existing server authorization remains authoritative.

## Scope boundary

Implement discovery, shared passenger navigation and entry routing. The **Pesanan saya** label initially points to the existing `/tickets` page; a combined pending-payment/history experience and the detailed Akun redesign remain separate discussions. Do not claim those tab contents have been redesigned. Native Crew clients, Admin redesign, geographic directories, payment rules and inventory mutation rules are outside this change.

## Technical defaults adopted with plan approval

The preview does not establish a discovery date window or pagination policy. The accompanying plan proposes the existing WIB date selection (default today), full first-to-last route discovery when both locations are blank, and at most 50 candidate trips per day. Both locations must be selected together for interval search; a partial pair displays a field error while retaining discovery results. The UI describes the selected date and any candidate limit honestly. The user adopted these explicit defaults by approving the implementation plan on 20 October 2026.

Reference: approved interactive preview `C:/Users/ASUS/.codex/visualizations/2026/10/05/01a10c3f-c9b9-7ef1-9162-9c919ff61ab4/seatpax-perjalanan-preview.html`; its fixtures and decorative bus must not be copied into production.
