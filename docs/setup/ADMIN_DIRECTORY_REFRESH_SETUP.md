# Admin PO location directory refresh

Date: 15 October 2026. Scope: the user requested implementation of the Admin PO view from the interactive visual concept before continuing Crew mobile work.

## Changes

- White Admin sidebar, real company workspace link, Phosphor navigation icons, navy/blue active states and locally served Plus Jakarta Sans through `next/font` scoped to Admin.
- Rename the stops navigation/page to **Titik naik & turun**. Render the authenticated company's actual stops as a table with address, city and status; local name/city search, status filter and visible result count.
- Add/Edit opens a labelled native modal dialog. Reuse `MasterForm` and `runAdminAction`; keep existing server authorization, validation, nonactivation confirmation and refresh behavior. Errors remain in the open form. Prevent dismissing or resubmitting while a request is pending.
- Preserve other Admin destinations, responsive navigation, keyboard focus indicators, mobile form font sizes, empty/no-match states and original logo assets.

The concept's location-type column is omitted because the persisted stop contract has no type field. No Terminal/Pool classification is inferred from a name. The city field remains the existing validated text field. National city/terminal integration is separate work; no dummy locations are added or deleted here.

## Verification

- Initial `npm run typecheck`: exit 0.
- Initial `npm run lint`: exit 0.
- Initial production `npm run build`: exit 0.
- Focused independent code review: no actionable issues reported; no tests executed by reviewer.
- Final `npm run build`: exit 0, including TypeScript and all page generation, after the last source edits.
- Final `npm run lint`: exit 0 after the last source edits.
- No test suites were added or run: user previously deferred testing. Authenticated visual and save-flow acceptance remain pending.

The in-app browser's existing session could not open Demo PO A's location page (404 from current access handling). Access guards were retained. The user was given the existing-account login instructions for `johancocthird+admina@gmail.com`; no OTP, cookie or role was synthesized to obtain a screenshot.

## Preview

Run the application with its existing environment and trusted database CA. The current preview uses `http://localhost:3001`. Open `/admin` after logging in with an assigned Admin PO account, choose the company and open **Titik naik & turun**. Existing dummy/demo records remain recognizable as their original data.

Crew mobile specification remains awaiting approval; this UI request does not approve or implement it. Passenger visual concept changes are also not included in this Admin slice.
