# [0.13.0] - 2026-08-11

## Release

Sprint 13 — Centralized Role-Based Authorization and Alarm Acknowledgment Audit completed.

## Added

- Centralized permission definitions and Role → Permissions authorization policy.
- Reusable authorization middleware with explicit permission enforcement.
- Route authorization across Site, Room, Sensor, Device, Alarm, and Dashboard APIs.
- SQLite Migration 004 for `acknowledged_by_user_id` with a foreign key to `users(id)`.
- Alarm acknowledgment audit persistence using the authenticated User ID.
- Authorization, route-matrix, Alarm audit, repository, service, and migration test coverage.

## Changed

- Alarm acknowledgment is restricted to ADMIN and OPERATOR; VIEWER receives 403.
- Alarm acknowledgment is atomic and succeeds only while the Alarm status is `TRIGGERED`.
- Zero-change acknowledgment races return `409 / INVALID_ALARM_STATE`.
- Alarm reads use an explicit public projection instead of `SELECT *`.
- Project, backend package, and Health API version metadata align at `0.13.0`.

## Compatibility

- Existing Authentication and JWT identity flow is unchanged.
- Existing 401, 404, and 409 API contracts are preserved.
- Successful Alarm acknowledgment remains `{ "success": true }`.
- `acknowledged_by_user_id` remains internal and is excluded from Alarm GET responses.
- Deleting a User sets the audit reference to NULL without deleting the Alarm.
- Migrations 001–003 are unchanged.
- No dependency or MQTT contract changes were introduced.

## Verified

- 25 test files and 303 automated tests passed before release preparation.
- Typecheck, build, lint, formatting check, and GitHub Actions passed.
- Sprint 13 PR #4 was merged using a normal merge commit.
- S13-06/User Management and Sprint 14 have not started.

---

# [0.12.0] - 2026-08-10

## Release Candidate

Sprint 12 — Device Onboarding and Telemetry Trust Boundary completed. Draft PR #2
remains unmerged; no tag, GitHub Release, or deployment is claimed.

## Added

- Strict Zod validation for Device create, update, route parameters, and list queries.
- Device read, approved metadata update, activate, and disable REST operations.
- Atomic `pending/0 -> active/1 -> disabled/0` lifecycle transitions.
- Site existence and Device identity integrity for registration and activation.
- Device, Site, channel, and enabled-Sensor telemetry trust enforcement.
- Device repository, service, route, REST integration, characterization, acceptance,
  and telemetry-policy coverage.
- GitHub Actions backend quality gates using Node.js 22 and clean `npm ci` installation.

## Changed

- New Device records are always persisted as `pending` with `activated = 0`.
- Production SQLite initialization enables foreign-key enforcement.
- Invalid Device requests return `400`, missing Devices/Sites return `404`, and state
  or uniqueness conflicts return `409` without exposing persistence details.
- Trusted telemetry uses the persisted Site record; invalid channels are rejected
  individually while valid channels in the same payload continue.
- Project, backend package, and Health API version metadata align at `0.12.0`.

## Compatibility

- Existing Device create/list response contracts are preserved.
- MQTT telemetry remains `bioems/{siteCode}/telemetry/{deviceId}` with subscription
  `bioems/+/telemetry/+`; the payload schema is unchanged.
- No SQLite schema change or migration was introduced.

## Deferred

- Discovery, QR identification, activation codes, Asset approval/assignment,
  Authentication, certificates, provisioning, pairing, heartbeat/last-seen,
  Monitoring Points, Notification Engine, Frontend, OTA, and npm audit remediation.

## Verified

- Local quality gates and GitHub Actions passed.
- 113 automated tests passed across 10 test files.
- `git diff --check` passed.

---

# [0.11.0] - 2026-08-06

## Release

Sprint 11 — Engineering Foundation and Alarm Consolidation completed.

## Added

- Unified Domain Alarm Evaluation Engine with critical-low, warning-low, normal,
  warning-high, critical-high, and unknown classifications.
- Persisted `warning_low` and `warning_high` sensor thresholds.
- Versioned SQLite migration history and idempotent warning-threshold migration.
- Alarm Domain, persistence, REST API, and migration coverage totaling 13 tests.
- ESLint flat configuration and Prettier quality checks.

## Changed

- MQTT telemetry alarm evaluation and Dashboard room status now share the Domain Engine.
- Fresh SQLite schemas include warning thresholds while migration 002 upgrades existing schemas.
- Project, backend package, and Health API versions are aligned at `0.11.0`.

## Compatibility

- Existing Room, Sensor, MQTT, Telemetry, Dashboard, and Alarm API contracts are unchanged.
- Existing MQTT topics and entity relationships are unchanged.
- Sprint 12 work is not included.

## Verified

- Typecheck, build, lint, Prettier check, 13 automated tests, and `git diff --check`.

---

# [0.10.0] - 2026-08-03

## Release

Sprint 10 Completed

---

## Added

### Dashboard

- Dashboard Summary API
- Latest Telemetry API
- Room Status API
- Alarm Statistics API

### Backend

- Dashboard Aggregation Engine
- Generic Room Telemetry Query
- Alarm Statistics Service
- Dashboard DTOs
- Dashboard REST Endpoints

---

## Changed

- DashboardService redesigned as the central aggregation service.
- Room status is now generated by combining SQLite configuration with InfluxDB telemetry.
- Dashboard endpoints now expose production-ready DTOs.
- Generic telemetry query layer introduced for dashboard widgets.

---

## Fixed

- Room telemetry mapping.
- Sensor-to-room aggregation.
- Dashboard API integration.
- TypeScript build issues.
- Repository lookup consistency.

---

## Tested

End-to-End verification completed for:

- Dashboard Summary
- Latest Telemetry
- Room Status
- Alarm Statistics

Build Status:

PASS

---

## Architecture

Implemented architectural decisions introduced during Sprint 10:

- Dashboard Aggregation Engine
- Widget-per-Endpoint design
- Generic Influx Query Layer
- Separation of configuration data and telemetry data

---

## Notes

Sprint 10 marks the completion of the first production-ready backend dashboard foundation for BIO-EMS.
