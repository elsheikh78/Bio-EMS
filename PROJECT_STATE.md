# BIO-EMS Project State

**State date:** 1 September 2026

**Latest published tagged release:** `v0.17.0`

**Current source-software version:** `0.18.0`

**Current phase:** P0-P6 source-software scope is complete, merged, and CI verified through P6 productization. P6 closed through PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`. Physical controller qualification, production deployment evidence, BIO EGYPT commissioning/UAT, and customer/production acceptance remain external evidence gates.

## Current Controlled Continuation

1. Treat GitHub `main` as authoritative and reconcile the local working copy before further work.
2. Do not repeat P0-P6 source implementation unless a verified regression, audit finding, or approved new scope requires it.
3. Use the completed commissioning, production-hardening, commercial-operations, and productization tooling only with genuine controlled evidence.
4. Execute physical hardware qualification, live provider evidence, deployed MQTT/recovery evidence, required endurance, production restore/rollback/DR evidence, BIO EGYPT commissioning/UAT, and acceptance as separate external gates.
5. Use `IMPLEMENTATION_PLAN.md`, `docs/architecture/roadmap.md`, `docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md`, and the relevant P3/P6 closure/evidence records as the controlled continuation set.

## Status Vocabulary

- **SOFTWARE COMPLETE / CI VERIFIED** — source behavior exists and automated gates pass.
- **SOFTWARE CONTROLS COMPLETE** — operational controls/tooling exist in source, but real production execution evidence may remain open.
- **SOFTWARE PRODUCTIZATION COMPLETE** — packaging/deployment/acceptance tooling exists in source; field/production/customer acceptance is not implied.
- **EXTERNAL EVIDENCE OPEN** — physical deployment, live provider, field endurance, commissioning, UAT, production execution, or customer sign-off has not been executed/proven.

## Implemented Platform

- TypeScript/Express backend with Controller, Service, Repository, and persistence boundaries.
- SQLite configuration/versioned migrations plus InfluxDB time-series storage.
- MQTT telemetry ingestion, Alarm evaluation, Dashboard APIs, and Site/Room/Device/Sensor APIs.
- Device onboarding lifecycle and telemetry trust-boundary enforcement.
- JWT Authentication, active-User enforcement, centralized RBAC, ADMIN User Management, and isolated SYSTEM_OWNER boundary.
- Append-only audit, Alarm acknowledgment audit, Sensor calibration history, Device communication health, notification event/delivery evidence, and protected delivery operations.
- Editable Sensor thresholds/delays, recipient directory, escalation configuration, and BF-08 controller synchronization contract.
- React operational Dashboard and Monitored Areas with authenticated telemetry-driven refresh, reconnect/cleanup, and polling fallback.
- Controlled Reporting Center: Calibration History, Temperature Performance, Alarm History, Device Communication Health, Audit and Operations — Preview/CSV/PDF.
- Production deployment validation, MQTT TLS/QoS, persistent SQLite backup/recovery foundations, and LIVE/REPLAY semantics.
- P2 host-side Site Controller runtime: deterministic boot/connectivity/watchdog, BF-08 receipt/integrity, durable full known-good configuration recovery, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover contract/runtime, reconnect reconciliation, controller health evidence, qualification gate, and durable replay acceptance recovery.
- P3 commissioning tooling: durable sessions/checks, append-only evidence/deviations/decisions, Site-scoped protected APIs, authenticated-user provenance, configuration/sensor mapping/calibration verification, functional-test orchestration, commissioning UI, CSV/PDF records, decision snapshots, and BIO EGYPT software dry-run/UAT package.
- P4 production-hardening controls covering deployment validation, backup/restore, supervision, secrets/configuration, persistence/recovery, observability, retention, upgrade/rollback, and DR evidence structures.
- P5 isolated SYSTEM_OWNER/commercial-operations workflows while preserving the customer ADMIN trust boundary.
- P6 controlled productization/deployment/acceptance tooling and documentation.

## P0-P6 Delivery Position

- **P0 — Professional Software / Reporting Baseline:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Field MQTT/UAT evidence remains external.
- **P1 — Notification Delivery Engine:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Live provider evidence and field notification UAT remain external.
- **P2 — Site Controller Runtime:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Physical controller/DS18B20/SIM800L/MQTT bench qualification remains external.
- **P3 — Pilot Commissioning Tooling:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** PRs #130-#132; closure merge `6a74122e`. Field evidence and customer acceptance remain open.
- **P4 — Production Hardening:** **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED.** PR #133 / merge `3b90dda94811440cc18739bb857c036a48ce72ad`. Production restore/endurance/rollback/DR evidence remains external.
- **P5 — SYSTEM_OWNER / Commercial Operations:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** PR #134 / CI run #445 / merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`. Billing/payment execution and live commercial evidence remain external/later scope where applicable.
- **P6 — Productization / Deployment / Acceptance:** **SOFTWARE PRODUCTIZATION COMPLETE / MERGED / CI VERIFIED.** PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`. Deployment, field commissioning, UAT/sign-off, and production/customer acceptance remain external gates.

## P2 Closure Evidence

- P2-01 — Runtime Foundation — PR #115.
- P2-02 — Configuration Receipt and Integrity — PR #116.
- P2-03 — Durable Configuration Identity Foundation — PR #117.
- P2-04 — DS18B20 Acquisition — PR #118.
- P2-05 — Offline Alarm Evaluation — PR #119.
- P2-06 — Local Emergency SMS Failover — PR #120.
- P2-07 — Reconnect Reconciliation / LIVE-REPLAY — PR #121.
- P2-08 — Controller Health Evidence — PR #122.
- P2-09 — Bench Qualification Software Gate — PR #123; CI run #380 SUCCESS.
- Post-P2 durability hardening — PR #124; CI run #382 SUCCESS; merge `453ea1fe6f983528c861667dc638bcc424710eff`.
- Documentation authority reconciliation — PR #125; CI run #387 SUCCESS.
- Version/release reconciliation — PR #126; CI run #389 SUCCESS; merge `cc8a5e7594c3a8101d7e227f582dfdf66f74fd48`; release tag `v0.17.0` published 31 August 2026.
- Published-release documentation finalization — PR #127; CI run #391 SUCCESS; merge `71659783be66d20458beb380a7fa92e557f5859a`.

## P3-P6 Closure Evidence

- P3-01 Commissioning Evidence Foundation — PR #128.
- P3-02 Commissioning Session Domain/Persistence — PR #129; CI run #419 SUCCESS; merge `5b17b827cc22170112cc4e3dd8f409aa8669c7d7`.
- P3-03 Protected Site-scoped Commissioning API — PR #130; merge `4500cd49c3bad6ba4b080e0c8cfd16c0958317be`.
- P3 remaining commissioning slices and closure — through PR #132; closure merge `6a74122e`.
- P4 Production Hardening — PR #133; merge `3b90dda94811440cc18739bb857c036a48ce72ad`.
- P5 SYSTEM_OWNER / Commercial Operations — PR #134; CI run #445 SUCCESS; merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`.
- P6 Productization / Deployment / Acceptance — PR #135; CI run #448 SUCCESS; merge `214a228cc490df12b895b264fc031efaecf8931e`.

## Release / Version Position

`VERSION` is the product source-version authority. The backend package metadata follows it. The frontend package remains a private scaffold version and is not an independently published BIO-EMS product package.

`v0.17.0` is the latest published release. Current source-software version is `0.18.0`. Source version `0.18.0` must not be described as a published release until an explicit tag/release is created and verified.

Release publication does not constitute physical qualification, field commissioning, customer acceptance, or production acceptance.

## Physical / Pilot / Production Evidence Still Open

- Initial controller test-kit procurement and HV-01 onward.
- Physical Standard/Advanced controller validation.
- Controlled power interruption/restart evidence.
- Physical industrial DS18B20 disconnect/reconnect and excursion/recovery tests.
- SIM800L live emergency SMS evidence.
- Deployed MQTT disconnect/recovery and LIVE/REPLAY evidence.
- Required endurance run including the controlled 72-hour gate where applicable.
- Production backup/restore/rollback/DR execution evidence.
- BIO EGYPT physical installation and calibration evidence.
- Commissioning and Alarm tests.
- Customer UAT, Quality/customer sign-off, and customer/production acceptance.

## BIO EGYPT Pilot Scope Boundary

Phase 1 remains temperature-only using industrial DS18B20 sensors across two Sites, with a controlled total of 20 Sensors. This repository state does not claim that those Sensors/controllers are installed, commissioned, or customer accepted.

## Domain Boundary

Frontend **Monitored Area** remains presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is claimed by this state document.

## Deferred / Open Product Scope

Broader Asset/discovery/provisioning, OTA delivery, final production controller firmware/hardware adapters, billing/payment execution, additional industry-specific capabilities, physical commissioning, live-provider acceptance, and customer acceptance remain open unless later work explicitly implements and verifies them.

## Repository Continuation Rule

Begin with this file, then `IMPLEMENTATION_PLAN.md`, then `docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md` and `docs/architecture/roadmap.md`. For field execution use the relevant P3/P6 closure records and the existing `docs/pilot/bio-egypt/` evidence pack. GitHub `main` remains the source of truth. Preserve valid historical release/Sprint/handoff documents; update this current-state document whenever the actual project gate changes rather than creating competing status files.