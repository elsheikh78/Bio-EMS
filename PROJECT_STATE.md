# BIO-EMS Project State

**State date:** 1 September 2026

**Latest published tagged release:** `v0.17.0`

**Current source-software version:** `0.17.0`

**Current phase:** P3 Pilot Commissioning Tooling is in active implementation. P3-01 Commissioning Evidence Foundation is complete and P3-02 Commissioning Session Domain/Persistence is complete at source level pending final CI/merge. P2 Site Controller software remains complete; physical controller qualification and BIO EGYPT Pilot commissioning remain external evidence gates.

## Current controlled continuation

1. Treat GitHub `main` as authoritative and reconcile the local working copy before development.
2. Do not repeat P0, P1, or P2 software implementation unless a regression/audit finding requires it.
3. Execute P3 through controlled commissioning-tooling slices while preserving existing Pilot documents and authoritative domain evidence.
4. Keep physical hardware qualification, live provider evidence, 72-hour endurance, commissioning, customer UAT, and customer acceptance as evidence gates; do not convert them into software-complete claims.

## Audit Result — Reconciled 31 August 2026

- Reporting/BF-10 source scope is complete: all five controlled report families support Preview/CSV/PDF.
- Dashboard and Monitored Areas have authenticated telemetry-driven refresh with reconnect/cleanup and polling fallback.
- P1 Notification Delivery Engine software is complete and merged; live production-provider evidence remains external.
- P2 Site Controller software sequence P2-01 through P2-09 is complete and merged.
- PR #124 closed the P2 source-level durability blockers: full BF-08 known-good persistence/recovery and durable replay acceptance.
- Physical bench qualification is not complete merely because automated software evidence passes.
- BIO EGYPT Pilot remains NOT COMMISSIONED / NOT ACCEPTED.
- Hardware validation HV-01 through HV-15 and required endurance/evidence gates remain physical work.

### Status vocabulary

- **SOFTWARE COMPLETE / CI VERIFIED** — source behavior exists and automated gates pass.
- **FOUNDATION/PARTIAL** — reusable capability exists but the end-to-end operational workflow is incomplete.
- **EXTERNAL EVIDENCE OPEN** — physical deployment, live provider, field endurance, commissioning, UAT, or customer sign-off has not been executed/proven.

## Implemented Platform

- TypeScript/Express backend with Controller, Service, Repository, and persistence boundaries.
- SQLite configuration/versioned migrations plus InfluxDB time-series storage.
- MQTT telemetry ingestion, Alarm evaluation, Dashboard APIs, and Site/Room/Device/Sensor APIs.
- Device onboarding lifecycle and telemetry trust-boundary enforcement.
- JWT Authentication, active-User enforcement, centralized RBAC, ADMIN User Management, and isolated SYSTEM_OWNER boundary.
- Append-only audit, Alarm acknowledgment audit, Sensor calibration history, Device communication health, notification event/delivery evidence, and protected delivery operations.
- Editable Sensor thresholds/delays, recipient directory, escalation configuration, and BF-08 controller synchronization contract.
- React operational Dashboard and Monitored Areas with authenticated event-driven refresh.
- Controlled Reporting Center: Calibration History, Temperature Performance, Alarm History, Device Communication Health, Audit and Operations — Preview/CSV/PDF.
- Production deployment validation, MQTT TLS/QoS, persistent SQLite backup/recovery foundations, and LIVE/REPLAY semantics.
- P2 host-side Site Controller runtime: deterministic boot/connectivity/watchdog, BF-08 receipt/integrity, durable full known-good configuration recovery, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover contract/runtime, reconnect reconciliation, controller health evidence, qualification gate, and durable replay acceptance recovery.

## P0-P6 Delivery Position

- **P0 — Professional software/reporting baseline:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Field MQTT/UAT evidence remains external.
- **P1 — Notification Delivery Engine:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Live provider evidence and field notification UAT remain external.
- **P2 — Site Controller Runtime:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Physical controller/DS18B20/SIM800L/MQTT bench qualification remains external.
- **P3 — Pilot Commissioning Tooling:** **STARTED / PARTIAL.** P3-01 evidence foundation and P3-02 durable session/evidence persistence are implemented. Protected API, verification orchestration, UI/export, dry-run/UAT and field evidence remain open.
- **P4 — Production Hardening:** **PARTIAL.** Deployment validation, persistence/recovery, TLS/QoS, backup, controller durability, and replay durability foundations exist. Production operational/endurance evidence remains open.
- **P5 — SYSTEM_OWNER / Commercial Operations:** **FOUNDATION IMPLEMENTED.** Identity/auth/audit isolation exists. Broader fleet/customer/license/update/maintenance/commercial production workflows remain open.
- **P6 — Productization / Deployment / Acceptance:** **OPEN.** Packaging/release operationalization, final field commissioning, customer UAT/sign-off, and production acceptance remain gates.

## P3 Execution Sequence

P3 turns controlled Pilot documentation into repeatable commissioning tooling without manufacturing field evidence.

- P3-01 — Commissioning Evidence Foundation — **COMPLETE**.
- P3-02 — Commissioning Session Domain/Persistence — **COMPLETE / CI-VERIFICATION PENDING**.
- P3-03 — Protected Site-scoped Commissioning API.
- P3-04 — Configuration, Sensor Mapping and Calibration Verification.
- P3-05 — Functional Test Orchestration and evidence linking.
- P3-06 — Commissioning UI.
- P3-07 — Commissioning Record PDF/CSV export and decision snapshot.
- P3-08 — BIO EGYPT software dry-run/UAT package.
- P3-09 — P3 closure audit preserving external evidence boundaries.

The controlled P3-01 definition is `docs/project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md`.

## P2 Closure Evidence

- P2-01 — Runtime Foundation — PR #115.
- P2-02 — Configuration Receipt and Integrity — PR #116.
- P2-03 — Durable Configuration Identity Foundation — PR #117.
- P2-04 — DS18B20 Acquisition — PR #118.
- P2-05 — Offline Alarm Evaluation — PR #119.
- P2-06 — Local Emergency SMS Failover — PR #120.
- P2-07 — Reconnect Reconciliation / LIVE-REPLAY — PR #121.
- P2-08 — Controller Health Evidence — PR #122.
- P2-09 — Bench Qualification Gate — PR #123; CI run #380 SUCCESS.
- Post-P2 durability hardening — PR #124; CI run #382 SUCCESS; merge commit `453ea1fe6f983528c861667dc638bcc424710eff`.
- Documentation authority reconciliation — PR #125; CI run #387 SUCCESS.
- Version/release reconciliation — PR #126; CI run #389 SUCCESS; merge commit `cc8a5e7594c3a8101d7e227f582dfdf66f74fd48`; release tag `v0.17.0` published 31 August 2026.
- Published-release documentation finalization — PR #127; CI run #391 SUCCESS; merge commit `71659783be66d20458beb380a7fa92e557f5859a`.

## Release / Version Position

`VERSION` is the product source-version authority. The backend package metadata follows it. The frontend package remains a private scaffold version and is not an independently published BIO-EMS product package.

`v0.17.0` is the latest published release. Publication does not constitute physical qualification, field commissioning, customer acceptance, or production acceptance.

## Physical / Pilot Evidence Still Open

- Initial controller test-kit procurement and HV-01 onward.
- Physical Standard/Advanced controller validation.
- Controlled power interruption/restart evidence.
- Physical industrial DS18B20 disconnect/reconnect and excursion/recovery tests.
- SIM800L live emergency SMS evidence.
- Deployed MQTT disconnect/recovery and LIVE/REPLAY evidence.
- Required endurance run including the controlled 72-hour gate where applicable.
- BIO EGYPT physical installation, calibration evidence, commissioning, Alarm tests, UAT, Quality/customer sign-off, and acceptance.

## BIO EGYPT Pilot Scope Boundary

Phase 1 remains temperature-only using industrial DS18B20 sensors across two Sites, with a controlled total of 20 Sensors. This repository state does not claim that those Sensors/controllers are installed, commissioned, or customer accepted.

## Domain Boundary

Frontend **Monitored Area** remains presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is claimed by this state document.

## Deferred / Open Product Scope

Broader Asset/discovery/provisioning, OTA, final production controller firmware/hardware adapters, fleet/customer/license/update commercial operations, packaging/release operationalization, physical commissioning, live-provider acceptance, and customer acceptance remain open unless later work explicitly implements and verifies them.

## Repository Continuation Rule

Begin with this file, then `IMPLEMENTATION_PLAN.md`. For P3 use the controlled P3 slice document and existing `docs/pilot/bio-egypt/` evidence pack. GitHub `main` remains the source of truth. Preserve historical release/Sprint documents; update this current-state document rather than creating competing status files.
