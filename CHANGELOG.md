# [Unreleased]

## Fixed

- Made SQLite deployment-path tests use platform-native absolute paths so the release
  suite validates the same behavior on Windows and Linux.

---

# [0.15.0] - 2026-08-17

## Release

Post-`v0.13.0` repository development through the completed Sprint 14 frontend and
Sprint 15 Pilot-readiness foundation.

## Added

- ADMIN User Management with transactional last-active-ADMIN protection and
  concurrency coverage.
- React frontend foundation, responsive AppShell, typed localization, browser
  authentication/session lifecycle, and authorization-aware routing.
- Operational Dashboard and read-only Site → Monitored Area → Sensor frontend views.
- Product-grade Sensor identity, hardware, installation, and current calibration
  state through SQLite migration 005.
- Append-only, actor-audited calibration history and immutable enforcement through
  SQLite migration 006.
- Trusted Device heartbeat/last-seen persistence, communication-health states, and
  Device health API through SQLite migration 007.
- Durable, channel-independent Alarm and Device notification events through SQLite
  migration 008.
- Provider-neutral, failover-only emergency SMS policy with E.164 validation and
  retry idempotency.
- Controlled BIO EGYPT two-Site/eight-area/20-Sensor Pilot scope, installation,
  commissioning, acceptance, and open-item records.
- Fail-closed production configuration validator, MQTT TLS/QoS configuration,
  persistent SQLite and backup paths, LIVE/REPLAY telemetry recovery behavior, Site
  Controller contract, and deployment/backup/restore runbook.

## Changed

- MQTT rejected-input logging is sanitized and no longer reflects untrusted topic or
  payload content.
- Telemetry persistence retains value, battery, signal, and original payload
  timestamp.
- LIVE telemetry evaluates current Alarms; REPLAY telemetry preserves historical
  data without delayed historical Alarm re-triggering.
- Device health remains derived from trusted backend receipt time rather than an
  untrusted payload timestamp.
- Project, backend package, and Health API version metadata align at `0.15.0`.

## Compatibility

- The existing `/api/v1` boundary, authentication model, role policy, and successful
  Alarm acknowledgment contract remain intact.
- Existing Device lifecycle and Site → Room → Sensor relationships remain
  authoritative; Monitored Area remains frontend terminology for Room.
- Existing databases upgrade sequentially through migrations 005–008; migration
  history remains atomic and versioned.
- MQTT production configuration now requires TLS, credentials, and a stable client
  ID, while development defaults remain available outside production validation.
- The frontend package retains its private scaffold version and is not an independent
  published package.

## Known limitations and acceptance boundary

- BIO EGYPT field survey, installation, commissioning, signed evidence, and Pilot
  acceptance are not claimed by this software release.
- Monitoring Points, Assets, broader Device discovery/provisioning, OTA, additional
  operational frontend modules, delivery-channel provider implementations, and
  broader commercial production operations remain separately scoped.
- Publishing `v0.15.0` does not deploy the system or constitute field acceptance.

## Verified

- Sprint 14 and Sprint 15 implementation and closure PRs were merged with successful
  Backend and Frontend GitHub quality gates.
- Release preparation PR #37 passed Backend and Frontend typecheck, build, lint,
  formatting, automated tests, and migration coverage in GitHub Actions run
  `32050279641`.
- The production configuration validator passed with a complete non-sensitive dummy
  environment.
- `git diff --check`, release metadata consistency, documentation status, and secret
  boundary checks passed before publication approval.

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
