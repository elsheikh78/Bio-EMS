# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 31 August 2026**

The original Architecture Freeze v1.0 phase model is historical. Current implementation is governed by repository evidence, `PROJECT_STATE.md`, `docs/SPRINT_PROGRESS.md`, approved ADRs, and the P0-P6 sequence below.

## Current Position

- Sprints 13, 14, and 15 are complete and closed.
- Sprint 16 reporting implementation and BF-10 are complete, merged, and CI verified.
- P0 professional software/reporting baseline is complete at source level.
- P1 Notification Delivery Engine software is complete, merged, and CI verified through PR #113 / integration commit `b1d2611866d2e7a8455d5ed898932ae91fe6068f` / CI run 319.
- Live SMS-provider evidence, physical commissioning, MQTT/UAT evidence, and customer acceptance remain external gates.
- P0-P6 source-software delivery is complete and CI verified. Physical/live/field/customer evidence gates remain open.

## P0-P6 Sequence

### P0 — Professional Software / Reporting Baseline

Status: **COMPLETE / MERGED / CI VERIFIED**

Includes all five controlled report families through Preview/CSV/PDF, professional PDF identity, selected Site time-zone rendering, and authenticated event-driven refresh for Dashboard and Monitored Areas.

Open evidence: deployed MQTT endurance/UAT evidence and field acceptance are not inferred from repository completion.

### P1 — Notification Delivery Engine

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**

Integrated sequence:

1. durable delivery queue;
2. worker execution/runtime;
3. SMS-provider runtime boundary;
4. Alarm escalation delivery orchestration;
5. protected Site-scoped Delivery Operations view.

Closure integration: PR #113, commit `b1d2611866d2e7a8455d5ed898932ae91fe6068f`, CI run 319 SUCCESS.

Open evidence: configure a real provider, controlled E.164 recipient, deploy the worker/runtime, prove successful send, prove retry/failure handling, verify Delivery Operations evidence, and execute notification UAT.

### P2 — Site Controller Runtime

Status: **SOFTWARE COMPLETE / EXTERNAL PHYSICAL EVIDENCE OPEN**

BF-08 and the P2 runtime slices are implemented and CI verified. Physical controller, DS18B20, SIM800L, deployed MQTT and endurance evidence remain external gates.

Target slices:

- P2-01 Controller runtime package and version identity.
- P2-02 secure configuration retrieval/receipt and checksum verification.
- P2-03 durable local last-acknowledged configuration persistence.
- P2-04 DS18B20 acquisition pipeline and sensor/channel mapping.
- P2-05 local threshold and configurable persistence-delay evaluation.
- P2-06 offline Alarm state and local emergency SMS failover execution.
- P2-07 reconnect reconciliation, APPLIED/REJECTED acknowledgement, stale-version handling, and replay protection.
- P2-08 controller health/heartbeat diagnostics and server evidence.
- P2-09 bench test package covering power loss, network loss, stale config, sensor fault, recovery, and reconnect.

No P2 slice may claim field completion without controller/firmware and bench evidence.

### P3 — Pilot Commissioning Tooling

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

The controlled Pilot documentation is implemented as repeatable commissioning sessions, checks, append-only evidence/deviations/decisions, Site-scoped APIs, readiness UI, and CSV/PDF records. Physical commissioning, field endurance, UAT, and customer acceptance remain external evidence gates.

### P4 — Production Hardening

Status: **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

Complete operational deployment evidence around backup/restore, process supervision, secrets/configuration, TLS/QoS, persistent storage, recovery, observability, log retention, upgrade/rollback, and disaster-recovery drills.

### P5 — SYSTEM_OWNER / Commercial Operations

Status: **SOFTWARE COMPLETE / CI VERIFIED**

Preserve the isolated SYSTEM_OWNER trust domain and append-only audit boundary while adding only approved platform-owner workflows. Candidate later scope includes customer/site fleet visibility, license lifecycle, update entitlement, maintenance/calibration oversight, and commercial operational evidence. Customer ADMIN must never administer or discover SYSTEM_OWNER.

### P6 — Productization / Deployment / Acceptance

Status: **SOFTWARE PRODUCTIZATION COMPLETE / EXTERNAL ACCEPTANCE OPEN**

Close controlled release packaging, installer/deployment procedure, version/release reconciliation, production deployment evidence, BIO EGYPT field commissioning, customer UAT, final sign-off, and release acceptance.

## Execution Rule

Repository completion, CI success, bench evidence, field commissioning, provider delivery, and customer acceptance are distinct gates. Documentation must state exactly which gate has been satisfied and must not infer later gates from earlier ones.

## Historical Value

Older phase descriptions remain useful as architectural background, but they are not authoritative for current completion status. `PROJECT_STATE.md` is the concise current source of truth; this file defines the active execution sequence.
