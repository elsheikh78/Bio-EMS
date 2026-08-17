# S15-01 Closure — Sensor Lifecycle & Calibration Foundation

## Status

**COMPLETE / MERGED / VERIFIED / CLOSED**

S15-01 is closed. Its approved implementation was integrated into `main` through
PR #21.

Feature commit:

`bb3873424a566ef43a18e12b732b9f252bfa99ff`

Integration commit on `main`:

`d0a800dea252907d5f2a942571add2528a29666f`

## Objective achieved

S15-01 established the backward-compatible Sensor metadata and domain contracts
required to identify installed hardware and represent its current calibration state
for Pilot readiness.

The completed contract includes:

- `STANDARD` and `ADVANCED` product grades without coupling grade to measurement type;
- optional hardware model and installation date;
- `NOT_CALIBRATED`, `VALID`, `DUE`, and `EXPIRED` calibration states;
- latest calibration and next-due timestamps;
- finite numeric calibration offset/correction metadata;
- optional calibration-certificate reference.

## Persistence and compatibility evidence

SQLite migration `005_add_sensor_calibration_foundation` adds the approved fields
without modifying migrations 001–004.

Existing Sensor rows remain valid and receive these defaults:

- `product_grade = STANDARD`;
- `calibration_status = NOT_CALIBRATED`;
- `calibration_offset = 0`.

Fresh-database schema creation and supported migration upgrade paths expose the same
Sensor foundation. Migration tests cover registration order, idempotency, existing
row preservation, and default values.

## API and domain evidence

The Sensor entity and repository expose the new metadata. `POST /api/v1/sensors`
uses a strict request contract that preserves valid legacy create requests while
rejecting:

- unknown product grades or calibration states;
- malformed installation dates or calibration timestamps;
- non-finite offsets;
- due timestamps earlier than the latest calibration timestamp;
- unknown or internal fields.

`GET /api/v1/sensors` retains its existing list shape and returns persisted Sensor
metadata.

## Quality evidence

PR #21 contained one focused implementation commit and 14 changed files.

Before merge:

- backend TypeScript typecheck passed;
- backend build passed;
- backend ESLint passed;
- backend Prettier check passed;
- 10 focused migration tests passed;
- 8 focused Sensor API tests passed;
- GitHub Backend quality gates passed;
- GitHub Frontend quality gates passed.

GitHub Actions run: `32040967247`.

Backend job: `95420082550`.

Frontend job: `95420082504`.

PR #21 was confirmed `CLEAN` and `MERGEABLE` at the expected feature HEAD before
merge.

## Scope boundary preserved

S15-01 did not introduce:

- calibration-history persistence;
- an overwritable substitute for calibration history;
- frontend calibration screens;
- telemetry, MQTT, or Alarm Engine changes;
- Device lifecycle changes;
- authentication or authorization-policy changes;
- notification, SMS, deployment, or production-operation behavior.

Calibration history remains a separate persistent module and is the approved scope
of S15-02.

## Closure decision

All S15-01 acceptance evidence is complete and integrated. No known implementation,
migration, CI, or documentation blocker remains.

**Decision: close S15-01 and proceed to S15-02 — Calibration History.**
