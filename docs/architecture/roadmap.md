# BIO-EMS Development Roadmap

Published version: `v0.13.0`

Repository status: Sprints 13 through 15 are complete, merged, verified, and closed.
The current phase is controlled BIO EGYPT field-pilot preparation; field
commissioning and Pilot acceptance remain unexecuted.

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
- Durable Alarm and Device notification events: implemented.
- Delivery-channel provider implementations beyond the approved SMS failover contract: planned.

## Phase 5 — Identity and Management

JWT Authentication, active-User enforcement, centralized RBAC, and ADMIN User Management are implemented. Sprint 14 additionally provides the frontend Login/session lifecycle and authorization-aware routing established in S14-03.

## Phase 6 — Operational Frontend

- S14-01: frontend architecture, providers, localization contract, and quality foundation — complete.
- S14-02: professional responsive AppShell and navigation — complete.
- S14-03: Login, session restoration, protected-request boundary, and authorization-aware routing — complete.
- S14-04: operational Dashboard frontend — complete.
- S14-05: Monitored Areas frontend — complete, merged, and verified.
  - S14-05A contracts/data access — complete.
  - S14-05B Site → Monitored Area hierarchy — complete.
  - S14-05C Sensor inventory and threshold metadata — complete.
  - S14-05D refresh/retry/integration/hardening — complete.

For S14-05, Monitored Area is presentation terminology for the existing Room domain. No new Asset or Monitoring Point backend domain is introduced.

## Post-Sprint-15 Product Readiness Priorities

After Sprint 15 closure, BIO-EMS must complete controlled field evidence before the
first reference deployment is treated as commissioned or accepted.

### Hardware / Pilot Readiness

- Perform a formal Hardware Design Review against the accepted hardware, Device, Zone Controller, wiring, onboarding, and communications ADRs before committing to production hardware.
- Use the ESP32-based controller architecture as the starting point unless the review identifies a concrete technical or lifecycle reason to change it.
- Optimize hardware for **low cost, reliability, and manufacturability** together; BOM reduction must not compromise field reliability or required industrial protection.
- Prefer modular hardware so installations pay only for required interfaces and capabilities.
- Prepare an MVP suitable for a real customer pilot/reference installation, including commissioning, telemetry continuity, alarm verification, calibration evidence, and acceptance evidence.
- Use lessons from the first field deployment to drive subsequent BOM cost-down and hardware revisions.

### Commercial-Grade UI/UX

- Treat professional, visually compelling user interfaces as a product requirement, not optional cosmetic polish.
- Preserve operational clarity, accessibility, responsive behavior, localization readiness, and performance while improving visual presentation.
- Maintain a coherent BIO-EMS design language across Login, Application Shell, Dashboard, Monitored Areas, Alarms, Devices, Configuration, and subsequent operational screens.
- After the functional Sprint 14 scope is complete, perform a dedicated UI/UX Professionalization Pass rather than rebuilding the frontend architecture.
- The first customer demo/reference deployment must present a polished commercial product experience in addition to correct engineering behavior.

These two tracks are complementary: the first reference installation must combine field-reliable, cost-conscious hardware with a professional customer-facing software experience.

## Phase 7 — Future Product Expansion

Planned work includes broader Device discovery/provisioning, Assets, Monitoring Points,
delivery-channel implementations, additional operational screens, reports, and
approved industry-specific capabilities.

## Phase 8 — Production Operations

Pilot deployment validation, backup/restore procedures, and rollback guidance are
implemented. Field execution, broader production monitoring, commercial operations,
and OTA updates remain separately scoped.

## Release Boundary

The published `v0.13.0` tag remains fixed at
`ee2cb45832888ff500e02afcbe1418b6144276c6`. Later Sprint 13 work and all Sprint 14
and Sprint 15 work are newer repository development and are not retroactively
attributed to that immutable release artifact.
