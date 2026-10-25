# Landing section navigation

Implemented locally on codex/seatpax-landing, 25 October 2026.

## Scope

Eight permanent viewport-minimum section frames and native anchors. Hero stands alone with a search-section CTA. Search retains its asynchronous boundary. Desktop section navbar and compact native disclosure observe the current section. Selection, outside pointer, focus exit and Escape close the menu. Footer remains naturally sized. No dependency, database, authentication or booking changes.

## Verification

- TypeScript no-emit and scoped ESLint passed after the final navigation correction.
- Headless Chrome widths 1440, 1150, 1024, 768, 390 and 320 at height 950: hero ends and search starts at y=950; eight frames and no horizontal overflow.
- Compact menu exposes eight sections plus orders. Selection closes the menu; target top is 88px on a 390px viewport. Escape closes it.
- All eight sections update the active desktop anchor during document scrolling. Normal-motion scrolling settles at a 104px desktop offset.
- Native compact disclosure and anchor work without JavaScript. At 390x600 there is no horizontal overflow or clipped section container.
- Catalogue retains its regular passenger nav and has no landing section nav.
- Desktop hero/search and phone menu screenshots visually inspected. Fixed inherited mobile bottom positioning that initially collapsed the menu, and stale intersection geometry that initially selected the previous section.
- Independent source review completed. Focus-exit issue fixed; header sizing verified against browser measurements.

Screenshots in the task visualization directory: section-hero-final-1440.png, section-search-final.png and section-menu-mobile.png.

Physical phone/tablet and Safari acceptance remain pending. No production build or test suite was run for this layout refinement. No merge or push.


## Follow-up correction

User requested restoring the hero/search composition and consolidating the first four menu entries. Search is now inside the hero frame with an 80px desktop/tablet overlap and 56px phone overlap. Five navbar entries remain; featured trips and seat illustration resolve to the Beranda active link. The cari-perjalanan anchor remains for existing links.

Fresh no-emit TypeScript and scoped ESLint passed. Chrome inspections at widths 1440, 1024, 390 and 320 confirmed no horizontal overflow, five section links and restored overlap. Scrolling to featured trips or seat illustration selects Beranda; scrolling to Cara pesan selects its own entry. Desktop and phone screenshots were inspected: hero-search-restored-1440.png and hero-search-restored-390.png. Earlier eight-link and standalone-search measurements above describe the superseded version.


## Landing interaction corrections - 25 October 2026

Root causes reproduced in real Chrome: the active nav immediately changed on click but IntersectionObserver overwrote it with intermediate sections during smooth scroll; the deck used field width <640px as a phone test, although the desktop animation column can also be below640px, and intentionally expanded vertically. The deck also required clicks and exposed replay/captions.

Fixed: click destination stays selected until scrollend, user wheel/touch/scroll keys release it, manual scrolling follows the section beneath the header. Deck uses viewport phone breakpoint767px, fixed field height, automatic12s loop with a horizontal desktop spread and stacked-only phone choreography; card click accelerates the current loop2.5x. External controls/notes removed. Complaint link is an accessible icon-only chat glyph and still opens the form. No provider/DB/auth changes.

Verification: regression reproduced failing icon-only, removed-caption, stable-click-nav and automatic-deck checks before edits. `tests/browser/landing-interactions.mjs` passes14 real-Chrome checks at1440px and390px: all navbar destinations, auto start, click acceleration, horizontal spread, repeating loop, phone stack/no overflow, reduced motion. Run with a local server and an available Playwright installation (`PLAYWRIGHT_MODULE` can identify a host-provided module; default is playwright). `SEATPAX_TEST_URL` optionally overrides localhost3001. TypeScript and scoped ESLint passed; full unit suite80 files /304 tests passed. Desktop/phone screenshots visually inspected. Physical phone/Safari remain untested.
