# BIO-EMS Development Roadmap

**Roadmap state:** 1 September 2026  
**Latest published tagged release:** `v0.17.0`  
**Current source-software version:** `0.18.0`

`PROJECT_STATE.md` is the single authoritative current-state document. This roadmap describes the forward product path and must not be used to infer completion of physical, field, provider, UAT, or customer-acceptance gates.

## Delivered Software Baseline — P0-P6

The repository completed, merged, and CI-verified P0-P6. This includes the core EMS platform, reporting, notification delivery, Site Controller runtime, commissioning tooling, production-hardening controls, P5 SYSTEM_OWNER commercial backend/domain workflows, and P6 productization/deployment/acceptance tooling.

The post-P6 product audit did not invalidate those closures. It identified the P7 product-surface completion phase. P7-01 established the isolated SYSTEM_OWNER frontend boundary; P7-02 added the first owner-facing commercial fleet workflow.

## Active Software Roadmap — P7 Final Product Completion

Status: **COMPLETE / MERGED / CI VERIFIED** through PR #145 / CI run #522.

Controlled plan: `docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`.

### P7-01 — SYSTEM_OWNER Console Foundation

Status: **COMPLETE / MERGED / CI VERIFIED**

Implemented an owner-only frontend authentication/session boundary and protected console surface, invisible from customer ADMIN/OPERATOR/VIEWER navigation and constrained to the existing isolated SYSTEM_OWNER trust domain. PR #141 / merge `873b55439f02fbb7de84d29631d22af399208dec`. Closure record: `docs/project-management/P7-01-SYSTEM-OWNER-CONSOLE-CLOSURE-2026-09-01.md`.

### P7-02 — Customer / Site Fleet Management

Status: **COMPLETE / MERGED / CI VERIFIED**

Exposes approved customer/fleet identity through SYSTEM_OWNER-only list/detail/create workflows, existing Site/installation context from commercial bindings, authenticated provenance, and owner-session query isolation. Unsupported customer lifecycle mutation remains absent because the backend does not authorize it. Final PR CI run #516 / workflow `33543271797` passed; PR #142 merged as `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`. Closure record: `docs/project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md`.

### P7-03 — License Lifecycle / Installation Binding

Status: **COMPLETE / MERGED / CI VERIFIED**

Expose SYSTEM_OWNER license inventory/detail, validity/lifecycle, and supported installation/Site binding while preserving server-derived provenance and the isolated platform trust boundary. Recorded Site/license association must not be represented as physical installation, field commissioning, or payment settlement. Any required new mutation contract must use validated SYSTEM_OWNER-only API/service/repository boundaries and append-only commercial evidence.

### P7-04 — Update Entitlement / Release Eligibility

Status: **COMPLETE / MERGED / CI VERIFIED**

Expose approved entitlement and eligibility workflows while keeping remote OTA/update execution explicitly outside the implemented boundary unless separately added.

### P7-05 — Maintenance / Calibration / Support Fleet Operations

Status: **COMPLETE / MERGED / CI VERIFIED**

Provide owner-level fleet oversight and actionable status across the P5 commercial operations domain while preserving site-level evidence boundaries.

### P7-06 — UX / Legacy Cleanup

Status: **COMPLETE / MERGED / CI VERIFIED**

Remove or reconcile stale/dead frontend residue, including obsolete Sprint-14 Foundation/deferred text, and review navigation, loading/error/empty states, responsive behavior, accessibility, and localization.

### P7-07 — End-to-End Product Workflow Audit

Status: **COMPLETE / MERGED / CI VERIFIED**

Exercise every exposed operational, administration, reporting, commissioning, and SYSTEM_OWNER workflow for permission consistency, primary actions, API/error behavior, state refresh, and exports.

### P7-08 — Full Regression / Documentation / Closure

Status: **COMPLETE / MERGED / CI VERIFIED**

Run the complete software quality gate and reconcile all current-state documentation with actual P7 evidence. Only successful P7 closure permits the status **SOFTWARE PRODUCT COMPLETE** for the approved scope.

## Parallel External Evidence and Field Roadmap

P7 is software-product completion. The following remain separate evidence tracks and may proceed in parallel where controlled resources are available:

1. Procure and assemble the initial controller test kit.
2. Execute hardware validation HV-01 through HV-15 for Standard/Advanced controller paths as applicable.
3. Prove power interruption/restart and durable configuration recovery on physical hardware.
4. Prove industrial DS18B20 disconnect/reconnect, fault, excursion, and recovery behavior.
5. Prove SIM800L live emergency SMS behavior with controlled recipients.
6. Prove deployed MQTT disconnect/recovery and LIVE/REPLAY behavior.
7. Execute the required endurance run, including the controlled 72-hour gate where applicable.
8. Install and commission the BIO EGYPT Phase-1 temperature-only Pilot.
9. Capture calibration, Alarm, commissioning, UAT, Quality/customer sign-off, and acceptance evidence through the implemented tooling.
10. Execute production deployment/restore/rollback/DR evidence before claiming production acceptance.

## BIO EGYPT Phase-1 Boundary

The controlled Pilot remains temperature-only using industrial DS18B20 sensors across two Sites, total 20 Sensors. Repository completion does not mean those Sensors/controllers are installed, commissioned, or accepted.

## Later / External Product Integrations

Unless explicitly approved and implemented, later scope includes payment/invoicing integration, live remote OTA/update execution, broader Asset/discovery/provisioning, final production hardware/firmware adapters, additional environmental parameters/industry verticals, and other commercial integrations.

## Domain Boundary

Frontend **Monitored Area** remains presentation terminology for the existing Room domain:

**Site → Monitored Area (Room) → Sensor**

No separate Monitoring Point or Asset backend domain is claimed as implemented by this roadmap.

## Release Boundary

`v0.17.0` remains the latest published tagged release while repository source-software version remains `0.18.0`. P7-01 and P7-02 do not change either value. A later release must be explicitly tagged and published before it is described as the latest published release.

Software completion, CI verification, physical qualification, provider evidence, field commissioning, UAT, and customer/production acceptance remain separate gates.
