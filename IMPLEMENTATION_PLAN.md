# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 1 September 2026**

The original Architecture Freeze v1.0 phase model is historical. Current implementation is governed by repository evidence, `PROJECT_STATE.md`, `docs/SPRINT_PROGRESS.md`, approved ADRs, and the P0-P6 sequence below.

## Current Position

- Sprints 13, 14, and 15 are complete and closed.
- Sprint 16 reporting implementation and BF-10 are complete, merged, and CI verified.
- P0-P6 source-software delivery is complete, merged, and CI verified through P6 productization.
- P3 closed through PRs #130-#132 / closure merge `6a74122e`.
- P4 closed through PR #133 / merge `3b90dda94811440cc18739bb857c036a48ce72ad`.
- P5 closed through PR #134 / CI run #445 / merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`.
- P6 closed through PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`.
- Live SMS-provider evidence, physical controller qualification, endurance, production deployment evidence, BIO EGYPT commissioning/UAT, and customer/production acceptance remain external gates.

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

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED / EXTERNAL PHYSICAL EVIDENCE OPEN**

BF-08 and P2-01 through P2-09 are implemented and CI verified, including post-P2 durability hardening through PR #124. Physical controller, DS18B20, SIM800L, deployed MQTT, and endurance evidence remain external gates.

Delivered slices:

- P2-01 Controller runtime package and version identity.
- P2-02 secure configuration retrieval/receipt and checksum verification.
- P2-03 durable local last-acknowledged configuration persistence.
- P2-04 DS18B20 acquisition pipeline and sensor/channel mapping.
- P2-05 local threshold and configurable persistence-delay evaluation.
- P2-06 offline Alarm state and local emergency SMS failover execution.
- P2-07 reconnect reconciliation, APPLIED/REJECTED acknowledgement, stale-version handling, and replay protection.
- P2-08 controller health/heartbeat diagnostics and server evidence.
- P2-09 bench qualification software gate covering power loss, network loss, stale config, sensor fault, recovery, and reconnect.

No P2 status may claim physical qualification without genuine controller/firmware/bench evidence.

### P3 — Pilot Commissioning Tooling

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

The controlled Pilot documentation is implemented as repeatable commissioning sessions, checks, append-only evidence/deviations/decisions, Site-scoped APIs, configuration/mapping/calibration verification, functional-test orchestration, readiness UI, CSV/PDF commissioning records, and BIO EGYPT software dry-run/UAT package.

Closure: PRs #130-#132 / closure merge `6a74122e`.

Open evidence: physical commissioning, field endurance, UAT execution, Quality/customer sign-off, and customer acceptance.

### P4 — Production Hardening

Status: **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

Operational controls cover backup/restore, process supervision, secrets/configuration, TLS/QoS, persistent storage, recovery, observability, log retention, upgrade/rollback, and disaster-recovery evidence structures.

Closure: PR #133 / merge `3b90dda94811440cc18739bb857c036a48ce72ad`.

Open evidence: production restore/endurance/rollback/DR execution and retained operational evidence.

### P5 — SYSTEM_OWNER / Commercial Operations

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**

The isolated SYSTEM_OWNER trust domain and approved platform-owner/commercial operations are implemented while preserving the rule that customer ADMIN cannot administer or discover SYSTEM_OWNER.

Closure: PR #134 / CI run #445 / merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`.

Open/later evidence: billing/payment execution and live production commercial operations where applicable.

### P6 — Productization / Deployment / Acceptance

Status: **SOFTWARE PRODUCTIZATION COMPLETE / MERGED / CI VERIFIED / EXTERNAL ACCEPTANCE OPEN**

Controlled release/productization packaging, deployment/acceptance procedures, and supporting source-level tooling are complete.

Closure: PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`.

Open evidence: physical deployment, production execution, BIO EGYPT field commissioning, customer UAT, final sign-off, and production/customer acceptance.

## Next Controlled Execution

P0-P6 source implementation must not be repeated without a verified regression or audit finding. The next controlled work is evidence execution:

1. physical hardware qualification and HV-01 through HV-15;
2. live SMS-provider evidence;
3. deployed MQTT/LIVE-REPLAY and recovery evidence;
4. required endurance including the controlled 72-hour gate where applicable;
5. production backup/restore/rollback/DR execution;
6. BIO EGYPT installation, calibration, commissioning and Alarm testing;
7. customer UAT, Quality/customer sign-off, and acceptance.

## Execution Rule

Repository completion, CI success, bench evidence, field commissioning, provider delivery, production deployment, UAT, and customer acceptance are distinct gates. Documentation must state exactly which gate has been satisfied and must not infer later gates from earlier ones.

## Historical Value

Older phase descriptions remain useful as architectural background, but they are not authoritative for current completion status. `PROJECT_STATE.md` is the concise current source of truth; this file defines the controlled execution sequence and post-P6 evidence path.