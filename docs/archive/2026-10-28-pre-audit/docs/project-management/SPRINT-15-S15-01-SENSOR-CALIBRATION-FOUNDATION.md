# Sprint 15 — S15-01 Sensor Lifecycle & Calibration Foundation

## Objective

Introduce the backward-compatible Sensor metadata required for pilot installation and
current calibration-state tracking without implementing calibration history.

## Approved contracts

| Field | Contract |
| --- | --- |
| `product_grade` | `STANDARD` or `ADVANCED`; defaults to `STANDARD`. Grade is independent of measurement type. |
| `hardware_model` | Optional physical sensor/probe model. |
| `installation_date` | Optional ISO 8601 calendar date. |
| `calibration_status` | `NOT_CALIBRATED`, `VALID`, `DUE`, or `EXPIRED`; defaults to `NOT_CALIBRATED`. |
| `last_calibrated_at` | Optional ISO 8601 timestamp representing the latest calibration event. |
| `calibration_due_at` | Optional ISO 8601 timestamp; cannot precede `last_calibrated_at` at the API boundary. |
| `calibration_offset` | Finite numeric correction applied as metadata; defaults to `0`. |
| `certificate_reference` | Optional external certificate/evidence reference. |

## Persistence

Migration `005_add_sensor_calibration_foundation` adds the eight columns without
rewriting historical migrations. Existing Sensor rows remain valid and receive
`STANDARD`, `NOT_CALIBRATED`, and zero-offset defaults. Fresh databases expose the
same schema directly from `schema.ts`.

## API boundary

`POST /api/v1/sensors` now uses a strict request schema. Existing valid create
requests remain accepted with the new defaults, while unknown fields, invalid enum
values, malformed dates, non-finite offsets, and reversed calibration dates are
rejected. `GET /api/v1/sensors` returns the persisted metadata through its existing
list response shape.

## Scope boundaries

- No calibration-history table or overwritable-history substitute was introduced;
  persistent calibration events belong to S15-02.
- No telemetry, Alarm Engine, MQTT, Device lifecycle, authentication, authorization,
  frontend, notification, or deployment behavior was changed.
- Product grade is not coupled to `sensor_type` or `hardware_model`.

## Verification

- Migration tests cover ordered registration, idempotency, upgrade preservation, and
  backward-compatible defaults.
- Sensor route tests cover metadata acceptance, legacy request compatibility,
  validation failures, date ordering, and list output.
- Backend TypeScript typecheck and ESLint gates pass.
