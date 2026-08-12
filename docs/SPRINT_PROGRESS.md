# Sprint Progress

## Sprint 09 — REST API Foundation

Status: Completed

- Alarm REST API, Controller, Routes, AppError integration, validation, and API
  development standard.

## Sprint 10 — Dashboard Backend

Status: Completed

- Dashboard summary, latest telemetry, room status, alarm statistics, aggregation,
  and generic telemetry queries.

## Sprint 11 — Engineering Foundation and Alarm Consolidation

Status: Completed — version 0.11.0

- Unified Alarm Domain Engine, warning thresholds, migrations, and quality tooling.

## Sprint 12 — Device Onboarding and Telemetry Trust Boundary

Status: Completed — version 0.12.0 release candidate

- [x] Device request validation and characterization tests
- [x] Device Repository, Service, Controller, and Routes
- [x] Device create and list contract preservation
- [x] Device read and approved metadata update
- [x] Device registration with Site and identity constraints
- [x] Device activation and disablement lifecycle
- [x] Telemetry Device/Site/Sensor trust policy
- [x] REST integration and acceptance coverage
- [x] GitHub Actions backend quality gates
- [x] 113 tests passing across 10 test files

Deferred: discovery, QR identification, activation codes, Asset approval,
Authentication, provisioning/pairing, heartbeat/last-seen, and Monitoring Points.

Draft PR #2 remains unmerged; no tag, GitHub Release, or deployment is recorded.

## Sprint 13 — Authentication, RBAC, and User Management

Status: Completed

- S13-01 through S13-08 are merged and closed.
- The published `v0.13.0` tag remains unchanged; later merged Sprint 13 work is not
  retroactively part of that artifact.

## Sprint 14 — Frontend Application

Status: In progress

- [x] S14-01 frontend architecture and project foundation — merged and formally closed
- [ ] S14-02 professional responsive application shell — implemented on a Draft PR,
  pending independent review
- [ ] S14-03 authentication, session, and authorization-aware routing — not started

Assets and Monitoring Points remain proposed and are not frontend or Backend contracts.
