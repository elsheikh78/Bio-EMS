# Sprint 15 — S15-02 Calibration History

## Objective

Persist actor-audited, append-only Sensor calibration evidence without overwriting
historical records, while synchronizing the current Sensor calibration snapshot only
after a passing calibration.

## Domain contract

Each calibration record contains:

- globally resolved Sensor UUID and persisted Sensor ID;
- result: `PASS` or `FAIL`;
- performed timestamp;
- optional due timestamp, offset, certificate reference, and notes;
- authenticated performing User ID and username;
- database creation timestamp.

A passing record requires a finite offset and a due timestamp later than the
performed timestamp. A failed attempt can be recorded without a due timestamp or
offset.

## Persistence and immutability

Migration `006_create_calibration_records` creates the calibration history table,
chronological Sensor index, foreign keys to Sensor and User, and SQLite triggers that
reject record update or deletion. Corrections must be appended as new records.

Record insertion and successful Sensor snapshot synchronization execute inside one
SQLite transaction.

For `PASS`, the current Sensor snapshot becomes `VALID` and receives the record's
performed date, due date, offset, and certificate reference. For `FAIL`, the attempt
is preserved but an existing valid Sensor snapshot is not destroyed.

## REST contract

- `POST /api/v1/sensors/:sensorUuid/calibrations` — append an actor-audited record.
- `GET /api/v1/sensors/:sensorUuid/calibrations` — list history by performed time and
  record ID, newest first.

Both endpoints use existing authenticated configuration permissions. Sensor UUID,
body, and empty query contracts are strictly validated. Unknown Sensors return
`404 / SENSOR_NOT_FOUND`.

## Scope boundaries

- No update or delete endpoint exists for calibration records.
- No certificate-file storage is introduced; the record stores a reference only.
- No frontend, reminders, scheduling engine, notification, telemetry, MQTT, Alarm
  Engine, Device lifecycle, or deployment behavior is introduced.
- Automatic `DUE`/`EXPIRED` time progression is deferred from S15-02.

## Verification

Coverage includes migration registration/idempotency, immutable SQLite enforcement,
atomic snapshot updates, failed-attempt preservation, actor auditing, ordering,
rollback, stable not-found behavior, strict REST validation, and RBAC route inventory.
