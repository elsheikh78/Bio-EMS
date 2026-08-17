# BIO-EMS Project State

**Published version:** [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

**Current phase:** Sprint 15 — Pilot Readiness Foundation

**Current integrated `main` baseline:** `f22945ccc5ce9d97a4991b6b923814d04802ade5`

**Current work item:** S15-05 — SMS Failover Contract

## Implemented Platform

- TypeScript/Express backend with Controller, Service, Repository, and persistence boundaries.
- SQLite configuration and versioned migration infrastructure plus InfluxDB time-series storage.
- MQTT telemetry ingestion, Alarm evaluation, Dashboard APIs, and Site/Room/Device/Sensor APIs.
- Device onboarding lifecycle and telemetry trust-boundary enforcement.
- JWT Authentication, active-User enforcement, centralized RBAC, and ADMIN User Management.
- Authenticated Alarm acknowledgment with actor audit persistence.
- React frontend foundation, responsive AppShell, authenticated session lifecycle,
  authorization-aware routing, operational Dashboard, and Monitored Areas.
- Sensor product-grade, hardware, installation, and current calibration-state foundation.
- Append-only, actor-audited Sensor calibration history.
- Trusted Device heartbeat/telemetry communication health with derived read-time states.
- Durable channel-independent Alarm and Device communication notification events.

## Release and Repository Timeline

The immutable `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
Later Sprint 13, Sprint 14, and Sprint 15 work is current repository development and
is not retroactively part of that tagged artifact.

- Sprint 13: COMPLETE / MERGED / CLOSED.
- Sprint 14: COMPLETE / MERGED / CLOSED.
- Sprint 15: IN PROGRESS.

## Sprint 15 State

- **S15-01 — Sensor Lifecycle & Calibration Foundation:** COMPLETE / MERGED / VERIFIED / CLOSED.
  - feature commit: `bb3873424a566ef43a18e12b732b9f252bfa99ff`;
  - PR: #21;
  - merge commit: `d0a800dea252907d5f2a942571add2528a29666f`;
  - backend and frontend GitHub CI quality gates: PASS.
- **S15-02 — Calibration History:** COMPLETE / MERGED / VERIFIED / CLOSED through PR #23.
- **S15-03 — Device / Communication Health:** COMPLETE / MERGED / VERIFIED / CLOSED through PR #25.
- **S15-04 — Notification Architecture:** COMPLETE / MERGED / VERIFIED / CLOSED through PR #28.
- **S15-05 — SMS Failover Contract:** IN PROGRESS on `agent/s15-05-sms-failover-contract`.
- **S15-06 — BIO EGYPT Pilot Documentation:** NOT STARTED.
- **S15-07 — Deployment & Commissioning Readiness:** NOT STARTED.

## S15-01 Boundary

S15-01 introduced backward-compatible current Sensor metadata for product grade,
hardware model, installation date, calibration status and dates, calibration offset,
and certificate reference through SQLite migration 005 and strict Sensor request
validation.

Calibration history was deliberately excluded. Persistent, non-overwritable
calibration records belong to S15-02.

No frontend, telemetry, MQTT, Alarm Engine, Device lifecycle, authentication,
authorization-policy, notification, or deployment behavior changed in S15-01.

## Domain Boundary

For the frontend, **Monitored Area** remains presentation terminology for the existing
Room domain:

**Site → Monitored Area (Room) → Sensor**

No Asset, Monitoring Point, or separate Area backend domain has been introduced.

## Deferred State

Monitoring Points, broader Asset/discovery/provisioning workflows, OTA, production
operations, and other separately scoped capabilities remain deferred unless a later
approved Sprint 15 work item implements them.
