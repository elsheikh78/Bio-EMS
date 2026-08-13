# BIO-EMS Project State

**Published version:** [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

**Current phase:** Sprint 14 — S14-05 Monitored Areas frontend

**Current integrated `main` baseline:** `b3f938e8d46fddf6c3e406f38d5ae1f5a28541f1`

**Active feature branch:** `agent/s14-05-monitored-areas`

## Implemented Platform

- TypeScript/Express backend with Controller, Service, Repository, and persistence boundaries.
- SQLite configuration and migration infrastructure plus InfluxDB time-series storage.
- MQTT telemetry ingestion, Alarm evaluation, Dashboard APIs, and core Site/Room/Device/Sensor APIs.
- JWT Authentication with persisted active-User enforcement.
- Centralized role-based authorization and ADMIN-only User Management.
- Transactional protection against disabling or demoting the last active ADMIN.
- Authenticated Alarm acknowledgment with actor audit persistence.
- React frontend architecture, typed localization, responsive AppShell, independent frontend quality gates, authenticated session lifecycle, authorization-aware routing, and an operational Dashboard.

## Release and Repository Timeline

The immutable `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
Later Sprint 13 and Sprint 14 work is current repository development but is not retroactively part of that tagged artifact.

Sprint 13 and S13-08 are closed.

## Sprint 14 State

- **S14-01 — Frontend foundation:** COMPLETE / MERGED / CLOSED.
- **S14-02 — Professional application shell and navigation:** COMPLETE / MERGED / VERIFIED.
- **S14-03 — Authentication, session, and authorization-aware routing:** COMPLETE / MERGED / VERIFIED.
- **S14-04 — Operational Dashboard frontend:** COMPLETE / MERGED / VERIFIED.
- **S14-05 — Monitored Areas frontend:** IN PROGRESS.

### S14-05 Progress

- **S14-05A — Contracts and data access:** COMPLETE / COMMITTED / PUSHED on `agent/s14-05-monitored-areas`.
  - commit `90e39af` — `feat(frontend): add monitored areas data contracts and queries`.
- **S14-05B — Site and Monitored Area hierarchy:** COMPLETE / COMMITTED / PUSHED on the same feature branch.
  - commit `bd442e9` — `feat(frontend): add monitored areas hierarchy view`.
  - final recorded frontend gate: 21/21 test files and 189/189 tests passing.
- **S14-05C — Sensor inventory and threshold metadata:** NOT STARTED / NEXT.
- **S14-05D — Refresh, integration, and hardening:** NOT STARTED.

S14-05A/B are feature-branch progress and are not yet integrated into `main`.

## Domain Boundary

For the S14-05 frontend, **Monitored Area** is presentation terminology for the existing Room domain. The hierarchy is:

**Site → Monitored Area (Room) → Sensor**

No Asset, Monitoring Point, or new Area backend domain has been introduced.

## Deferred State

Monitoring Points, broader Asset/discovery/provisioning workflows, Notification Engine, OTA, deployment, production operations, and other separately scoped future features remain planned unless explicitly implemented and merged.
