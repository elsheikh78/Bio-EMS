# BIO-EMS UI/UX Visual Design Freeze — 4 September 2026

## Purpose

This document records the detailed visual/product decisions approved during the 4 September 2026 BIO-EMS Work discussion. It supplements `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md` and exists so the approved visual direction is not reconstructed later from memory.

## Authority and Baseline

- Repository: `elsheikh78/Bio-EMS`.
- Authoritative branch: `main`.
- UI/UX documentation merge baseline at the time this freeze was prepared: `fef1e0508162407c53aba6cd618a2645cef5e5d7` — `Merge approved BIO-EMS UI/UX product refresh work package`.
- Earlier RTL technical baseline that must remain preserved: `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` — Arabic navigation drawer on the right and English navigation drawer on the left.
- Existing P0-P8 implementation/closure evidence remains authoritative and must not be rewritten by this design freeze.

## 1. Approved BIO-EMS Logo Direction

### Selected concept

The approved basis is **Logo Option 5** from the 4 September design discussion.

The selected concept is the **EMS monogram combined with a sensor/network-node motif**, intended to communicate environmental monitoring, connected sensing and a technical product identity rather than a generic medical or administrative symbol.

### Refinement decisions

- Keep the Option 5 concept as the brand basis; do not revert to the alternative logo concepts discussed earlier.
- Simplify the mark enough for software use, but do not simplify the `E`/monogram to the point that the BIO-EMS identity becomes ambiguous.
- The product name must read clearly as **BIO-EMS**.
- The master production logo must have a **transparent/background-independent** version.
- Do not bake a page background into the logo artwork.

### Required production variants

The implementation should prepare reusable brand assets suitable for:

- primary horizontal BIO-EMS lockup;
- compact icon/mark-only usage;
- light-surface version;
- dark-surface version;
- application header/navigation;
- opening/splash/login experience;
- reports and exported branded documents;
- favicon/application icon;
- Windows installer/setup/product packaging.

The visual identity must remain recognizable at both large hero size and small navigation/icon sizes.

### Rejected/non-selected directions

Other concepts discussed during exploration — including shield/pulse, isolated B/network concepts, circular-monitoring concepts, room-monitoring concepts and later alternative marks — remain **not selected**. They are not implementation targets unless a future explicit design decision replaces Option 5.

## 2. Theme Strategy

BIO-EMS will use a shared product theme system rather than unrelated decoration on each page.

### Default theme

- **Light theme is the default operating theme.**
- It should feel clean, professional, high-clarity and suitable for normal office, pharmaceutical and quality/operations use.

### Optional monitoring theme

- Provide an **optional dark theme** suitable for monitoring-room / low-light operational use.
- Dark mode is an alternate presentation of the same product information hierarchy, not a different feature set.
- Status meaning, Alarm severity, permissions, form errors and live values must remain equally clear in both themes.

### Theme implementation rules

- Theme behavior must be implemented through shared tokens/primitives/components.
- Avoid separate one-off color systems per screen.
- Both themes must support Arabic RTL and English LTR.
- Theme selection must never affect authorization, data visibility or Alarm logic.

## 3. Background and Surface Direction

The approved background direction is **calm and technical**, with subtle environmental-monitoring / sensor / pulse cues where useful.

- Do not use strong decorative backgrounds that compete with live values or Alarm information.
- Avoid placing a heavy independent background image on every screen.
- Prefer reusable surface hierarchy: application background -> section/panel -> card/tile -> actionable control.
- Decorative sensor/pulse/network treatments may be used mainly in opening/hero/entry areas or very restrained shell surfaces.
- Operational screens must prioritize readability, density and evidence over decoration.

## 4. Operational Status Visual Language

The design discussion established a stable status family that must remain recognizable across the product:

- **Green** — Normal / healthy state.
- **Yellow/Amber** — Warning / attention state.
- **Red** — Alarm / critical state.
- **Gray** — Unavailable / offline / no-current-data state where applicable.

Color alone is not sufficient. Cards, tables and alerts must also use text labels, icons, shape/border/state markers or equivalent non-color cues for accessibility and operational certainty.

These visual states must map to the existing BIO-EMS domain semantics; UI styling must not invent a second Alarm/state model.

## 5. Opening / Entry Experience

Add a professional BIO-EMS opening/entry surface using the approved Option 5 identity.

The opening experience should:

- establish the BIO-EMS brand immediately;
- use the refined transparent/background-independent logo correctly;
- work naturally in both light and dark visual contexts;
- transition cleanly to the relevant authentication/product surface;
- remain bilingual and RTL/LTR-safe;
- avoid exposing customer, Site, Alarm or SYSTEM_OWNER information before authorization.

This is a product-branding experience, not a replacement for the existing trust boundaries.

## 6. Dashboard Redesign

The Dashboard is to be redesigned as a **compact, professional, information-dense operational dashboard**.

Approved intent:

- show the main operational picture within one normal desktop viewport as far as practical;
- reduce wasted vertical space;
- make current status and exceptions more important than decorative content;
- retain live telemetry behavior and operational drill-down.

Priority information includes:

- overall monitoring/system state;
- active Alarm / Warning picture and actionable exceptions;
- monitored-area state;
- current/recent environmental readings;
- relevant device/communication health;
- concise KPIs and charts where they add operational value;
- direct navigation to deeper screens;
- a clear entry to the Monitoring Areas Live Board.

### Charts

Charts should be visually simpler and easier to read than dense decorative analytics. The goal is rapid operational interpretation, not dashboard ornamentation.

Do not regress authenticated event-driven refresh, reconnect/cleanup or polling fallback already present in Dashboard/Monitored Areas.

## 7. New Screen — Monitoring Areas Live Board

A new Dashboard-accessible screen is approved.

Working name: **Monitoring Areas Live Board**.

Its purpose is immediate at-a-glance live monitoring of all Monitored Areas without replacing the detailed Monitored Areas workflow.

Each Monitored Area should have a prominent live card/tile showing, where supported by current domain/API data:

- area/room identity;
- current relevant measurement(s);
- engineering unit;
- Normal / Warning / Alarm / Unavailable state;
- freshness / last-update / communication indication;
- clear non-color status cue.

The layout must:

- scale from the current pilot to larger Site fleets;
- use responsive grid/grouping/filtering rather than an uncontrolled vertical list;
- support Arabic/English and RTL/LTR as first-class behavior;
- use the existing domain `Site -> Monitored Area (Room) -> Sensor`;
- use existing trusted APIs rather than creating a duplicate monitoring backend;
- follow the same live update/reconnect/fallback behavior as Dashboard and Monitored Areas.

The Live Board is a monitoring surface, not a replacement for configuration, history, Alarm workflow, calibration or reporting.

## 8. Existing Screen Refresh Scope

The 4 September decision was not limited to the Dashboard. The complete frontend is to be reviewed and visually reconciled with the new identity/theme system.

This includes at minimum:

- authentication and entry screens;
- customer application shell/navigation;
- SYSTEM_OWNER shell/navigation;
- Dashboard;
- Monitored Areas;
- Alarms and acknowledgement;
- Devices / communication health;
- Configuration;
- Calibration;
- Notification recipients / escalation / delivery operations;
- Reporting Center and export surfaces;
- commissioning/productization screens still exposed to users;
- SYSTEM_OWNER customer/site/license/update/maintenance/support workflows;
- P8 installation provisioning/revision/receipt/commissioning/acceptance screens.

Every refreshed screen must preserve its domain semantics, permissions and current operational behavior.

## 9. Localization and Directionality

Arabic/English support is a hard regression gate for this redesign.

- Arabic: RTL layout with the navigation drawer on the **right**.
- English: LTR layout with the navigation drawer on the **left**.
- No new hard-coded English strings.
- Validate text alignment, icons, breadcrumbs, tables, charts, dialogs, drawers and forms in both directions.
- The design system must work in both languages instead of applying late page-specific RTL patches.

## 10. Implementation Intent Captured From the Work Discussion

The approved direction is intended to be **implemented in the repository**, not left as visual mockups or a documentation-only exercise.

The implementation work must therefore:

1. audit all frontend routes/components/styles and identify stale/duplicate visual code;
2. establish the approved brand assets and shared theme/design primitives;
3. implement the opening experience;
4. redesign Dashboard;
5. implement Monitoring Areas Live Board;
6. reconcile Monitored Areas and high-frequency operations;
7. reconcile remaining customer surfaces;
8. reconcile SYSTEM_OWNER and P8 workflows;
9. execute full responsive, localization, accessibility, auth/RBAC and live-refresh regression;
10. update project/release documentation only after real code is merged and verified.

## 11. Non-Regression Boundaries

The visual redesign must not casually alter:

- telemetry ingestion semantics;
- Alarm evaluation/lifecycle;
- tenant/customer isolation;
- SYSTEM_OWNER authentication boundary;
- RBAC authority;
- audit semantics;
- P8 installation receipt/acceptance semantics;
- reporting evidence contracts;
- provider secrets/live-provider evidence;
- existing email/Telegram/WhatsApp evidence status;
- hardware/commissioning/UAT acceptance claims.

Server authorization remains authoritative; hiding a frontend control is never an authorization mechanism.

## 12. Documentation Rule

This document records only the visual/product decisions that were actually identified as approved in the 4 September 2026 Work discussion and the existing repository work package. Any future visual choice that is merely explored must not be treated as approved until it is explicitly accepted and this design freeze (or its successor ADR/specification) is updated.

## Controlled Continuation

When UI/UX implementation resumes:

1. reconcile local Windows `main` with GitHub `main`;
2. read `PROJECT_STATE.md`;
3. read `IMPLEMENTATION_PLAN.md`;
4. read `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`;
5. read this Visual Design Freeze;
6. preserve the RTL baseline and existing P0-P8 evidence;
7. start with frontend inventory/design-system implementation rather than ad-hoc per-screen editing.
