# Approved landing screen sections

The user requested one full screen per landing section, a hero separated from search, and navbar navigation between sections, then confirmed a single scrollable landing page with "yup". This is layout/navigation work, not new page routes.

## Approach

Use minimum viewport-height section frames and native anchor navigation. Keep normal document scrolling; no mandatory scroll snap, wheel interception or internal scrolling. Desktop frames fill the visible viewport below the sticky header. Phone/tablet frames can grow with their content, especially the final three-card stack. The hero retains its photo, typography and rounded composition, with the search panel in the next frame rather than overlapping.

Keep eight existing content blocks in order: Beranda (`beranda`), Cari jadwal (`cari-perjalanan`), Perjalanan (`pilihan-perjalanan`), Pilih kursi (`pilih-kursi`), Cara pesan (`cara-memesan`), Persiapan (`persiapan`), Pemesanan (`alur-pemesanan`) and Bantuan (`bantuan`). Short navbar labels are an implementation choice; all eight sections remain directly reachable. Footer and photo credits remain short closing content, not empty full-screen frames.

The landing header alone receives section links and a current-section blue text/underline indicator. Wide layouts use a link row, narrow layouts use a native disclosure menu. Preserve order/account access. Booking pages retain their existing navigation and mobile bottom bar. The landing uses a sticky top header without the old booking bottom bar. Preserve working legacy heading anchors.

Use native smooth anchor scrolling under normal motion and immediate scrolling under reduced motion. Use IntersectionObserver for active section; close the mobile disclosure on link selection, outside click, Escape or focus leaving it. Anchor targets clear the sticky header. No JavaScript still allows the native menu and anchors to work. Keep the one-time seat animation, interactive cards, old route animation, demo trip labels, search fields/query contract and auth services unchanged.

## Verification boundary

Typecheck, scoped lint and local Chromium layout/interaction inspection. No automated test suite is added/run without a request. Physical device and Safari acceptance remain separate.
