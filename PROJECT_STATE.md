# BIO-EMS Project State

**Published version:** [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

**Current phase:** Sprint 14 — S14-02 application shell review

**Main baseline:** `cc699124bdf49d67cd692d559899642b8d0cfabe`

## Implemented platform

- TypeScript/Express backend with Controller, Service, Repository, and persistence boundaries.
- SQLite configuration and migration infrastructure plus InfluxDB time-series storage.
- MQTT telemetry ingestion, Alarm evaluation, Dashboard APIs, and core Site/Room/Device/Sensor APIs.
- JWT Authentication with persisted active-User enforcement.
- Centralized role-based authorization and ADMIN-only User Management.
- Transactional protection against disabling or demoting the last active ADMIN.
- Authenticated Alarm acknowledgment with actor audit persistence.
- React frontend foundation with typed localization, responsive shell architecture,
  and independent frontend quality gates.

## Sprint 13 delivered state

S13-01 through S13-07 are implemented and merged. Authentication identifies the
active persisted User; authorization applies centralized permissions; resource
ownership remains a separate data-boundary concern. ADMIN User Management includes
list, create, profile/role update, status update, and password replacement APIs.

S13-07 added rejected-input MQTT log sanitization, User Management regression and
concurrency coverage, and removed the unused direct `yamljs` dependency without
changing public API contracts.

## Release and repository timeline

The immutable `v0.13.0` tag targets
`ee2cb45832888ff500e02afcbe1418b6144276c6`. S13-06 and S13-07 were merged to
`main` after that tag, so they are current repository capabilities but are not
retroactively part of the tagged artifact.

Current `main` passed CI run 31504321547 with 30 test files and 359 passing tests,
and zero failed, skipped, or todo tests.

## Closure and Sprint 14 state

Sprint 13 and S13-08 are closed. S14-01 was merged through PR #10 and formally closed
after CI run 31520085478 attempt 2 completed successfully. Sprint 14 has started.

S14-02 implements the professional responsive application shell on a Draft PR pending
independent review. It is not closed. S14-03 authentication/session work has not
started.

## Deferred state

Monitoring Points, broader Asset/discovery/provisioning workflows, Notification
Engine, operational frontend features, authentication/session UI, OTA, deployment,
and production operations remain planned unless separately authorized.
