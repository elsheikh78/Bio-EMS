# BIO-EMS Changelog

## [Unreleased]

No source changes are recorded after the `0.17.0` release-preparation baseline.

## [0.17.0] - 2026-08-31

### Release scope

Source-software milestone consolidating the substantial post-`v0.15.0` work through P0/P1/P2 software closure. This is a MINOR SemVer increment because it contains significant new functionality, not merely fixes.

### Added / Changed

- Completed the controlled Reporting Center with Calibration History, Temperature Performance, Alarm History, Device Communication Health, and Audit and Operations in Preview/CSV/PDF workflows.
- Added authenticated telemetry-driven Dashboard and Monitored Areas refresh with reconnect, cleanup, and polling fallback.
- Completed the P1 Notification Delivery Engine software sequence, including durable notification events/delivery operations and controlled provider/runtime boundaries.
- Completed P2-01 through P2-09 Site Controller host-side software runtime: deterministic runtime/watchdog state, BF-08 configuration receipt/integrity, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover, reconnect reconciliation, controller health evidence, and bench qualification gating.
- Hardened P2 after qualification review by persisting/revalidating the complete known-good BF-08 envelope and making replay acceptance durable across restart with same-batch duplicate suppression.
- Established `PROJECT_STATE.md` as the single current-state authority, converted `docs/SPRINT_PROGRESS.md` to a historical ledger, removed duplicate `docs/project-status.md`, and made README the stable project/documentation entry point.
- Preserved the independent hardware validation path: initial test kit first, then HV execution; no hardware approval is inferred from software CI.

### Verification evidence

- BF-10 reporting closure: PR #106 / CI run #303 SUCCESS.
- P1 software sequence: PRs #109 through #113, final integration commit `b1d2611866d2e7a8455d5ed898932ae91fe6068f`, CI run #319 SUCCESS.
- P2 software sequence: PRs #115 through #123; P2-09 CI run #380 SUCCESS.
- P2 durability hardening: PR #124 / CI run #382 SUCCESS / merge commit `453ea1fe6f983528c861667dc638bcc424710eff`.
- Documentation authority and audit handoff: PR #125 / CI run #387 SUCCESS / merge commit `d1918a1bd6526cfd8c140bd350e93e584641436d`.
- Release-preparation PR must pass the normal backend/frontend GitHub quality gates before merge/tag publication.

### Acceptance boundary

This release does **not** claim:

- physical Site Controller qualification;
- live industrial DS18B20 bench acceptance;
- live SIM800L carrier delivery acceptance;
- deployed MQTT endurance/72-hour hardware PASS;
- BIO EGYPT installation or commissioning;
- customer/Quality UAT or production acceptance.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED** until external evidence gates are executed and approved.

## [0.16.3] - 2026-08-31 — Professional reporting baseline

- Applied the BIO-EMS controlled visual identity to Alarm History, Device Communication Health, and Audit and Operations PDF exports.
- Added Site-time-zone rendering, report identity and scope, executive summaries, data-quality disclosure, controlled-copy footers, and page numbering to operational PDFs.
- Closed BF-10 integration verification through PR #106 and successful CI run #303.
- Kept field MQTT endurance, commissioning, and customer UAT as explicit external evidence gates.

## [0.16.2] - 2026-08-31 — Operational report export fix

- Fixed strict client validation rejecting Alarm, Device Health, and Audit CSV/PDF exports before the request reached the backend.
- Hardened browser downloads and added CSV/PDF request-contract and failure-feedback regression coverage.

## [0.16.1] - 2026-08-31 — Reports Center visual completion

- Replaced the calibration-focused readiness table with selectable report cards.
- Made selected report identity, scope, evidence source, availability, and preview update together.

## [0.16.0] - 2026-08-31 — Reporting Center completion

- Completed Alarm History, Device Communication Health, and Audit and Operations reports with validated Preview/CSV/PDF workflows.
- Added an append-only Device communication event ledger and reused existing Alarm/Audit evidence stores.
- Closed BF-10 at the source-software boundary without claiming field commissioning or customer acceptance.

## [0.15.1] - 2026-08-31 — Live monitoring and temperature reporting completion

- Added authenticated SSE publication after accepted/persisted telemetry and Alarm evaluation.
- Added frontend stream lifecycle, Dashboard/Monitored Areas invalidation, reconnect behavior, logout cleanup, and polling resilience fallback.
- Integrated Temperature Performance into Reports Center Preview/CSV/PDF.

---

## [0.15.0] - 2026-08-17

### Release

Post-`v0.13.0` repository development through completed Sprint 14 frontend and Sprint 15 Pilot-readiness foundation.

### Added / Changed

- ADMIN User Management with transactional last-active-ADMIN protection.
- React frontend/AppShell, typed localization, browser authentication/session lifecycle, and authorization-aware routing.
- Operational Dashboard and Site → Monitored Area → Sensor views.
- Product-grade Sensor identity/hardware/installation/current calibration state and append-only calibration history.
- Trusted Device communication-health semantics and durable Alarm/Device notification events.
- Provider-neutral emergency SMS failover policy.
- Controlled BIO EGYPT two-Site/20-Sensor Pilot documents.
- Production configuration validation, MQTT TLS/QoS, persistent SQLite/backup paths, and LIVE/REPLAY recovery semantics.

### Compatibility / boundary

- Existing `/api/v1`, authentication/RBAC, Device lifecycle, and Site → Room → Sensor relationships remain authoritative.
- Frontend private package version is not an independently published BIO-EMS product version.
- Publishing `v0.15.0` did not constitute field commissioning or customer acceptance.

---

## [0.13.0] - 2026-08-11

### Release

Sprint 13 — Centralized Role-Based Authorization and Alarm Acknowledgment Audit.

### Added / Changed

- Centralized permission vocabulary and Role → Permissions authorization policy.
- Route authorization across Site, Room, Sensor, Device, Alarm, and Dashboard APIs.
- Migration 004 for `acknowledged_by_user_id` and authenticated actor audit persistence.
- Atomic Alarm acknowledgment with state-conflict handling and explicit public projection.

### Verified

- Published `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
- Automated tests, typecheck, build, lint, formatting, and GitHub Actions passed.

---

## [0.12.0] - 2026-08-10

### Release Candidate

Sprint 12 — Device Onboarding and Telemetry Trust Boundary.

- Added strict Device request/list validation, read/update/lifecycle APIs, Site existence checks, Device/Sensor telemetry trust enforcement, and regression coverage.
- Preserved existing MQTT topic/payload contracts and introduced no SQLite migration in this release candidate.

---

## [0.11.0] - 2026-08-06

### Release

Sprint 11 — Engineering Foundation and Alarm Consolidation.

- Added the unified six-state Alarm Domain Engine, warning thresholds, versioned/idempotent SQLite migration history, and quality tooling.
- MQTT Alarm evaluation and Dashboard room status share the Domain Engine.

---

## [0.10.0] - 2026-08-03

### Release

Sprint 10 — Dashboard foundation.

- Added Dashboard Summary, Latest Telemetry, Room Status, and Alarm Statistics APIs.
- Added Dashboard aggregation and generic Influx telemetry-query foundations.

## Detailed historical evidence

Detailed Sprint, BF, PVR, architecture, Pilot, reporting, and hardware records remain under `docs/` and in immutable Git history. This changelog is the controlled product/source release ledger; it is not a duplicate of `PROJECT_STATE.md`.