# BIO-EMS Implementation Plan

## Status

**Current controlled delivery sequence — reconciled 2 September 2026 after local P7-03 through P7-08 verification**

The original Architecture Freeze v1.0 phase model is historical. Current implementation is governed by repository evidence, `PROJECT_STATE.md`, approved ADRs, and the P0-P7 sequence below.

## Current Position

- Sprints 13, 14, and 15 are complete and closed.
- Sprint 16 reporting implementation and BF-10 are complete, merged, and CI verified.
- P0-P6 source-software delivery is complete, merged, and CI verified through P6 productization.
- P7 — Final Product Completion is at its final PR/CI/merge gate.
- P7-01 is complete, merged, and CI verified through PR #141 / merge `873b55439f02fbb7de84d29631d22af399208dec`.
- P7-02 is complete, merged, and CI verified through PR #142 / final CI run #516 / workflow `33543271797` / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`.
- P7-03 through P7-08 are implemented and locally verified on `agent/p7-03-08-product-completion`; normal PR CI and merge remain required.
- Live SMS-provider evidence, physical controller qualification, endurance, production deployment evidence, BIO EGYPT commissioning/UAT, and customer/production acceptance remain separate external gates.

## Next-Session Start Procedure

1. Reconcile local `main` with GitHub `origin/main` and confirm a clean working tree.
2. Read `PROJECT_STATE.md` first, then this file, then `docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`.
3. Verify the existing completion branch through normal PR/CI gates and merge only when green.
4. Record exact PR head, CI workflow/run, and merge evidence in the closure record and current-state documents.
5. Keep payment settlement, invoicing, live remote OTA/update execution and external evidence outside the software closure claim.

## P0-P7 Sequence

### P0 — Professional Software / Reporting Baseline

Status: **COMPLETE / MERGED / CI VERIFIED**

Includes all five controlled report families through Preview/CSV/PDF, professional PDF identity, selected Site time-zone rendering, and authenticated event-driven refresh for Dashboard and Monitored Areas.

### P1 — Notification Delivery Engine

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**

Durable delivery queue, worker/runtime, SMS-provider boundary, Alarm escalation delivery orchestration, and protected Site-scoped Delivery Operations are implemented. Live-provider/field evidence remains external.

### P2 — Site Controller Runtime

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED / EXTERNAL PHYSICAL EVIDENCE OPEN**

BF-08 and P2-01 through P2-09 are implemented and CI verified, including post-P2 durability hardening. Physical controller, DS18B20, SIM800L, deployed MQTT, and endurance evidence remain external gates.

### P3 — Pilot Commissioning Tooling

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

Controlled commissioning sessions, checks, evidence/deviations/decisions, Site-scoped APIs, verification/orchestration, readiness UI, CSV/PDF records, and BIO EGYPT software dry-run/UAT package are implemented.

Closure: PRs #130-#132 / closure merge `6a74122e`.

### P4 — Production Hardening

Status: **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED / EXTERNAL EVIDENCE OPEN**

Operational controls cover backup/restore, process supervision, secrets/configuration, TLS/QoS, persistent storage, recovery, observability, retention, upgrade/rollback, and disaster-recovery evidence structures.

Closure: PR #133 / merge `3b90dda94811440cc18739bb857c036a48ce72ad`.

### P5 — SYSTEM_OWNER / Commercial Operations

Status: **BACKEND/DOMAIN SOFTWARE COMPLETE / MERGED / CI VERIFIED**

The isolated SYSTEM_OWNER trust domain and approved customer fleet identity, license/update-entitlement, and maintenance/calibration/support/update oversight workflows are implemented while preserving the rule that customer ADMIN cannot administer or discover SYSTEM_OWNER.

Closure: PR #134 / CI run #445 / merge `7c1ae9cfad3a26ab8414a931ad6fbfd28cf016fb`.

### P6 — Productization / Deployment / Acceptance

Status: **SOFTWARE PRODUCTIZATION COMPLETE / MERGED / CI VERIFIED / EXTERNAL ACCEPTANCE OPEN**

Controlled release/productization packaging, deployment/acceptance procedures, and supporting source-level tooling are complete.

Closure: PR #135 / CI run #448 / merge `214a228cc490df12b895b264fc031efaecf8931e`.

### P7 — Final Product Completion

Status: **P7-03 THROUGH P7-08 IMPLEMENTED / LOCAL GATES VERIFIED / PR-CI-MERGE PENDING**

Controlled plan: `docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md`.

P7 closes the remaining gap between source-level capability and a coherent end-to-end product surface.

#### P7-01 — SYSTEM_OWNER Frontend Boundary and Console Shell

Status: **COMPLETE / MERGED / CI VERIFIED**

Implemented isolated owner authentication/session state, strict SYSTEM_OWNER principal validation, protected `/system-owner` routing, fail-closed owner route behavior, bilingual owner console shell, no customer-shell owner navigation, and authorization/contract regression tests.

Closure: PR #141 / merge `873b55439f02fbb7de84d29631d22af399208dec` / `docs/project-management/P7-01-SYSTEM-OWNER-CONSOLE-CLOSURE-2026-09-01.md`.

#### P7-02 — Customer / Site Fleet Management

Status: **COMPLETE / MERGED / CI VERIFIED**

Implemented SYSTEM_OWNER customer fleet list/detail, safe customer creation through the existing P5 contract, Site/installation identity visibility from existing commercial bindings, authenticated provenance, and owner-session query isolation. Unsupported customer lifecycle update actions remain intentionally absent because no backend update contract exists.

Closure: PR #142 / final CI run #516 / workflow `33543271797` / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d` / `docs/project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md`.

#### P7-03 — License Lifecycle and Installation Binding UI

Status: **IMPLEMENTED / LOCAL GATES VERIFIED / PR-CI-MERGE PENDING**

Required scope for continuation:

- expose SYSTEM_OWNER license inventory and license detail using the existing isolated platform trust boundary;
- expose validity/lifecycle fields already supported by the platform-operations domain;
- expose supported Site/installation association and clearly distinguish recorded binding from physical installation/commissioning evidence;
- preserve authenticated server-derived actor provenance;
- add only backend mutations that are required by the approved P7-03 acceptance target and are protected by SYSTEM_OWNER middleware, validation, service/repository boundaries, and append-only commercial evidence;
- do not introduce customer-role access to platform commercial routes;
- do not model payment/invoice settlement as license state;
- do not claim remote update execution from entitlement/license records;
- provide bilingual loading/error/empty/detail/action states and regression coverage;
- pass backend/frontend typecheck, build, lint, formatting, tests, and normal PR/CI/merge gates.

P7-03 closure must update `PROJECT_STATE.md`, this plan, roadmap/changelog as applicable, and create a dedicated closure record before advancing to P7-04.

#### P7-04 — Update Entitlement and Release Eligibility UI

Status: **IMPLEMENTED / LOCAL GATES VERIFIED / PR-CI-MERGE PENDING**

Owner-facing entitlement/eligibility workflows with explicit separation from remote update execution.

#### P7-05 — Maintenance, Calibration and Support Fleet Operations

Status: **IMPLEMENTED / LOCAL GATES VERIFIED / PR-CI-MERGE PENDING**

Fleet-level due/overdue/actionable oversight and supported owner operations without fabricating field completion evidence.

#### P7-06 — Product UX and Legacy Cleanup

Status: **IMPLEMENTED / LOCAL GATES VERIFIED / PR-CI-MERGE PENDING**

Remove/reconcile stale frontend artifacts and obsolete user-facing text, including the known Sprint-14 Foundation/deferred residue; review loading/error/empty states, navigation consistency, responsiveness, accessibility, and localization.

#### P7-07 — End-to-End Product Workflow Review

Status: **REVIEW COMPLETE LOCALLY / PR-CI-MERGE PENDING**

Audit every exposed operational/customer/owner workflow for live actions, permission consistency, API/error behavior, refresh behavior, and export/download operation.

#### P7-08 — Full Regression, Documentation Reconciliation and Software Product Closure

Status: **LOCAL REGRESSION AND DOCUMENTATION COMPLETE / PR-CI-MERGE PENDING**

Complete CI gates plus P7 security/navigation/API/UI/export regressions and reconcile all current-state documents with actual PR/CI/merge evidence.

## P7 Exit Gate

BIO-EMS must not be described as **SOFTWARE PRODUCT COMPLETE** until P7-01 through P7-08 are implemented, merged, and CI verified.

P7 software closure still does not establish physical qualification, provider delivery, field commissioning, UAT, Quality/customer sign-off, billing/payment execution, live remote-update execution, or production/customer acceptance.

## Parallel External Evidence Track

The following may proceed in parallel where practical but remains a distinct evidence track:

1. physical hardware qualification and HV-01 through HV-15;
2. live SMS-provider evidence;
3. deployed MQTT/LIVE-REPLAY and recovery evidence;
4. required endurance including the controlled 72-hour gate where applicable;
5. production backup/restore/rollback/DR execution;
6. BIO EGYPT installation, calibration, commissioning and Alarm testing;
7. customer UAT, Quality/customer sign-off, and acceptance.

## Execution Rule

Repository completion, CI success, physical/bench evidence, provider delivery, field commissioning, production deployment, UAT, and customer acceptance are distinct gates. Documentation must state exactly which gate has been satisfied and must not infer later gates from earlier ones.

## Historical Value

P0-P6 closure records remain valid historical evidence. P7 is new approved scope resulting from the post-P6 product audit; historical documents must not be rewritten to imply P7 was part of their original closure.
