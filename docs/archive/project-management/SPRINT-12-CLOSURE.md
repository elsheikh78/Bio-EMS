# Sprint 12 — Device Onboarding and Telemetry Trust Boundary

Status: Completed

Release candidate: 0.12.0

Date: 2026-08-10

## Delivered Scope

- Strict Zod validation for Device request bodies, route parameters, and list queries.
- Preserved Device create and list contracts, plus read, metadata update, activate,
  and disable operations.
- Device lifecycle enforcement: `pending/0 -> active/1 -> disabled/0`.
- Site existence checks during registration and activation, SQLite foreign-key
  enforcement, and safe uniqueness/foreign-key error mapping.
- Telemetry authorization by Device identity, operational lifecycle, exact Site code,
  Sensor channel ownership, and `enabled = 1`.
- Repository, service, route, integration, characterization, and telemetry-policy
  coverage.
- GitHub Actions quality gates for clean install, typecheck, build, lint, formatting,
  and tests.

## Device REST Contract

| Operation | Route | Success |
| --- | --- | --- |
| Create | `POST /api/v1/devices` | `201`, `{ "success": true, "id": number }` |
| List | `GET /api/v1/devices` | `200`, Device array |
| Read | `GET /api/v1/devices/:deviceId` | `200`, persisted Device row |
| Update metadata | `PATCH /api/v1/devices/:deviceId` | `200`, updated Device row |
| Activate | `POST /api/v1/devices/:deviceId/activate` | `200`, active Device row |
| Disable | `POST /api/v1/devices/:deviceId/disable` | `200`, disabled Device row |

Invalid Zod input returns `400`; a missing Device or Site returns `404`; invalid
lifecycle transitions and uniqueness conflicts return `409`. Error responses use the
established error envelope and do not expose Zod internals, SQLite messages, or stack
traces. PATCH accepts only `device_type`, `protocol`, `manufacturer`, `model`, and
`firmware_version`.

## Lifecycle and Registration Integrity

Creation always stores `pending` with `activated = 0`. Activation accepts only
`pending/0`, requires the configured Site to exist, and atomically stores `active/1`.
Disable accepts only `active/1` and atomically stores `disabled/0`. Conditional-update
races are resolved as not-found or state-conflict without exposing persistence details.

Device identity and Site ownership cannot be changed by metadata updates. Production
SQLite initialization enables foreign-key enforcement. Duplicate identity returns
`RESOURCE_ALREADY_EXISTS`; a missing Site returns `SITE_NOT_FOUND`.

## Telemetry Trust Boundary

The implemented topic remains `bioems/{siteCode}/telemetry/{deviceId}` and the
subscription remains `bioems/+/telemetry/+`. A complete message is rejected before
Alarm evaluation or InfluxDB writes when its topic/message type is invalid, its Device
is unknown or not `active/1`, its Site is missing, or the configured Site code differs
from the topic.

Within a trusted message, unknown channels and Sensors whose `enabled` value is not
`1` are rejected individually. Other valid channels in the same payload continue.
Telemetry writes use the trusted persisted Site record.

## Compatibility Boundary

- Existing Device create/list response contracts remain unchanged.
- The MQTT telemetry topic, subscription, and payload schema remain unchanged.
- No SQLite schema change or migration was introduced.
- Device continues to mean firmware identity inside a Zone Controller, not the Zone
  Controller itself.

## Verification

- Local gates: `npm ci`, typecheck, build, lint, format check, tests, and
  `git diff --check`.
- Acceptance suite: 113 passing tests across 10 test files.
- GitHub Actions: `CI / Backend quality gates` passed on Draft PR #2.

These results verify the release candidate. They do not claim that the branch has
been merged or that version 0.12.0 has been tagged, released, or deployed.

## Deferred and Excluded Scope

Discovery broadcasts, QR scanning, activation-code verification, Asset approval or
assignment, provisioning, pairing, heartbeat/last-seen, automatic registration,
device authentication or certificates, Monitoring Points, Users/Roles,
Authentication/Authorization, Notification Engine, Frontend, OTA Updates, and npm
audit remediation remain deferred or out of scope.
