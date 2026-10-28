# BIO-EMS UI/UX Product Refresh Work Package — 4 September 2026

## Purpose

This document freezes the product/UI decisions agreed on 4 September 2026 so the next implementation session can resume without reconstructing the discussion.

## Repository Baseline

- Authoritative branch before this documentation package: `main`.
- Last observed `main` commit before this work package: `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` — `Merge RTL navigation drawer correction`.
- That commit mirrors the desktop/mobile navigation drawer to the right in Arabic and retains left placement in English.
- Existing P0-P8 closure/evidence remains valid and must not be rewritten by this UI/UX package.

## Approved Product Identity Direction

- Product name remains **BIO-EMS**.
- Adopt the selected logo concept identified in the design discussion as **option 5** as the preferred visual direction.
- Production logo assets must be prepared without a baked-in background so they can work on light/dark/hero surfaces.
- Final implementation must preserve legibility at application-header, splash/login, report-branding, favicon/app-icon and installer scales.

## Approved Visual Direction

BIO-EMS should move from a functional administration UI to a coherent professional environmental-monitoring product surface.

The redesign must be:

- visually distinctive but operationally readable;
- suitable for pharmaceutical/GMP-facing use;
- consistent across SYSTEM_OWNER and customer surfaces while preserving their trust-boundary distinction;
- responsive and accessible;
- fully compatible with English LTR and Arabic RTL;
- theme-driven rather than implemented as unrelated per-page decoration.

Avoid visual effects that obscure Alarm severity, live readings, permissions, validation errors or audit/operational evidence.

## Global Design-System Scope

Create/reconcile a shared frontend visual system covering:

- product logo/brand marks;
- typography hierarchy;
- spacing/grid tokens;
- surface/background hierarchy;
- cards/panels;
- navigation shell;
- buttons/inputs/selectors;
- status and Alarm severity treatments;
- charts and KPI presentation;
- loading/empty/error states;
- modal/drawer/table/report-control presentation;
- responsive behavior;
- dark/light theme readiness where supported by the existing product architecture.

Background treatment must be implemented through reusable theme/surface primitives. Do not place heavy independent background images on every screen.

## Opening / Entry Experience

Add a professional BIO-EMS opening/entry experience using the approved product identity. It should establish the product brand immediately and transition cleanly into the appropriate authentication/product surface.

It must not weaken authentication boundaries or expose customer/SYSTEM_OWNER information before authorization.

## Dashboard Redesign

Redesign the operational Dashboard to be more compact, professional and information-dense, with the primary operating picture visible in one normal desktop viewport as far as practical.

The Dashboard should prioritize:

- current overall system/monitoring status;
- Alarm state and actionable exceptions;
- monitored-area health/status;
- recent/live environmental information;
- device/communication health where relevant;
- clear navigation to deeper operational screens;
- minimal wasted vertical space.

Existing telemetry-driven refresh behavior must be preserved or improved; the redesign must not regress authenticated event-driven refresh, reconnect/cleanup or polling fallback.

## New Monitoring Areas Live Board

Add a dedicated Dashboard-accessible screen for live Monitored Area measurements.

Working product name: **Monitoring Areas Live Board**.

Requirements:

- a clear Dashboard navigation/button entry;
- one prominent card/tile per Monitored Area;
- each card shows the current relevant measurement(s), unit, area identity, state/severity and freshness/communication indication where supported by existing APIs;
- cards must make Normal/Warning/Alarm/Unavailable conditions immediately distinguishable without relying on color alone;
- layout should scale from a small pilot to larger Site fleets through responsive grids/filtering/grouping rather than uncontrolled page length;
- Arabic/English and RTL/LTR must be first-class;
- data must use existing trusted API/domain contracts; do not invent a second Monitored Area backend domain. Existing domain remains `Site -> Monitored Area (Room) -> Sensor`;
- live update/reconnect/fallback behavior must be consistent with Dashboard/Monitored Areas.

## Monitored Areas Screen

Retain the existing Monitored Areas operational workflow, but visually reconcile it with the new design system and Live Board. The Live Board is an at-a-glance operating surface; it does not replace detailed configuration/history/operational workflows.

## Full Frontend Review

Review all frontend screens, not only the Dashboard. At minimum include:

- authentication and entry surfaces;
- customer application shell/navigation;
- SYSTEM_OWNER shell/navigation;
- Dashboard;
- Monitored Areas;
- Alarms and acknowledgement workflows;
- Devices/communication health;
- Configuration;
- Calibration;
- Notification recipients/escalation/delivery operations;
- Reporting Center and exports;
- Commissioning/productization surfaces that remain user-facing;
- SYSTEM_OWNER customer/site/license/update/maintenance/support workflows;
- installation provisioning/revision/receipt/commissioning/acceptance workflows introduced by P8.

For every surface verify visual consistency, responsive behavior, bilingual resources, RTL/LTR layout, permission-driven visibility, loading/empty/error states and action feedback.

## Localization Regression Requirement

The earlier observation that Arabic worked mainly on SYSTEM_OWNER while other areas were incomplete was addressed by the global localization correction merged previously. This refresh must treat localization as a regression gate, not assume visual redesign is safe.

Specifically verify:

- all customer and SYSTEM_OWNER routes in Arabic and English;
- navigation drawer right-side placement in Arabic and left-side placement in English, preserving baseline commit `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`;
- text alignment, icon direction, breadcrumbs, drawers, tables, charts and form controls under RTL;
- no hard-coded English strings introduced by the redesign.

## Non-Regression Boundaries

This package is frontend/product presentation scope unless a narrowly required API adapter is proven missing. Do not casually change:

- telemetry ingestion semantics;
- Alarm evaluation/lifecycle;
- tenant/customer isolation;
- SYSTEM_OWNER authentication boundary;
- RBAC authority;
- audit evidence semantics;
- P8 installation receipt/acceptance semantics;
- reporting evidence contracts;
- provider secrets or live-provider evidence.

Server authorization remains authoritative; frontend hiding is not authorization.

## Implementation Sequence

1. Audit the complete current frontend route/component inventory and identify legacy/stale styling.
2. Establish brand assets and reusable design tokens/primitives.
3. Rework global customer and SYSTEM_OWNER shells with bilingual/RTL regression tests.
4. Implement the opening/entry experience.
5. Redesign Dashboard.
6. Implement Monitoring Areas Live Board and Dashboard entry.
7. Reconcile Monitored Areas and high-frequency operational screens.
8. Reconcile remaining customer screens.
9. Reconcile SYSTEM_OWNER/P8 workflows.
10. Execute full frontend regression and accessibility/responsiveness/localization review.
11. Update screenshots/product docs only after the implementation is real.
12. Update VERSION/README/CHANGELOG/Release notes only according to the project's release/version policy and actual merged scope.

## Required Verification

Before closure, pass the repository's normal frontend gates and any affected backend gates, including at minimum:

- typecheck;
- build;
- lint;
- formatting;
- frontend automated tests;
- route/auth/RBAC regression;
- Arabic/English and RTL/LTR regression;
- Dashboard/Monitored Areas/Live Board live-refresh regression;
- export/report navigation regression where touched;
- responsive checks at representative desktop/tablet/mobile widths;
- accessibility sanity checks for keyboard focus, contrast and non-color status cues.

## Closure Evidence

Do not mark this package complete until implementation is merged and CI verified. Closure documentation must record exact PR, CI run/workflow and merge SHA, plus any screenshots/UAT evidence actually produced.

## Next Session Start Point

1. Reconcile local Windows working copy to GitHub `main`.
2. Confirm `git status` is clean.
3. Read `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, then this work package.
4. Confirm the RTL navigation baseline remains present.
5. Start with the frontend inventory/design-system audit before editing individual screens.

The live-provider, hardware, field commissioning, UAT and customer acceptance tracks remain separate and must not be inferred from UI completion.
