# Local quick login for testing

The user authorized skipping the email OTP challenge for local testing. Open http://localhost:3001/login, choose a preset and press Masuk tanpa OTP. The page remains available to signed-in local testers so a different preset replaces the current browser session. These are existing real Supabase identities, not client-defined role claims.

| Preset | Email | Destination |
| --- | --- | --- |
| Customer | johancocthird@gmail.com | /trips |
| Admin PO A | johancocthird+admina@gmail.com | /admin |
| Helpdesk PO A | johancocthird+helpdesk@gmail.com | /helpdesk |
| Crew PO A | johancocthird+crewa@gmail.com | /crew |
| Super Admin | johancocthird+super@gmail.com | /super-admin/companies |
| Admin PO B (older fixture) | johancocthird+adminb@gmail.com | /admin |
| Crew PO B (older fixture) | johancocthird+crewb@gmail.com | /crew |

Other customer identities still exist; this table lists only the quick-login presets. No existing admin/crew membership was changed. The dedicated Helpdesk identity was newly provisioned confirmed, with only ACTIVE HELPDESK in Demo PO A. scripts/setup-dev-helpdesk.ts is guarded to the established development project, checks the company and preserves existing membership states. A repeat run verified idempotent behavior. Existing unconfirmed identities fail setup instead of being silently confirmed or granted membership.

## Boundary

DEV_QUICK_LOGIN=true in ignored local environment enables the feature only with NODE_ENV=development, the exact dev Supabase URL, and loopback host. The action also requires a matching Origin and a preset ID. Arbitrary emails, public hosts, unknown projects and production mode fail closed before privileged work. Turning the flag off restores the regular OTP page. Production always uses the regular flow even if the flag is accidentally set.

The server uses admin.generateLink without sending an email, then consumes its hash via the normal writable Supabase SSR client. The hash/key never reaches the form or action response. The result is an ordinary verified session; existing access guards still enforce fresh memberships/permissions. Customer return paths use the existing validated trips/holds path; internal accounts go to fixed role workspaces. No global Supabase email-verification setting was disabled.

## Verification

New guard/preset tests plus action tests cover production/origin rejection before privileged calls, arbitrary identity rejection, missing identities, private error sanitization and server-side token consumption. Existing OTP/identity/entry tests still pass. Full unit suite: 82 files /312 tests passed. TypeScript and scoped ESLint checked separately. Live browser verified real Customer/Admin PO A/Helpdesk sessions and redirects, Customer admin denial and reopening the switcher while signed in. Authentication cookies and token hashes were never printed or saved as artifacts. Generated development session login timestamps are expected test effects; no booking/payment/report was created.

Independent review checked the local boundary and existing-account provisioning. The suspected verifyOtp type mismatch was not reproduced: the current token_hash type=email call succeeded against live Supabase. An existing-unconfirmed-account preflight was added. Physical phone/public-host quick login is intentionally unavailable; normal authentication is retained there.
