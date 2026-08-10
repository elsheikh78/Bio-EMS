# BIO-EMS Development Roadmap

Version: 0.12.0 release candidate

Repository status: Sprint 12 completed on 2026-08-10. Draft PR #2 remains unmerged.

## Phase 1 — Foundation

Completed: project structure, documentation, MQTT and InfluxDB integration, SQLite,
migrations, repositories, Sites, and REST testing foundations.

## Phase 2 — Domain Design

Completed through Sprint 12: Domain model, architecture decisions, database design,
unified Alarm evaluation, and Device lifecycle/trust-boundary rules.

## Phase 3 — Core Modules

- Devices: lifecycle onboarding scope completed in Sprint 12.
- Rooms: implemented baseline; broader management remains planned.
- Sensors: implemented baseline; broader management remains planned.
- Monitoring Points: planned and not implemented.

## Phase 4 — Monitoring

- Telemetry ingestion: implemented.
- Telemetry trust boundary: completed in Sprint 12.
- Alarm Engine: implemented and consolidated in Sprint 11.
- Event Engine and Notification Engine: planned.

## Phase 5 — Management

Users, Roles, Authentication, and Authorization remain planned.

## Phase 6 — Dashboard

Dashboard APIs and threshold-based room status are implemented. Grafana integration
and reports remain planned.

## Sprint 11 — Engineering Foundation and Alarm Consolidation

Completed as version 0.11.0.

## Sprint 12 — Device Onboarding and Telemetry Trust Boundary

Completed as the 0.12.0 release candidate:

- Strict Device REST validation and preserved create/list contracts.
- Device read and approved metadata update APIs.
- `pending/0 -> active/1 -> disabled/0` lifecycle transitions.
- Site existence, foreign-key, and identity uniqueness integrity.
- Device/Site/Sensor telemetry trust-boundary enforcement.
- 113 passing tests across 10 files.
- Successful GitHub Actions backend quality gates on Draft PR #2.

Discovery, QR identification, activation codes, Asset approval, Authentication,
certificates, provisioning, pairing, and heartbeat remain future work. Completion of
the Sprint does not claim merge, tag, GitHub Release, or deployment.

## Phase 7 — Production

OTA Updates, backup, restore, deployment, and production monitoring remain planned.
