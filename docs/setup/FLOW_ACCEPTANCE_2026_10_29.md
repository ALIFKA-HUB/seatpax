# Flow acceptance inventory — 29 October 2026

## Latest Helpdesk attempt — actual Windows browser, 29 October

The later Computer Use session reached the real application and supersedes the Helpdesk blockage below for the specific steps recorded here. It is **partial lifecycle acceptance**, not a full end-to-end pass.

Preconditions: the main checkout at `da433dd` was served on `http://localhost:3001`; the browser already had an authorized Helpdesk session. Testing used exactly one labelled simulation report and the previously user-approved test recipient. No booking, payment or unrelated report was changed.

The submission failure shown by the user was local configuration: the main checkout lacked four Helpdesk settings already present in the implementation worktree, and the server lacked the trusted database CA at startup. The missing settings were copied into ignored `.env.local`, with `HELPDESK_PUBLIC_ORIGIN=http://localhost:3001`; existing provider keys and the supplementation secret were preserved. The server restarted with `NODE_EXTRA_CA_CERTS` pointing to the existing local certificate. TLS verification was not disabled. `npm run db:check` then reported `Database connection OK`. No source change was necessary for this failure.

| Step | Expected / actually observed | Result |
| --- | --- | --- |
| Required form fields | Empty submission invokes required-field validation. | Observed through Chrome UI. |
| Guest submission | One clearly labelled simulated report is accepted and its complaint code is shown. | Observed for `Uji alur Helpdesk setelah perbaikan konfigurasi`, created at 23:35:31 WIB. No attachment or booking reference. Bearer lookup code is omitted from this public repository. |
| Public lookup and local history | Tracking displays the new report with initial waiting status, unset staff priority and browser-local recent code. | Observed through the real lookup UI; reporter contact data was absent. |
| Receipt notification | Persistence/provider acceptance remains distinct from inbox delivery. | Read-only query scoped to this case returned `ACCEPTED`, with no error code. User inbox confirmation is pending. |
| Staff dashboard and detail | New report appears in waiting queue and recent list; authorized detail displays the report and staff controls. | Observed through Chrome UI. |
| Staff priority | Set Rendah and save; the selector and case summary retain the saved priority. | Observed; history adds `Prioritas diperbarui`. |
| Start processing | Save the processing action with an explicitly simulated public note. | Observed: `Sedang diproses`; history adds `Mulai diproses` at 23:45:14 WIB. |
| Request information | Staff requests additional simulation context with a required explanation. | Observed: `Perlu dilengkapi`; history adds `Meminta kelengkapan` at 23:46:49 WIB. The new email initially displays `Sedang dikirim`; final provider/inbox outcome is not established here. |

Next prerequisite: the reporter opens the actual supplementation link from the received email. Do not retrieve or manufacture the editing capability from the database to substitute for inbox acceptance. Supplement submission, consumed-link replay, reprocessing, completion, completion inbox delivery and attachment UI remain unaccepted in this attempt. The existing authenticated session establishes only the tested staff actions, not fresh login or negative role authorization coverage.

No application source was edited for this browser run. This record does not establish physical-phone, Safari, attachment-download, duplicate-submit or whole-product acceptance. The historical attempt and other untested areas below are retained for traceability.

## Earlier blocked attempt

P02 and P10 are **blocked, not passed**. Computer Use initialized and returned a Chrome window. A read-only observation succeeded, but the active page changed between observations, indicating concurrent browser use. A separate-tab click returned `coordinate input geometry is unavailable`; no Seatpax page was reached, no report or email was created, and no product flow was exercised. Stopped browser input to avoid disrupting the other session. The earlier attempt separately stopped because its helper could not determine the browser URL safely; see [flow audit](../analysis/2026-10-29-computer-use-flow-audit.md). Neither tool issue establishes an application defect. Served worktree/revision and port 3001 were not established in this attempt.

Status meanings: **passed** means observed for the stated historical scope only; **blocked** means a prerequisite prevented the current attempt; **untested** means no current acceptance evidence. Historical automated, synthetic and provider evidence is not a current end-to-end pass.

| Area / expected outcome | Evidence and actual result | Current status / next prerequisite |
| --- | --- | --- |
| Customer landing, trip discovery and role destinations | No Seatpax UI reached in this attempt. | Blocked: stable exclusive browser session and confirmed local revision; inspect landing, search, login destinations and denied routes. |
| Customer SELF/OTHER, hold, Sandbox payment, ticket and QR | User screenshots on 8 October showed one Sandbox QRIS happy path, confirmed booking and ticket in My Tickets; see [checkout evidence](CHECKOUT_PAYMENT_SETUP.md). | Untested for current revision: bounded fixture and Sandbox callback; exercise both passenger types, pending/expiry/retry and conflict without real payment. |
| Admin setup and authorization | Historical synthetic layout measurements and older guarded checks are documented in [Admin visual evidence](ADMIN_VISUAL_SETUP.md); they are not a live administrative walkthrough. | Untested: authenticated roles and labelled fixtures; observe route, fleet, trip, read-only boundaries and cross-company denial. |
| Guest complaint submission, lookup and receipt | Historical 26 October report and public status were observed; provider accepted receipt and user confirmed inbox. Earlier guest HTTP and synthetic checks are described in [Helpdesk setup](HELPDESK_SETUP.md). | Current UI blocked. Historical receipt is a limited pass only, not a complete lifecycle. Verify validation and idempotency with at most the authorized synthetic report. |
| Helpdesk handling and completion | Existing report and authenticated list/detail were observed on 26 October. Full priority, information request, actual email link supplementation, processing, completion and public result were not accepted end to end. | Blocked: stable browser, authorized staff session and scoped test case. Confirm actual inbox delivery separately from provider acceptance; verify duplicate-submit behavior. |
| Private evidence | Historical Storage API check showed private bucket, successful test upload/download and anonymous denial. Actual authenticated browser download was intercepted by IDM expiry. | Untested in UI: authorized and unauthorized access and download, using synthetic files; avoid general storage cleanup. |
| Crew assigned trips, manifest, boarding and snack | Historical synthetic preview and automated checks do not establish real Crew or camera operation; see [Crew visual evidence](CREW_VISUAL_SETUP.md). | Untested: authorized assigned itinerary/ticket, role denial and actual phone/camera. Boarding and snack remain separate actions; verify retries do not duplicate. |
| Physical device and accessibility | Historical viewport simulations and selected keyboard measurements exist; these are not physical-device acceptance. | Untested: physical phone, camera, mobile Safari, native zoom, reduced motion and keyboard/screen-reader flows. |

Resume only when the browser can safely identify and control the intended local page, with an uncontested window and the serving revision verified. Record each subsequent flow's preconditions, steps, expected and observed results and evidence. Do not infer a product pass or failure from this tool blockage. No global mail queue drain, destructive cleanup, real payment or unapproved recipient is authorized by this inventory.
