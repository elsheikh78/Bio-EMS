# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 5 September 2026.**

Historical P0-P8 software closure/evidence remains authoritative for completed scope. The UI/UX Product Refresh and Site-Bound Licensing LIC-01 through LIC-13 are complete/merged/CI verified. DEP-01 implementation and clean-machine qualification remain open.

## Current Position

- P0-P7: completed/merged/CI verified according to existing closure records.
- P8-01 WhatsApp/Email source delivery: software complete; Email live evidence passed; WhatsApp live evidence remains externally blocked by Meta.
- P8-01A Telegram: source complete/merged/CI verified; live bot and end-to-end evidence remain open.
- P8-02 through P8-08: source complete/merged/CI verified.
- Global Arabic/English localization: complete/merged/CI verified.
- RTL navigation correction: merged on `main`; baseline `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- DEP-01 Full Offline Windows Installer: DEP-01-01 foundation complete/merged/CI verified through PR #177 and CI #609; DEP-01-02 exact-input freeze and deterministic staging/build source is next. Setup build and clean-machine qualification are not yet claimed.
- UI/UX Product Refresh: complete/merged/CI verified; controlled work package: `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`.
- Site-Bound Licensing / Anti-Cloning: LIC-01 through LIC-13 complete/merged/CI verified. Architecture authority: `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.

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

Status: **COMPLETE / MERGED / CI VERIFIED**

- professional BIO-EMS opening/entry experience;
- clean transition into customer or SYSTEM_OWNER authentication/product surfaces;
- no trust-boundary or pre-auth information leakage.

Implementation record: `docs/project-management/UX-03-OPENING-ENTRY-EXPERIENCE-CLOSURE-2026-09-07.md`. The responsive opening experience uses the approved production identity and dark technical composition, localized startup copy, reduced startup delay, per-tab completion persistence and a hard child-mount boundary so authentication/product flows are not mounted behind the opening screen. Frontend typecheck, 283 automated tests, lint, formatting and production build passed on `agent/ux-03-opening-entry`; PR #165 passed CI #574 and merged to `main` at `6a46ad24e49ae219d4ebb8c6e4289856febe6f36`.

### UX-04 — Compact Operational Dashboard Redesign

Status: **COMPLETE / MERGED / CI VERIFIED**

- redesign Dashboard for a compact, high-information normal desktop viewport;
- prioritize overall state, Alarm/actionable exceptions, monitored-area status, live environmental readings and relevant device health;
- preserve authenticated telemetry-driven refresh, reconnect/cleanup and polling fallback;
- provide a clear entry to the new Monitoring Areas Live Board.

Implementation record: `docs/project-management/UX-04-COMPACT-OPERATIONAL-DASHBOARD-CLOSURE-2026-09-07.md`. The Dashboard now provides a compact exception-first command surface, six condensed KPI cards, smaller current-reading and priority-area panels, shared-theme surfaces, bilingual copy and preserved detailed evidence sections. The current action safely opens Monitored Areas; UX-05 will retarget it to the dedicated Live Board only when that route exists. Frontend typecheck, 284 automated tests, lint, formatting and production build passed on `agent/ux-04-compact-dashboard`; PR #166 passed CI #577 and merged to `main` at `8f82c4e3a72064bc719c58feec4cf382393efd08`.

### UX-05 — Monitoring Areas Live Board

Status: **COMPLETE / MERGED / CI VERIFIED**

- add a dedicated Dashboard-accessible route/screen;
- one prominent live card/tile per Monitored Area;
- show current measurement(s), unit, area identity, state/severity and freshness/communication indication where supported;
- distinguish Normal/Warning/Alarm/Unavailable without color-only encoding;
- responsive grouping/filtering for larger fleets;
- first-class Arabic/English and RTL/LTR;
- use existing trusted APIs/domain contracts and consistent live update/reconnect/fallback behavior.

Implementation record: `docs/project-management/UX-05-MONITORING-AREAS-LIVE-BOARD-CLOSURE-2026-09-07.md`. A protected `/live-board` route now uses the authoritative Dashboard room-status contract, existing polling and AppShell SSE invalidation to render summary counts and one responsive card per Monitored Area. Search, Site/status filtering and grid density are local presentation controls; unsupported ranges/min-max/trends are intentionally omitted. Frontend typecheck, 288 automated tests, lint, formatting and production build passed on `agent/ux-05-live-board`; PR #167 passed CI #580 and merged to `main` at `e989a516e6ab0f6566eb265aa623b4295ebc8404`.

### UX-06 — High-Frequency Customer Operations Refresh

Status: **COMPLETE / MERGED / CI VERIFIED**
Reconcile Monitored Areas, Alarms/acknowledgement, Devices/health, Configuration, Calibration, notifications/escalation/delivery operations and Reporting Center with the shared design system without changing their domain semantics.

Implementation record: `docs/project-management/UX-06-HIGH-FREQUENCY-OPERATIONS-REFRESH-CLOSURE-2026-09-07.md`. The high-frequency operational review adds compact lifecycle summaries, responsive control surfaces, logical RTL-safe severity borders and preserved action/error behavior to Alarms, Monitored Areas, Devices and Notification Delivery. Configuration, Calibration, recipient/escalation operations and Reporting Center were reviewed against the shared theme and retained where already reconciled. No API, RBAC, tenant, Alarm lifecycle, calibration or reporting semantics changed. PR #168 passed CI #583 and merged to `main` at `b05181e0e89f8b3c97d24daac3a643d5f4be0c55`.

### UX-07 — Remaining Customer Surface Refresh

Status: **COMPLETE / MERGED / CI VERIFIED**
Reconcile remaining user-facing commissioning/productization/operational surfaces, including loading/empty/error/action states, responsive behavior and accessibility.

Implementation record: `docs/project-management/UX-07-REMAINING-CUSTOMER-SURFACES-CLOSURE-2026-09-07.md`. The operational workspace now exposes the complete permission-filtered customer workflow set without stale readiness claims. Commissioning adds explicit loading/empty states, responsive readiness summaries and an overflow-safe evidence table. User administration controls and access/error surfaces are responsive and keyboard-focus aware. Frontend typecheck, 51 test files/292 tests, lint, formatting and production build passed on `agent/ux-07-customer-surfaces`; PR #169 passed CI #586 and merged to `main` at `92449009e726d36b630179178cbd80d32db258ea`.

### UX-08 — SYSTEM_OWNER and P8 Workflow Refresh

Status: **COMPLETE / MERGED / CI VERIFIED**
Reconcile SYSTEM_OWNER customer/site/license/update/maintenance/support and P8 installation provisioning/revision/receipt/commissioning/acceptance surfaces while preserving isolated platform authentication and tenant/RBAC boundaries.

Implementation record: `docs/project-management/UX-08-SYSTEM-OWNER-P8-WORKFLOW-REFRESH-CLOSURE-2026-09-07.md`. SYSTEM_OWNER login and console now use approved identity/accessibility and responsive shell treatment. Customer fleet, commercial operations and installation lifecycle screens gain responsive controls/tables, explicit lifecycle loading/error/empty states, and authoritative installation summaries while preserving isolated platform authentication and P8 domain gates. Frontend typecheck, 51 test files/292 tests, lint, formatting and production build passed on `agent/ux-08-system-owner-p8`; PR #170 passed CI #589 and merged to `main` at `adce8acca13cfb2e82467c39ed5f6dbb4d7567af`.

### UX-09 — Full Regression and Closure

Status: **COMPLETE / MERGED / CI VERIFIED**
Required gates include typecheck, build, lint, formatting, automated frontend tests, auth/RBAC/route regression, Arabic/English + RTL/LTR regression, Dashboard/Monitored Areas/Live Board live-refresh regression, responsive checks, accessibility sanity checks and affected export/report navigation regression.

Only after real implementation, PR, CI and merge evidence may this package be marked complete and reflected in release/version documentation.

Regression record: `docs/project-management/UX-09-FULL-REGRESSION-CLOSURE-2026-09-07.md`. Backend typecheck/build/lint/format and 106 test files/755 tests passed. Frontend typecheck/lint/format, 51 test files/292 tests and production build passed. The automated total is 157 files/1,047 tests. Auth/RBAC/routes, localization/RTL, live refresh, responsive/accessibility behavior and reporting contracts are represented by the controlled suites. PR #171 passed CI #592 and merged to `main` at `eaa8a99bd2acf1b283c280eec4d54b09f789cd2f`. Version `0.20.0` was prepared through PR #172 / CI #594 and published as tag/Release `v0.20.0` from `e50593ddfda7acd3996d11d1de53c86821cb6c83` after explicit Owner approval.

## Site-Bound Licensing / Anti-Cloning — Mandatory Production Gate

**Decision:** LIC-01 through LIC-13 are mandatory before a BIO-EMS Production Installer or any commercial/customer production deployment may be declared production-ready.

**Architecture authority:** `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`

**Status:** **LIC-01 THROUGH LIC-13 COMPLETE / MERGED / CI VERIFIED / DEP-01 NEXT**

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
4. Use the completed LIC-11 contract in DEP-01 implementation and qualification.
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
