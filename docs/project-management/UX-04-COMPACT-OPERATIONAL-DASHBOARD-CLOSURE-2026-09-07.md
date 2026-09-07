# UX-04 Compact Operational Dashboard Closure — 7 September 2026

## Status

**COMPLETE / MERGED / CI VERIFIED**

Branch: `agent/ux-04-compact-dashboard`

- PR: #166
- CI: #577 — PASS
- Merge: `8f82c4e3a72064bc719c58feec4cf382393efd08`

This record closes UX-04 implementation, CI verification and merge only. It does not claim UX-05 Monitoring Areas Live Board, later screen reconciliation, release, licensing, installer qualification or customer acceptance.

## Implemented Scope

- Reordered the Dashboard into a compact exception-first operational hierarchy.
- Added a command surface showing authorized scope, live-evidence wording, current exception state and direct Monitored Areas navigation.
- Derives the attention state only from trusted summary values: active Alarms, offline devices and stale devices.
- Condensed the six Site/area/device/sensor/Alarm/offline KPI cards for a normal desktop viewport.
- Reduced the current Sensor profile height while retaining its accessible label and snapshot—not historical trend—meaning.
- Condensed Priority Areas cards while preserving offline/status/Alarm ordering from the existing priority helper.
- Preserved the full Monitored Area, latest telemetry and Alarm-statistics evidence sections below the fast operating picture.
- Replaced new hard-coded English UI copy with complete English/Arabic localization resources.
- Preserved RTL-safe logical borders/layout, shared Light/Dark surfaces and non-color status labels.
- Preserved the existing authenticated realtime telemetry sync, reconnect/cleanup and polling fallback because no query or sync architecture was changed.

## Live Board Boundary

UX-04 does not create a broken route or fabricate the UX-05 screen. Its action opens the existing authoritative Monitored Areas workflow. UX-05 owns the dedicated Monitoring Areas Live Board route, its permission wiring, live card grid and the final Dashboard action retargeting.

## Verification Evidence

Executed from `frontend/`:

- `npm run typecheck` — PASS.
- `npm run test:run` — PASS, 47 files and 284 tests.
- `npm run lint` — PASS with zero warnings.
- `npm run format:check` — PASS.
- `npm run build` — PASS.

Automated coverage includes all four data-source refresh calls from one action, loading/error/empty/data states, KPI values, current exception status and the valid Monitored Areas navigation target.

## Non-Regression Boundaries

UX-04 changes Dashboard presentation and information hierarchy only. It does not add backend data, infer unsupported trends or thresholds, change route permissions, alter tenant/Site scope, change Alarm lifecycle, modify telemetry refresh behavior or claim Live Board completion.

## Controlled Next Step

Reconcile `main`, then start UX-05 Monitoring Areas Live Board.
