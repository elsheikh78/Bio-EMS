# UX-03 Opening / Entry Experience Closure — 7 September 2026

## Status

**IMPLEMENTED / BRANCH VERIFIED / AWAITING PR MERGE**

Branch: `agent/ux-03-opening-entry`

This record closes UX-03 implementation and local verification only. It does not claim UX-04 Dashboard redesign, UX-05 Monitoring Areas Live Board, later surface reconciliation, merge, CI, release, licensing, installer qualification or customer acceptance.

## Implemented Scope

- Implemented a real responsive opening experience from the approved visual composition rather than embedding the supplied screenshot.
- Uses the approved transparent BIO-EMS identity from UX-02 on a deep navy technical surface with restrained network and monitoring-wave cues.
- Localized all visible startup content in English and Arabic through the existing localization contract.
- Preserved the logo geometry under RTL; only layout/text direction follows localization.
- Added a short 900 ms startup transition that runs once per browser tab and does not impose repeat navigation delays.
- Added safe fallback behavior when session storage is unavailable.
- Enforced a child-mount boundary: authentication, routing and protected product surfaces are not mounted behind the opening screen.
- Avoided customer, Site, Alarm, SYSTEM_OWNER or other protected data in the opening content.
- Used a semantic status region and labeled progress indicator for assistive technology.
- Inherited the global reduced-motion rule and used no blocking decorative animation.

## Verification Evidence

Executed from `frontend/`:

- `npm run typecheck` — PASS.
- `npm run test:run` — PASS, 47 files and 283 tests.
- `npm run lint` — PASS with zero warnings.
- `npm run format:check` — PASS.
- `npm run build` — PASS.

The tests explicitly prove that protected child content is absent while the opening screen is active, Arabic copy is rendered, completion is persisted per tab and later mounts are not delayed.

## Non-Regression Boundaries

UX-03 changes application entry presentation only. It does not change route decisions, session verification, customer or SYSTEM_OWNER authentication, RBAC, tenant isolation, telemetry, Alarm lifecycle, notifications, reporting, commissioning or installation semantics.

## Controlled Next Step

1. Publish `agent/ux-03-opening-entry` and open its pull request against `main`.
2. Require CI success, merge and record the PR/CI/merge SHA.
3. Reconcile `main`, then start UX-04 Compact Operational Dashboard Redesign.
