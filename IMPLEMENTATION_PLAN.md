# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 5 September 2026.**

Historical P0-P8 software closure/evidence remains authoritative for completed scope. The approved UI/UX Product Refresh and Site-Bound Licensing architecture are later software scope and are **APPROVED / DOCUMENTED / NOT YET IMPLEMENTED**.

## Current Position

- P0-P7: completed/merged/CI verified according to existing closure records.
- P8-01 WhatsApp/Email source delivery: software complete; Email live evidence passed; WhatsApp live evidence remains externally blocked by Meta.
- P8-01A Telegram: source complete/merged/CI verified; live bot and end-to-end evidence remain open.
- P8-02 through P8-08: source complete/merged/CI verified.
- Global Arabic/English localization: complete/merged/CI verified.
- RTL navigation correction: merged on `main`; baseline `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- DEP-01 Full Offline Windows Installer: approved later scope; implementation/clean-machine qualification not yet claimed.
- UI/UX Product Refresh: approved on 4 September 2026; controlled work package: `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`.
- Site-Bound Licensing / Anti-Cloning: approved on 5 September 2026; architecture authority: `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.

## UI/UX Product Refresh — Approved Execution Plan

### UX-01 — Frontend Inventory and Non-Regression Baseline

Status: **COMPLETE / MERGED / CI VERIFIED**

- enumerate all customer, SYSTEM_OWNER and P8 routes/components/styles;
- identify duplicate/stale styling and legacy artifacts;
- capture current route/auth/RBAC/localization/live-refresh behavior before visual changes;
- verify Arabic drawer/right and English drawer/left baseline;
- preserve the existing `Site -> Monitored Area (Room) -> Sensor` domain.

Closure record: `docs/project-management/UX-01-FRONTEND-INVENTORY-BASELINE-2026-09-07.md`. PR #162 passed CI #567 and merged to `main` at `7a50338c153bf1388d8d28a7f3b2b3658bfd69ac`. The three approved visual-reference masters are present under `docs/assets/ui-ux/`.

### UX-02 — Brand and Shared Design System

Status: **COMPLETE / MERGED / CI VERIFIED**

- implement the selected BIO-EMS logo direction (design option 5) as reusable background-independent assets;
- establish typography, spacing, surface, card, navigation, control, status/severity, chart and responsive tokens/primitives;
- use reusable theme/surface treatment rather than unrelated heavy per-screen backgrounds;
- maintain operational contrast and non-color severity cues.

Implementation record: `docs/project-management/UX-02-BRAND-SHARED-DESIGN-SYSTEM-CLOSURE-2026-09-07.md`. Runtime code now contains background-independent horizontal and compact approved identity assets, shared light/dark palette and component primitives, persisted optional dark monitoring mode, localized theme controls and shell/navigation adoption. Frontend typecheck, 281 automated tests, lint, formatting and production build passed on `agent/ux-02-brand-theme`; PR #164 passed CI #571 and merged to `main` at `81ea4a9d91c862f31ad7d278914dcb34fa99d5c6`.

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

## Site-Bound Licensing / Anti-Cloning — Mandatory Production Gate

**Decision:** LIC-01 through LIC-13 are mandatory before a BIO-EMS Production Installer or any commercial/customer production deployment may be declared production-ready.

**Architecture authority:** `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`

**Status:** **APPROVED / DOCUMENTED / NOT YET IMPLEMENTED**

### Controlled sequence

- LIC-01 — Licensing domain/data model
- LIC-02 — Installation identity and protected key storage
- LIC-03 — Hardware fingerprint and tolerance policy
- LIC-04 — License certificate schema and cryptographic signing/verification
- LIC-05 — Activation API and Platform Owner workflow
- LIC-06 — Local runtime license validator
- LIC-07 — Site and gateway/device binding
- LIC-08 — Offline activation and offline/grace behavior
- LIC-09 — Transfer/reactivation/revocation workflows
- LIC-10 — Platform licensing dashboard and audit history
- LIC-11 — Installer integration
- LIC-12 — Anti-tamper/negative/security tests
- LIC-13 — Operational signing-key management, backup and recovery procedure

### Production-gate rule

The following are prohibited until LIC-01 through LIC-13 have implementation and test evidence sufficient for production use:

- declaring DEP-01 a final Production Installer;
- releasing a commercial reusable customer setup package;
- declaring a customer/site deployment production-ready;
- representing BIO-EMS as protected against unauthorized cross-PC/cross-site reuse.

Prototype, development, laboratory, UI/UAT and controlled pilot work may continue before this gate where explicitly identified as non-production and where licensing absence does not create a commercial deployment risk.

Commercial enforcement must not be designed to unexpectedly stop critical local telemetry collection or alarm generation solely because Internet connectivity is lost. Offline/grace and monitoring-continuity behavior must be validated under LIC-08/LIC-12.

## Delivery Ordering

1. Complete/stabilize the current UI/UX/P8/localization/notification work and its regression evidence.
2. Execute the Licensing Core: LIC-01 -> LIC-06.
3. Execute site/device governance and lifecycle: LIC-07 -> LIC-10.
4. Integrate licensing with DEP-01 and finish production protection: LIC-11 -> LIC-13.
5. Qualify the final Production Installer on clean machines only after the licensing production gate is satisfied.
6. Proceed to commercial/customer production deployment only after installer, licensing, deployment and applicable field/UAT gates are evidenced.

## Next-Session Start Procedure

1. Reconcile local Windows `main` with GitHub `origin/main`; confirm clean working tree.
2. Read `PROJECT_STATE.md`, this file, the UI/UX work package/visual freeze, and `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.
3. Continue the current UI/UX controlled sequence unless an explicit decision starts the licensing workstream earlier.
4. Preserve the rule that DEP-01 cannot become the final Production Installer before LIC-01 -> LIC-13 are complete and evidenced.
5. Keep Meta/Telegram/provider evidence, hardware, field commissioning/UAT/customer acceptance and licensing as separately evidenced tracks.

## Execution Rule

Repository completion, CI success, provider delivery, physical/bench evidence, licensing qualification, installer qualification, field commissioning, production deployment, UAT and customer acceptance are distinct gates. Documentation or UI polish must never be used to imply completion of an implementation or external evidence gate.
