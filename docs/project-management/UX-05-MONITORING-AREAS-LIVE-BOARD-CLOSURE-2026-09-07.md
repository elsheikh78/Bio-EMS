# UX-05 Monitoring Areas Live Board Closure — 7 September 2026

## Status

**COMPLETE / MERGED / CI VERIFIED**

Branch: `agent/ux-05-live-board`

This record closes UX-05 implementation, verification, CI and merge. It does not claim UX-06 customer-operation reconciliation, release, licensing, installer qualification, field commissioning or customer acceptance.

## Implemented Scope

- Added the protected `/live-board` route under the existing customer AppShell.
- Uses the existing `DASHBOARD_READ` permission and centralized route/return-path policy for ADMIN, OPERATOR and VIEWER access.
- Added Dashboard and persistent navigation entries with complete English/Arabic localization.
- Uses the authoritative Dashboard room-status contract; no backend endpoint, duplicate domain or frontend-generated operational record was introduced.
- Derives one display priority per card: Offline first, then Alarm from active Alarm/critical state, then Warning, otherwise Normal.
- Displays four accessible summary counts and one responsive card per Monitored Area.
- Cards show Site and area identity, temperature, relative humidity, state label, active Alarm count, communication state and last-update evidence where supplied.
- Added local Search, Site filter, Status filter and Comfortable/Compact grid density controls for larger fleets.
- Shows LIVE/automatic-update context and a manual whole-board refresh action.
- Preserves query polling fallback and AppShell authenticated SSE invalidation/reconnect/cleanup behavior.
- Provides explicit loading, error/retry, empty and no-filter-match states.
- Provides direct navigation back to detailed Monitored Areas configuration/evidence.
- Uses logical borders and responsive grids for Arabic RTL/English LTR and mobile/tablet/desktop layouts.

## Contract-Limited Omissions

Configured ranges, today min/max, signal strength, Sensor count and historical sparkline/trend are not present in the selected room-status contract. UX-05 therefore omits them rather than inferring or fabricating operational evidence. They require an approved contract extension before later implementation.

## Verification Evidence

Executed from `frontend/`:

- `npm run typecheck` — PASS.
- `npm run test:run` — PASS, 48 files and 288 tests.
- `npm run lint` — PASS with zero warnings.
- `npm run format:check` — PASS.
- `npm run build` — PASS.

- PR #167 — MERGED.
- CI #580 — PASS.
- Merge — `e989a516e6ab0f6566eb265aa623b4295ebc8404`.

Automated coverage verifies status priority, all four summary states, one card per area, trusted values/last update, local search filtering, loading/error states, navigation registry and safe Viewer return-path authorization.

## Non-Regression Boundaries

UX-05 does not alter ingestion, Alarm lifecycle, tenant isolation, API validation, authentication/session behavior, Monitored Areas configuration, notification delivery, reporting, commissioning or SYSTEM_OWNER boundaries.

## Controlled Next Step

Reconcile `main`, then start UX-06 High-Frequency Customer Operations Refresh.
