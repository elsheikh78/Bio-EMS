# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 4 September 2026.**

Historical P0-P8 software closure/evidence remains authoritative for completed scope. The newly approved UI/UX Product Refresh is later software scope and is **APPROVED / DOCUMENTED / NOT YET IMPLEMENTED**.

## Current Position

- P0-P7: completed/merged/CI verified according to existing closure records.
- P8-01 WhatsApp/Email source delivery: software complete; Email live evidence passed; WhatsApp live evidence remains externally blocked by Meta.
- P8-01A Telegram: source complete/merged/CI verified; live bot and end-to-end evidence remain open.
- P8-02 through P8-08: source complete/merged/CI verified.
- Global Arabic/English localization: complete/merged/CI verified.
- RTL navigation correction: merged on `main`; latest observed baseline before this work package is `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- DEP-01 Full Offline Windows Installer: approved later scope; implementation/clean-machine qualification not yet claimed.
- UI/UX Product Refresh: approved on 4 September 2026; controlled work package: `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`.

## UI/UX Product Refresh — Approved Execution Plan

### UX-01 — Frontend Inventory and Non-Regression Baseline

Status: **APPROVED / NOT STARTED**

- enumerate all customer, SYSTEM_OWNER and P8 routes/components/styles;
- identify duplicate/stale styling and legacy artifacts;
- capture current route/auth/RBAC/localization/live-refresh behavior before visual changes;
- verify Arabic drawer/right and English drawer/left baseline;
- preserve the existing `Site -> Monitored Area (Room) -> Sensor` domain.

### UX-02 — Brand and Shared Design System

Status: **APPROVED / NOT STARTED**

- implement the selected BIO-EMS logo direction (design option 5) as reusable background-independent assets;
- establish typography, spacing, surface, card, navigation, control, status/severity, chart and responsive tokens/primitives;
- use reusable theme/surface treatment rather than unrelated heavy per-screen backgrounds;
- maintain operational contrast and non-color severity cues.

### UX-03 — Opening / Entry Experience

Status: **APPROVED / NOT STARTED**

- professional BIO-EMS opening/entry experience;
- clean transition into customer or SYSTEM_OWNER authentication/product surfaces;
- no trust-boundary or pre-auth information leakage.

### UX-04 — Compact Operational Dashboard Redesign

Status: **APPROVED / NOT STARTED**

- redesign Dashboard for a compact, high-information normal desktop viewport;
- prioritize overall state, Alarm/actionable exceptions, monitored-area status, live environmental readings and relevant device health;
- preserve authenticated telemetry-driven refresh, reconnect/cleanup and polling fallback;
- provide a clear entry to the new Monitoring Areas Live Board.

### UX-05 — Monitoring Areas Live Board

Status: **APPROVED / NOT STARTED**

- add a dedicated Dashboard-accessible route/screen;
- one prominent live card/tile per Monitored Area;
- show current measurement(s), unit, area identity, state/severity and freshness/communication indication where supported;
- distinguish Normal/Warning/Alarm/Unavailable without color-only encoding;
- responsive grouping/filtering for larger fleets;
- first-class Arabic/English and RTL/LTR;
- use existing trusted APIs/domain contracts and consistent live update/reconnect/fallback behavior.

### UX-06 — High-Frequency Customer Operations Refresh

Status: **APPROVED / NOT STARTED**

Reconcile Monitored Areas, Alarms/acknowledgement, Devices/health, Configuration, Calibration, notifications/escalation/delivery operations and Reporting Center with the shared design system without changing their domain semantics.

### UX-07 — Remaining Customer Surface Refresh

Status: **APPROVED / NOT STARTED**

Reconcile remaining user-facing commissioning/productization/operational surfaces, including loading/empty/error/action states, responsive behavior and accessibility.

### UX-08 — SYSTEM_OWNER and P8 Workflow Refresh

Status: **APPROVED / NOT STARTED**

Reconcile SYSTEM_OWNER customer/site/license/update/maintenance/support and P8 installation provisioning/revision/receipt/commissioning/acceptance surfaces while preserving isolated platform authentication and tenant/RBAC boundaries.

### UX-09 — Full Regression and Closure

Status: **APPROVED / NOT STARTED**

Required gates include typecheck, build, lint, formatting, automated frontend tests, auth/RBAC/route regression, Arabic/English + RTL/LTR regression, Dashboard/Monitored Areas/Live Board live-refresh regression, responsive checks, accessibility sanity checks and affected export/report navigation regression.

Only after real implementation, PR, CI and merge evidence may this package be marked complete and reflected in release/version documentation.

## Next-Session Start Procedure

1. Reconcile local Windows `main` with GitHub `origin/main`; confirm clean working tree.
2. Read `PROJECT_STATE.md`, this file, then `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`.
3. Confirm baseline `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` RTL navigation behavior.
4. Execute UX-01 first; do not start by styling isolated pages.
5. Establish UX-02 shared brand/design primitives before Dashboard/screen redesign.
6. Proceed UX-03 -> UX-04 -> UX-05 -> UX-06 -> UX-07 -> UX-08 -> UX-09.
7. Keep Meta/Telegram/provider evidence, hardware, field commissioning/UAT/customer acceptance and DEP-01 as separate tracks unless explicitly being worked.

## Execution Rule

Repository completion, CI success, provider delivery, physical/bench evidence, field commissioning, production deployment, UAT and customer acceptance are distinct gates. UI polish must never be used to imply completion of an external evidence gate.
