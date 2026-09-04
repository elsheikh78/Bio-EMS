# BIO-EMS UI/UX Visual Design Freeze — 4 September 2026

## Purpose

This document records the detailed visual/product decisions approved during the 4 September 2026 BIO-EMS Work discussion. It supplements `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md` and exists so the approved visual direction is not reconstructed later from memory.

## Authority and Baseline

- Repository: `elsheikh78/Bio-EMS`.
- Authoritative branch: `main`.
- UI/UX documentation merge baseline: `fef1e0508162407c53aba6cd618a2645cef5e5d7` — `Merge approved BIO-EMS UI/UX product refresh work package`.
- Earlier RTL technical baseline that must remain preserved: `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` — Arabic navigation drawer on the right and English navigation drawer on the left.
- Existing P0-P8 implementation/closure evidence remains authoritative and must not be rewritten by this design freeze.

## Approved Visual Reference Set — FINAL

Three visual references supplied and explicitly confirmed by the product owner on 4 September 2026 are now the implementation references. They are not exploratory mockups.

1. **Final BIO-EMS logo artwork** — supplied PNG, 1536×656, SHA-256 `2c6b823909ecc7dc331d705f71acd1ee02575951fb198e25f218c2b4f8a59fa1`.
2. **Final approved opening/splash screen** — supplied PNG, 1536×864, SHA-256 `152e567cf02e6f417ce6c113811fabeed3ca5de079a7bb69f6c982557bc0d4f7`.
3. **Approved Live Monitoring Wall visual reference** — supplied PNG, 1536×864, SHA-256 `3ca13d50dd2ad5c77b90d4df0643b161a925065ae2978945fb44721441f630cc`.

The binary reference images were supplied in the Work/chat discussion. Their hashes and dimensions are recorded here to prevent later substitution or reinterpretation. When implementation begins, production assets should be derived from these approved references and checked against these hashes/reference visuals. If the repository later stores the binary masters, their repository paths must be added to this document.

## 1. Final Approved BIO-EMS Logo

The supplied logo image is the **FINAL APPROVED ARTWORK**, refined from Option 5. Option 5 is no longer merely a conceptual direction.

The approved composition contains:

- the EMS monogram integrated with a circular environmental-monitoring/sensor-network motif;
- connected node details around the EMS mark;
- a blue/cyan/teal technical gradient family with a small green node accent;
- the horizontal `BIO-EMS` wordmark to the right of the symbol;
- a clean, modern environmental-monitoring identity suitable for software and operational use.

### Implementation lock

- Do **not** redesign, reinterpret or replace the mark during frontend implementation.
- Preserve the approved geometry, proportions, node/circuit concept, wordmark relationship and visual character.
- Technical adaptation is allowed only to create production-quality assets for different sizes/backgrounds.
- The product name must remain **BIO-EMS**.
- Prepare a genuinely transparent/background-independent master asset; the checkerboard-like transparency preview visible in the supplied reference is not part of the artwork.

### Required production variants

Prepare reusable assets for:

- primary horizontal BIO-EMS lockup;
- compact mark-only/icon usage;
- light-surface version;
- dark-surface version;
- application header/navigation;
- opening/splash/login experience;
- reports and exported branded documents;
- favicon/application icon;
- Windows installer/setup/product packaging.

The identity must remain recognizable at large hero size and small navigation/icon sizes.

Other earlier logo concepts are **not selected** and are not implementation targets unless a future explicit approved design decision supersedes this freeze.

## 2. Theme Strategy

BIO-EMS will use a shared product theme system rather than unrelated decoration on each page.

- **Light theme is the default operating theme** for normal office, pharmaceutical and quality/operations use.
- Provide an **optional dark theme** suitable for monitoring-room / low-light operational use.
- Dark mode is an alternate presentation of the same information hierarchy, not a different feature set.
- Status meaning, Alarm severity, permissions, form errors and live values must remain equally clear in both themes.
- Theme behavior must use shared tokens/primitives/components, support Arabic RTL and English LTR, and never affect authorization/data semantics.

## 3. Background and Surface Direction

The approved background direction is calm, technical and environmental-monitoring oriented.

- Use subtle sensor/network/pulse cues where useful.
- Do not use strong decoration that competes with live values or Alarm information.
- Avoid heavy independent background images on every screen.
- Prefer reusable hierarchy: application background -> section/panel -> card/tile -> actionable control.
- Decorative sensor/pulse/network treatments belong mainly in opening/hero areas or restrained shell surfaces.
- Operational screens prioritize readability, density and evidence.

## 4. Operational Status Visual Language

Use a stable status family across the product:

- **Green** — Normal / healthy.
- **Yellow/Amber** — Warning / attention.
- **Red** — Alarm / critical.
- **Gray** — Unavailable / offline / no-current-data where applicable.

Color alone is insufficient. Use text labels, icons, borders/state markers or equivalent non-color cues. Styling must map to the existing BIO-EMS Alarm/state semantics rather than create a second state model.

## 5. Final Approved Opening / Splash Screen

The supplied 1536×864 opening-screen image is the **FINAL APPROVED VISUAL REFERENCE**. It must be implemented from this design rather than redesigned from scratch.

### Approved visual composition

- full-screen deep navy/blue technical background;
- subtle connected network/node pattern in the upper/background field;
- centered BIO-EMS identity using the approved mark and wordmark;
- subtitle: **Environmental Monitoring System**;
- restrained environmental sensor icons distributed around the scene (for example temperature, environmental/leaf, humidity/water, cloud and CO₂ cues);
- luminous cyan/teal monitoring-wave/data-wave treatment across the lower portion;
- centered slim progress/loading indicator beneath the brand;
- loading/status copy beneath the progress indicator, visually represented in the approved reference as `Preparing your secure monitoring environment...`.

### Implementation behavior

- Preserve the composition, dark technical mood, hierarchy and visual identity of the approved reference.
- Implement it as a real application opening/splash experience, not as a static screenshot pasted into the UI.
- Use responsive CSS/assets so the composition adapts safely to supported desktop/tablet/mobile sizes.
- Localize user-facing loading/status text through the existing i18n system; no hard-coded English-only runtime strings.
- Maintain RTL/LTR safety without mirroring or distorting the logo artwork itself.
- The opening screen may transition to the appropriate authentication/product surface only through existing trusted application flow.
- Do not expose customer, Site, Alarm or SYSTEM_OWNER data before authorization.
- Motion/animation, if used, should be subtle: progress/data-wave/network ambience only; it must not delay startup unnecessarily or obscure accessibility.

## 6. Dashboard Redesign

Redesign Dashboard as a compact, professional, information-dense operational dashboard with the main operating picture in one normal desktop viewport as far as practical.

Prioritize overall monitoring state, Alarm/Warning exceptions, monitored-area state, current/recent readings, relevant device/communication health, concise useful KPIs/charts and direct navigation to deeper screens. Reduce wasted vertical space. Charts should support rapid interpretation rather than decoration.

Do not regress authenticated event-driven refresh, reconnect/cleanup or polling fallback.

## 7. New Screen — Live Monitoring Wall / Monitoring Areas Live Board

The supplied 1536×864 **Live Monitoring Wall** image is the **APPROVED VISUAL REFERENCE** for the new Dashboard-accessible live monitoring screen. The functional/domain working name in planning remains **Monitoring Areas Live Board** until route/product naming is finalized; implementation should preserve the approved visual concept.

### Approved visual composition

- dark professional monitoring-wall presentation consistent with the opening-screen identity;
- persistent application navigation/sidebar;
- page heading `Live Monitoring Wall` in the approved reference;
- top filtering/control row for client/site, area type, status, search, grid density/full-screen and related operating controls where supported by actual product permissions/data;
- visible LIVE/auto-refresh/last-update indication;
- language/theme controls consistent with the global shell;
- compact summary cards for Normal, Warning, Alarm and Offline states;
- overall system-health summary where existing trusted data supports it;
- optional alarm-focus control where implementable without changing domain semantics;
- dense responsive card grid showing Monitored Areas.

### Area-card visual/functional content

Each Monitored Area card should show, where supported by existing APIs/domain data:

- area/room name and Site identity;
- prominent current measurement and engineering unit;
- Normal / Warning / Alarm / Offline state badge;
- allowed/configured range;
- today min/max where trusted data exists;
- compact trend/sparkline where existing history supports it;
- freshness/last-update indication;
- communication/signal state where supported;
- sensor count where supported;
- strong non-color status cues.

Alarm/Warning/Normal/Offline cards should retain the high-contrast operational treatment shown by the approved reference while complying with accessibility requirements.

### Scaling and domain rules

- Scale from the current pilot to larger Site fleets through responsive grid, grouping, filtering and optional grid-density controls rather than uncontrolled vertical growth.
- Arabic/English and RTL/LTR are first-class.
- Preserve the existing domain `Site -> Monitored Area (Room) -> Sensor`.
- Use existing trusted APIs; do not create a duplicate monitoring backend merely to reproduce mockup content.
- If a visual element in the reference has no trusted backend source, omit/disable it or implement the required narrowly scoped adapter only after proving the gap; never fabricate operational data.
- Follow the same live update/reconnect/fallback behavior as Dashboard and Monitored Areas.
- The Live Board/Wall does not replace detailed configuration, history, Alarm workflow, calibration or reporting.

## 8. Existing Screen Refresh Scope

The decision is not limited to Dashboard and Live Monitoring Wall. Review and visually reconcile the complete frontend with the approved identity/theme system, including authentication/entry, customer shell/navigation, SYSTEM_OWNER shell/navigation, Dashboard, Monitored Areas, Alarms/acknowledgement, Devices/communication health, Configuration, Calibration, notifications/escalation/delivery, Reporting Center/exports, commissioning/productization, SYSTEM_OWNER customer/site/license/update/maintenance/support and P8 installation provisioning/revision/receipt/commissioning/acceptance surfaces.

Every refreshed screen must preserve domain semantics, permissions and operational behavior.

## 9. Localization and Directionality

Arabic/English support is a hard regression gate.

- Arabic: RTL with navigation drawer on the **right**.
- English: LTR with navigation drawer on the **left**.
- No new hard-coded English strings.
- Validate alignment, icons, breadcrumbs, tables, charts, dialogs, drawers and forms in both directions.
- Do not mirror/distort the BIO-EMS logo itself under RTL.

## 10. Implementation Intent

These approved references are intended to be **implemented in the repository**, not left as mockups/documentation.

Implementation sequence:

1. audit all frontend routes/components/styles and identify stale/duplicate visual code;
2. derive production brand assets from the final approved logo;
3. establish shared theme/design primitives;
4. implement the final approved opening/splash experience;
5. redesign Dashboard;
6. implement the approved Live Monitoring Wall / Monitoring Areas Live Board;
7. reconcile Monitored Areas and high-frequency operations;
8. reconcile remaining customer surfaces;
9. reconcile SYSTEM_OWNER and P8 workflows;
10. execute full responsive, localization, accessibility, auth/RBAC and live-refresh regression;
11. update project/release documentation only after real code is merged and verified.

## 11. Non-Regression Boundaries

The visual redesign must not casually alter telemetry ingestion semantics, Alarm evaluation/lifecycle, tenant/customer isolation, SYSTEM_OWNER authentication boundary, RBAC authority, audit semantics, P8 installation receipt/acceptance semantics, reporting evidence contracts, provider secrets/live-provider evidence, existing Email/Telegram/WhatsApp evidence status, or hardware/commissioning/UAT acceptance claims.

Server authorization remains authoritative; hiding a frontend control is never authorization.

## 12. Documentation Rule

The final logo, final opening screen and Live Monitoring Wall reference identified by dimensions and SHA-256 above are **approved**, not exploratory. Future alternatives must not replace them unless explicitly approved and this freeze (or a successor ADR/specification) is updated.

## Controlled Continuation

When UI/UX implementation resumes:

1. reconcile local Windows `main` with GitHub `main`;
2. read `PROJECT_STATE.md`;
3. read `IMPLEMENTATION_PLAN.md`;
4. read `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`;
5. read this Visual Design Freeze;
6. preserve the RTL baseline and existing P0-P8 evidence;
7. implement from the final approved visual references rather than reinterpreting them from memory.
