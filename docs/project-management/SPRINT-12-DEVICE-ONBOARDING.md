# Sprint 12 — Device Onboarding and Telemetry Trust Boundary

Status: Planned

Target version: v0.12.0

Planning baseline: v0.11.0

Branch: `sprint-12-device-onboarding`

## Objective and Rationale

Sprint 12 will turn the existing Device record into an explicit onboarding lifecycle
and make that lifecycle part of the telemetry trust boundary. A registered row alone
must no longer authorize operational telemetry: the Device must be active, belong to
the Site named by the existing MQTT topic, and expose an enabled Sensor for every
accepted channel.

This closes the gaps recorded by ADR-009 and ADR-010. Today the backend rejects an
unknown `device_id`, but it does not enforce `status` or `activated`, does not compare
the Device Site with the topic Site, accepts disabled Sensors, and exposes only Device
create/list REST operations without boundary validation.

## Current-State Constraints

- A Device represents the firmware identity running inside a Zone Controller; it does
  not represent the physical Zone Controller itself. Sprint 12 must preserve this
  distinction in naming, validation, persistence, REST behavior, and documentation.
- SQLite already owns Device configuration through `devices.site_id`, `status`, and
  `activated`; Sensors already provide `device_id`, `channel`, and `enabled`.
- The Device repository currently supports create, list, and lookup by `device_id`.
- The Device REST API currently exposes `POST /api/v1/devices` and
  `GET /api/v1/devices` and passes unvalidated request bodies to the service.
- Telemetry payloads are Zod-validated and unknown devices/channels are rejected, but
  lifecycle, Site ownership, and Sensor enablement are not enforced.
- The approved current telemetry topic contract is
  `bioems/{siteCode}/telemetry/{deviceId}`. The subscriber/service use this ordering,
  while `src/mqtt/topics.ts` contains a conflicting legacy shape. Resolving that
  conflict means unifying `src/mqtt/topics.ts` with this exact existing contract. It
  does not authorize adding, changing, versioning, or migrating any MQTT topic.
- No REST contract, MQTT topic, or SQLite schema is changed by this planning document.

## In Scope

- A Device lifecycle of `pending -> active -> disabled` using the existing columns.
- Repository and service operations to list, read, update, activate, and disable
  Devices.
- Zod schemas at the Device REST boundary for parameters and request bodies.
- Additive Device endpoints needed for read, update, activation, and disablement while
  preserving the existing create/list behavior.
- Telemetry policy checks for Device lifecycle, Site ownership, and enabled Sensors.
- Repository, REST, and telemetry-policy automated tests.
- GitHub Actions quality gates for typecheck, build, lint, formatting, and tests.
- Release and documentation alignment for v0.12.0.

## Out of Scope

- Monitoring Points.
- Authentication, authorization, Users, or Roles.
- Notification Engine.
- Frontend work.
- OTA Updates.
- Discovery broadcasts, QR scanning, activation codes, certificates, or automatic
  registration from MQTT.
- Any `npm audit` fix or dependency remediation prompted solely by audit output.
- REST contract renaming/removal, MQTT topic changes, and SQLite schema changes.

## Device Lifecycle

```text
pending  --activate-->  active  --disable-->  disabled
```

### State Invariants

| Status | `activated` | Operational telemetry |
| --- | ---: | --- |
| `pending` | `0` | Rejected |
| `active` | `1` | Eligible after all other policy checks pass |
| `disabled` | `0` | Rejected |

The service layer owns transitions and writes `status` and `activated` atomically.
REST update input must never set either field directly.

### Transition Rules

- Create always produces `pending` plus `activated = 0`; client-supplied lifecycle
  fields are rejected rather than trusted.
- Activate permits only `pending -> active`. The Site must exist before activation.
- Disable permits only `active -> disabled`.
- `pending -> disabled`, `disabled -> active`, `active -> pending`, and every other
  transition are rejected with a domain conflict response.
- Repeating activation of an active Device or disablement of a disabled Device is
  rejected consistently as an invalid transition; it must not silently mutate data.
- General updates may change only approved mutable metadata and must not change
  identity, Site ownership, lifecycle fields, or timestamps.
- A failed transition leaves the stored Device unchanged.

## Planned Device REST Contract and Zod Validation

The implementation must preserve the existing route prefix and existing create/list
responses. New routes are additive. Before implementing any new endpoint, route-level
characterization tests must pin the exact response envelopes and HTTP status codes of
the current Device endpoints, including their error behavior. Those characterized
contracts must remain unchanged throughout Sprint 12 unless a separate approved
contract decision explicitly supersedes them.

| Operation | Planned route | Validation and behavior |
| --- | --- | --- |
| List | `GET /api/v1/devices` | Optional query schema only if filtering is added; otherwise reject unsupported query behavior consistently. |
| Read | `GET /api/v1/devices/:deviceId` | Zod validates a non-empty bounded `deviceId`; return the Device or not found. |
| Create | `POST /api/v1/devices` | Strict Zod object for existing writable identity, Site, type, protocol, and optional metadata fields; lifecycle fields are forbidden; verify Site exists. |
| Update | `PATCH /api/v1/devices/:deviceId` | Strict, non-empty partial schema limited to `device_type`, `protocol`, `manufacturer`, `model`, and `firmware_version`; identity, `site_id`, `status`, and `activated` are forbidden. |
| Activate | `POST /api/v1/devices/:deviceId/activate` | Parameter schema only; apply the pending-to-active transition atomically. |
| Disable | `POST /api/v1/devices/:deviceId/disable` | Parameter schema only; apply the active-to-disabled transition atomically. |

Implementation schemas should be colocated in a Device DTO/schema module and inferred
to TypeScript types with `z.infer`. All objects must be strict, strings trimmed and
bounded, numeric IDs positive integers, and empty PATCH bodies rejected. Zod failures
must flow through the established error middleware as stable client errors. Database
uniqueness and foreign-key failures must be translated without exposing SQLite
details.

### Expected HTTP Error Policy

- Return `400 Bad Request` for Zod validation failures and otherwise malformed or
  invalid requests.
- Return `404 Not Found` when the requested Device does not exist or when a referenced
  Site does not exist.
- Return `409 Conflict` for a disallowed lifecycle transition or a uniqueness conflict.
- Error envelopes must follow the contracts pinned by characterization tests and must
  never expose SQLite messages, constraint names, SQL text, stack traces, or other
  persistence details.

## Repository and Service Plan

- Add `findById`/`findByDeviceId` read behavior appropriate to REST and telemetry use.
- Add metadata update with an explicit column allowlist and an updated timestamp.
- Add conditional transition statements whose `WHERE` clause includes the expected
  current status; update both lifecycle columns in the same statement.
- Return enough information to distinguish not-found from invalid-transition without
  a read-then-write race.
- Keep lifecycle rules and Site existence checks in the service layer; controllers
  remain HTTP adapters and repositories remain persistence adapters.
- Do not add a migration: the required Device and Sensor columns already exist.

## Telemetry Trust-Boundary Policy

For each message on the existing telemetry topic, apply these checks in order before
alarm evaluation or an InfluxDB write:

1. Parse and validate the existing topic shape and require `messageType` to be
   `telemetry`.
2. Validate the existing telemetry payload schema.
3. Resolve `deviceId`; reject an unknown Device without creating one.
4. Require `status === "active"` and `activated === 1`; reject `pending`, `disabled`,
   contradictory lifecycle values, and unknown status values.
5. Resolve `device.site_id` to an existing Site and require its `code` to equal the
   topic `siteCode` exactly. Reject missing or mismatched Sites.
6. Resolve each `(device.id, channel)` pair. Reject an unknown channel and reject a
   channel whose Sensor has `enabled !== 1`.
7. Only after every per-reading check succeeds, evaluate alarms and write that reading
   to InfluxDB.

Policy rejection must be observable through structured logs containing a reason and
safe identifiers, but must not write telemetry or invoke alarm evaluation for the
rejected reading. A Device-level rejection rejects the whole message. A channel-level
rejection rejects that reading and permits other valid readings in the same message;
tests must pin this existing partial-message behavior. No rejection may mutate Device,
Site, or Sensor configuration.

## Test Plan

### Repository Tests

- Create defaults to the pending invariant.
- Find/list/read return persisted lifecycle and metadata.
- Metadata update changes only allowlisted fields and timestamps.
- Activation succeeds only from pending and updates both lifecycle columns.
- Disablement succeeds only from active and updates both lifecycle columns.
- Invalid and repeated transitions are non-mutating and distinguishable from not-found.
- Unique Device identity and nonexistent Site failures are translated predictably.

### REST Tests

- Characterize current create/list response contracts before adding routes.
- Pin existing response envelopes and status codes before implementing any new Device
  endpoint, then assert those contracts remain stable for the rest of Sprint 12.
- Happy paths for list, read, create, update, activate, and disable.
- Invalid params, malformed bodies, unknown keys, empty PATCH, client lifecycle fields,
  duplicate identity, missing Device, missing Site, and invalid transitions.
- Confirm status codes and response bodies are stable and no internal SQLite/Zod detail
  leaks.
- Confirm lifecycle cannot be bypassed through the general update endpoint.

### Telemetry Policy Tests

- Accept an active/activated Device whose configured Site matches the topic and whose
  Sensor is enabled.
- Reject unknown, pending, disabled, and internally inconsistent Devices.
- Reject a missing Site and a topic Site mismatch.
- Reject unknown channels and Sensors with `enabled = 0`.
- Assert rejection causes zero Influx writes and zero alarm evaluations.
- Assert a mixed payload processes only valid enabled channels, matching the documented
  partial-message policy.
- Characterize the approved existing topic ordering and prevent accidental topic
  contract changes while resolving the current code inconsistency.

Tests must use isolated SQLite state and mocked Influx/alarm boundaries; they must not
depend on a developer database, broker, or live InfluxDB.

## CI Plan

Add a GitHub Actions workflow for pull requests and pushes to `main`, using the
repository's supported Node.js version and `npm ci` in `backend`. The workflow must run
these required commands as distinct visible gates:

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. `npm run format:check`
5. `npm run test:run`

CI must not run `npm audit fix` and must fail the check when any required command
fails.

## Documentation and Release Plan

At implementation completion—not during this planning-only change—update:

- `docs/architecture/roadmap.md` with Sprint 12 completion and Device onboarding scope.
- `docs/project-status.md` and `PROJECT_STATE.md` with tested status and v0.12.0.
- `docs/SPRINT_PROGRESS.md` to replace stale Device registration/activation entries.
- ADR-009 and ADR-010 implementation-status sections to reflect exactly what shipped;
  retain QR, activation-code, Asset approval, and Authentication work as deferred.
- MQTT protocol copies and other stale architecture text only to reconcile them with
  the already-approved topic contract, without changing that contract.
- `CHANGELOG.md`, `VERSION`, and `backend/package.json`/lockfile version metadata for
  v0.12.0 following the release process.

Documentation must distinguish implemented lifecycle onboarding from the broader
four-phase workflow that remains deferred.

## Acceptance Criteria

- [ ] New Devices are persisted as `pending` with `activated = 0`, regardless of REST
  input, and invalid lifecycle input is rejected.
- [ ] The Device API can list, read, update allowed metadata, activate, and disable a
  Device through Zod-validated inputs.
- [ ] Only `pending -> active -> disabled` transitions succeed; all other transitions
  return a tested conflict and leave the row unchanged.
- [ ] Telemetry from unknown, pending, disabled, or lifecycle-inconsistent Devices
  produces no alarm evaluation and no InfluxDB write.
- [ ] Telemetry is rejected when the Device's configured Site code does not exactly
  match the Site code in the existing MQTT topic.
- [ ] Unknown channels and channels mapped to Sensors with `enabled !== 1` are not
  evaluated or persisted; valid channels in the same payload retain the documented
  partial-message behavior.
- [ ] Existing REST create/list contracts and the approved MQTT topic shape remain
  backward compatible; no SQLite schema migration is introduced.
- [ ] Device REST errors return `400` for Zod/invalid requests, `404` for missing
  Devices or Sites, and `409` for invalid lifecycle transitions or uniqueness
  conflicts, without leaking SQLite details.
- [ ] Characterization tests pin existing Device response envelopes and status codes
  before new endpoints are implemented and continue to pass unchanged throughout the
  Sprint.
- [ ] `src/mqtt/topics.ts` is unified with
  `bioems/{siteCode}/telemetry/{deviceId}` without adding, changing, or migrating any
  MQTT topic.
- [ ] Repository, REST, and telemetry-policy suites cover every success and rejection
  path listed in this plan and pass in isolation.
- [ ] GitHub Actions runs and passes `typecheck`, `build`, `lint`, `format:check`, and
  `test:run` using clean dependency installation.
- [ ] Roadmap, project status, Sprint progress, ADR implementation status, protocol
  documentation, changelog, and version files accurately describe the delivered
  v0.12.0 boundary.
- [ ] Monitoring Points, Authentication, Users/Roles, Notification Engine, Frontend,
  OTA Updates, and npm-audit remediation are absent from the implementation diff.
- [ ] The release candidate reports v0.12.0 and passes `git diff --check` with no
  commit or push performed until review approval.

## Definition of Done

All acceptance criteria are evidenced by automated tests or repository inspection,
all five CI gates pass locally and in GitHub Actions, compatibility constraints are
documented, and the v0.12.0 documentation accurately separates delivered behavior
from deferred onboarding and security capabilities.
