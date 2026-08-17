# [Unreleased]

## Repository Development After v0.13.0

These changes are newer repository development and are **not** retroactively part of the immutable `v0.13.0` tag.

### Sprint 15 pilot-readiness work

- S15-07 Deployment & Commissioning Readiness: production configuration gate, MQTT
  TLS support, persistent SQLite path, LIVE/REPLAY telemetry recovery semantics,
  Site Controller contract, deployment/backup/restore runbook, and readiness evidence
  boundary — merged and closed through PR #34.
- S15-06 BIO EGYPT Pilot Documentation: controlled two-Site/20-Sensor scope and map,
  installation/wiring requirements, commissioning record, acceptance gates, and
  open-items register — merged and closed through PR #32.
- S15-05 SMS Failover Contract: provider-neutral emergency decision policy for
  critical Alarms and Device offline transitions during primary communication loss,
  with E.164 validation and retry idempotency — merged and closed through PR #30.
- S15-04 Notification Architecture: durable channel-independent Alarm and Device
  communication event outbox, idempotent producer contracts, and future delivery
  adapter boundary — merged and closed through PR #28.
- S15-03 Device/communication health: trusted telemetry and heartbeat last-seen
  semantics, derived operational communication states, Device health API, and
  Dashboard offline correction — merged and closed through PR #25.
- S15-02 calibration history: append-only actor-audited `PASS`/`FAIL` records,
  immutable SQLite enforcement, chronological Sensor history API, and atomic current
  Sensor snapshot synchronization after passing calibration — merged and closed
  through PR #23.
- S15-01 Sensor lifecycle and calibration foundation: backward-compatible product
  grade, hardware, installation, and current calibration-state contracts, backed by
  SQLite migration 005 and strict Sensor request validation — merged and closed
  through PR #21.

Sprint 15 is complete, merged, verified, and closed. BIO EGYPT field commissioning
and Pilot acceptance remain unexecuted pending controlled field evidence.

### Sprint 13 post-release work

- S13-06 ADMIN User Management, including transactional last-active-ADMIN protection and concurrency coverage.
- S13-07 security hardening, including rejected-input MQTT log sanitization, User Management regression coverage, and removal of unused `yamljs`.
- S13-08 documentation correction and Sprint 13 closure.

### Sprint 14 frontend work

- S14-01 frontend architecture, provider, localization, configuration, and quality foundation — merged and closed.
- S14-02 professional responsive AppShell and navigation — merged and verified.
- S14-03 browser authentication/session lifecycle and authorization-aware routing — merged and verified.
- S14-04 operational Dashboard frontend — merged and verified.
- S14-05 operational Monitored Areas frontend — merged and closed through PR #19.

Sprint 14 is complete, merged, and closed.

---

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

- The published `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`; later repository commits are not part of that immutable tag target.
- 25 test files and 303 automated tests passed for the original release preparation.
- Typecheck, build, lint, formatting check, and GitHub Actions passed.
- Sprint 13 PR #4 was merged using a normal merge commit.

---

# [0.12.0] - 2026-08-10

## Release Candidate

Sprint 12 — Device Onboarding and Telemetry Trust Boundary completed.

## Added

- Strict Zod validation for Device create, update, route parameters, and list queries.
- Device read, approved metadata update, activate, and disable REST operations.
- Atomic `pending/0 -> active/1 -> disabled/0` lifecycle transitions.
- Site existence and Device identity integrity for registration and activation.
- Device, Site, channel, and enabled-Sensor telemetry trust enforcement.
- Device repository, service, route, REST integration, characterization, acceptance, and telemetry-policy coverage.
- GitHub Actions backend quality gates using Node.js 22 and clean `npm ci` installation.

## Changed

- New Device records are always persisted as `pending` with `activated = 0`.
- Production SQLite initialization enables foreign-key enforcement.
- Invalid Device requests return `400`, missing Devices/Sites return `404`, and state or uniqueness conflicts return `409` without exposing persistence details.
- Trusted telemetry uses the persisted Site record; invalid channels are rejected individually while valid channels in the same payload continue.
- Project, backend package, and Health API version metadata align at `0.12.0`.

## Compatibility

- Existing Device create/list response contracts are preserved.
- MQTT telemetry remains `bioems/{siteCode}/telemetry/{deviceId}` with subscription `bioems/+/telemetry/+`; the payload schema is unchanged.
- No SQLite schema change or migration was introduced.

## Deferred

- Discovery, QR identification, activation codes, Asset approval/assignment, certificates, provisioning, pairing, heartbeat/last-seen, Monitoring Points, Notification Engine, Frontend expansion, OTA, and audit remediation not separately scoped.

## Verified

- Local quality gates and GitHub Actions passed.
- 113 automated tests passed across 10 test files.
- `git diff --check` passed.

---

# [0.11.0] - 2026-08-06

## Release

Sprint 11 — Engineering Foundation and Alarm Consolidation completed.

## Added

- Unified Domain Alarm Evaluation Engine with critical-low, warning-low, normal, warning-high, critical-high, and unknown classifications.
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

## Changed

- DashboardService redesigned as the central aggregation service.
- Room status is generated by combining SQLite configuration with InfluxDB telemetry.
- Dashboard endpoints expose production-ready DTOs.
- Generic telemetry query layer introduced for dashboard widgets.

## Tested

End-to-End verification completed for Dashboard Summary, Latest Telemetry, Room Status, and Alarm Statistics.

## Architecture

Implemented Dashboard Aggregation Engine, Widget-per-Endpoint design, Generic Influx Query Layer, and separation of configuration data from telemetry data.
