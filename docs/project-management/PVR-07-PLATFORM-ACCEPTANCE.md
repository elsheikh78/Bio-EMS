# PVR-07 — Platform acceptance and release decision

## Decision

**PVR-01 through PVR-07 are review-complete. The platform is NO-GO for BF-10 and production acceptance until the release blockers below are closed.**

This decision distinguishes merged implementation evidence from actual platform acceptance. GitHub CI proves the repository builds and its automated contracts pass; it does not prove the locally running API, SQLite/Influx services, seeded Site scope, or browser workflows are correctly commissioned.

## Review evidence

| Review                       | Outcome                                              | GitHub evidence                                          |
| ---------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| PVR-01 integration recovery  | Accepted; Site-scoped browser retest passed          | PR #86, merge `3ab9f1139e5888ff11e7fc2784c9960624c0b3ab` |
| PVR-02 operational workspace | Accepted                                             | PR #87, merge `46e718dc90c7f4c87d34da53dd624ec99aacb0b1` |
| PVR-03 Monitored Areas       | Accepted in code; live telemetry retest pending      | PR #88, merge `80ad8cdcd0463a389ff34eabda8624a51175d4f0` |
| PVR-04 Alarms                | Active and populated History browser views passed   | PR #89, merge `ccd7874c9a99c59dc8caece2259aa01194ab1ac5` |
| PVR-05 Devices               | Lifecycle, health, edit, and Audit retest passed     | PR #90, merge `59dc878d31b7024020f35d3292f9279ab9d704d7` |
| PVR-06 Reports               | Partially accepted                                   | PR #91, merge `76556c24b0488181fe42931500d3ce9f95ccd7d0` |
| PVR-07 acceptance            | NO-GO until blockers close                           | This document and final CI PR                            |

## Release blockers

1. Repeat the real browser smoke test with frontend and backend running from the same accepted `main`, valid environment configuration, migrations, and seeded Site scope.
2. Exercise the permission-controlled Alarm acknowledgement action against a newly triggered active Alarm. Active/History loading and historical acknowledged/recovered evidence have passed.
3. Repeat the Calibration PDF export after the renderer correction and retain the corrected two-page output as UAT evidence. Preview and CSV content have passed.
4. Reconcile Dashboard Device connectivity with authoritative health states; `NEVER_SEEN` and `NOT_OPERATIONAL` must not be presented as Online.
5. Investigate the Monitored Areas warning presentation where warning thresholds are not configured, and replace obsolete Workspace completion labels for Alarms and Devices.
6. Complete Temperature Performance, Alarm History, Device Communication Health, and Audit & Operations reports. Calibration is the only controlled report family currently available.
7. Record customer/UAT evidence and production deployment/commissioning evidence. Automated unit/integration tests are not substitutes.

## Live retest findings

- Site loading is verified in Monitored Areas, Configuration, and Users/Audit.
- The Devices retest found two legacy non-UUID identifiers in the local database; these were repaired with a retained SQLite backup while preserving `device_id`.
- The same retest exposed a contract mismatch for a never-updated Device: SQLite correctly returns `updated_at: null`. The frontend contract now accepts that persisted state and retains strict validation for every other Device field.
- The metadata-edit retest exposed a missing JSON media type on the Device PATCH adapter. The adapter now sends `Content-Type: application/json`, with regression coverage asserting the exact protected request.
- Customer approval extended the lifecycle with controlled `disabled -> active` reactivation. Metadata changes, activation, reactivation, and disablement now append Site-scoped Audit events.
- The Devices browser retest passed list loading, `NOT_OPERATIONAL`/`NEVER_SEEN` health presentation, metadata edit, activation, disablement, reactivation, and the corresponding immutable Audit events.
- The Alarms browser retest passed an empty Active view and a populated History view containing acknowledged and recovered `HIGH_TEMPERATURE` evidence. A fresh triggered-to-acknowledged action remains required.
- The Calibration report preview and CSV export passed with four Sensors, four PASS attempts, zero FAIL, and explicit missing-hardware-model warnings. Inspection of the exported PDF found cursor drift, clipped identity/approval content, and two footer-only pages; the renderer now preserves the content cursor, reserves footer space, and has a page-count regression test. Corrected browser export evidence remains required before PDF acceptance.

## Automated repository evidence

- Backend: typecheck, lint, build, 71 test files / 601 tests.
- Frontend: typecheck, lint, build, and 35 test files / 247 current tests. At the PVR-05 gate, a pre-existing Login timing test failed once under the full serial load and passed 11/11 when repeated in isolation; GitHub CI passed. The full PVR-07 suite passed without the obsolete placeholder test.
- PVR-05 GitHub CI run 237: success.
- PVR-06 GitHub CI run 239: success.
- No active application route uses the obsolete Sprint-14 placeholder component; it was removed during PVR-07.

## Documentation audit

- Current-state records now separate historical sprint descriptions from the present route surface.
- Reporting documentation names every missing projection and does not infer report readiness from data-store existence.
- Field sensor positions, drawings, and BOM remain outside acceptance until the agreed field sign-off; they are not silently treated as complete.
- BF-10 must not start merely because PVR documents are merged. Start requires explicit closure evidence for the blockers above or a formally approved exception.
