# BIO-EMS Project State

**State date:** 2 September 2026

**Latest published tagged release:** `v0.17.0`

**Current source-software version:** `0.19.0`

**Current phase:** **SOFTWARE PRODUCT COMPLETE** for the approved P0-P7 scope. P8-01 primary WhatsApp and Email Alarm delivery is merged and CI verified. P8-02 through P8-08 SYSTEM_OWNER installation provisioning and customer-RBAC realignment are approved/documented future scope and are not implemented. Live provider, physical controller, production deployment, BIO EGYPT commissioning/UAT, and customer/production acceptance remain separate external evidence gates.

## Current Controlled Continuation

1. Treat GitHub `main` as authoritative and reconcile the local working copy before further work.
2. Preserve P0-P6 closure evidence; P7 is new approved scope, not a reopening of completed packages.
3. Preserve P7-03 through P7-08 closure evidence from PR #145 and CI run #522.
4. Continue only with the separate external evidence/field acceptance tracks or explicitly approved later software scope.
5. Continue hardware qualification, live-provider evidence, production execution, BIO EGYPT commissioning/UAT, and acceptance as separate evidence tracks; do not manufacture those claims from source completion.
6. Reconcile the Windows local copy with merge `a045e933dcd6583f1e7e32e73562f0ab2b45dd4c`, preserve all real provider secrets only in ignored `backend/.env`, and run the controlled SMTP smoke test.
7. Resolve the Meta for Developers registration loop before obtaining a Phone Number ID, permanent access token, or approved WhatsApp template; no Meta credential or template approval is currently claimed.
8. Implement P8-02 through P8-08 from `docs/project-management/P8-SYSTEM-OWNER-INSTALLATION-AND-RBAC-PLAN-2026-09-02.md` while P8-01 live Email/WhatsApp acceptance remains an explicit parallel open track; effective customer permissions remain the current code behavior until each change is implemented, tested, merged, and documented.

## Status Vocabulary

- **SOFTWARE COMPLETE / CI VERIFIED** — source behavior exists and automated gates pass.
- **SOFTWARE CONTROLS COMPLETE** — operational controls/tooling exist in source, but real production execution evidence may remain open.
- **SOFTWARE PRODUCTIZATION COMPLETE** — packaging/deployment/acceptance tooling exists in source; field/production/customer acceptance is not implied.
- **SOFTWARE PRODUCT COMPLETE** — reserved for successful P7 closure across the approved end-to-end product surface.
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
- P5 isolated SYSTEM_OWNER commercial APIs/workflows for customer fleet identity, license/update entitlement, and maintenance/calibration/support/update oversight while preserving the customer ADMIN trust boundary.
- P6 controlled productization/deployment/acceptance tooling and documentation.
- P7-01 isolated SYSTEM_OWNER frontend authentication/session boundary, protected owner routes, bilingual console shell, fail-closed route behavior, and authorization/contract regression coverage.
- P7-02 SYSTEM_OWNER customer fleet list/detail, customer creation, existing Site/installation identity context, commercial provenance visibility, and platform-query isolation across owner sessions.

## P0-P7 Delivery Position

- **P0 — Professional Software / Reporting Baseline:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Field MQTT/UAT evidence remains external.
- **P1 — Notification Delivery Engine:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Live provider evidence and field notification UAT remain external.
- **P2 — Site Controller Runtime:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** Physical controller/DS18B20/SIM800L/MQTT bench qualification remains external.
- **P3 — Pilot Commissioning Tooling:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED.** PRs #130-#132; closure merge `6a74122e`. Field evidence and customer acceptance remain open.
- **P4 — Production Hardening:** **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED.** PR #133 / merge `3b90dda94811440cc18739bb857c036a48ce72ad`. Production restore/endurance/rollback/DR evidence remains external.
- **P5 — SYSTEM_OWNER / Commercial Operations:** **BACKEND/DOMAIN SOFTWARE COMPLETE / MERGED / CI VERIFIED.** PR #134 / CI run #445 / merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`. Billing/payment and live remote-update execution remain external/later integrations unless separately implemented.
- **P6 — Productization / Deployment / Acceptance:** **SOFTWARE PRODUCTIZATION COMPLETE / MERGED / CI VERIFIED.** PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`. Deployment, field commissioning, UAT/sign-off, and production/customer acceptance remain external gates.
- **P7 — Final Product Completion:** **COMPLETE / MERGED / CI VERIFIED** through PR #145 / CI run #522 / merge `3798277bea14820632c8e1edd0b83df91f8f7084`.
- **P8-01 — Primary WhatsApp and Email Alarm Delivery:** **SOFTWARE COMPLETE / MERGED / CI VERIFIED / LIVE PROVIDER EVIDENCE OPEN.** Provider implementation: PR #147 / CI run #526 / merge `17bbfc1d5623ad7bdf47d99e6d5954fc33a9666d`. Safe configuration and SMTP smoke test: PR #148 / CI run #528 / merge `a045e933dcd6583f1e7e32e73562f0ab2b45dd4c`.
- **P8-02 through P8-08 — SYSTEM_OWNER Installation Provisioning and RBAC Realignment:** **APPROVED / DOCUMENTED / IMPLEMENTATION PENDING.** Controlled by ADR-022 and the dated P8 implementation plan. Current code permissions must not be described as already realigned.

## P7 Active Plan

Controlled plan: `docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`.

Sequence:

1. P7-01 — SYSTEM_OWNER Frontend Boundary and Console Shell — complete through PR #141 / merge `873b55439f02fbb7de84d29631d22af399208dec`; closure record `docs/project-management/P7-01-SYSTEM-OWNER-CONSOLE-CLOSURE-2026-09-01.md`.
2. P7-02 — Customer / Site Fleet Management — complete through PR #142 / final CI run #516 / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`; closure record `docs/project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md`.
3. P7-03 — License Lifecycle and Installation Binding UI — implemented / locally verified.
4. P7-04 — Update Entitlement and Release Eligibility UI — implemented / locally verified.
5. P7-05 — Maintenance, Calibration and Support Fleet Operations — implemented / locally verified.
6. P7-06 — Product UX and Legacy Cleanup — implemented / locally verified.
7. P7-07 — End-to-End Product Workflow Review — locally verified.
8. P7-08 — Full Regression, Documentation Reconciliation and Software Product Closure — complete / merged / CI verified.

## P3-P6 Closure Evidence

- P3-01 Commissioning Evidence Foundation — PR #128.
- P3-02 Commissioning Session Domain/Persistence — PR #129; CI run #419 SUCCESS; merge `5b17b827cc22170112cc4e3dd8f409aa8669c7d7`.
- P3-03 Protected Site-scoped Commissioning API — PR #130; merge `4500cd49c3bad6ba4b080e0c8cfd16c0958317be`.
- P3 remaining commissioning slices and closure — through PR #132; closure merge `6a74122e`.
- P4 Production Hardening — PR #133; merge `3b90dda94811440cc18739bb857c036a48ce72ad`.
- P5 SYSTEM_OWNER / Commercial Operations — PR #134; CI run #445 SUCCESS; merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`.
- P6 Productization / Deployment / Acceptance — PR #135; CI run #448 SUCCESS; merge `214a228cc490df12b895b264fc031efaecf8931e`.

## Release / Version Position

`VERSION` is the product source-version authority. `v0.17.0` remains the latest published release; current source-software version is prepared as `0.19.0` for P8-01. No `v0.19.0` tag or GitHub Release is claimed until the controlled release procedure is completed.

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

Payment/invoicing integration, live remote OTA/update execution, broader Asset/discovery/provisioning, final production controller firmware/hardware adapters, additional industry-specific capabilities, physical commissioning, live-provider acceptance, and customer acceptance remain open unless later work explicitly implements and verifies them.

## Repository Continuation Rule

**Next-session start point:** Continue P8-02 through P8-08 source implementation now. In the next Windows local session, update `main`, retain the Gmail App Password only in ignored `backend/.env`, verify SYSTEM_OWNER Platform JWT configuration, and resume P8-01 live Email/WhatsApp plus end-to-end Alarm evidence.
