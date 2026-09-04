# BIO-EMS Master Continuation Checklist — 4 September 2026

## Purpose

This is the single controlled continuation checklist for BIO-EMS. It combines the open work that existed before the 4 September 2026 visual-design discussion with the newly approved UI/UX work so future sessions do not depend on reconstructing separate chats.

## Authoritative starting point

- Repository: `elsheikh78/Bio-EMS`
- Branch: `main`
- GitHub is authoritative; reconcile the Windows local working copy to `origin/main` before implementation and require a clean working tree.
- Preserve all completed P0-P8 closure evidence, global localization, and RTL navigation behavior.
- Visual-reference documentation baseline includes commit `cee5d81c7f8c7336ef6eb7f631583af1e15ac78a` (`docs: freeze approved BIO-EMS visual references`).

## A. Pre-UI open work that must not be lost

### A1 — Provider/live notification evidence

- Preserve passed Email SMTP evidence.
- WhatsApp source implementation remains complete, but live provider acceptance remains externally blocked by Meta; do not represent this as a software failure or as completed live acceptance.
- Telegram interim alarm-delivery source is merged/CI-verified; live Bot Token/Chat ID smoke evidence and full end-to-end TELEGRAM + EMAIL alarm-delivery evidence remain open until actually executed and recorded.
- SMS remains an emergency/fallback delivery track; live-provider evidence remains separate unless explicitly completed.

### A2 — Deployment / installer

- `DEP-01 Full Offline Windows Installer` remains approved later scope.
- Target: customer installation through a setup package containing BIO-EMS plus the required runtime/services/tools and performing the controlled installation automatically.
- Maintain a technician commissioning package/workflow where required.
- Do not call DEP-01 complete until implementation and clean-machine qualification are actually executed and evidenced.

### A3 — Operational and acceptance evidence

Keep these evidence tracks separate from source-software completion and UI completion:

- physical controller/hardware qualification;
- deployed MQTT/recovery evidence where still required;
- endurance/stability evidence;
- production backup/restore/rollback/DR execution evidence;
- BIO EGYPT physical installation/calibration/commissioning;
- customer UAT / Quality sign-off;
- production/customer acceptance.

### A4 — Hardware continuation

Hardware work remains a separate controlled track. Preserve the approved Standard/Advanced hardware concepts and existing BOM/protection documentation. Before pilot hardware is called ready, complete the remaining architecture/BOM/layout/protection/signal-integrity verification and appropriate endurance/validation evidence. Do not infer hardware readiness from frontend or source-software completion.

## B. Approved visual/product work

Read together:

1. `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`
2. `docs/project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md`

### B1 — Preserve the three final approved visual references

The 4 September Work discussion approved three visual references:

1. final refined BIO-EMS Logo Option 5 artwork;
2. final opening/splash screen design;
3. Live Monitoring Wall / Monitoring Areas Live Board visual design.

The design-freeze document records their approved status. The actual PNG files supplied in ChatGPT must be added to the repository from the local working copy before implementation, because the GitHub text-file connector used during documentation could not persist binary PNG files directly.

Target repository paths:

- `docs/assets/ui-ux/bio-ems-final-logo.png`
- `docs/assets/ui-ux/bio-ems-approved-opening-screen.png`
- `docs/assets/ui-ux/bio-ems-approved-live-monitoring-wall.png`

After adding them, update the Visual Design Freeze to link the repository paths and commit the images before visual implementation proceeds.

### B2 — Brand and themes

- Final Logo Option 5 is the implementation reference; do not redesign its geometry during frontend work.
- Produce implementation-safe transparent/background-independent variants as required for header, splash/login, reports, favicon/app icon and installer/package use.
- Light theme is the default operating theme.
- Dark theme is an optional monitoring/low-light theme.
- Use shared design tokens/primitives, not unrelated page-by-page themes.
- Use calm technical environmental-monitoring backgrounds/surfaces; avoid heavy backgrounds that compete with readings/alarms.
- Preserve accessible state language: Normal green, Warning amber/yellow, Alarm/Critical red, Unavailable/offline gray, always with non-color cues.

### B3 — Opening screen

Implement the approved opening/splash visual reference rather than designing a new concept. Preserve its identity while adapting technically for responsive layouts, supported light/dark contexts, Arabic/English and RTL/LTR, and authentication/trust-boundary requirements.

### B4 — Dashboard

Redesign Dashboard to be compact, professional and information-dense, showing the main operational picture within one normal desktop viewport as far as practical. Preserve live telemetry refresh, reconnect/cleanup and polling fallback. Prioritize overall status, actionable Alarm/Warning exceptions, monitored-area state, current readings, relevant communication/device health, concise charts/KPIs, and direct access to the Live Board.

### B5 — Monitoring Areas Live Board / Live Monitoring Wall

Implement the approved new Dashboard-accessible screen. Use one prominent live card/tile per Monitored Area, showing supported current measurement(s), unit, state/severity and freshness/communication status. Preserve `Site -> Monitored Area (Room) -> Sensor`; do not create a duplicate backend monitoring domain. Support responsive fleet scaling, filtering/grouping, Arabic/English, RTL/LTR and the same live-update/reconnect/fallback behavior as Dashboard/Monitored Areas.

### B6 — Complete frontend reconciliation

Review and visually reconcile all user-facing frontend surfaces, including:

- authentication/entry;
- customer shell/navigation;
- SYSTEM_OWNER shell/navigation;
- Dashboard;
- Monitored Areas;
- Alarms/acknowledgement;
- Devices/communication health;
- Configuration;
- Calibration;
- notification recipients/escalation/delivery operations;
- Reporting Center and exports;
- commissioning/productization surfaces;
- SYSTEM_OWNER customer/site/license/update/maintenance/support;
- P8 installation provisioning/revision/receipt/commissioning/acceptance workflows.

Preserve domain semantics, API contracts, RBAC, tenant isolation, SYSTEM_OWNER trust boundary, audit semantics and reporting/commissioning evidence semantics.

## C. Mandatory regression gates

Before closing the UI/UX package, execute and record at least:

- typecheck;
- build;
- lint;
- formatting;
- frontend automated tests;
- affected backend tests if any adapter/API code changes;
- route/auth/RBAC regression;
- customer/SYSTEM_OWNER trust-boundary regression;
- Arabic/English regression;
- Arabic drawer/right and English drawer/left regression;
- responsive desktop/tablet/mobile checks;
- keyboard/focus/contrast/non-color-status accessibility sanity checks;
- Dashboard/Monitored Areas/Live Board live-refresh/reconnect/fallback regression;
- export/report navigation regression where touched.

## D. Documentation and release closure

After real implementation is merged and CI verified:

- update `PROJECT_STATE.md`;
- update `IMPLEMENTATION_PLAN.md` and relevant roadmap/progress/closure documents;
- update README/CHANGELOG where actual product behavior warrants it;
- advance `VERSION` and release notes only according to the repository release policy and actual merged scope;
- record exact PR, CI workflow/run and merge SHA;
- add real screenshots/UAT evidence only after implementation exists;
- never mark provider, hardware, commissioning, UAT or customer acceptance complete without actual evidence.

## E. Controlled execution order

1. Reconcile Windows local `main` to GitHub `origin/main`; confirm clean tree.
2. Read `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, this checklist, UI/UX Work Package and Visual Design Freeze.
3. Add the three approved PNG visual-reference files to `docs/assets/ui-ux/` and link them from the Design Freeze.
4. Inventory all current frontend routes/components/styles and establish a non-regression baseline.
5. Implement brand assets + shared design/theme primitives.
6. Implement approved opening screen.
7. Redesign Dashboard.
8. Implement Live Monitoring Wall / Monitoring Areas Live Board.
9. Reconcile Monitored Areas and high-frequency customer operations.
10. Reconcile remaining customer surfaces.
11. Reconcile SYSTEM_OWNER and P8 workflows.
12. Execute full regression/CI and close the UI/UX package only with evidence.
13. Continue/close the remaining provider-live-evidence, DEP-01, hardware, deployment, commissioning and UAT tracks according to their own evidence gates; do not silently drop them.

## Rule for future sessions

This checklist is the umbrella continuation document. A future session must not treat the newest visual task as replacing older open work. New approved work must be appended/reconciled here (or in a successor master checklist) so the complete backlog and evidence boundaries remain visible.