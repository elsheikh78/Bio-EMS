# BF-04 — Editable Sensor Alarm Thresholds

Status: IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-04-editable-alarm-thresholds`
Base: `main` at `4ff9882a571f90761a5eb3bdc25e427867e76e95`

## 1. Objective

Add an authorized post-creation mutation contract for the four Sensor thresholds
already consumed by the Alarm Domain Engine, with effective-value validation,
Site-scoped atomic audit evidence, and no change to Alarm evaluation precedence or
boundary comparisons.

## 2. REST contract

`PATCH /api/v1/sensors/:sensorUuid/thresholds`

- requires customer `CONFIGURATION_WRITE`;
- requires a valid Sensor UUID;
- accepts a strict, non-empty partial object containing only:
  `warning_low`, `alarm_low`, `warning_high`, and `alarm_high`;
- each supplied value is a finite number or `null`;
- `null` explicitly clears a configured threshold;
- omitted fields retain their current effective value;
- success returns the persisted Sensor using the established Sensor contract.

## 3. Effective-value validation

After merging submitted and persisted values, every configured pair must respect the
strict rank:

`alarm_low < warning_low < warning_high < alarm_high`

Missing thresholds remain supported. The configured subset must still be strictly
increasing by its rank. When Sensor `min_value` or `max_value` exists, every configured
threshold must fall inside the inclusive measurement range. Invalid effective
configuration fails closed with `VALIDATION_ERROR` and no mutation.

The Domain Engine remains authoritative for inclusive reading comparisons and state
precedence. BF-04 does not redefine Alarm status semantics.

## 4. Persistence and audit rule

The repository updates only the four threshold columns and `updated_at`. Sensor
identity, hierarchy, unit, range, calibration, and lifecycle fields cannot be changed
through this route.

The accepted update and `SENSOR.THRESHOLDS_UPDATED` SUCCESS event commit in one SQLite
transaction. The event targets the Sensor UUID, uses the Site resolved through its
Room, and records the complete safe prior/new effective threshold sets. Audit failure
rolls back the Sensor update.

Authenticated permission denial records a body-free DENIED event with only a valid
UUID target when available. Authorized controlled failure records a body-free FAILED
event. Validation-rejected bodies are not persisted as audit evidence.

## 5. Compatibility and exclusions

- Existing Sensor creation/list and calibration contracts remain unchanged.
- Existing partial threshold metadata remains supported.
- Existing Alarm Engine and telemetry/dashboard consumers remain unchanged.
- No historical effective-dating model or report reconstruction is claimed.
- No threshold frontend editor is added by BF-04.
- No BIO EGYPT threshold value is hard-coded; BE-006 remains field approval work.

## 6. Required evidence

- authorized update, clear, partial-merge, missing-Sensor, and no-op behavior;
- invalid ordering, non-finite, unknown-key, empty-body, and range rejection;
- OPERATOR/VIEWER denial before validation;
- safe prior/new Site-scoped audit evidence;
- forced audit failure rolls back threshold persistence;
- Alarm Engine boundary/regression suite remains green;
- full backend and frontend regression quality gates pass;
- documentation audit distinguishes current-threshold mutation from historical
  threshold reconstruction.

## 7. Implemented evidence

- Added strict UUID params and non-empty partial threshold schema with finite-number
  or explicit-null values.
- Added Sensor/Room/Site context lookup and a repository update restricted to the four
  threshold columns.
- Added effective ordering/range validation without duplicating reading evaluation.
- Added shared audited authorization denial and Site-scoped atomic SUCCESS evidence.
- Added route, authorization, repository/service, failure, clear, no-op, and rollback
  coverage.

## 8. Verification evidence

Backend local gates:

- TypeScript typecheck: PASS;
- production build: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 64 files / 558 tests PASS.

Frontend source is unchanged. Final regression gates:

- TypeScript typecheck: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 25 files / 212 tests PASS;
- production build: PASS.

## 9. Documentation audit

- README/API and changelog: current editable capability recorded.
- Product decisions: effective ordering, clear semantics, and historical exclusion
  recorded.
- Configurability gap register: CFG-001 backend gap closed; cross-cutting RBAC/audit
  remain partial across later BF families.
- Arabic guide: current mutation distinguished from live Alarm state and historical
  threshold reconstruction.
- BE-006: remains pending real customer approval; no BIO EGYPT values were invented.

## 10. Integration gate

BF-04 becomes complete only after PR review, GitHub CI, merge, and
integration-evidence update. BF-05 starts only from verified merged BF-04 `main`.
