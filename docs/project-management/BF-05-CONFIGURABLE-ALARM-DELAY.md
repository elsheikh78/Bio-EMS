# BF-05 — Configurable Alarm Persistence/Delay

Status: IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-05-configurable-alarm-delay`
Base: `main` at `d2fe86ab715ab8eb5ec5c89b7b37dfbf82e6d6c2`

## 1. Objective

Replace immediate-only Alarm activation with persisted, configurable violation
persistence while preserving the existing threshold evaluation, active Alarm,
notification, recovery, and replay boundaries.

## 2. Configuration contract

BF-05 owns two Sensor-scoped effective values:

- `warning_delay_seconds` for `WARNING` violations;
- `critical_delay_seconds` for `CRITICAL` violations.

Both values are integer seconds from `0` through `86400`. The persisted default is
`0`, which preserves the established immediate-trigger behavior. The two values are
independent; BF-05 does not invent a customer-specific ordering between warning and
critical delay.

The authorized mutation contract is:

`PATCH /api/v1/sensors/:sensorUuid/alarm-delay`

- requires `CONFIGURATION_WRITE`;
- requires an RFC UUID Sensor identifier;
- accepts a strict, non-empty partial object containing only the two approved fields;
- merges omitted fields with persisted values;
- returns the persisted Sensor contract.

## 3. Effective lifecycle semantics

- A LIVE violating reading with effective delay `0` activates the Alarm immediately.
- With a positive delay and no matching active Alarm, the first violating LIVE
  reading creates a persisted activation candidate containing Sensor, Alarm type,
  severity, first-observed time, last-observed time, and latest value.
- A later LIVE reading activates only when the same Sensor, direction/type, and
  severity have remained continuously violating for at least the configured delay.
- A normal reading, an opposite-direction reading, or a severity change invalidates
  the previous candidate before evaluating the new state.
- Candidate state is removed after successful Alarm activation.
- Existing active Alarm recovery remains immediate when its direction is no longer
  desired. Recovery delay/hysteresis is not claimed by BF-05.
- REPLAY telemetry remains excluded from Alarm evaluation and cannot create, advance,
  or clear a candidate.
- Changing either delay invalidates all pending candidates for that Sensor. The next
  LIVE reading starts evaluation under the new complete policy; configuration changes
  never retroactively activate an Alarm.

Elapsed time uses the trusted backend observation clock, not a customer-submitted
configuration timestamp. A non-increasing clock cannot satisfy positive persistence.

## 4. Persistence and audit

SQLite stores the two effective delay values on the Sensor and stores pending
activation candidates separately from Alarm history. Candidate rows are operational
state, not Alarm events and not compliance history.

An accepted configuration mutation, candidate invalidation, and Site-scoped
`SENSOR.ALARM_DELAY_UPDATED` SUCCESS audit event commit in one transaction. Audit
failure rolls back the complete change. The event records only prior/new effective
delay values. Authenticated denial is body-free and fail-closed.

## 5. Explicit exclusions

- no BIO EGYPT delay value is embedded as a product default;
- no recovery delay, hysteresis, notification delay, escalation timing, or schedule;
- no historical/effective-dated configuration ledger;
- no frontend delay editor;
- no processing of REPLAY telemetry;
- no claim that BE-006 customer approval is complete.

## 6. Acceptance evidence

- fresh and supported-upgrade migrations produce identical delay/candidate contracts;
- zero-delay behavior preserves existing Alarm activation;
- positive delay survives evaluator/repository recreation;
- continuous violation activates at the boundary, not before;
- normal, opposite, and severity-change readings reset candidates;
- configuration validation, authorization denial, Site-scoped audit, and rollback are
  tested;
- Alarm notification and recovery regressions remain green;
- complete backend/frontend quality gates and documentation audit pass before PR.

## 7. Implemented evidence

- migration 011 adds constrained delay columns and restart-safe candidate storage;
- LIVE telemetry supplies the persisted effective values to the Alarm evaluator;
- the evaluator preserves zero-delay behavior and owns candidate start/reset/boundary
  semantics without changing threshold classification;
- the mutation route validates before service execution and requires
  `CONFIGURATION_WRITE` before reading the body;
- configuration, candidate invalidation, and audit success share one transaction;
- tests cover migration idempotency, restart persistence, exact boundary activation,
  reset paths, validation, denial, Site audit, and forced rollback.

## 8. Verification evidence

Backend local gates: typecheck, ESLint, Prettier, production build, and 66 files / 573
tests PASS. Frontend gates: typecheck, ESLint, Prettier, production build, and 25 files
/ 212 tests PASS. GitHub integration evidence remains pending.
