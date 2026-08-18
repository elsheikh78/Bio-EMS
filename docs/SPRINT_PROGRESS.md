# Sprint Progress

## Sprint 16 — Product Experience, Reporting, Hardware, and Pilot Readiness

Status: **IN PROGRESS**

### Completed work items

- S16-01 — Requirements Baseline: **COMPLETE / MERGED / VERIFIED / CLOSED**.
- S16-02 — Design System and Wireframes: **COMPLETE / MERGED / VERIFIED / CLOSED**.
- S16-03 — Reporting Architecture: **COMPLETE / MERGED / VERIFIED / CLOSED**.
- S16-04 — Hardware Design Review: **COMPLETE / MERGED / VERIFIED / CLOSED**.
- S16-06 — Executive Dashboard and Operational Charts: **COMPLETE / PRODUCT OWNER APPROVED / MERGED / CI VERIFIED / CLOSED** through PR #50.

### S16-06 integration evidence

- final feature head: `29625572bcd1a2f33b1d0145ff801c003e244096`;
- PR: #50;
- integration commit: `4ce1155156015d1983a93e637dde8f99f7be2337`;
- GitHub CI run: `32179346503` — PASS;
- final visual and functional Product Owner acceptance: 18 August 2026.

S16-06 delivered the approved Dashboard visual treatment, current operational charts,
completed navigation, and the authorized Sensors & Calibration register and history.

### Current next actions

- Product/Reporting: start S16-07 Reports Center.
- Field: continue S16-05 controlled BIO EGYPT survey evidence.
- Hardware: progress S16-08 only from approved S16-04 and applicable S16-05 evidence.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Completed Sprints

Sprints 09 through 15 are complete.

## Sprint 15 — Pilot Readiness Foundation

Status: **COMPLETE / MERGED / VERIFIED / CLOSED**

### Work-item status

- S15-01 — Sensor Lifecycle & Calibration Foundation: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #21.
- S15-02 — Calibration History: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #23.
- S15-03 — Device / Communication Health: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #25.
- S15-04 — Notification Architecture: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #28.
- S15-05 — SMS Failover Contract: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #30.
- S15-06 — BIO EGYPT Pilot Documentation: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #32.
- S15-07 — Deployment & Commissioning Readiness: **COMPLETE / MERGED / VERIFIED / CLOSED** through PR #34.

### S15-01 integration evidence

- feature commit: `bb3873424a566ef43a18e12b732b9f252bfa99ff`;
- PR: #21;
- merge commit: `d0a800dea252907d5f2a942571add2528a29666f`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-01 added the backward-compatible Sensor product-grade, hardware, installation,
and current calibration-state foundation. Calibration history was excluded and
remains the dedicated scope of S15-02.

### S15-02 integration evidence

- feature commit: `a579f69ce921ecb208133efca5c0d40a9bd42dea`;
- PR: #23;
- merge commit: `43969c57a1caf670cac22b52543a8b2a253adb89`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-02 added immutable, actor-audited calibration records and atomic synchronization
of the current Sensor calibration snapshot after passing records.

### S15-03 integration evidence

- feature commit: `ce969ff3b9fefa781823e1ee31a87ef952a953f5`;
- PR: #25;
- merge commit: `daa64bed7bf6b6a7a5932ebc40c9c31da9536d1b`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-03 added trusted telemetry/heartbeat last-seen tracking, derived Device
communication states, a health read API, and communication-based Dashboard offline
counting without changing Device lifecycle semantics.

### S15-04 integration evidence

- feature commit: `2fc2ea7cf3041b885285d7753254c0f741ad327a`;
- PR: #28;
- merge commit: `f22945ccc5ce9d97a4991b6b923814d04802ade5`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-04 added a durable, idempotent, channel-independent notification event outbox,
transactional Alarm event production, Device communication transition contracts,
and a future delivery-adapter seam without selecting an external provider.

### S15-05 integration evidence

- feature commit: `66b43e139c1c5462860a3c24ddd2a42ce4f524db`;
- PR: #30;
- merge commit: `2b2983433f0ea80ef00fd5359d1230b7f86254e3`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-05 added the provider-neutral SMS failover decision table, gateway contract,
E.164 safety boundary, and retry idempotency for critical Alarm and Device-offline
events during primary communication loss.

### S15-06 integration evidence

- feature commit: `e5015163c606f4aab969e615e67892f023eca7cb`;
- PR: #32;
- merge commit: `8ee97931079d90d4f901e9500f06dc905d7e6049`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-06 added the controlled BIO EGYPT two-Site/eight-area/20-Sensor package,
installation and wiring requirements, commissioning/acceptance record, and blocking
open-items register without inventing field evidence.

### S15-07 integration evidence

- feature commit: `15ee68c25b0ad41a67ab9c1ff08a8a72dd4d6d5d`;
- PR: #34;
- merge commit: `c18ca46b3b7c3a68e3ddac1dfab10fdcd76c49f4`;
- Backend and Frontend GitHub CI quality gates: PASS.

S15-07 added production configuration validation, MQTT TLS/QoS, persistent SQLite,
complete telemetry quality/timestamp persistence, LIVE/REPLAY recovery semantics,
the Site Controller integration contract, and operational deployment/restore
evidence boundaries.

## Sprint 14 — Frontend Application

Status: **COMPLETE / MERGED / CLOSED**

Sprint 14 established the production-oriented frontend application foundation and completed the initial operational frontend surfaces required before Pilot readiness assessment.

### Final Slice Status

- S14-01 — COMPLETE / MERGED / CLOSED
- S14-02 — COMPLETE / MERGED / VERIFIED through PR #11
- S14-03 — COMPLETE / MERGED / VERIFIED through PR #12
- S14-04 — COMPLETE / MERGED / VERIFIED through PR #15
- S14-05 — COMPLETE / MERGED / VERIFIED through PR #19

### S14-05 — Monitored Areas

All S14-05 internal slices are complete:

- S14-05A — contracts and data access: COMPLETE
- S14-05B — Site / Monitored Area hierarchy: COMPLETE
- S14-05C — Sensor inventory and threshold metadata: COMPLETE
- S14-05D — refresh, integration, and hardening: COMPLETE

S14-05 was integrated into `main` through PR #19.

Final S14-05 feature-branch head before merge:

`19a7e49acb4b0b224aa71d085fd741e2bcadd87e`

Final S14-05 integration commit on `main`:

`2f79609ce8f79ac22ce06c12d9cf08c19a9a8207`

GitHub CI completed successfully before merge.

For S14-05, `Monitored Area` is presentation terminology for the existing backend Room domain.

No separate Area backend abstraction was introduced.

Monitoring Points remain outside the implemented Sprint 14 domain.

## Sprint 14 Delivered Capability

Sprint 14 delivered:

- frontend architecture and quality foundations;
- professional responsive AppShell;
- localization and accessibility foundations;
- authenticated session lifecycle;
- authorization-aware routing and navigation;
- operational Dashboard;
- operational Monitored Areas hierarchy;
- Site → Monitored Area (Room) → Sensor presentation;
- Sensor configuration and threshold metadata;
- loading, empty, error, refresh, retry, and success states;
- frontend regression coverage and quality gates.

The existing backend architecture remained authoritative for authentication, authorization, domain behavior, telemetry, and alarm processing.

## Sprint 14 Final State

Sprint 14 implementation is closed.

The repository has moved from frontend feature implementation to **Pilot Readiness assessment**.

No additional feature expansion should be approved solely because a capability could be useful.

Potential work must first be classified against the requirements of the target Pilot deployment.

## Pilot Readiness Transition

The BIO-EMS Pilot Readiness Review was completed and recorded in
`docs/BIO-EMS-FULL-AUDIT-2026-08-17.md`. Its decision established Sprint 15 as the
Pilot Readiness Foundation sequence.

The review will determine which Pilot requirements are:

- already implemented and ready;
- implemented but requiring validation;
- configuration required;
- deployment or hardware work required;
- documentation or procedure required;
- genuine software gaps.

Only confirmed gaps should create new implementation scope.

Sprint 15 is closed. The immediate project critical path is controlled BIO EGYPT
field-pilot preparation and closure of `BE-001` through `BE-012`. The Pilot remains
not commissioned and not accepted.
