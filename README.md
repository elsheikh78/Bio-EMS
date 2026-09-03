# BIO-EMS

![Source Version](https://img.shields.io/badge/source-0.19.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

Enterprise Environmental Monitoring System for pharmaceutical cold rooms, warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other regulated environments.

**Release prepared for publication:** `v0.19.0`.
**Current source-software version:** `0.19.0`.

## Documentation Authority — Read This First

| Need | Authoritative document |
| --- | --- |
| Where is the whole project now? | [`PROJECT_STATE.md`](PROJECT_STATE.md) — **single current-state authority** |
| What is the approved software/product execution plan and exact next package? | [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) |
| What is the approved SYSTEM_OWNER installation and RBAC plan? | [`docs/project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md`](docs/project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md) |
| What is the approved customer Windows installer plan? | [`docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md`](docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md) |
| What exactly is active P7 scope? | [`docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`](docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md) |
| How is SYSTEM_OWNER bootstrapped and Platform JWT configured safely? | [`docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md`](docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md) |
| What is the latest P7 closure evidence? | [`docs/project-management/P7-03-08-SOFTWARE-PRODUCT-CLOSURE-2026-09-02.md`](docs/project-management/P7-03-08-SOFTWARE-PRODUCT-CLOSURE-2026-09-02.md) |
| What is the P8-02 through P8-08 closure evidence? | [`docs/project-management/P8-02-08-SOURCE-CLOSURE-2026-09-02.md`](docs/project-management/P8-02-08-SOURCE-CLOSURE-2026-09-02.md) |
| What did the current documentation audit conclude? | [`docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md`](docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md) |
| What is the hardware validation path? | [`docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`](docs/hardware/BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md) |
| Historical Sprint/BF/PVR progress | [`docs/SPRINT_PROGRESS.md`](docs/SPRINT_PROGRESS.md) — historical ledger only |

**Rule:** if a historical document conflicts with current status, `PROJECT_STATE.md` controls.

## Current Position

**The approved P0-P7 software scope is SOFTWARE PRODUCT COMPLETE.** P7-03 through P7-08 closed through PR #145 / CI run #522 / merge `3798277bea14820632c8e1edd0b83df91f8f7084`.

- **P0:** software complete / merged / CI verified.
- **P1:** software complete / merged / CI verified; live notification-provider/field evidence remains external.
- **P2:** software complete / merged / CI verified; physical controller qualification remains external.
- **P3:** software complete / merged / CI verified; physical commissioning and customer acceptance remain external.
- **P4:** software controls complete / merged / CI verified; production restore/endurance/DR evidence remains external.
- **P5:** SYSTEM_OWNER backend/domain commercial operations complete / merged / CI verified.
- **P6:** source productization complete / merged / CI verified; deployment, UAT, sign-off, and production acceptance remain external.
- **P7-01:** SYSTEM_OWNER frontend boundary and console shell complete / merged / CI verified through PR #141.
- **P7-02:** Customer / Site Fleet Management complete / merged / CI verified through PR #142 / CI run #516 / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`.
- **P7-03 through P7-08:** complete / merged / CI verified through PR #145.
- **P8-01:** provider source complete / merged / CI verified; live SMTP send and inbox arrival passed on 3 September 2026; WhatsApp and end-to-end dual-channel evidence remain open because Meta developer registration is still blocked.
- **P8-02 through P8-08:** source complete / merged / CI verified through PR #152 / CI run #537 / merge `0666dd2bbf837c80cf52542062cf7cdd9a337907`; physical receipt, field Commissioning and customer acceptance remain external.

BIO EGYPT Pilot remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Approved Full Offline Windows Installer

DEP-01 is approved later software scope. It will deliver one offline customer
Production Setup that installs BIO-EMS and required runtimes/services automatically,
plus a separate technician Commissioning Package. It includes first-run
configuration, Windows service startup, post-install health verification, and
data-safe Repair/Upgrade/Uninstall requirements. Implementation and clean-machine
qualification have not started and are not implied by P6 productization.

Controlled plan:
[`docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md`](docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md).

## P8 Installation Provisioning and RBAC

The application now provides explicit customer ownership, the approved customer-role
matrix, SYSTEM_OWNER-managed customer ADMIN accounts, controlled configuration
revisions and checksums, device receipt evidence, safe configuration activation,
technical Commissioning and independent customer ADMIN acceptance. See the P8 plan
and closure record above for the exact software/evidence boundary.

The global language control persists Arabic/English selection and applies RTL/LTR across both SYSTEM_OWNER and customer operations. Customer navigation, monitoring, Alarm, Device, delivery, calibration, reporting, configuration, User/Audit and Workspace surfaces use Arabic copy when Arabic is selected; controlled report requests also use the selected language.

Global localization integration evidence: PR #155 / CI run #543 / merge `e0f305c2286ff577f20df076b64118e327a5ba0c`.

## P7 Final Product Completion (Historical)

P7 consists of eight controlled work packages:

1. SYSTEM_OWNER frontend boundary and console shell — complete.
2. Customer / Site fleet management — complete.
3. License lifecycle and installation-binding UI — complete.
4. Update-entitlement and release-eligibility UI — complete.
5. Maintenance, calibration and support fleet operations — complete.
6. Product UX and legacy cleanup — complete.
7. End-to-end product workflow review — complete.
8. Full regression, documentation reconciliation and software-product closure — complete.

P7-01 through P7-08 are complete, merged and CI verified; external provider, physical, field, UAT and production evidence remain separately controlled.

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
- P7-01 isolated SYSTEM_OWNER login/session/route boundary and bilingual owner console shell.
- P7-02 owner customer fleet list/detail/create workflow with recorded Site/installation context and commercial provenance.

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

Before testing or developing the SYSTEM_OWNER surface, follow [`docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md`](docs/deployment/SYSTEM-OWNER-BOOTSTRAP-AND-PLATFORM-JWT.md); never commit real owner credentials or Platform JWT secrets.

For continuation, read `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, and the latest P7 closure record. P7 software is closed; remaining work is in the separately controlled external evidence/acceptance tracks or later explicitly approved software scope.
