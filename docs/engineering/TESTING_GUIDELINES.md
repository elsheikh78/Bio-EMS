# BIO-EMS Testing Guidelines

| Item | Value |
|------|-------|
| Document | Testing Guidelines |
| Version | 1.0 |
| Status | Draft |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines the testing standard for the currently implemented BIO-EMS
backend.

It establishes how engineers verify alarm evaluation, persistence changes, telemetry
processing, dashboard aggregation, API error behavior, and regression risk before a
Sprint 11 Pull Request is reviewed or merged.

The document describes present tooling and implemented behavior only. It does not
claim that unimplemented test infrastructure or coverage already exists.

## 2. Scope

These guidelines apply to TypeScript code in `backend/`, SQLite migrations and
repositories, InfluxDB query/writer modules, MQTT telemetry code, dashboard services,
and backend documentation changes that affect testable behavior.

The current automated test runner is Vitest. The current committed automated test
coverage is focused on `AlarmEvaluationEngine` under `src/domain/engines/tests/`.

Integration targets described here are verification requirements when those paths
change; they MUST NOT be read as a claim that an integration suite already exists.

## 3. Testing Philosophy

BIO-EMS testing follows these priorities:

- Correctness before coverage.
- Business rules before UI behavior.
- Repeatable tests.
- Deterministic results.

Tests MUST demonstrate that the intended behavior is correct, rather than merely
increasing a coverage metric. A small test suite that covers critical alarm boundaries
is more valuable than broad tests that do not assert business outcomes.

Tests SHOULD avoid dependence on local production data, current clock values, live
MQTT brokers, or live InfluxDB instances unless the test is explicitly an integration
verification with controlled configuration.

## 4. Test Strategy

The current strategy is domain-first. Pure alarm evaluation is tested through Vitest;
other backend paths require targeted verification when changed.

```text
              Manual / targeted API verification
                         /
                Integration verification
                       /
             Unit tests (Domain rules)
```

| Level | Current BIO-EMS use |
| --- | --- |
| Unit | Vitest tests for `AlarmEvaluationEngine`. |
| Integration | Required targeted verification for changed SQLite, dashboard, or telemetry paths. |
| API/manual | Used to verify affected REST behavior when no automated API test exists. |

The pyramid is intentionally adapted to the current repository. Unit tests MUST NOT
start databases or brokers merely to test a pure domain decision.

### Current Commands

The backend currently exposes the following npm commands for verification.

| Command | Current purpose |
| --- | --- |
| `npm.cmd run build` | Compile TypeScript into `dist/`. |
| `npm.cmd run typecheck` | Check TypeScript types without emitting output. |
| `npm.cmd run test:run` | Execute the Vitest suite once. |
| `npm.cmd run test:watch` | Run Vitest in watch mode during local development. |

Pull Requests MUST use `build` and `test:run` as the baseline verification commands.
`typecheck` MAY be run as an additional focused diagnostic, but it does not replace a
successful build.

Command output SHOULD be retained in the Pull Request summary when a reviewer needs
to verify a change that affects alarms, migrations, dashboard aggregation, or telemetry.

Test commands MUST be run from the `backend/` directory.

## 5. Unit Testing

Unit tests isolate a deterministic unit of business behavior. They run with Vitest
through `npm.cmd run test:run`.

The current Domain unit suite tests `AlarmEvaluationEngine` for unknown, critical low,
low, normal, high, and critical high outcomes.

- Domain tests MUST call `evaluateAlarm` directly with plain values.
- Tests MUST assert meaningful result fields, not only that execution completes.
- Tests SHOULD use named threshold fixtures that make boundary intent clear.
- Tests MUST NOT require SQLite, InfluxDB, Express, or MQTT.

Value objects and enums currently consist of TypeScript types and enums. They do not
have independent runtime constructors or validators, so they SHOULD be exercised
through domain-engine behavior rather than through artificial implementation tests.

## 6. Integration Testing

Integration verification confirms that implemented modules collaborate correctly at
their real boundary.

| Area | Verification focus when changed |
| --- | --- |
| Repositories | Persisted values, lookup behavior, and constraint handling. |
| DashboardService | Telemetry aggregation, sensor resolution, and status mapping. |
| Telemetry processing | Device/sensor resolution, alarm invocation, and telemetry write invocation. |
| API boundary | Controller/service/error middleware response behavior. |

Integration tests SHOULD use controlled, disposable data. They MUST NOT rely on an
operator's existing `bioems.db` or unverified external telemetry history.

Where a targeted integration test is not yet automated, the Pull Request MUST record
the exact verification performed and why it is sufficient for the change.

### Test Data Control

Tests and targeted verification MUST use data created for the test case or a clearly
identified disposable database. They MUST NOT alter a developer's working project
database as a side effect of ordinary test execution.

Test fixtures SHOULD use recognizable values, such as a temperature sensor with
`warningHigh: 8` and `alarmHigh: 10`, so an assertion can be reviewed without hidden
meaning. Fixture setup MUST make the relevant sensor, room, device, and threshold
relationships explicit when an integration path requires them.

## 7. Database Testing

SQLite stores configuration and operational data. Database verification is mandatory
for any schema or repository behavior change.

- Every schema modification MUST include a migration.
- A migration change MUST be tested on a fresh database.
- A migration change MUST be tested on an existing database lacking the new schema.
- The bootstrap sequence MUST create base tables before incremental migrations run.
- A migration MUST be recorded only after its work completes.
- Repository tests SHOULD assert persisted threshold fields, relationships, and unique constraints.

Example: migration `002_add_warning_thresholds` must yield `warning_low` and
`warning_high` for a new database and add them to an existing `sensors` table.

InfluxDB is not the configuration database. Tests for Influx queries or writes MUST
verify telemetry semantics without treating InfluxDB as the source of sensor limits.

## 8. Repository Testing

Repository tests verify persistence behavior, not business policy.

Repositories SHOULD be tested for:

- Creation and retrieval of their owned records.
- Correct mapping of nullable and required fields.
- Lookup methods using their documented identifiers.
- Constraint and relationship behavior relevant to the changed query.
- Consistent storage and retrieval of sensor warning and alarm thresholds.

Repository tests MUST NOT test:

- Alarm severity or status interpretation.
- Dashboard `NORMAL`, `WARNING`, or `CRITICAL` mapping.
- MQTT topic parsing or InfluxDB write behavior.
- HTTP response serialization.

Example: `SensorRepository.findByDeviceAndChannel` can be tested for finding the
configured sensor; `evaluateAlarm` is tested separately for interpreting its limits.

## 9. Domain Testing

Domain tests are the primary protection for BIO-EMS business behavior.

- Tests MUST cover normal state and every configured threshold state.
- Tests MUST cover null values, which evaluate to `UNKNOWN`.
- Tests MUST cover values equal to warning and alarm thresholds.
- Tests MUST verify inclusive comparisons (`<=` low and `>=` high).
- Tests SHOULD assert status, severity, color, alarm flag, and message key when the
  behavior under test establishes each value.
- Tests MUST remain independent of repositories and external systems.

Example threshold fixture:

```ts
const threshold = {
  alarmLow: 0,
  warningLow: 2,
  warningHigh: 8,
  alarmHigh: 10,
};
```

A reading of `2` is `LOW`; a reading of `10` is `CRITICAL_HIGH`.

## 10. Dashboard Testing

Dashboard testing verifies application composition rather than re-testing threshold
logic owned by the Domain.

- Tests SHOULD verify that latest telemetry is associated with the configured sensor.
- Tests SHOULD verify temperature and humidity aggregation for a room.
- Tests MUST verify that a Domain result maps to the existing dashboard API status.
- Tests MUST verify absent telemetry maps to `UNKNOWN`.
- Tests MUST NOT duplicate detailed threshold-comparison cases already owned by Domain tests.
- Tests SHOULD preserve `roomId`, names, site information, values, alarm counts, and
  `lastUpdate` behavior when changing dashboard aggregation.

Example: a sensor result of `LOW` or `HIGH` maps to `WARNING`; critical domain states
map to `CRITICAL` in the room-status response.

## 11. Error Handling Tests

Error tests protect the current `AppError` and error-middleware contract.

- Expected service failures SHOULD be tested as `AppError` with status and code.
- API-facing tests MUST verify that expected errors have the standard JSON error shape.
- Unknown failures MUST result in `INTERNAL_SERVER_ERROR` without stack trace exposure.
- Tests MUST NOT assert sensitive configuration values or internal database paths.

Example: acknowledging a missing alarm should verify the not-found application error,
not a database-driver-specific error message.

## 12. Regression Testing

A regression test is required whenever a defect is fixed in an implemented behavior
that can be reproduced deterministically.

- The regression test MUST fail before the fix and pass after it.
- It MUST describe the observed business or integration failure.
- It SHOULD be placed at the lowest layer that reproduces the defect.
- A migration regression MUST include fresh and upgrade coverage when applicable.

Example: the SQLite bootstrap ordering defect requires verification that a fresh
database receives the warning-threshold columns before sensor creation uses them.

## 13. Test Review Checklist

Reviewers of testing changes MUST confirm:

- [ ] Tests assert behavior, not incidental implementation details.
- [ ] Domain changes include boundary and null-value cases.
- [ ] Tests are deterministic and use controlled data.
- [ ] No unit test requires a live broker or live InfluxDB connection.
- [ ] Database changes verify fresh and upgrade behavior.
- [ ] Dashboard changes verify status mapping and aggregation effects.
- [ ] Error changes verify stable error codes and safe responses.
- [ ] Regression tests are added for reproducible defects.
- [ ] `npm.cmd run build` and `npm.cmd run test:run` pass.

## 14. Common Testing Anti-Patterns

| Anti-pattern | Why it is harmful | Required alternative |
| --- | --- | --- |
| Testing implementation details | Refactoring breaks tests without changing behavior. | Assert observable business results. |
| Duplicated tests | Multiple tests obscure the one authoritative behavior. | Test each rule at its owning layer. |
| Infrastructure in unit tests | Tests become slow and non-deterministic. | Use pure inputs for domain tests. |
| Skipping boundary values | Threshold defects remain undetected. | Test equality and adjacent values. |
| Shared mutable fixtures | Test order affects results. | Create isolated fixtures per test. |
| Live production-like data | Results cannot be repeated safely. | Use disposable controlled data. |

## 15. Test Naming Convention

Test names SHOULD state the expected outcome and the triggering condition.

Preferred pattern:

```text
should <expected behavior> when <condition>
```

Examples from the current Domain style:

- `should return UNKNOWN when value is null`
- `should return CRITICAL_LOW when value is below alarmLow`
- `should return WARNING when a dashboard sensor is within a warning range`

Test names MUST avoid vague labels such as `works`, `test alarm`, or `case 1`.

## 16. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Build, test, documentation, and delivery expectations. |
| `docs/engineering/ARCHITECTURE_PRINCIPLES.md` | Layer boundaries and data ownership. |
| `docs/engineering/DOMAIN_GUIDELINES.md` | Domain rule and threshold-evaluation ownership. |
| `docs/engineering/CODE_REVIEW_CHECKLIST.md` | Pull Request verification and merge outcomes. |

## 17. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Draft | Initial Sprint 11 testing guidelines for the current backend. |
