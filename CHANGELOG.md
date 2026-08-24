# [Unreleased]

## PVR-07

- Added the platform acceptance matrix, release blockers, and explicit NO-GO decision.
- Removed the obsolete runtime feature-placeholder component and localization copy.
- Replaced stale workspace staging text with the current operational scope description.
- Reconciled the strict Device contract with SQLite's valid `updated_at: null` state and added regression coverage.

## PVR-06

- Added a complete report-family readiness matrix to the Reports Center.
- Corrected the obsolete Audit-store blocker to the outstanding operations-report projection.
- Documented report readiness and release blockers without overstating unavailable exports.

## PVR-05

- Replaced the Devices placeholder with registry and communication-health views.
- Added permission-controlled Device metadata editing and lifecycle operations.
- Added strict frontend Device response contracts and regression coverage.

## Fixed

- Reconciled the strict frontend Site contract with the production SQLite response so shared Site
  selection no longer fails when `created_at` is returned.
- Added production-shaped Site contract/API regression evidence for the Monitored Areas,
  Configuration, and Audit consumers.

## Added

- Replaced the Alarms placeholder with protected Active/History views and permission-controlled
  acknowledgement over the existing Alarm lifecycle API.

- Completed the Monitored Areas operational view with recoverable room telemetry status, Alarm
  count, last update, and Sensor calibration presentation while preserving configuration access.

- Replaced the stale application-shell landing placeholder with a permission-aware Operational
  Workspace that links to available workflows and labels staged platform capabilities.

- Added the controlled `BE002-EV-001` field pack for two-Site drawing control, all
  20 Sensor positions, mapping rationale, completeness review, and Quality approval.

- Closed BF-09 commercial configuration UX with deliberate Site selection before
  recipient, escalation-policy, or customer Audit retrieval.
- Unified the Configuration page identity and added distinguishable accessible names
  for repeated user lifecycle controls.
- Recorded BF-09 final integration through PR #82 and successful GitHub CI run 221.

- Added the BF-09-05 ADMIN User Management and Site-scoped Audit Log center.
- Added runtime-validated user/audit contracts, protected lifecycle/password/API
  adapters, secret-safe password presentation, and summarized immutable evidence.
- Added the BF-09-04 ADMIN escalation-policy directory and editor with Site scope,
  severity eligibility, ordered recipient-role/channel steps, and lifecycle controls.
- Added contiguous step generation, strict increasing-delay validation, protected
  policy mutations, query refresh, and recoverable UI states.
- Added the BF-09-03 ADMIN notification recipient directory with Site selection,
  create/edit workflows, channel/severity eligibility, and lifecycle controls.
- Added contact validation, duplicate-channel prevention, contact-minimized register
  presentation, protected mutations, and query refresh behavior.
- Added the BF-09-02 ADMIN Sensor configuration register and editor for persisted
  warning/alarm thresholds and warning/critical activation delays.
- Added client-side ordering/range validation, controlled mutations, query refresh,
  and explicit loading, empty, failure, and success presentation.
- Added BF-09-01 frontend permission parity for Audit, notification recipients, and
  escalation policies plus ADMIN-only Configuration navigation/route presentation.
- Added runtime-validated frontend contracts and authenticated API adapters for
  Sensor thresholds/delays, recipients, and escalation-policy lifecycle operations.
- Added BF-08 versioned offline-critical controller configuration bundles with
  validated minimum subsets and deterministic SHA-256 delivery envelopes.
- Added explicit acknowledgement/currentness evaluation, stale/rejected/mismatch/
  controller-ahead handling, reconnect actions, and safe fallback semantics.
- Added BF-07 Site-scoped escalation policies with owner role, active lifecycle,
  severity eligibility, and ordered role/channel steps with strict elapsed timing.
- Added dedicated ADMIN-only policy read/manage boundaries, deterministic due-step
  resolution, atomic audit evidence, and migration/REST/rollback coverage.
- Added BF-06 Site-scoped notification recipients with normalized Email, SMS, and
  WhatsApp endpoints plus per-channel Warning/Critical eligibility.
- Added dedicated ADMIN-only recipient read/manage permissions, strict contact
  validation, inactive-recipient exclusion, and contact-free atomic audit evidence.
- Added BF-05 Sensor-scoped warning/critical Alarm activation delays with zero-delay
  backward compatibility and persisted activation candidates.
- Added authorized `PATCH /api/v1/sensors/:sensorUuid/alarm-delay`, strict validation,
  Site-scoped atomic audit evidence, and lifecycle/migration regression coverage.
- Added BF-04 `PATCH /api/v1/sensors/:sensorUuid/thresholds` for authorized partial
  threshold update/clear operations with effective ordering and range validation.
- Added Site-scoped atomic `SENSOR.THRESHOLDS_UPDATED` audit evidence and shared
  audited-denial middleware for configuration mutations.
- Added BF-03 atomic User Management audit evidence for creation, profile/role,
  status, and password-management actions.
- Added safe `SUCCESS`, authenticated `DENIED`, and controlled `FAILED` User audit
  semantics without persisting rejected request bodies or credential values.
- Added the BF-02 append-only `audit_events` persistence foundation with actor,
  action, target, Site, result, prior/new values, request context, reason, and
  authoritative event identity/time.
- Added ADMIN Site-scoped audit reads and separately authenticated platform
  cross-Site audit reads with deterministic ordering and bounded pagination.
- Added recursive audit redaction, immutable SQLite enforcement, authorization,
  repository, service, migration, and REST regression coverage.
- Added the BF-01 platform-level `SYSTEM_OWNER` identity in isolated SQLite storage,
  separate platform JWT configuration, dedicated login/current-principal REST APIs,
  and a one-time environment-driven bootstrap command.
- Added platform authentication, authorization-boundary, persistence, migration,
  bootstrap, and REST contract coverage.

## Security

- Notification contact values remain behind dedicated ADMIN-only routes and are
  excluded from logs, URLs, deduplication keys, and audit prior/new values.
- Alarm-delay configuration requires `CONFIGURATION_WRITE`; accepted mutation,
  pending-candidate invalidation, and audit evidence commit atomically.
- Sensor threshold updates are restricted to `CONFIGURATION_WRITE`; denial is
  recorded before body validation without copying the submitted body.
- Successful threshold persistence and its prior/new audit evidence commit in one
  SQLite transaction, with rollback on audit failure.
- Successful User mutations and their audit events now commit in one SQLite
  transaction; audit persistence failure rolls back the User change.
- Password-management events contain action/result/target context only and never
  contain the submitted password, bcrypt hash, or credential prior/new values.
- Audit updates and deletes are rejected by SQLite triggers; customer audit reads
  require `AUDIT_READ`, which is assigned only to ADMIN.
- Sensitive structured keys, bearer credentials, password hashes, private-key
  material, and recognized credential assignments are redacted before persistence.
- Customer roles remain limited to `ADMIN`, `OPERATOR`, and `VIEWER`; customer User
  Management cannot create, assign, enumerate, mutate, or impersonate a
  `SYSTEM_OWNER`.
- Platform access tokens use a separate secret, issuer, audience, claims, middleware,
  and persisted-principal lookup from customer authentication.
- Customer and platform authentication now share strict single-`Authorization`
  header enforcement and reject duplicate header fields before token verification.
- No master password, universal credential, plaintext password, or frontend-embedded
  owner secret was introduced.

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
