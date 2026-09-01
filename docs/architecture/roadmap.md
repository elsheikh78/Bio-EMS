# BIO-EMS Development Roadmap

**Roadmap state:** 1 September 2026  
**Latest published tagged release:** `v0.17.0`  
**Current source-software version:** `0.18.0`

`PROJECT_STATE.md` is the single authoritative current-state document. This roadmap describes the forward product path and must not be used to infer completion of physical, field, provider, UAT, or customer-acceptance gates.

## Delivered Software Baseline

The repository has completed, merged, and CI-verified the controlled P0-P6 source-software sequence.

### Foundation and Core Platform — COMPLETE

- TypeScript/Express backend and React frontend.
- SQLite configuration/versioned migrations and InfluxDB time-series storage.
- MQTT telemetry ingestion and unified Alarm evaluation.
- Site, Room/Monitored Area, Device, Sensor, User, reporting, notification, audit, and operational APIs.
- JWT Authentication, active-User enforcement, centralized RBAC, ADMIN User Management, and isolated SYSTEM_OWNER trust boundary.
- Device onboarding lifecycle and telemetry trust-boundary enforcement.
- Dashboard and Monitored Areas with authenticated telemetry-driven refresh plus polling fallback.

### P0 — Professional Software / Reporting Baseline — COMPLETE

All five controlled report families support Preview/CSV/PDF: Calibration History, Temperature Performance, Alarm History, Device Communication Health, and Audit & Operations.

### P1 — Notification Delivery Engine — SOFTWARE COMPLETE

Durable delivery queue, worker/runtime, SMS-provider boundary, Alarm escalation orchestration, and protected Delivery Operations are implemented and CI verified. Live provider evidence remains external.

### P2 — Site Controller Runtime — SOFTWARE COMPLETE

P2-01 through P2-09 plus durability hardening are merged and CI verified, including deterministic runtime behavior, BF-08 configuration receipt/integrity, durable known-good recovery, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover contract/runtime, reconnect reconciliation, controller-health evidence, qualification gates, and durable replay acceptance.

Physical controller/DS18B20/SIM800L/MQTT bench qualification remains external.

### P3 — Pilot Commissioning Tooling — SOFTWARE COMPLETE

Commissioning sessions/checks, append-only evidence/deviations/decisions, Site-scoped APIs, configuration/mapping/calibration verification, functional-test orchestration, commissioning UI, CSV/PDF commissioning records, and BIO EGYPT software dry-run/UAT package are complete. Field commissioning and customer acceptance remain open.

### P4 — Production Hardening — SOFTWARE CONTROLS COMPLETE

Production-hardening controls covering deployment validation, backup/restore, process supervision, configuration/secrets boundaries, TLS/QoS, persistence/recovery, observability, retention, upgrade/rollback, and disaster-recovery evidence structures are implemented. Production execution evidence remains external.

### P5 — SYSTEM_OWNER / Commercial Operations — SOFTWARE COMPLETE

The isolated SYSTEM_OWNER trust domain and approved commercial-operations workflows are implemented without exposing SYSTEM_OWNER administration/discovery to customer ADMIN users. Billing/payment execution and live commercial operations remain external or later scope where applicable.

### P6 — Productization / Deployment / Acceptance — SOFTWARE PRODUCTIZATION COMPLETE

Controlled productization/deployment/acceptance tooling and documentation are complete at source level through PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`.

## Current Forward Roadmap — External Evidence and Field Execution

The next work is not a repeat of P0-P6 source implementation. It is controlled execution and evidence collection:

1. Procure and assemble the initial controller test kit.
2. Execute hardware validation HV-01 through HV-15 for Standard/Advanced controller paths as applicable.
3. Prove power interruption/restart and durable configuration recovery on physical hardware.
4. Prove industrial DS18B20 disconnect/reconnect, fault, excursion, and recovery behavior.
5. Prove SIM800L live emergency SMS behavior with controlled recipients.
6. Prove deployed MQTT disconnect/recovery and LIVE/REPLAY behavior.
7. Execute the required endurance run, including the controlled 72-hour gate where applicable.
8. Install and commission the BIO EGYPT Phase-1 temperature-only Pilot.
9. Capture calibration, Alarm, commissioning, UAT, Quality/customer sign-off, and acceptance evidence through the implemented tooling.
10. Execute production deployment/restore/rollback/DR evidence before claiming production acceptance.

## BIO EGYPT Phase-1 Boundary

The controlled Pilot remains temperature-only using industrial DS18B20 sensors across two Sites, total 20 Sensors. Repository completion does not mean those Sensors/controllers are installed, commissioned, or accepted.

## Product Expansion After Evidence Gates

Potential later scope includes broader Asset/discovery/provisioning, Monitoring Point/Asset domain expansion where formally approved, OTA delivery, production hardware/firmware adapters, additional environmental parameters and industry verticals, billing/payment execution, and broader fleet/commercial operations.

## Domain Boundary

Frontend **Monitored Area** remains presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is claimed as implemented by this roadmap.

## Release Boundary

`v0.17.0` remains the latest published tagged release while the repository source-software version is `0.18.0`. A later release must be explicitly tagged and published before it is described as the latest published release.

Software completion, CI verification, physical qualification, provider evidence, field commissioning, UAT, and customer/production acceptance are separate gates.