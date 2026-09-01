# BIO-EMS Development Roadmap

**Roadmap state:** 1 September 2026  
**Latest published tagged release:** `v0.17.0`  
**Current source-software version:** `0.18.0`

`PROJECT_STATE.md` is the single authoritative current-state document. This roadmap describes the forward product path and must not be used to infer completion of physical, field, provider, UAT, or customer-acceptance gates.

## Delivered Software Baseline — P0-P6

The repository completed, merged, and CI-verified P0-P6. This includes the core EMS platform, reporting, notification delivery, Site Controller runtime, commissioning tooling, production-hardening controls, P5 SYSTEM_OWNER commercial backend/domain workflows, and P6 productization/deployment/acceptance tooling.

The post-P6 product audit did not invalidate those closures. It identified a final product-surface gap: P5 owner capabilities exist in backend/domain form but do not yet have a complete approved SYSTEM_OWNER frontend/commercial console, and a final end-to-end product UX/regression pass is still required.

## Active Software Roadmap — P7 Final Product Completion

Status: **APPROVED / PLANNED / NOT YET IMPLEMENTED**

Controlled plan: `docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`.

### P7-01 — SYSTEM_OWNER Console Foundation

Create an owner-only frontend boundary and navigation surface, invisible to customer ADMIN/OPERATOR/VIEWER identities and protected by the existing isolated SYSTEM_OWNER trust domain.

### P7-02 — Customer / Site Fleet Management

Expose approved customer/fleet identity and supported installation/Site context through controlled owner workflows.

### P7-03 — License Lifecycle / Installation Binding

Expose license inventory, validity/lifecycle, and supported installation/site binding without conflating license state with external payment settlement.

### P7-04 — Update Entitlement / Release Eligibility

Expose approved entitlement and eligibility workflows while keeping remote OTA/update execution explicitly outside the implemented boundary unless separately added.

### P7-05 — Maintenance / Calibration / Support Fleet Operations

Provide owner-level fleet oversight and actionable status across the P5 commercial operations domain while preserving site-level evidence boundaries.

### P7-06 — UX / Legacy Cleanup

Remove or reconcile stale/dead frontend residue, including obsolete Sprint-14 Foundation/deferred text, and review navigation, loading/error/empty states, responsive behavior, accessibility, and localization.

### P7-07 — End-to-End Product Workflow Audit

Exercise every exposed operational, administration, reporting, commissioning, and SYSTEM_OWNER workflow for permission consistency, primary actions, API/error behavior, state refresh, and exports.

### P7-08 — Full Regression / Documentation / Closure

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

`v0.17.0` remains the latest published tagged release while repository source-software version remains `0.18.0`. P7 planning does not change either value. A later release must be explicitly tagged and published before it is described as the latest published release.

Software completion, CI verification, physical qualification, provider evidence, field commissioning, UAT, and customer/production acceptance remain separate gates.