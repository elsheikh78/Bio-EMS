# UX-09 Full Regression Closure — 7 September 2026

## Status

**COMPLETE / MERGED / CI VERIFIED**

Branch: `agent/ux-09-full-regression`

## Executed Gates

### Backend

- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- `npm run lint` — PASS.
- `npm run format:check` — PASS.
- `npm run test:run` — PASS, 106 files and 755 tests.

### Frontend

- `npm run typecheck` — PASS.
- `npm run lint` — PASS with zero warnings.
- `npm run format:check` — PASS.
- `npm run test:run` — PASS, 51 files and 292 tests.
- `npm run build` — PASS with only the existing non-blocking Vite chunk-size advisory.

Automated total: **157 files / 1,047 tests**.

- PR #171 — MERGED.
- CI #592 — PASS.
- Merge — `eaa8a99bd2acf1b283c280eec4d54b09f789cd2f`.

## Regression Matrix

| Gate                               | Evidence represented by suites                                                                             | Result |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| Authentication and session         | Customer login/session restore/logout and isolated platform authentication                                 | PASS   |
| Authorization and routes           | Role permission matrix, protected route decisions, customer/SYSTEM_OWNER separation                        | PASS   |
| Arabic/English and RTL/LTR         | Global resource selection, persistence, document direction and P8 Arabic rendering                         | PASS   |
| Dashboard/Areas/Live Board refresh | Query polling, SSE invalidation/reconnect/cleanup and manual grouped refresh                               | PASS   |
| Operational states                 | Loading, empty, error/retry and action feedback across controlled surfaces                                 | PASS   |
| Responsive/accessibility sanity    | Drawer breakpoints, focus restoration/initial focus, skip link, logical borders and narrow-layout controls | PASS   |
| Reports/exports                    | Preview/export schemas, CSV/PDF renderers and authenticated report navigation/contracts                    | PASS   |
| Backend trust boundaries           | Tenant ownership, MQTT/telemetry, Alarm, Device, notification, reporting and commissioning policies        | PASS   |

## Closure Boundaries

This regression proves repository software behavior only. It does not claim live WhatsApp acceptance, Telegram end-to-end acceptance, hardware qualification, Site-Bound Licensing implementation, final Windows Installer qualification, production deployment, field commissioning, BIO EGYPT UAT, Quality sign-off or customer acceptance.

Post-merge source release candidate `v0.20.0` was prepared through PR #172, CI #594 and merge `195abca7f01bd92850e255093df85c94ee721cd5`. It was subsequently published after explicit Owner approval from tag target `e50593ddfda7acd3996d11d1de53c86821cb6c83`.

## Controlled Next Step

Continue licensing from LIC-01 only from reconciled `main` unless another explicitly approved track is selected.
