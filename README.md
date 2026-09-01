# BIO-EMS

![Source Version](https://img.shields.io/badge/source-0.18.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

Enterprise Environmental Monitoring System for pharmaceutical cold rooms, warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other regulated environments.

**Latest published tagged release:** `v0.17.0`.  
**Current source-software version:** `0.18.0`.

## Documentation Authority — Read This First

| Need | Authoritative document |
| --- | --- |
| Where is the whole project now? | [`PROJECT_STATE.md`](PROJECT_STATE.md) — **single current-state authority** |
| What is the approved software/product execution plan? | [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) |
| What exactly is active P7 scope? | [`docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`](docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md) |
| What did the current documentation audit conclude? | [`docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md`](docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md) |
| What is the hardware validation path? | [`docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`](docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md) |
| Historical Sprint/BF/PVR progress | [`docs/SPRINT_PROGRESS.md`](docs/SPRINT_PROGRESS.md) — historical ledger only |

**Rule:** if a historical document conflicts with current status, `PROJECT_STATE.md` controls.

## Current Position

P0-P6 are the delivered/CI-verified source baseline at their documented gates. A post-P6 product audit approved **P7 — Final Product Completion** because the complete approved product surface still needs owner-facing commercial UI/workflows and a final end-to-end product closure pass.

- **P0:** software complete / merged / CI verified.
- **P1:** software complete / merged / CI verified; live notification-provider/field evidence remains external.
- **P2:** software complete / merged / CI verified; physical controller qualification remains external.
- **P3:** software complete / merged / CI verified; physical commissioning and customer acceptance remain external.
- **P4:** software controls complete / merged / CI verified; production restore/endurance/DR evidence remains external.
- **P5:** SYSTEM_OWNER backend/domain commercial operations complete / merged / CI verified; approved owner-facing product UI/workflows are assigned to P7.
- **P6:** source productization complete / merged / CI verified; deployment, UAT, sign-off, and production acceptance remain external.
- **P7:** **approved / planned / not yet implemented** — final software-product completion phase.

BIO EGYPT Pilot remains **NOT COMMISSIONED / NOT ACCEPTED**.

## P7 Final Product Completion

P7 consists of eight controlled work packages:

1. SYSTEM_OWNER frontend boundary and console shell.
2. Customer / Site fleet management.
3. License lifecycle and installation-binding UI.
4. Update-entitlement and release-eligibility UI.
5. Maintenance, calibration and support fleet operations.
6. Product UX and legacy cleanup.
7. End-to-end product workflow review.
8. Full regression, documentation reconciliation and software-product closure.

BIO-EMS must not be described as **SOFTWARE PRODUCT COMPLETE** for the approved scope until P7 is implemented, merged, and CI verified.

## Hardware Track

The hardware track remains deliberately independent from software-complete claims. Current approved direction is initial test kit first, then HV validation; do not infer Pilot hardware acceptance from repository status.

Primary controlled hardware plan: [`docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`](docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md).

Hardware scope uses industrial DS18B20 temperature sensing, Standard/Advanced hardware tiers, ESP32-family controller direction, and SIM800L as the SMS-only fallback candidate. Final component approval requires actual validation evidence.

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
- P2 Site Controller host-side runtime and recovery/qualification software gates.
- P3 Site-scoped commissioning sessions, evidence/deviations/decisions, readiness UI, and CSV/PDF commissioning records.
- P4 production-hardening controls.
- P5 isolated SYSTEM_OWNER customer, license/update-entitlement, and maintenance oversight backend/domain workflows with append-only provenance.
- P6 controlled `0.18.0` release manifest and machine-checkable release-package validation.

## Architecture Boundary

Frontend **Monitored Area** is presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is currently claimed.

## Evidence Boundary

Repository CI can establish source-software completion. It does not establish physical installation or operational acceptance.

Still requiring external evidence include physical controller/hardware validation, live SIM800L delivery, deployed MQTT/endurance tests, the controlled 72-hour hardware gate where required, BIO EGYPT installation/calibration/commissioning, customer/Quality UAT, sign-off, and production acceptance.

Payment/invoicing integration and live remote OTA/update execution are also not implied by P5/P7 unless separately implemented and verified.

## Development

**Backend:** TypeScript / Express  
**Frontend:** React / TypeScript / Vite  
**License:** Proprietary

For development continuation, synchronize local `main` from GitHub first, then read `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, and the P7 plan. Do not use old Sprint documents as the current project status.