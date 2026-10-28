# BIO-EMS Architecture Principles

| Item | Value |
|------|-------|
| Document | Architecture Principles |
| Version | 1.0 |
| Status | Approved |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines the architectural principles governing the implemented
BIO-EMS backend.

BIO-EMS is an environmental monitoring backend for regulated environments. Its
architecture separates configuration management, telemetry processing, alarm
evaluation, and HTTP delivery so that each concern can evolve independently.

This document describes architectural structure and constraints. Operational
process rules are defined in `ENGINEERING_PLAYBOOK.md`.

## 2. Scope

These principles apply to the current TypeScript backend under `backend/`.

They cover Express APIs, application services, the alarm domain package, SQLite
repositories, InfluxDB query and writer modules, MQTT routing, and configuration.

The document does not describe a frontend, notification engine, reporting system,
or enforced authentication/authorization architecture because those are not
implemented in the current codebase.

## 3. Architectural Vision

BIO-EMS follows a layered architecture because environmental monitoring combines
distinct technical concerns: HTTP delivery, MQTT ingestion, alarm interpretation,
configuration persistence, and time-series telemetry.

Layering keeps those concerns explicit. A change to an InfluxDB query, for example,
MUST NOT require the domain alarm engine to know InfluxDB APIs. Likewise, a route
change MUST NOT redefine sensor threshold behavior.

The architecture favors replaceable infrastructure and stable business semantics.
It enables one configured sensor to be evaluated consistently wherever its reading
is presented.

## 4. Architecture Goals

| Goal | Architectural response |
| --- | --- |
| Maintainability | Focused layers and named modules isolate responsibility. |
| Reliability | Stable data ownership and explicit error boundaries reduce ambiguity. |
| Scalability | Time-series telemetry is stored separately from configuration records. |
| Testability | The domain alarm engine has no infrastructure dependency. |
| Separation of concerns | HTTP, MQTT, domain, and persistence code are distinct. |
| Long-term evolution | Repository and query boundaries localize storage changes. |

Architecture changes SHOULD improve one or more of these goals without weakening
the domain boundary or existing API contracts.

## 5. Layered Architecture

The backend is organized as a set of cooperating layers rather than a single
technical stack.

```text
Presentation
  Routes -> Controllers -> Error Middleware
                 |
Application
  Services -> Telemetry Module -> Dashboard Aggregation
                 |
Domain
  AlarmEvaluationEngine -> Value Objects -> Enums
                 |
Infrastructure
  Repositories -> MQTT -> InfluxDB Query/Writer -> Configuration
                 |
Persistence
  SQLite configuration database      InfluxDB telemetry database
```

| Layer | Current components | Architectural purpose |
| --- | --- | --- |
| Presentation | `routes/`, `controllers/`, `middleware/` | Expose REST endpoints and normalize failures. |
| Application | `services/`, `modules/telemetry/` | Coordinate use cases and compose dependencies. |
| Domain | `domain/` | Express alarm behavior without transport or storage coupling. |
| Infrastructure | repositories, MQTT, database clients/query modules, config | Adapt external systems to application needs. |
| Persistence | SQLite and InfluxDB | Store configuration and telemetry according to their ownership. |

Layers are logical boundaries. Some infrastructure modules reside under `database/`
instead of `src/infrastructure/`, but their dependency role remains infrastructure.

## 6. Dependency Rule

Dependencies MUST point inward toward business meaning, never outward from the
Domain layer to a delivery mechanism or storage technology.

| From \ To | Presentation | Application | Domain | Infrastructure | Persistence |
| --- | --- | --- | --- | --- |
| Presentation | MAY | MUST | MUST NOT | MUST NOT | MUST NOT |
| Application | MUST NOT | MAY | MUST | MAY | MUST NOT directly |
| Domain | MUST NOT | MUST NOT | MAY | MUST NOT | MUST NOT |
| Infrastructure | MUST NOT | MAY | MAY | MAY | MAY |
| Persistence | MUST NOT | MUST NOT | MUST NOT | MUST NOT | MAY |

The Domain layer MUST remain independent. It MUST NOT import Express, MQTT,
`better-sqlite3`, InfluxDB clients, repository classes, or environment configuration.

Application services MAY depend on repositories and infrastructure adapters, but
MUST consume domain outputs rather than reproducing domain comparisons.

## 7. Domain-Driven Design

The current domain package contains focused alarm concepts:

| Concept | Current implementation |
| --- | --- |
| Value objects | `SensorReading`, `AlarmThreshold`, `AlarmEvaluationResult` |
| Enums | sensor type, alarm status, severity, and color |
| Domain engine | `evaluateAlarm` in `AlarmEvaluationEngine` |
| Domain constants | alarm message keys |

The project also has data-oriented entity interfaces in `src/entities/` for Site,
Room, Device, Sensor, Alarm, and User records. These describe current data shapes;
the dedicated alarm rules are represented in the domain package.

`AlarmEvaluationEngine` accepts a reading and threshold values and returns a domain
status. It evaluates critical low, warning low, critical high, warning high, then
normal state. A null reading returns `UNKNOWN`.

```text
SensorReading + AlarmThreshold
             |
             v
     AlarmEvaluationEngine
             |
             v
 AlarmEvaluationResult(status, severity, color, messageKey)
```

Domain services and engines MUST NOT expose HTTP response shapes. For example,
`DashboardService` maps domain `LOW` and `HIGH` to API `WARNING` at its boundary.

> **Current-state note:** `src/services/alarm.evaluator.ts` remains a legacy alarm
> evaluation path for telemetry processing. It is not the architectural target for
> new business rules; consolidating it into the Domain layer requires a deliberate
> refactoring change.

## 8. Repository Pattern

Repositories exist to isolate SQLite access from application use cases. They provide
an explicit access boundary for configuration records and alarm lifecycle records.

Current repositories include `SiteRepository`, `DeviceRepository`, `RoomRepository`,
`SensorRepository`, `AlarmRepository`, and `MigrationRepository`.

Repositories MUST:

- Execute SQLite reads and writes required by their owned record type.
- Bind SQL values instead of concatenating dynamic values into SQL.
- Return repository entities or interfaces rather than HTTP responses.
- Keep persistence details out of controllers and domain code.

Repositories MUST NOT:

- Evaluate alarm thresholds or assign business severity.
- Decide dashboard status or API response policy.
- Invoke MQTT or InfluxDB operations as a side effect of a SQLite query.

`SensorRepository` is the reference example. It persists sensor identity, room and
device relationships, channel, unit, and warning/alarm threshold values. It supplies
those values to the application; it does not interpret them.

## 9. Service Layer Principles

Services implement application orchestration. They connect a use case to repositories,
domain behavior, and infrastructure integrations without becoming an alternative
domain model.

| Service area | Current orchestration responsibility |
| --- | --- |
| Site, device, room, sensor services | Delegate configuration operations to repositories. |
| Alarm service | Coordinates alarm persistence and acknowledgement/recovery lifecycle. |
| Telemetry service | Resolves MQTT telemetry to known devices and sensors, then writes points. |
| Dashboard service | Aggregates SQLite configuration, InfluxDB telemetry, and domain evaluation. |

Services MUST NOT contain duplicated business logic. They SHOULD call a domain engine
when a decision depends on business thresholds or states.

`DashboardService` demonstrates this boundary: it obtains the latest telemetry,
resolves the configured sensor using `SensorRepository`, invokes `evaluateAlarm`,
and maps the result to the established dashboard status contract.

Services MUST NOT contain raw SQLite SQL. SQLite operations belong in repositories.

## 10. Infrastructure Principles

Infrastructure adapts external technologies to the application. It provides capability
but MUST NOT drive business rules.

### SQLite

SQLite holds configuration and operational records: sites, devices, rooms, sensors,
alarms, and migration history. It is accessed through the SQLite client, schema,
migrations, and repository classes.

### InfluxDB

InfluxDB holds high-frequency telemetry. The writer records a numeric `value` with
site, device, sensor, and unit tags; query modules retrieve latest telemetry for
dashboard and room-status aggregation.

### MQTT

MQTT connects devices to the telemetry module. The router validates the expected
topic shape and dispatches telemetry messages to the telemetry listener.

### Configuration

`src/config/config.ts` reads environment configuration for server, MQTT, InfluxDB,
JWT configuration, and log level. Configuration is an infrastructure concern, not a
source of business policy.

Neither an MQTT topic nor an InfluxDB measurement MUST define an alarm threshold;
threshold configuration remains in SQLite and is interpreted by the Domain layer.

## 11. API Boundary

The REST API is the presentation boundary between external clients and application
services.

```text
HTTP request -> Route -> Controller -> Service -> response or AppError
                                               |
                                               v
                                      Error Middleware -> JSON error
```

| Component | Current role |
| --- | --- |
| Routes | Bind endpoint paths and HTTP methods to controller methods. |
| Controllers | Translate Express request/response interaction into service calls. |
| DTO/types | Define the TypeScript shapes used by API-facing operations. |
| Error middleware | Converts `AppError` and unknown errors into JSON responses. |

API contracts SHOULD remain stable because dashboard and management clients depend on
their response fields. Controllers MUST NOT query SQLite directly or evaluate alarms.

`AppError` is the expected-failure abstraction; unknown failures become a generic
`INTERNAL_SERVER_ERROR` response through the shared middleware.

```text
Client
  |
  v
Dashboard Route
  |
  v
Dashboard Controller
  |
  v
Dashboard Service
  |-- SensorRepository (SQLite)
  |-- Influx Query
  `-- AlarmEvaluationEngine
        |
        v
  RoomStatus DTO
```

## 12. Data Ownership

BIO-EMS assigns each category of data to one authoritative architectural owner.

```text
SQLite
  |
  +--> Configuration: sites, devices, rooms, sensors, thresholds, alarms

InfluxDB
  |
  +--> Telemetry: time-series sensor values and tags

Domain
  |
  +--> Business rules: alarm state evaluation from readings and thresholds
```

| Data type | Owner | Access path |
| --- | --- | --- |
| Sensor identity and thresholds | SQLite | `SensorRepository` |
| Device and room configuration | SQLite | corresponding repositories |
| Alarm records and acknowledgement state | SQLite | `AlarmRepository` and alarm service |
| Latest and historical telemetry | InfluxDB | query modules |
| Alarm severity/status interpretation | Domain | `AlarmEvaluationEngine` |

This ownership prevents telemetry storage from becoming configuration storage and
prevents repository records from defining business outcomes by themselves.

## 13. Architectural Constraints

The following constraints are mandatory for the implemented architecture:

- Business rules MUST NOT exist in controllers.
- Repositories MUST NOT evaluate alarms.
- Services MUST NOT contain SQL.
- Domain code MUST NOT import infrastructure modules.
- Controllers MUST NOT query SQLite directly.
- InfluxDB MUST NOT be used as the source of configuration thresholds.
- Domain statuses MUST be mapped to API statuses at an application boundary.
- New SQLite schema changes MUST be represented by migrations.
- Circular dependencies between layers MUST NOT be introduced.

These constraints make an architectural violation visible during code review and keep
the cost of later storage or transport changes contained.

## 14. Anti-Patterns

The following practices are prohibited because they collapse architectural boundaries.

| Anti-pattern | Why it is prohibited | BIO-EMS alternative |
| --- | --- | --- |
| Duplicated business logic | Divergent behavior becomes likely. | Use `AlarmEvaluationEngine`. |
| Hardcoded thresholds | Configuration cannot be managed per sensor. | Read sensor limits through `SensorRepository`. |
| Controller SQL | HTTP delivery becomes coupled to persistence. | Call an application service. |
| Repository alarm evaluation | Persistence code acquires policy ownership. | Return values to the domain/application boundary. |
| Domain importing infrastructure | Domain tests and portability are weakened. | Pass plain value objects to the engine. |
| Circular dependencies | Initialization and ownership become ambiguous. | Maintain inward dependency direction. |

An anti-pattern MUST be removed or isolated as explicit technical debt before it is
used as a template for new code.

## 15. Architectural Decision Records

Architecture Decision Records in `docs/adr/` preserve the rationale behind structural
choices such as device abstraction, monitoring points, onboarding, and dashboard
aggregation.

Every architectural change SHOULD be documented as an ADR when it changes a layer,
dependency direction, data owner, integration boundary, or central domain concept.

The ADR records why a decision was made. This document records the architectural
principles that future decisions MUST preserve.

### Related ADRs

The following ADRs are expected references when available. They are not asserted to
exist merely by being listed here.

- ADR-001 Repository Pattern
- ADR-002 Configuration vs Telemetry Storage
- ADR-003 Alarm Evaluation Domain Engine

## 16. Architecture Evolution

BIO-EMS architecture SHOULD evolve through controlled, incremental refactoring.

- Changes SHOULD preserve API compatibility unless an approved contract change exists.
- New dependencies MUST comply with the dependency matrix before they are introduced.
- A refactor MAY move legacy logic toward the Domain layer without changing external
  behavior.
- Infrastructure replacement SHOULD occur behind repositories or query/writer modules.
- Architecture evolution MUST NOT present planned capability as current implementation.

Example: replacing or extending telemetry storage should preserve the application and
domain contracts so that dashboard status evaluation remains unchanged.

## 17. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Engineering process, quality, review, and release rules. |
| `docs/engineering/DOMAIN_GUIDELINES.md` | Domain-oriented implementation guidance. |
| `docs/engineering/ADR_POLICY.md` | ADR creation and maintenance policy. |

These references complement this document. They MUST NOT be interpreted as evidence
that a planned product capability is implemented.

## Architecture Summary

BIO-EMS uses a layered architecture with explicit dependency direction and separation
of concerns. Domain-Driven Design keeps alarm evaluation in an independent Domain
layer, while the Repository Pattern isolates SQLite configuration access. REST API
contracts remain stable at the presentation boundary. SQLite owns configuration,
InfluxDB owns telemetry, and application services compose those sources without
moving business rules into infrastructure.

## 18. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Approved | Initial architecture-principles document based on the current backend. |
