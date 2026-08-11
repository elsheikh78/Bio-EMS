# BIO-EMS Development Roadmap

Published version: `v0.13.0`

Repository status: S13-01 through S13-07 are merged; S13-08 closure evidence is
pending independent review. Sprint 14 has not started.

## Phase 1 — Foundation

Completed: project structure, documentation, MQTT and InfluxDB integration, SQLite,
migrations, repositories, Sites, and REST testing foundations.

## Phase 2 — Domain design

Implemented through Sprint 13: Domain model, architecture decisions, database
design, unified Alarm evaluation, Device lifecycle/trust-boundary rules,
Authentication, centralized RBAC, and Alarm acknowledgment actor auditing.

## Phase 3 — Core modules

- Devices: lifecycle onboarding scope implemented.
- Rooms and Sensors: baseline implemented; broader management remains planned.
- Users: ADMIN management implemented with last-active-ADMIN protection.
- Monitoring Points: proposed and not implemented.

## Phase 4 — Monitoring

- Telemetry ingestion and Device/Site/Sensor trust boundary: implemented.
- Alarm Engine and authenticated acknowledgment audit: implemented.
- Event Engine and Notification Engine: planned.

## Phase 5 — Identity and management

JWT Authentication, active-User enforcement, centralized RBAC, and ADMIN User
Management are implemented. Tenant/site-scoped administration beyond current
repository contracts remains future work.

## Phase 6 — Dashboard

Dashboard APIs and threshold-based room status are implemented. Grafana integration
and reports remain planned.

## Sprint 13 — Authentication, RBAC, User Management, and hardening

- S13-01 through S13-04: Authentication foundation and active-User enforcement.
- S13-05: centralized permissions and Alarm acknowledgment actor audit.
- S13-06: ADMIN User Management and transactional last-active-ADMIN protection.
- S13-07: security hardening, concurrency and regression coverage, and dependency cleanup.
- S13-08: documentation correction and closure evidence, pending independent review.

The published `v0.13.0` tag remains fixed at
`ee2cb45832888ff500e02afcbe1418b6144276c6`. S13-06 and S13-07 were merged to
`main` later and are not retroactively attributed to that artifact. Current main CI
run 31504321547 passed with 30 test files and 359 tests.

## Phase 7 — Production

OTA updates, backup, restore, deployment, and production monitoring remain planned.
