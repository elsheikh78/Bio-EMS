# Company Cloud, Viewer and Mobile Applications

Reviewed candidate `d151b1f`, 28 October 2026. Current deployment/distribution status belongs in [PROJECT_STATE](../../PROJECT_STATE.md). Cloud source/build success is not a Worker deployment or mobile store release.

## Distinct products and identities

| Surface | Source | Identity and authority |
| --- | --- | --- |
| Company portal | `company-cloud/public/`, Worker/management | Company access key session; customer/site/license operations, queued controlled remote jobs and activity records |
| Customer Viewer/PWA | `company-cloud/public/viewer/`, `src/viewer.mjs` | Customer-scoped viewer password/session; read-only multi-site snapshot monitoring |
| Native customer monitor | `mobile/` | Separate Viewer bearer API/session; SecureStore and fixed HTTPS cloud origin; read-only monitoring |
| Company mobile shell | `company-mobile/` | Restricted WebView of company origin; inherits company portal identity and permissions |
| Local platform customer/owner | `backend/`, `frontend/` | Separate local authentication boundaries; not interchangeable with Viewer/company credentials |

Company auth uses HMAC-signed, Secure/HttpOnly/SameSite=Strict host cookie with 30-minute lifetime and configured ≥32-character admin/session secrets. Login has an IP/time-bucket limit. Company is a shared operator access-key model, not individual attributable company RBAC. Logout clears the browser cookie; there is no server-side per-session revocation for a copied company cookie (audit finding A04). Local platform owners have separate database-backed revocable sessions.

Viewer passwords use PBKDF2-SHA256 and random salts; session token hashes are stored in D1, scoped through active customer accounts. Password reset/disable revokes related Viewer sessions/subscriptions. Browser Viewer cookies and native bearer tokens are deliberately separate; native endpoints are read-only login/logout/overview. Same-origin mutation checks apply to browser paths. Mobile fetch restricts origin and redirects to avoid forwarding credentials to arbitrary locations.

## Data and delivery

Local export is independently opt-in and builds a bounded snapshot from the installed site under validated context. Worker checks payload/timestamps/schema and retains scoped current snapshots. Snapshot age and reading age are distinct freshness checks. Stale/offline presentation must not imply current normal readings. A disabled export or lost site agent cannot be fixed by refreshing the phone UI.

Viewer supports responsive Arabic/English, room/sensor/alarms, foreground sound and local silence. PWA Web Push uses subscriptions, VAPID configuration and durable deduplicated delivery/retry jobs. Browser/OS permissions, installation and network conditions remain acceptance dependencies. Customer native background remote push is **not implemented**; a foreground/local notification feature is not continuous remote alarm coverage. Explicitly test screen-locked/background scenarios before promising alert delivery.

Company remote jobs are queued, encrypted/validated and executed through the site-agent trust boundary; portal permission does not authorize arbitrary script execution. Activity manual date-range deletion is separate from operational telemetry retention; there is no newly approved automatic weekly archive policy in this audit.

## Build and controlled deployment

From `company-cloud`, `npm test`, `npm run build`, and Wrangler dry-run validate source/bundling. `wrangler.jsonc` defines Worker/assets/D1 bindings. Migrations `0001_company.sql` and `0002_viewer.sql` are schema inputs. Deploy/migrate only through the controlled environment with the correct secrets, backup and rollback plan. The audit ran no remote migration and no deployment.

Both Expo apps use independent 0.1.0 versions; typecheck/tests/all-platform export were verified. Export is not Android native compilation, iOS Xcode signing, IPA/TestFlight, store acceptance or device qualification. The earlier company Android pilot result remains a dated observation; no fresh native device acceptance was performed here.

Retained detailed guides: [company cloud](COMPANY-CLOUD-PILOT-AR.md), [Viewer](CUSTOMER-VIEWER-PORTAL-AR.md), [company mobile](COMPANY-MOBILE-APP-AR.md), [customer mobile](CUSTOMER-MOBILE-ANDROID-IOS.md). Their original deployment evidence must not be extended to a newer source tree automatically.
