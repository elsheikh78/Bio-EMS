# ADR-023 — Customer read-only cloud monitoring

Status: Accepted scope by customer on 14 October 2026; deployment qualification pending.

## Requirement and acceptance

Customers see all their enrolled sites and rooms from desktop, Android and iOS, with
all enabled telemetries, recorded timestamps, explicit stale/offline states, alarm
colour/text, foreground sound and opt-in Web Push. Arabic RTL and English are
required. Viewer identities cannot mutate operational configuration or acknowledge
alarms. Customer A must never receive customer B's data or company privileges.

## Decision

Extend the existing company-cloud Worker/D1 deployment, not a second management
platform. Add distinct customer passwords, hashed credentials, revocable server-side
sessions and customer-scoped read endpoints. Only authenticated company operators
provision/revoke viewers. Existing company/owner authorization remains unchanged.
Local export is separately opt-in and restricted to the installer-authoritative
site from InstallationContextService. Never export other local sites, contacts,
credentials, owner sessions, or full historical telemetry. Each cloud enrollment
must be attached by the company to the matching customer and site. Multiple
installations under one cloud customer appear together.

The agent sends bounded latest-reading snapshots and recent alarm lifecycle records
over existing outbound HTTPS every 30 seconds when enabled. Existing local alarm
engine remains authoritative. Short recovered alarms remain visible in the 24-hour
feed; latest readings alone must never manufacture lifecycle alarms. No incoming
customer-PC ports are required. Cloud receipt time and individual sensor timestamps
both control freshness; failed telemetry queries do not produce healthy zeros.

Use a responsive PWA at /viewer/ with a scoped service worker: cache only public
shell assets, never customer API responses. Web Push uses VAPID and encrypted
payloads, durable per-subscription delivery records, retries and expired endpoint
cleanup. Notification text is deliberately generic on lock screens. Push endpoints
are HTTPS and limited to known browser push providers. No delivery guarantee is
claimed. Native store wrappers/publication are phase two; no APK/IPA is implied.

## Evidence boundaries

Source tests/builds are separate from deployed Cloudflare migration, VAPID setup,
installed Windows client upgrade, real Android/iOS notification acceptance and
App Store/Google Play accounts/review. Product version remains 0.20.0 until an
explicit release decision.
