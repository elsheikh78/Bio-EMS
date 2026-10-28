# BIO-EMS Domain Guidelines

| Item | Value |
|------|-------|
| Document | Domain Guidelines |
| Version | 1.0 |
| Status | Draft |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines how the BIO-EMS Domain Layer is designed, implemented,
reviewed, and evolved.

The Domain Layer holds the system's business meaning for implemented alarm
evaluation. It provides a stable, technology-independent place for rules that must
produce the same result regardless of whether a reading arrives through MQTT or is
presented through the dashboard.

This is a Domain-specific document. Architecture-wide dependency rules, delivery
process, and repository workflow are documented elsewhere.

## 2. Scope

These guidelines apply to `backend/src/domain/` and code that calls its public
functions and types.

The current Domain Layer contains alarm evaluation behavior only. It includes one
domain engine, value objects, enums, and centralized alarm message keys.

This document does not claim that all backend capabilities have a completed domain
model. It describes only the domain components present in the current repository.

## 3. Domain Philosophy

Business rules belong only to the Domain. The Domain is the source of truth for the
meaning of an alarm reading, its status, severity, color, and message key.

- Domain behavior MUST represent business meaning, not transport or database mechanics.
- A business rule MUST have one authoritative implementation.
- Callers MUST consume domain results instead of recreating threshold comparisons.
- The Domain MAY expose neutral types and functions that application code can compose.

Example: the decision that a temperature equal to `alarmHigh` is critical belongs in
`AlarmEvaluationEngine`, not in a dashboard status formatter.

## 4. Domain Responsibilities

The Domain Layer owns implemented concepts that determine the state of an alarm.

| Responsibility | Current Domain component |
| --- | --- |
| Evaluate a reading against thresholds | `evaluateAlarm` |
| Define alarm state vocabulary | `AlarmStatus` |
| Define business severity | `AlarmSeverity` |
| Define presentation-independent color | `AlarmColor` |
| Define supported sensor categories | `SensorType` |
| Represent rule inputs and result | value objects |
| Define localization-neutral message identifiers | `AlarmMessageKeys` |

The Domain MUST return decisions in domain terms. It MUST NOT return Express
responses, SQL rows, MQTT packets, or InfluxDB points.

## 5. Domain Boundaries

The Domain boundary protects rule evaluation from external technical concerns.

The following MUST NOT exist inside `backend/src/domain/`:

- Express `Request`, `Response`, routes, controllers, or HTTP status codes.
- SQLite clients, SQL statements, repositories, migrations, or schema definitions.
- MQTT clients, topic parsing, payload buffers, or subscription logic.
- InfluxDB clients, Flux queries, points, buckets, or telemetry persistence.
- Environment variables, `dotenv`, application configuration, or secrets.
- API DTOs and endpoint-specific response contracts.

The Domain MUST NOT decide how configuration is loaded. It receives threshold values
as `AlarmThreshold` input and evaluates them without knowing their source.

## 6. Domain Building Blocks

The current Domain Layer uses small, explicit building blocks.

| Building block | Location | Current role |
| --- | --- | --- |
| Domain engine | `engines/alarm-evaluation.engine.ts` | Evaluates alarm state. |
| Value objects | `value-objects/` | Describe reading, thresholds, and result. |
| Enums | `enums/` | Constrain domain vocabulary. |
| Constants | `constants/alarm-message-keys.ts` | Provide message keys. |
| Tests | `engines/tests/` | Verify alarm-evaluation behavior. |

A Domain building block SHOULD express a concept that has business meaning. It MUST
NOT exist merely to mirror an infrastructure API.

## 7. AlarmEvaluationEngine

`evaluateAlarm` is the current Domain engine. Its purpose is to classify one sensor
reading using the configured warning and alarm thresholds.

| Aspect | Current behavior |
| --- | --- |
| Input reading | `SensorReading` with `SensorType` and numeric or null value |
| Input thresholds | Optional warning-low, alarm-low, warning-high, alarm-high values |
| Output | `AlarmEvaluationResult` |
| Null reading | Returns `UNKNOWN`, `INFO`, `GRAY`, and non-alarm state |
| Evaluation order | Critical low, warning low, critical high, warning high, normal |

The engine uses inclusive bounds: a value equal to a configured alarm or warning
threshold matches that threshold.

The engine MUST:

- Evaluate only the reading and threshold values passed to it.
- Return a complete `AlarmEvaluationResult` for every input.
- Keep threshold comparisons in one place.
- Return a message key rather than localized text.

The engine MUST NOT:

- Query `SensorRepository` or any database.
- Create, acknowledge, or recover persisted alarm records.
- Publish MQTT messages or write telemetry.
- Format HTTP, dashboard, or UI responses.
- Read environment variables or configuration files.

## 8. Value Objects

The current value objects are TypeScript structural types. They define the shape of
domain inputs and results without infrastructure dependencies.

| Value object | Fields | Purpose |
| --- | --- | --- |
| `SensorReading` | `sensorType`, `value` | Represents one value being evaluated. |
| `AlarmThreshold` | warning/alarm low/high values | Represents optional evaluation limits. |
| `AlarmEvaluationResult` | status, severity, color, alarm flag, message key | Represents the decision. |

Value objects SHOULD be treated as immutable inputs and outputs. Current types do not
use `readonly` fields or runtime freezing; callers MUST NOT mutate an object while it
is being evaluated or rely on mutation as a business mechanism.

Current value objects perform no runtime validation themselves. Runtime payload
validation is currently performed at external boundaries, such as the telemetry Zod
schema. The Domain engine owns semantic interpretation of null readings and threshold
boundaries.

New value objects SHOULD provide validation only when that validation is a domain
invariant, not merely an HTTP or database-format requirement.

## 9. Domain Enums

Enums centralize the fixed vocabulary used by domain rules and prevent free-form
strings from becoming implicit business policy.

| Enum | Current values or purpose |
| --- | --- |
| `AlarmStatus` | `UNKNOWN`, `NORMAL`, `LOW`, `HIGH`, critical states, `OFFLINE` |
| `AlarmSeverity` | `INFO`, `WARNING`, `CRITICAL` |
| `AlarmColor` | green, yellow, orange, red, gray domain color labels |
| `SensorType` | temperature, humidity, pressure, door, CO2, particle, battery, custom |

Enums belong in the Domain because status, severity, color, and sensor category are
part of the vocabulary used to express a business evaluation result.

Application code MAY map an enum to an API contract. It MUST NOT redefine the domain
meaning of an enum value.

## 10. Business Rule Ownership

The following table identifies the authoritative owner of implemented alarm rules.

| Rule or concept | Owner | Current implementation |
| --- | --- | --- |
| Threshold evaluation | Domain | `AlarmEvaluationEngine` |
| Alarm status | Domain | `AlarmStatus` and engine result |
| Severity | Domain | `AlarmSeverity` and engine result |
| Color | Domain | `AlarmColor` and engine result |
| Message keys | Domain | `AlarmMessageKeys` |
| API status labels | Application boundary | `DashboardService` mapper |
| Persisted alarm lifecycle | Application/persistence | alarm service and repository |

Threshold evaluation MUST NOT be copied into repositories, controllers, SQL, MQTT
handlers, or dashboard formatting code.

Message keys intentionally remain localization-neutral. The Domain MUST return keys
such as `alarm.critical.high`, not user-facing translated text.

## 11. Domain Purity

Domain purity means the evaluation logic can run with plain TypeScript values and
does not need a running server, database, MQTT broker, or InfluxDB instance.

This property makes domain rules deterministic and directly testable. Given identical
`SensorReading` and `AlarmThreshold` values, `evaluateAlarm` MUST return the same
result independent of the caller.

The Domain MUST NOT depend on Infrastructure because external systems introduce
availability, format, and lifecycle concerns that are unrelated to rule meaning.

For example, a missing InfluxDB connection is an infrastructure failure; it is not a
domain condition that changes a configured threshold into a different threshold.

## 12. Application Interaction

Application services call the Domain after assembling domain inputs from external
sources. The service owns orchestration; the Domain owns the decision.

`DashboardService` is the current example:

```text
Latest InfluxDB telemetry + SensorRepository thresholds
                         |
                         v
             SensorReading + AlarmThreshold
                         |
                         v
                AlarmEvaluationEngine
                         |
                         v
          Dashboard status mapping and API response
```

`DashboardService` maps domain `NORMAL`, `LOW`, `HIGH`, critical, and unknown states
to its existing room-status API values. This mapping MAY adapt the API contract, but
MUST NOT repeat threshold logic.

The legacy `src/services/alarm.evaluator.ts` still evaluates telemetry alarm behavior.
It is an architectural exception. New or changed domain rules MUST be placed in the
Domain Layer, and consolidation of that legacy path requires an explicit refactor.

## 13. Domain Evolution

Domain evolution MUST preserve one authoritative rule implementation and existing
observable behavior unless an approved behavior change is intended.

### Adding a Value Object

1. Identify a stable business concept not represented by an existing type.
2. Define it under `value-objects/` without infrastructure imports.
3. Add domain-invariant validation only when the invariant belongs to the business rule.
4. Update or add focused Domain tests.

### Adding a Domain Engine

1. Define the business decision and its inputs/outputs in domain vocabulary.
2. Implement the engine under `engines/` with pure functions or pure objects.
3. Return value objects or enums rather than application responses.
4. Add tests for normal, boundary, absent, and exceptional domain states as applicable.

### Adding a Business Rule

1. Determine whether `AlarmEvaluationEngine` already owns the rule.
2. Extend the existing engine when it is the same alarm decision.
3. Add a new domain component only for a separate domain decision.
4. Update callers to consume the domain result rather than retain old comparisons.

## 14. Domain Anti-Patterns

The following patterns are prohibited because they create competing sources of truth.

| Anti-pattern | Problem | Required alternative |
| --- | --- | --- |
| Business rules in repositories | SQL access becomes policy ownership. | Return data to a domain caller. |
| Business rules in controllers | HTTP delivery defines system behavior. | Delegate to a service and domain engine. |
| Business rules in SQL | Rule semantics become database-specific. | Evaluate with the domain engine. |
| Business rules in MQTT handlers | Transport path changes decision behavior. | Convert payload, then invoke application/domain code. |
| Duplicated threshold evaluation | Boundary behavior diverges between callers. | Use `evaluateAlarm`. |
| Localized domain messages | UI language leaks into business logic. | Return `AlarmMessageKeys`. |
| Infrastructure imports in Domain | Tests and business logic become coupled. | Pass plain value objects. |

Hardcoded thresholds are also prohibited. The Domain evaluates supplied thresholds;
sensor-specific values are supplied by the application from configuration storage.

## 15. Domain Review Checklist

Pull requests affecting `src/domain/` MUST be reviewed against this checklist.

- [ ] The change expresses a genuine business concept or rule.
- [ ] The changed Domain code has no infrastructure, HTTP, or configuration import.
- [ ] Threshold comparison remains centralized in `AlarmEvaluationEngine`.
- [ ] New inputs and outputs use domain terminology and types.
- [ ] Enum and message-key changes remain backward-conscious for callers.
- [ ] Boundary conditions, null readings, and normal states are tested where applicable.
- [ ] The change does not duplicate evaluation logic in a service or controller.
- [ ] The caller maps domain output without changing its business meaning.
- [ ] Existing domain tests and the backend build pass.

## 16. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Engineering delivery, quality, and review requirements. |
| `docs/engineering/ARCHITECTURE_PRINCIPLES.md` | Architectural boundaries and dependency direction. |
| `docs/engineering/ADR_POLICY.md` | Policy for documenting architectural decisions. |

These documents complement the Domain guidelines. They MUST NOT be used to claim
that a planned domain feature is already implemented.

## 17. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Draft | Initial Domain guidelines based on the current Domain Layer. |
