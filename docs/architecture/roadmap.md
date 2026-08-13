# BIO-EMS Development Roadmap

Published version: `v0.13.0`

Repository status: Sprint 13 is closed. Sprint 14 is in progress. S14-01 through S14-04 are complete and merged. S14-05A and S14-05B are complete on the active Monitored Areas feature branch; S14-05C is the next implementation slice.

## Phase 1 — Foundation

Completed: project structure, documentation, MQTT and InfluxDB integration, SQLite, migrations, repositories, Sites, and REST testing foundations.

## Phase 2 — Domain Design

Implemented through Sprint 13: Domain model, architecture decisions, database design, unified Alarm evaluation, Device lifecycle/trust-boundary rules, Authentication, centralized RBAC, and Alarm acknowledgment actor auditing.

## Phase 3 — Core Modules

- Devices: lifecycle onboarding scope implemented.
- Rooms and Sensors: baseline backend domains implemented; broader management remains separately scoped.
- Users: ADMIN management implemented with last-active-ADMIN protection.
- Monitoring Points: proposed and not implemented.

## Phase 4 — Monitoring

- Telemetry ingestion and Device/Site/Sensor trust boundary: implemented.
- Alarm Engine and authenticated acknowledgment audit: implemented.
- Event Engine and Notification Engine: planned.

## Phase 5 — Identity and Management

JWT Authentication, active-User enforcement, centralized RBAC, and ADMIN User Management are implemented. Sprint 14 additionally provides the frontend Login/session lifecycle and authorization-aware routing established in S14-03.

## Phase 6 — Operational Frontend

- S14-01: frontend architecture, providers, localization contract, and quality foundation — complete.
- S14-02: professional responsive AppShell and navigation — complete.
- S14-03: Login, session restoration, protected-request boundary, and authorization-aware routing — complete.
- S14-04: operational Dashboard frontend — complete.
- S14-05: Monitored Areas frontend — in progress.
  - S14-05A contracts/data access — complete on `agent/s14-05-monitored-areas`.
  - S14-05B Site → Monitored Area hierarchy — complete on the same feature branch.
  - S14-05C Sensor inventory and threshold metadata — next.
  - S14-05D refresh/integration/hardening — planned after C.

For S14-05, Monitored Area is presentation terminology for the existing Room domain. No new Asset or Monitoring Point backend domain is introduced.

## Phase 7 — Future Product Expansion

Planned work includes broader Device discovery/provisioning, Assets, Monitoring Points, Notification Engine, additional operational screens, reports, and approved industry-specific capabilities.

## Phase 8 — Production Operations

OTA updates, backup, restore, deployment, and production monitoring remain planned.

## Release Boundary

The published `v0.13.0` tag remains fixed at `ee2cb45832888ff500e02afcbe1418b6144276c6`. Later Sprint 13 and Sprint 14 work is newer repository development and is not retroactively attributed to that immutable release artifact.
