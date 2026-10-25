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
