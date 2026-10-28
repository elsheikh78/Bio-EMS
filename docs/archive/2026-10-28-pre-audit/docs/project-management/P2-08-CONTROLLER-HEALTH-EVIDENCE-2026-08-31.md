# P2-08 Controller Health Evidence — 2026-08-31

Status: IMPLEMENTED — CI/merge pending.

## Objective

Provide a deterministic Site Controller health-evidence snapshot that can be transported to the BIO-EMS server and later consumed by commissioning, operations, and reporting without overstating field validation.

## Implemented

- Health contract version 1.
- Controller/site identity and observation timestamp.
- Runtime state and primary transport availability.
- Effective BF-08 config version/checksum identity when available.
- Watchdog timeout, heartbeat age, restart count, and overdue detection.
- Pending replay count from P2-07 reconciliation scope.
- Pending local SMS count from P2-06 operational scope.
- Sensor fault count from P2-04/P2-05 runtime scope.
- Deterministic HEALTHY / DEGRADED / NOT_READY classification with machine-readable reasons.
- Validation for timestamps and nonnegative evidence counters.
- Focused unit coverage for healthy, offline/degraded, watchdog/restart, pending operational work, sensor faults, and not-ready state.

## Classification

- `HEALTHY`: runtime ready, primary transport available, watchdog current, no restart/pending/fault evidence.
- `DEGRADED`: runtime can remain operational but one or more communication/watchdog/replay/SMS/sensor-fault reasons exist.
- `NOT_READY`: runtime state is `NOT_READY_*` or `RESTART_REQUIRED`.

## Boundaries

- This slice defines and tests host-side evidence generation only.
- It does not claim physical controller commissioning or 72-hour endurance evidence.
- It does not add a firmware MQTT publisher or server persistence endpoint.
- Counts are supplied by runtime integrations; this slice does not create a durable operational counter store.
- Hardware electrical health metrics are not invented where no approved runtime source exists.

## Next

P2-09 Bench Qualification: assemble deterministic bench qualification evidence and acceptance gates across P2-01 through P2-08 while keeping physical hardware execution explicitly external until performed.
