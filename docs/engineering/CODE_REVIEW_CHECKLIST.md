# BIO-EMS Code Review Checklist

| Item | Value |
|------|-------|
| Document | Code Review Checklist |
| Version | 1.0 |
| Status | Draft |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This document defines the required Pull Request review standard for the BIO-EMS
backend before merge.

It turns the current layered backend and its established quality checks into a
practical review procedure. It applies to Sprint 11 work and to subsequent changes
that use the same backend structure.

## 2. Scope

The checklist applies to changes in the TypeScript backend, SQLite migrations and
repositories, InfluxDB query/writer modules, MQTT telemetry processing, tests, and
engineering documentation.

It reviews the currently implemented site, device, room, sensor, alarm, telemetry,
and dashboard backend capabilities. It does not define review rules for unimplemented
frontend, notification, reporting, authentication, or authorization features.

## 3. Review Philosophy

Reviewers assess each Pull Request in this priority order:

1. Correctness
2. Architecture
3. Business Rules
4. Maintainability
5. Performance
6. Documentation
7. Coding Style

Correct code that violates architectural ownership is not acceptable. A stylistic
improvement MUST NOT distract from a broken migration, duplicated alarm rule, or
changed API contract.

Reviewers SHOULD make findings actionable, tied to code or documented behavior, and
classified as blocking or non-blocking.

## 4. Mandatory Verification

Every Pull Request MUST provide or receive verification for the following items.

| Verification | Required evidence |
| --- | --- |
| Build | `npm.cmd run build` completes successfully. |
| Tests | `npm.cmd run test:run` completes successfully. |
| Documentation | Relevant engineering, API, or operational documentation is updated. |
| Architecture | The change follows the current layer and dependency boundaries. |

A reviewer MUST request changes when any required verification is absent, failed, or
not applicable without a documented reason.

## 5. Architecture Review

Review architecture before implementation detail.

- [ ] The change is placed in the correct current layer.
- [ ] Dependencies point toward the Domain rather than outward from it.
- [ ] Controllers delegate to services rather than repositories or database clients.
- [ ] Services orchestrate use cases rather than define independent business rules.
- [ ] SQLite access is isolated in repositories.
- [ ] InfluxDB access remains in query/writer modules.
- [ ] MQTT routing remains separate from domain evaluation.
- [ ] No circular import or circular layer dependency is introduced.

Example: a dashboard status change belongs in `DashboardService` plus the Domain
engine when evaluation semantics change; it does not belong in an Influx query.

## 6. Domain Review

Domain review is required whenever a Pull Request changes alarm behavior, statuses,
thresholds, value objects, enums, message keys, or `src/domain/`.

- [ ] Business rules have one authoritative implementation.
- [ ] Threshold comparisons use `AlarmEvaluationEngine` where applicable.
- [ ] Domain code has no Express, SQLite, MQTT, InfluxDB, or configuration import.
- [ ] Null-reading and threshold-boundary behavior is intentional and tested.
- [ ] `AlarmStatus`, severity, color, and message-key changes remain coherent.
- [ ] The change returns domain concepts, not API or persistence shapes.
- [ ] No localized user-facing message is introduced into the Domain.

Example: a value equal to `alarmHigh` MUST be assessed against the engine's inclusive
comparison behavior, not compared differently in a dashboard mapper.

## 7. Repository Review

Repositories provide SQLite persistence access for configuration and alarm records.

- [ ] SQL is confined to repository or migration code.
- [ ] Dynamic SQL values use prepared statement parameters.
- [ ] Repository methods return records/entities, not HTTP responses.
- [ ] Repository changes do not evaluate alarm thresholds or determine severity.
- [ ] Queries use appropriate unique identifiers and relationship keys.
- [ ] New sensor fields are represented consistently in read and write paths.
- [ ] No InfluxDB or MQTT side effect occurs inside a repository method.

Example: `SensorRepository` may return `warning_low` and `alarm_high`; it MUST NOT
return a hand-calculated dashboard `CRITICAL` status.

## 8. Service Review

Services coordinate current use cases across repositories, Domain functions, and
infrastructure modules.

- [ ] The service method has one clear orchestration responsibility.
- [ ] The service does not duplicate a domain threshold or status rule.
- [ ] The service contains no raw SQLite SQL.
- [ ] Expected failures use `AppError` where applicable.
- [ ] The service preserves existing return types and callers unless approved otherwise.
- [ ] Integration calls are awaited and error paths remain visible.
- [ ] Dashboard aggregation resolves sensor configuration before evaluation.

Example: `DashboardService` may combine latest InfluxDB telemetry with
`SensorRepository` thresholds, then map a domain result to the room-status contract.

## 9. API Review

The API boundary consists of routes, controllers, API-facing types, and error
middleware.

- [ ] Routes remain thin HTTP method/path bindings.
- [ ] Controllers do not contain SQL, MQTT calls, or alarm comparison logic.
- [ ] Existing response fields and status behavior remain compatible.
- [ ] DTOs are changed only when the Pull Request explicitly authorizes it.
- [ ] `AppError` codes and HTTP status codes are appropriate and stable.
- [ ] Unknown errors still reach shared error middleware.
- [ ] Dashboard endpoints preserve the room-status, summary, telemetry, and alarm-statistics contracts.

## 10. Database Review

SQLite owns configuration; InfluxDB owns time-series telemetry.

- [ ] Every SQLite schema change has a versioned migration.
- [ ] The migration is registered in `migration-runner.ts`.
- [ ] Fresh database bootstrap has been considered.
- [ ] Existing database upgrade behavior has been verified.
- [ ] Migration recording occurs only after migration work succeeds.
- [ ] SQLite constraints, foreign keys, and unique relationships remain valid.
- [ ] InfluxDB changes preserve measurement, field, and tag semantics used by queries.
- [ ] Configuration thresholds are not moved into InfluxDB.

## 11. Security Review

Security review protects current integration and configuration boundaries.

- [ ] No secret, token, password, or environment value is committed or logged.
- [ ] Database values continue to use bound SQL parameters.
- [ ] API errors do not expose stack traces, database paths, or credentials.
- [ ] MQTT and telemetry input remains validated at its external boundary.
- [ ] InfluxDB token and URL handling remains confined to configuration/client modules.
- [ ] The Pull Request does not imply authentication or authorization is implemented when it is not.

## 12. Performance Review

Performance review is proportionate to the affected path.

- [ ] New loops over telemetry, sensors, alarms, or rooms have bounded and understood cost.
- [ ] Dashboard aggregation does not introduce unnecessary repeated repository lookups.
- [ ] InfluxDB queries retain a bounded range and appropriate latest-value grouping where applicable.
- [ ] SQLite queries avoid needless per-record scans when existing lookup methods can be used.
- [ ] MQTT processing does not block on avoidable synchronous work.
- [ ] Performance claims are supported by code or measurement, not assumption.

Example: build one sensor lookup map in dashboard aggregation rather than querying
SQLite separately for every telemetry record.

## 13. Documentation Review

Documentation review keeps implementation intent discoverable.

- [ ] The Pull Request summary describes scope and validation.
- [ ] Architecture changes reference relevant ADRs or explain why none is required.
- [ ] Database changes document migration behavior when operationally relevant.
- [ ] API changes update the applicable API documentation.
- [ ] Domain rule changes update relevant domain documentation or tests.
- [ ] Documents describe current implementation, not planned features as completed.
- [ ] Documentation links and file paths are accurate.

## 14. Pull Request Outcomes

| Outcome | Meaning | Merge condition |
| --- | --- | --- |
| Approved | Requirements and checks are satisfied. | May merge under repository policy. |
| Approved with Minor Improvements | Non-blocking improvements were identified. | May merge; improvements SHOULD be tracked. |
| Changes Requested | A blocking issue or missing evidence exists. | MUST NOT merge until resolved and re-reviewed. |
| Rejected | Scope, direction, or risk is unacceptable. | MUST NOT merge; a new or re-scoped proposal is required. |

An approval MUST NOT be used to waive a build failure, test failure, or architectural
violation without explicit documented authority.

## 15. Blocking Issues

The following issues MUST block merge:

- Build failure.
- Test failure.
- Missing required build or test evidence.
- Duplicated business rule or threshold evaluation.
- Broken layer dependency or circular dependency.
- SQL inside a service or controller.
- Domain code depending on infrastructure.
- Repository code evaluating alarms or determining business severity.
- Missing migration for a SQLite schema change.
- Broken existing REST API contract without explicit approval.
- Committed secrets or sensitive configuration.

## 16. Non-Blocking Improvements

The following are normally non-blocking when correctness and architecture are intact:

- Clearer names for methods, variables, or tests.
- Formatting and local consistency improvements.
- Small refactoring that does not change behavior.
- Comments that improve understanding of non-obvious code.
- Follow-up test expansion where the changed behavior is already adequately covered.

Reviewers MAY request these improvements before merge when they materially improve
maintainability or when the Pull Request scope already includes the affected code.

## 17. Final Review Checklist

Before selecting an outcome, the reviewer MUST confirm:

- [ ] The Pull Request objective and affected behavior are understood.
- [ ] Build passed.
- [ ] Tests passed.
- [ ] Domain rules remain centralized and pure.
- [ ] Repository access remains persistence-only.
- [ ] Services contain orchestration, not SQL or duplicate policy.
- [ ] Routes and controllers preserve the API boundary.
- [ ] SQLite changes have a migration and upgrade consideration.
- [ ] InfluxDB and MQTT changes preserve their current integration boundaries.
- [ ] No secrets or unsafe error disclosure were introduced.
- [ ] Performance impact is reasonable for the affected path.
- [ ] Documentation and Pull Request summary are sufficient.
- [ ] All blocking comments are resolved.

## 18. Cross References

| Document | Review use |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Build, test, documentation, and delivery expectations. |
| `docs/engineering/ARCHITECTURE_PRINCIPLES.md` | Layer ownership and dependency constraints. |
| `docs/engineering/DOMAIN_GUIDELINES.md` | Domain purity and alarm-rule ownership. |

## 19. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Draft | Initial Sprint 11 Pull Request review standard. |
