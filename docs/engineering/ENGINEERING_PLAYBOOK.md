# BIO-EMS Engineering Playbook

| Item | Value |
|------|-------|
| Document | Engineering Playbook |
| Version | 1.0 |
| Status | Approved |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This playbook is the primary engineering reference for the BIO-EMS backend.

BIO-EMS is an environmental monitoring platform for regulated facilities,
including pharmaceutical warehouses, hospitals, laboratories, and manufacturing
environments.

The playbook records how the implemented system MUST be maintained and extended.
It is an engineering manual, not a product roadmap or a user tutorial.

> **Implementation boundary:** A capability is described as implemented only when it
> exists in the repository. Planned frontend, notification, reporting, authentication,
> and authorization capabilities are not documented here as current features.

## 2. Scope

This document applies to the TypeScript backend in `backend/`, its SQLite and
InfluxDB persistence code, MQTT ingestion code, tests, and supporting documentation.

The current backend provides site, device, room, sensor, alarm, telemetry, and
dashboard APIs and processing.

- Engineers MUST apply these rules to new backend changes.
- Changes SHOULD be scoped to one coherent concern.
- A change MAY update this document when it changes an engineering practice.

## Engineering Goals

BIO-EMS engineering aims to achieve:

- Reliability over rapid feature delivery.
- Maintainability over short-term optimization.
- Clear architectural boundaries.
- Testability.
- Scalability.
- Traceability.
- Long-term supportability.

## 3. Engineering Philosophy

BIO-EMS favors correctness, traceability, explicit boundaries, and incremental
change. Regulated monitoring systems require behavior that can be inspected and
explained after deployment.

- Business decisions MUST be centralized instead of copied between API and data code.
- Existing API contracts MUST remain compatible unless an approved contract change exists.
- Configuration and telemetry MUST remain separated by storage responsibility.
- Engineers SHOULD prefer small, testable changes over broad rewrites.

Example: threshold comparison belongs in the alarm domain engine, not in a dashboard
controller or a SQLite query.

## 4. System Architecture Overview

BIO-EMS is a layered Express and TypeScript backend.

```text
REST client -> route -> controller -> service -> repository/query module -> SQLite or InfluxDB
MQTT device -> MQTT router -> telemetry listener/service -> alarm processing -> InfluxDB
Dashboard service -> domain alarm evaluation -> existing dashboard API response
```

| Area | Current implementation |
| --- | --- |
| HTTP API | Express routes, controllers, async/error middleware |
| Domain | Alarm engine, statuses, severity, colors, value objects |
| Application | Site, device, room, sensor, alarm, telemetry, dashboard services |
| Configuration store | SQLite through `better-sqlite3` repositories |
| Telemetry store | InfluxDB writer and query modules |
| Device integration | MQTT client, router, handlers, and telemetry module |

The architecture exists to prevent transport and persistence details from becoming
business-rule dependencies.

## 5. Project Structure

```text
backend/
  src/
    config/          environment configuration
    controllers/     HTTP request handling
    domain/          alarm domain model and evaluation engine
    errors/          AppError definition
    middleware/      async and error middleware
    modules/         telemetry module
    mqtt/            MQTT client, routing, topics, handlers
    repositories/    SQLite persistence access
    routes/          Express route declarations
    services/        application and dashboard orchestration
    types/           API-facing TypeScript types
  database/
    sqlite/          client, schema bootstrap, seeds, migrations
    influx/          client, writer, telemetry query modules
docs/
  engineering/       engineering handbook and standards
  architecture/      architecture decisions and reference material
```

Engineers MUST place new code in the layer that owns its responsibility. A new
database table, for example, SHOULD include schema migration and repository work.

## 6. Layer Responsibilities

| Layer | Owns | MUST NOT own |
| --- | --- | --- |
| Domain | Business state and rule evaluation | Express, MQTT, SQLite, InfluxDB dependencies |
| Repository | SQLite reads, writes, and record mapping | Alarm or workflow policy |
| Service | Use-case orchestration | Duplicated domain decisions |
| Controller | HTTP translation and service invocation | SQL or business policy |
| Route | HTTP method and path binding | Request handling logic |
| Influx query module | Telemetry read/write access | API response policy |

This division keeps a dashboard response change from changing telemetry persistence
or alarm comparison semantics.

## 7. Domain-Driven Design Rules

The current Domain layer is `backend/src/domain/`. It contains alarm enums, message
keys, value objects, and `AlarmEvaluationEngine`.

- The Domain layer MUST remain independent from Infrastructure.
- Domain code MUST NOT import Express, MQTT, SQLite, InfluxDB, or repositories.
- Business rules MUST exist only inside the Domain layer.
- New threshold behavior MUST be implemented in the domain engine and tested there.
- Application code MUST map domain outputs to API contracts at its boundary.

Example: `evaluateAlarm` accepts a `SensorReading` and `AlarmThreshold`, then returns
statuses such as `LOW` and `CRITICAL_HIGH`. `DashboardService` maps those statuses to
the API values `WARNING` and `CRITICAL` without repeating comparisons.

> **Current-state note:** `src/services/alarm.evaluator.ts` is a legacy telemetry
> evaluation path. It is an architectural exception; new or changed alarm rules MUST
> use the Domain layer, and its consolidation requires an explicit refactoring change.

## 8. Repository Rules

Repositories in `src/repositories/` access sites, devices, rooms, sensors, alarms,
and migration records in SQLite.

- Repositories MUST contain persistence access and record mapping only.
- Repositories MUST NOT contain business logic.
- SQL values MUST be passed as bound parameters.
- Controllers MUST NOT query the SQLite client directly.
- A repository SHOULD return the entity/interface defined for its record type.

Example: `SensorRepository` returns threshold fields such as `warning_low` and
`alarm_high`; it does not decide whether a reading is normal or critical.

## 9. Service Layer Rules

Services in `src/services/` and `src/modules/telemetry/` orchestrate use cases.

- Services MUST coordinate repositories, domain functions, and integrations.
- Services MUST NOT duplicate business logic.
- Services SHOULD use `AppError` for expected not-found and invalid-state failures.
- Dashboard aggregation MAY combine SQLite sensor configuration with InfluxDB data.
- Telemetry processing MUST resolve known devices and sensors before storing readings.

Example: `DashboardService` receives latest room telemetry, resolves its sensor
configuration, invokes `evaluateAlarm`, and preserves the established room-status API.

## 10. API Design Rules

The API is implemented with route modules, controllers, `asyncHandler`, and common
error middleware. API paths use the configured prefix, normally `/api/v1`.

- Routes MUST remain thin bindings of method and path to controller.
- Controllers MUST delegate application work to services.
- Existing REST response contracts MUST NOT change without explicit approval.
- DTOs and routes MUST NOT be changed incidentally during service refactoring.
- Expected errors MUST use stable application error codes.

Current endpoint groups include health, sites, devices, rooms, sensors, alarms, and
dashboard operations such as `/dashboard/summary` and `/dashboard/rooms/status`.

## 11. Database Rules

BIO-EMS uses two storage technologies because configuration and telemetry have
different access patterns.

| Store | Mandatory purpose | Current data |
| --- | --- | --- |
| SQLite | Configuration and operational records | sites, devices, rooms, sensors, alarms, migration history |
| InfluxDB | Time-series telemetry | sensor value points and tags |

- SQLite stores configuration data.
- InfluxDB stores telemetry.
- SQLite relationships MUST use the schema's foreign-key and uniqueness rules.
- Telemetry writes SHOULD include site, device, sensor, and unit context.
- A service MUST NOT treat InfluxDB as the source of sensor threshold configuration.

Example: a room-status response reads sensor limits from SQLite and latest values from
InfluxDB, then evaluates the combined result in the Domain layer.

## 12. Migration Policy

Migrations protect configuration data as the SQLite schema evolves.

- Every schema modification MUST be implemented using migrations.
- Migrations MUST be ordered, versioned, and registered in `migration-runner.ts`.
- The bootstrap sequence MUST create baseline tables before incremental migrations run.
- A migration MUST be recorded only after its `up()` work completes.
- Migrations MUST safely upgrade the supported existing database schema.
- Engineers MUST verify both fresh-database creation and existing-database upgrade.

Current migrations live in `backend/database/sqlite/migrations/`; applied versions are
recorded in the `schema_migrations` table.

## Architecture Decision Records (ADR)

Architecture Decision Records preserve the rationale behind decisions that shape the
system beyond an individual implementation task.

- Every architectural decision affecting system structure MUST be documented as an ADR.
- ADRs SHALL be stored under `docs/adr/`.
- The Playbook defines engineering rules.
- ADRs explain why a decision was made.
- Architecture changes MUST reference the corresponding ADR.

## 13. Error Handling Policy

Consistent failure handling protects API clients from transport and implementation
details while preserving actionable application errors.

`AppError` carries an HTTP status and stable error code. `errorMiddleware` converts
it to an API response; unexpected errors return `INTERNAL_SERVER_ERROR`.

- Services SHOULD throw `AppError` for expected failures.
- Controllers MUST NOT silently swallow errors.
- Error responses MUST NOT reveal tokens, database paths, or stack traces.
- Error codes SHOULD remain stable after clients depend on them.

Example: acknowledging an absent alarm produces a not-found application error rather
than an unhandled SQLite or JavaScript error.

## 14. Logging Policy

The current backend uses `console.log`, `console.warn`, and `console.error` for
startup, migrations, MQTT routing, telemetry processing, and unexpected failures.

- Logs MUST NOT include JWT secrets, MQTT credentials, or InfluxDB tokens.
- Logs SHOULD identify operational context such as device ID, sensor code, or alarm ID.
- Unknown-device and unknown-sensor telemetry SHOULD be distinguishable in logs.
- New logs MUST be concise and useful for operating the current service.

Structured logging is not currently implemented; engineers MUST NOT describe it as an
existing capability.

## 15. Configuration Management

Runtime configuration is loaded through `dotenv` and exposed by `src/config/config.ts`.

| Area | Current environment variables |
| --- | --- |
| Server | `NODE_ENV`, `PORT`, `API_PREFIX`, `LOG_LEVEL` |
| MQTT | `MQTT_HOST`, `MQTT_PORT` |
| InfluxDB | `INFLUX_URL`, `INFLUX_TOKEN`, `INFLUX_ORG`, `INFLUX_BUCKET` |
| JWT configuration | `JWT_SECRET` |

- Secrets MUST NOT be committed to source control.
- Production deployments MUST supply required InfluxDB settings explicitly.
- Local defaults MAY be used only when they are safe and intentional.
- Environment variables MUST NOT be logged.

> **Current-state note:** JWT configuration exists, but API authentication and
> authorization enforcement are not implemented by the current backend.

## 16. Testing Policy

The current automated suite uses Vitest and includes focused domain alarm-engine tests.
The backend exposes `build`, `typecheck`, `test:run`, and related npm scripts.

- Every Pull Request MUST pass Build and Tests before review.
- `npm.cmd run build` MUST compile the backend successfully.
- `npm.cmd run test:run` MUST complete successfully.
- New domain rules MUST have focused unit tests.
- Migration changes SHOULD be verified against fresh and existing SQLite databases.
- API and MQTT behavior SHOULD gain integration tests as those paths change.

Manual HTTP examples MAY support exploratory checks but MUST NOT replace automated
coverage for business-critical behavior.

## 17. Code Review Policy

Review is the control point for architecture, compatibility, and operational safety.

Reviewers MUST verify:

- [ ] The change uses the correct layer and follows dependency rules.
- [ ] Business rules are not duplicated outside the Domain layer.
- [ ] Repositories contain no workflow or alarm policy.
- [ ] API contracts remain unchanged unless explicitly approved.
- [ ] Schema changes include migration and upgrade verification.
- [ ] Build and tests pass.
- [ ] Documentation is updated where engineering behavior changed.

## 18. Pull Request Workflow

1. Define one bounded objective and inspect the relevant existing implementation.
2. Identify affected layers, contracts, migrations, and tests before editing.
3. Make the smallest coherent implementation change.
4. Run build and tests locally.
5. Update documentation required by the change.
6. Summarize modified files, validation, and known limitations in the pull request.
7. Request review only after the mandatory checks pass.

Every Pull Request MUST pass Build and Tests before review.

## 19. AI Development Workflow

AI assistance MAY be used for repository inspection, implementation, test drafting,
and documentation, but accountability remains with the engineer.

- Engineers MUST define scope and constraints before requesting changes.
- AI-generated output MUST be reviewed against actual repository behavior.
- AI MUST NOT invent endpoints, schema tables, security controls, or integrations.
- Engineers MUST run the required build and tests after AI-assisted changes.
- AI-generated documentation MUST distinguish current implementation from planned work.

The official BIO-EMS AI development workflow assigns responsibilities as follows:

| AI assistant | Primary responsibilities |
| --- | --- |
| ChatGPT | Architecture, engineering review, ADRs, sprint planning, documentation |
| Codex | Implementation, refactoring, build, tests, compilation fixes |

ChatGPT SHOULD help engineers evaluate architecture, review proposed changes, document
decisions, plan sprint work, and maintain project documentation. Codex SHOULD implement
approved changes, perform focused refactoring, run builds and tests, and resolve
compilation issues within the approved scope.

AI does not replace engineering review. Engineers remain responsible for validating
repository state, architectural compliance, test results, and production readiness.

Example: an AI-assisted dashboard change may use the existing domain alarm engine but
MUST NOT change routes or DTOs when the requested scope excludes them.

## 20. Definition of Done

A change is complete only when the applicable checklist is satisfied.

- [ ] Implementation follows the layer and dependency rules.
- [ ] Business behavior is centralized in the Domain layer.
- [ ] New behavior has appropriate automated coverage.
- [ ] Schema changes include migrations and upgrade verification.
- [ ] Existing API contracts are preserved or explicitly documented.
- [ ] Build and tests pass.
- [ ] Error, logging, and configuration impacts are considered.
- [ ] Documentation is part of the Definition of Done.
- [ ] The pull request records modified files and validation results.

## 21. Release Checklist

- [ ] Confirm the intended version and release notes.
- [ ] Run a clean backend build.
- [ ] Run the automated test suite.
- [ ] Verify required environment settings for the target deployment.
- [ ] Protect production SQLite data before any schema migration.
- [ ] Validate migrations on a representative database copy.
- [ ] Confirm InfluxDB URL, organization, bucket, and token configuration.
- [ ] Verify health and relevant API endpoints after deployment.
- [ ] Review logs for migration, MQTT, and telemetry-write failures.
- [ ] Publish the required engineering and operational documentation.

The release owner MUST record any failed or waived checklist item and its approval.

---

## Engineering Motto

> Build software that is understandable,
> maintainable,
> testable,
> observable,
> and safe to evolve.
