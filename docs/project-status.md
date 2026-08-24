# Project Status

## PVR-01 platform integration recovery — 24 August 2026

PVR-01 repairs the production Site response mismatch observed during manual platform review. The
backend returns the schema-owned `created_at` field while the strict frontend Site contract had
omitted it, causing the shared Site query to fail in Monitored Areas, Notification Recipients,
Escalation Policies, and the customer Audit Log.

The frontend contract and its API regression fixture now match the production response while
retaining strict unknown-field rejection. Automated gates and the required manual browser smoke
test remain closure evidence; PVR-01 does not claim completion of the operational platform tabs.

## BF-09-06 final frontend closure — 24 August 2026

BF-09-06 is merged through PR #82 at integration commit
`651699413e1d7d254b005ee5f12ff93b20cd1046`; GitHub CI run 221 succeeded. The ADMIN route is
now presented as one Commercial Configuration center, and recipient, escalation,
and customer Audit data is not requested until the operator deliberately selects a
Site. Repeated lifecycle controls expose user-specific accessible names.

Frontend gates pass with 32 files / 244 tests plus build. Backend gates pass with 71
files / 600 tests plus build; formatting, lint, typecheck, and documentation
consistency checks pass. The slice closes UX, accessibility, documentation
consistency, and full-regression evidence only. It does not add provider delivery, controller runtime, field
commissioning, or customer acceptance. BF-09 is complete, merged, CI verified, and closed.

## BF-09-05 Audit Log and User Management UI — 24 August 2026

BF-09-05 is merged through PR #81 at integration commit
`79c40bb38cdfb169a15aa211e973e6ab3818d1f4`; GitHub CI run 219 succeeded. The
ADMIN-only Users route provides list/create,
profile/role, lifecycle, and password workflows plus an explicit Site-scoped Audit
Log showing actor, action, result, target, and event time.

Password values are never displayed after submission or placed in paths. The compact
Audit UI deliberately omits structured prior/new values while the immutable backend
record remains authoritative. Platform audit remains isolated from customer ADMIN.

Frontend gates pass with 32 files / 244 tests plus production build. Backend
regression gates pass with 71 files / 600 tests plus build. Both applications pass
format, lint, and typecheck.

## BF-09-04 escalation-policy UI — 24 August 2026

BF-09-04 is merged through PR #80 at integration commit
`1d4e7a1ca4bb464bf68448dce962947e776ed009`; GitHub CI run 216 succeeded. ADMIN can
select a Site, manage policy identity/ownership/severity,
define one through twenty ordered recipient-role/channel steps with strictly
increasing elapsed delays, and use the dedicated lifecycle boundary.

The UI generates contiguous positions and rejects invalid delay/channel/severity
states before protected mutation. It configures deterministic policy data only; it
does not send messages, consume the outbox, or claim provider/field capability.

Frontend gates pass with 30 files / 237 tests plus production build. Backend
regression gates pass with 71 files / 600 tests plus build. Both applications pass
format, lint, and typecheck.

## BF-09-03 notification recipient UI — 24 August 2026

BF-09-03 is merged through PR #79 at integration commit
`40b5fc7f6e47f1ba581426b757b9afb169e36fbd`; GitHub CI run 214 succeeded. ADMIN can
select a Site, list its recipients, create or edit
a recipient with unique Email/SMS/WhatsApp channels and Warning/Critical eligibility,
and activate or deactivate the profile through the dedicated lifecycle route.

The list exposes channel and severity metadata without displaying contact addresses.
Email and E.164 contact validation occurs before protected mutations, while backend
validation and authorization remain authoritative. Delivery providers and message
sending remain explicitly outside this UI slice.

Frontend gates pass with 29 files / 232 tests plus production build. Backend
regression gates pass with 71 files / 600 tests plus build. Both applications pass
format, lint, and typecheck.

## BF-09-02 Sensor configuration UI — 24 August 2026

BF-09-02 is merged through PR #78 at integration commit
`78e94fef09f3170219bb880d8bc78033a9769994`; GitHub CI run 212 succeeded. The
ADMIN-only Configuration route now exposes a searchable Sensor
register and a controlled editor for persisted warning/alarm thresholds and
warning/critical activation delays.

The editor rejects invalid threshold ordering and delay values outside whole seconds
0 through 86400 before sending either protected mutation. Successful operations
refresh the shared Sensor register. This is configuration UI only; it does not claim
live telemetry changes, provider delivery, or field commissioning.

Frontend gates pass with 28 files / 227 tests plus production build. Backend
regression gates pass with 71 files / 600 tests plus build. Both applications pass
format, lint, and typecheck.

## BF-09-01 frontend readiness and API contracts — 24 August 2026

BF-09-01 is merged through PR #77 at integration commit
`a4e33bf9686141596b1580f5b925a64487348ba0`.

The frontend permission vocabulary now mirrors the backend through BF-07. The
mutation-capable Configuration route/navigation is ADMIN-only while read-only
Monitored Areas and Calibration access remains unchanged. Runtime-validated protected
API adapters now cover Sensor threshold/delay, recipient, and escalation contracts;
management screens remain deliberately unclaimed.

Frontend gates pass with 27 files / 223 tests. Backend regression gates pass with 71
files / 600 tests. Both applications pass format, lint, typecheck, and build.
The GitHub connector returned no commit-associated workflow run for the PR; the
protected merge accepted the exact reviewed head SHA.

## BF-08 controller configuration synchronization contract — 24 August 2026

BF-08 is merged and verified through PR #75 at `main` integration commit
`55a2031dc404d9c9cfdf51fac157261b3d0dd8c7`. GitHub CI run 206 completed
successfully before merge. The BF-01 through BF-08 backend-foundation sequence is
therefore complete at repository-contract level, subject to each slice's documented
field/UI/provider exclusions.

Contract version 1 defines the minimum Site Controller offline-critical bundle,
canonical checksum envelope, explicit APPLIED/REJECTED acknowledgement, exact
effective-state comparison, reconnect decision, and last-acknowledged safe fallback.
It does not claim transport, controller firmware/storage, or field commissioning.

Backend gates pass with 71 files / 600 tests. The unchanged frontend passes 25 files /
212 tests plus typecheck, lint, format, and production build.

## BF-07 escalation policy — 24 August 2026

BF-07 is merged and verified through PR #74 at `main` integration commit
`5890629b938a8b4dfe0364b1f41abbc72b2dc16f`. GitHub CI run 204 completed
successfully before merge.

Site-scoped active/inactive policies now define owner role, Warning/Critical
eligibility, and contiguous steps with strictly increasing elapsed delays, target
recipient role, and eligible channels. The resolver returns due steps
deterministically without sending messages or consuming the outbox.

Backend gates pass with 70 files / 596 tests. The unchanged frontend passes 25 files /
212 tests plus typecheck, lint, format, and production build.

## BF-06 notification recipient directory — 24 August 2026

BF-06 is merged and verified through PR #73 at `main` integration commit
`0532d2557d6d190275d611df27cf38cb857f43c6`. GitHub CI run 202 completed
successfully before merge.

The backend now supports Site-scoped recipient profiles, normalized Email/SMS/
WhatsApp endpoints, active/inactive lifecycle, and per-channel Warning/Critical
eligibility through dedicated ADMIN-only read/manage permissions. Contact addresses
are excluded from audit evidence, logs, URLs, and deduplication keys. No delivery
provider, escalation engine, or customer contact is activated.

Backend gates pass with 68 files / 587 tests. The unchanged frontend passes 25 files /
212 tests plus typecheck, lint, format, and production build.

## BF-05 configurable Alarm persistence/delay — 24 August 2026

BF-05 is merged and verified through PR #72 at `main` integration commit
`d67ea4ac5ccecc07840a9e391df83d74911e7328`. GitHub CI run 200 completed
successfully before merge.

Sensors now persist independent warning/critical activation delays from 0 through
86400 seconds. A positive delay uses restart-safe pending state; normal, opposite,
or severity-changing LIVE readings reset it. REPLAY remains excluded, recovery
remains immediate, and no BIO EGYPT timing value is hard-coded.

Backend gates pass with 66 files / 573 tests. The frontend passes 25 files / 212
tests plus typecheck, lint, format, and production build.

## BF-04 editable Sensor alarm thresholds — 24 August 2026

BF-04 is merged and verified through PR #71 at `main` integration commit
`d2fe86ab715ab8eb5ec5c89b7b37dfbf82e6d6c2`. GitHub CI run 198 completed
successfully before merge.

ADMIN can partially update or clear the four existing Sensor warning/alarm thresholds
through a strict post-creation route. Effective values must remain strictly ordered
and within the Sensor measurement range when configured. SUCCESS persistence and
Site-scoped prior/new audit evidence are atomic.

Backend gates pass with 64 files / 558 tests. The frontend regression suite passes 25 files /
212 tests plus typecheck, lint, format, and production build.

## BF-03 User Management audit integration — 24 August 2026

BF-03 is merged and verified through PR #70 at `main` integration commit
`4ff9882a571f90761a5eb3bdc25e427867e76e95`. GitHub CI run 196 completed
successfully before merge.

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

Execute controlled BIO EGYPT field-pilot preparation and close `BE-002` through
`BE-012` with evidence. `BE-001` is already closed through `BE001-EV-001`.

The immediate open gate is `BE-002`: obtain and mark up the controlled plans for both
Sites, record all 20 Sensor positions, and secure BIO EGYPT Quality approval using the
prepared `BE002-EV-001` evidence pack.

Field commissioning and Pilot acceptance remain unexecuted.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
