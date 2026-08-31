# BIO-EMS

![Source Version](https://img.shields.io/badge/source-0.17.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

Enterprise Environmental Monitoring System for pharmaceutical cold rooms, warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other regulated environments.

**Latest published tagged release:** `v0.15.0` until the prepared `v0.17.0` tag/release is published.  
**Current source-software version:** `0.17.0`.

## Documentation Authority — Read This First

BIO-EMS uses one current-state authority and separate execution/evidence tracks:

| Need | Authoritative document |
| --- | --- |
| Where is the whole project now? | [`PROJECT_STATE.md`](PROJECT_STATE.md) — **single current-state authority** |
| What is the approved software/product execution plan? | [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) |
| What did the latest audit conclude / where does the next session start? | [`docs/project-management/SESSION-HANDOFF-AUDIT-2026-08-31.md`](docs/project-management/SESSION-HANDOFF-AUDIT-2026-08-31.md) |
| What is the hardware validation path? | [`docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`](docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md) |
| What changed in hardware protection/BOM/cable planning? | [`docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md`](docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md) |
| Historical Sprint/BF/PVR progress | [`docs/SPRINT_PROGRESS.md`](docs/SPRINT_PROGRESS.md) — historical ledger only |

**Rule:** if a historical document conflicts with current status, `PROJECT_STATE.md` controls. Detailed closure/audit/hardware documents are evidence for their specific track; they do not become competing project-state files.

## Current Position

- **P0:** software complete / merged / CI verified.
- **P1:** software complete / merged / CI verified; live notification-provider/field evidence remains external.
- **P2:** software complete / merged / CI verified through PR #124, including full BF-08 durable recovery and durable replay acceptance. Physical controller qualification remains external.
- **P3:** partial / next controlled software-product phase.
- **P4:** partial production-hardening foundation; operational/endurance evidence remains open.
- **P5:** SYSTEM_OWNER/commercial foundation implemented; broader fleet/customer/license/update operations remain open.
- **P6:** productization/deployment/acceptance open.

BIO EGYPT Pilot remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Hardware Track

The hardware track is deliberately independent from software-complete claims.

Current approved direction is **initial test kit first, then HV validation; do not buy the complete Pilot quantity yet**.

Primary controlled hardware plan:

[`docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`](docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md)

It defines the Standard V1 initial test kit and the HV-01 onward validation sequence covering controller bring-up, DS18B20 identity/acquisition, MQTT/BIO-EMS ingestion, Alarm behavior, Internet-loss/SIM800L failover, power stability, disconnect/reconnect, cable/field simulation, and the remaining controlled hardware gates.

Protection/BOM/cable decisions are tracked separately in:

[`docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md`](docs/hardware/HARDWARE-PROTECTION-BOM-CABLE-UPDATE-2026-08-27.md)

Hardware scope uses industrial DS18B20 temperature sensing, Standard/Advanced hardware tiers, ESP32-family controller direction, and SIM800L as the SMS-only fallback candidate. Final component approval requires actual validation evidence; a datasheet, discussion, or BOM entry alone is not a Pilot PASS.

## Platform Capabilities

BIO-EMS currently includes:

- TypeScript/Express backend and React/TypeScript/Vite frontend.
- SQLite configuration/operational persistence and InfluxDB telemetry storage.
- MQTT telemetry ingestion with TLS/QoS and LIVE/REPLAY recovery semantics.
- Alarm evaluation, configurable thresholds and warning/critical persistence delays.
- Operational Dashboard and Monitored Areas with authenticated telemetry-driven refresh.
- JWT authentication, active-User enforcement, centralized RBAC, ADMIN User Management, and isolated SYSTEM_OWNER boundary.
- Append-only Audit, Alarm acknowledgment evidence, calibration history, and Device communication-health evidence.
- Notification recipients, escalation configuration, durable notification events/delivery operations, and SMS failover contracts/runtime.
- BF-08 Site Controller offline-critical configuration synchronization.
- Reporting Center with Calibration History, Temperature Performance, Alarm History, Device Communication Health, and Audit and Operations in Preview/CSV/PDF workflows.
- P2 Site Controller host-side runtime sequence: deterministic runtime/watchdog, configuration receipt/integrity, durable known-good configuration, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover, reconnect reconciliation, health evidence, bench qualification gate, and durable replay acceptance.

## Release / Version Rule

`VERSION` is the product source-version authority. The backend package metadata must match it. The frontend package remains a private scaffold (`0.0.0`) and is not an independently published product package. Published Git tags/releases are immutable release artifacts and may lag the source version while a release-preparation PR is in progress.

## Architecture Boundary

Frontend **Monitored Area** is presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is currently claimed.

## Evidence Boundary

Repository CI can establish source-software completion. It does not establish physical installation or operational acceptance.

Still requiring external evidence include physical controller/hardware validation, live SIM800L delivery, deployed MQTT/endurance tests, the controlled 72-hour hardware gate where required, BIO EGYPT installation/calibration/commissioning, customer/Quality UAT, sign-off, and production acceptance.

## Development

**Backend:** TypeScript / Express  
**Frontend:** React / TypeScript / Vite  
**License:** Proprietary

For development continuation, synchronize local `main` from GitHub first, then read `PROJECT_STATE.md`. Do not use old Sprint documents as the current project status.