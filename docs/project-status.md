# Project Status

## BF-03 User Management audit integration — 24 August 2026

BF-03 is implemented and locally verified on
`agent/bf-03-user-audit-integration`. It remains feature-branch capability until PR,
GitHub CI, review, and merge complete.

User creation, profile/role changes, status changes, and password management now emit
safe audit evidence. Successful mutation and audit persistence are atomic. Relevant
authenticated denials and controlled failures are recorded without copying request
bodies, passwords, or hashes.

Backend gates pass with 63 files / 545 tests. The unchanged frontend passes 25 files /
212 tests plus typecheck, lint, format, and production build.

## BF-02 audit foundation — 24 August 2026

The BF-02 append-only audit foundation is merged and verified through PR #68 at
`main` integration commit `9ca22d6f5a72a155203227c7ff0a0ad5b296b516`.
GitHub CI run 192 completed successfully before merge.

Implemented evidence includes migration 010, immutable database enforcement,
service-owned UUID/time, recursive secret redaction, deterministic repository reads,
ADMIN-only Site-scoped reads, separately authenticated platform cross-Site reads,
strict query validation, and security/regression tests.

BF-02 establishes the shared persistence/read contract. BF-03 now integrates User
Management; later action-specific producers remain separate controlled work.

## BF-01 backend foundation — 24 August 2026

The BF-01 `SYSTEM_OWNER` authorization boundary is merged and verified through PR
#67 at `main` integration commit `85a2d51f8d6887605c6a3390281a690966d4f391`.

Implemented BF-01 evidence includes isolated platform-principal persistence through
migration 009, separate platform authentication and JWT trust domains, controlled
one-time bootstrap, strict owner/customer separation, duplicate Authorization-header
rejection, and REST/security/regression tests.

BF-01 does not claim MFA, login rate limiting/lockout, Owner Portal UI, or commercial
owner permissions. Its deferred append-only audit foundation is implemented and
integrated by BF-02.

## Current reporting status — 23 August 2026

S16-07 Reports Center has progressed through the controlled Calibration History
reporting lifecycle.

Completed and integrated reporting slices include:

- S16-07-02 Calibration History Preview;
- S16-07-03 Reports Center UI;
- S16-07-04 Calibration History CSV export;
- S16-07-05 Calibration History PDF export;
- frontend exposure of the approved Calibration History PDF export.

The Calibration History PDF backend implementation was merged through PR #60.

The frontend PDF export capability was subsequently verified and merged through
PR #61 at `main` integration commit:

`50ebdef4edd8dd342865d6381083b02069955fe3`

The frontend PDF integration passed the local quality gate including:

- TypeScript;
- ESLint;
- Prettier;
- 212 frontend tests;
- production build.

Calibration History now supports the controlled preview, CSV export, and PDF
export lifecycle through the Reports Center.

Calibration history remains in SQLite; telemetry remains in InfluxDB 2.x.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

The immediate Pilot priority is controlled BIO EGYPT field preparation and
evidence-based closure of `BE-002` through `BE-012`; `BE-001` is closed.

No field commissioning or Pilot acceptance is declared by the reporting work.

## Current Version

Published release: [`v0.15.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.15.0)

The release contains later Sprint 13 work, the completed Sprint 14 frontend
application, and the completed Sprint 15 Pilot-readiness foundation.

It does not declare BIO EGYPT field commissioning or Pilot acceptance.

## Implemented

- [x] Project architecture and persistence foundations
- [x] MQTT and InfluxDB integration
- [x] Site, Room, Device, Sensor, Alarm, and Dashboard backend foundations
- [x] Device lifecycle and telemetry trust-boundary enforcement
- [x] JWT Authentication and active-User validation
- [x] Centralized RBAC route enforcement
- [x] Authenticated Alarm acknowledgment audit persistence
- [x] ADMIN User Management
- [x] Last-active-ADMIN transactional and concurrency protection
- [x] BF-01 isolated SYSTEM_OWNER authentication boundary
- [x] BF-02 append-only audit persistence and scoped read foundation
- [x] Security hardening and regression coverage
- [x] ESLint, Prettier, and GitHub Actions quality gates
- [x] S14-01 frontend architecture and quality foundation
- [x] S14-02 professional responsive AppShell and navigation
- [x] S14-03 frontend authentication/session lifecycle and authorization-aware routing
- [x] S14-04 operational Dashboard frontend
- [x] S14-05 operational Monitored Areas frontend
- [x] Site → Monitored Area (Room) → Sensor hierarchy
- [x] Sensor configuration and threshold presentation
- [x] Monitored Areas refresh/retry and integration hardening
- [x] S15-01 Sensor product-grade, hardware, installation, and current calibration-state foundation
- [x] SQLite migration 005 with backward-compatible Sensor defaults
- [x] S15-02 append-only, actor-audited calibration history
- [x] SQLite migration 006 with immutable calibration evidence
- [x] S15-03 trusted Device communication health and heartbeat foundation
- [x] SQLite migration 007 with Device last-seen and heartbeat timestamps
- [x] S15-04 durable channel-independent Notification Architecture
- [x] SQLite migration 008 with idempotent notification event outbox
- [x] S15-05 provider-neutral SMS failover contract and decision policy
- [x] S15-06 controlled BIO EGYPT Pilot documentation package
- [x] S16-01 Product, reporting, hardware, and evidence requirements baseline
- [x] S16-02 BIO-EMS Design System and approved high-value wireframes
- [x] S16-03 reporting architecture and evidence rules
- [x] S16-04 Site Controller v1 Hardware Design Review
- [x] S16-06 approved operational Dashboard, charts, and navigation treatment
- [x] Sensors & Calibration register, recording, and actor-audited history
- [x] S16-07-02 Calibration History Preview
- [x] S16-07-03 Reports Center UI
- [x] S16-07-04 Calibration History CSV export
- [x] S16-07-05 Calibration History PDF export
- [x] Frontend CSV and PDF export actions driven by the reporting catalogue

## Sprint 16

Sprint 16 is **IN PROGRESS**.

S16-01 through S16-04 and S16-06 are complete, merged, verified, and closed.

S16-06 was integrated through PR #50 at `main` commit:

`4ce1155156015d1983a93e637dde8f99f7be2337`

after final Product Owner visual and functional approval and successful GitHub CI.

S16-07 reporting work has progressed through the controlled Calibration History
reporting lifecycle:

- S16-07-01 Reporting catalogue and permissions: COMPLETE;
- S16-07-02 Calibration History Preview: COMPLETE;
- S16-07-03 Reports Center UI: COMPLETE;
- S16-07-04 Calibration History CSV export: COMPLETE;
- S16-07-05 Calibration History PDF export: COMPLETE;
- frontend PDF export integration: COMPLETE and merged through PR #61.

Controlled S16-05 field evidence and S16-08 hardware work continue on the
parallel field/hardware track.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

The immediate operational priority is not another reporting feature.

The next controlled project action is preparation for the BIO EGYPT field Pilot
and evidence-based closure of `BE-002` through `BE-012`; `BE-001` is closed.

## Sprint 14

Sprint 14 is **COMPLETE / MERGED / CLOSED**.

Final slice status:

- S14-01: COMPLETE / MERGED / CLOSED through PR #10.
- S14-02: COMPLETE / MERGED / VERIFIED through PR #11.
- S14-03: COMPLETE / MERGED / VERIFIED through PR #12.
- S14-04: COMPLETE / MERGED / VERIFIED through PR #15.
- S14-05: COMPLETE / MERGED / VERIFIED through PR #19.

S14-05 internal slices:

- S14-05A contracts/data access: COMPLETE.
- S14-05B Site/Monitored Area hierarchy: COMPLETE.
- S14-05C Sensor inventory/threshold metadata: COMPLETE.
- S14-05D refresh/integration/hardening: COMPLETE.

S14-05 was merged into `main` through PR #19.

Final S14-05 feature-branch head before merge:

`19a7e49acb4b0b224aa71d085fd741e2bcadd87e`

Final S14-05 integration commit on `main`:

`2f79609ce8f79ac22ce06c12d9cf08c19a9a8207`

GitHub CI completed successfully before the S14-05 merge.

Local `main` and `origin/main` were subsequently synchronized and verified at
the same integration commit before the documentation-only Sprint 14 closure
branch was created.

See:

- `docs/project-management/SPRINT-14-PLAN.md`;
- `docs/project-management/SPRINT-14-S14-05-PROGRESS.md`;
- `docs/project-management/SPRINT-14-CLOSURE.md`.

## Current Frontend Boundary

The completed frontend baseline includes:

- professional responsive AppShell;
- primary navigation;
- localization foundations;
- accessibility foundations;
- Login and authenticated session lifecycle;
- authorization-aware routing and navigation;
- protected frontend API boundary;
- operational Dashboard;
- operational Monitored Areas page;
- Reports Center;
- Calibration History preview;
- Calibration History CSV export;
- Calibration History PDF export;
- Site → Monitored Area (Room) → Sensor hierarchy;
- Sensor identification and configuration metadata;
- configured Sensor threshold presentation;
- loading, empty, error, success, refresh, and retry behavior for implemented
  operational surfaces;
- frontend regression and quality-gate coverage.

`Monitored Area` is presentation terminology for the existing backend Room domain.

No separate Area backend abstraction was introduced by Sprint 14.

Monitoring Points remain proposed and have no implemented backend table,
repository, or API.

Configured Sensor thresholds displayed by the frontend are configuration metadata
and must not be interpreted as current telemetry, current alarm state, or
device/Sensor connectivity health.

## Architecture Boundary Preserved

The established backend boundaries remain intact.

Calibration evidence remains SQLite-backed.

Telemetry remains InfluxDB 2.x-backed.

The frontend continues to consume established backend contracts rather than
creating a competing domain, persistence model, or authorization model.

Backend authorization remains authoritative.

The reporting UI does not independently recalculate calibration evidence.

The Calibration History CSV and PDF outputs consume the backend-owned canonical
report result.

No unrelated migration, MQTT ingestion, Device lifecycle, Alarm Engine, or
telemetry ownership changes were introduced by the reporting work.

## Current Project Phase

Sprint 15 Pilot Readiness Foundation is complete.

The Pilot Readiness Review is complete.

S15-01 is complete, merged, verified, and closed through PR #21 at `main`
integration commit:

`d0a800dea252907d5f2a942571add2528a29666f`

S15-02 and S15-03 are also complete, merged, verified, and closed.

S15-03 was integrated through PR #25 at `main` integration commit:

`daa64bed7bf6b6a7a5932ebc40c9c31da9536d1b`

S15-04 is complete, merged, verified, and closed through PR #28 at `main`
integration commit:

`f22945ccc5ce9d97a4991b6b923814d04802ade5`

S15-05 is complete, merged, verified, and closed through PR #30 at `main`
integration commit:

`2b2983433f0ea80ef00fd5359d1230b7f86254e3`

S15-06 is complete, merged, verified, and closed through PR #32 at `main`
integration commit:

`8ee97931079d90d4f901e9500f06dc905d7e6049`

S15-07 and Sprint 15 are complete, merged, verified, and closed.

S15-07 was integrated through PR #34 at `main` integration commit:

`c18ca46b3b7c3a68e3ddac1dfab10fdcd76c49f4`

The project is now in controlled Pilot execution preparation.

Potential Pilot requirements remain classified as:

- already implemented and ready;
- implemented but requiring validation;
- configuration required;
- deployment/hardware work required;
- documentation/procedure required;
- genuine software gap.

A possible requirement must not automatically become a new development story
until field preparation confirms an actual gap.

## Pilot Readiness Review Subjects

The Pilot execution path must continue to evaluate:

- target customer/site requirements;
- production deployment topology;
- hardware and gateway readiness;
- Device and Sensor commissioning;
- real telemetry path validation;
- network interruption and recovery behavior;
- operational alarm requirements;
- notification/escalation requirements;
- customer User and role requirements;
- calibration workflow and evidence;
- auditability requirements;
- reporting/export requirements;
- backup and recovery;
- operational logging and diagnostics;
- deployment security hardening;
- installer/update strategy;
- Pilot acceptance criteria;
- commissioning, handover, and support procedures.

These subjects are not automatically new development stories.

Each must be evaluated against the implemented system and the actual BIO EGYPT
field requirements.

## BIO EGYPT Open Items

The controlled Pilot open-items register is maintained in:

`docs/pilot/bio-egypt/BIO-EGYPT-OPEN-ITEMS.md`

Current open items are:

- `BE-001` — CLOSED through signed evidence `BE001-EV-001`.
- `BE-002` — Complete marked-up floor plans and approved Sensor positions.
- `BE-003` — Confirm controller location/count and released channel/electrical capacity.
- `BE-004` — Measure cable routes/lengths and approve cable/termination design.
- `BE-005` — Assign controller, Device, channel, Sensor serial, and platform identities.
- `BE-006` — Approve temperature warning/critical thresholds and delay requirements.
- `BE-007` — Verify calibration certificates/status for all 20 Sensors.
- `BE-008` — Confirm mains, protection, backup power, Internet, DNS/NTP/firewall, and 4G coverage.
- `BE-009` — Approve primary notification channel, recipients, and escalation ownership.
- `BE-010` — Select SMS implementation location/provider/SIM and approved E.164 test recipients.
- `BE-011` — Confirm backup/restore, support, incident, maintenance, and handover procedures.
- `BE-012` — Execute field deployment/commissioning using the approved S15-07 baseline.

Items `BE-002` through `BE-012` remain subject to the controlled closure rule.

Each closure entry must contain:

- evidence reference;
- approver;
- closure date.

Deleting an item is not closure.

Any new survey finding receives the next sequential ID and explicit impact
classification.

## Planned or Deferred

The following items remain subject to separate prioritization or Pilot-gap
confirmation:

- [ ] Monitoring Point architecture and APIs
- [ ] Broader Device discovery, QR, activation-code, and provisioning workflows
- [ ] Asset approval and assignment
- [x] Channel-independent Notification Architecture foundation
- [ ] Additional operational frontend features
- [ ] OTA update capabilities
- [x] Pilot deployment-readiness foundation and controlled operating runbook
- [x] Calibration History preview
- [x] Calibration History CSV export
- [x] Calibration History PDF export

These items must not be assumed necessary for the first Pilot unless the Pilot
execution process establishes that requirement.

## Next Action

Execute controlled BIO EGYPT field-pilot preparation and close `BE-001` through
`BE-012` with evidence.

The immediate first gate is `BE-001`.

Field commissioning and Pilot acceptance remain unexecuted.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
