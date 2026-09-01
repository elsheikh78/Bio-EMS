# P7 — Final Product Completion Plan

**Date:** 1 September 2026  
**Status:** APPROVED / PLANNED / NOT YET IMPLEMENTED  
**Baseline:** P0-P6 source-software delivery complete, merged, and CI verified  
**Purpose:** close the remaining gap between the implemented BIO-EMS software foundations and a coherent customer-ready/commercially operable product interface before declaring the software product complete.

## 1. Why P7 Exists

P0-P6 delivered the core EMS, reporting, notifications, Site Controller runtime, commissioning tooling, production-hardening controls, isolated SYSTEM_OWNER commercial APIs, and productization/acceptance tooling. A post-P6 product audit identified that source-level capability completion is not identical to end-to-end product completion.

The most material gap is that P5 commercial operations are implemented behind the isolated SYSTEM_OWNER API boundary, while the normal frontend navigation exposes operational/customer administration screens only. BIO-EMS therefore requires a final product-completion pass that exposes approved owner workflows through a controlled UI, reconciles remaining lifecycle workflows, removes stale frontend debt, and validates the complete product surface.

P7 does not invalidate P0-P6 closure evidence. It is new approved scope created by the post-P6 audit.

## 2. P7 Completion Definition

P7 is complete only when all approved P7 work packages are implemented, tested, documented, merged, and CI verified. Completion must establish a coherent software product surface; it must not claim physical hardware qualification, live-provider success, field commissioning, customer UAT, billing settlement, or production acceptance without genuine external evidence.

## 3. Work Packages

### P7-01 — SYSTEM_OWNER Frontend Boundary and Console Shell

Implement an isolated owner-only frontend entry and navigation surface that is not visible or discoverable to customer ADMIN/OPERATOR/VIEWER roles. Reuse the authenticated SYSTEM_OWNER trust boundary; do not weaken or merge it with customer administration.

Acceptance targets:

- owner-only route boundary and navigation;
- explicit unauthorized/not-found behavior;
- no SYSTEM_OWNER discovery from customer roles;
- owner console shell suitable for the P7 commercial modules;
- localization/accessibility consistent with the main product shell;
- frontend authorization tests.

### P7-02 — Customer / Site Fleet Management

Expose the implemented platform-customer/fleet identity workflows to SYSTEM_OWNER with controlled customer lifecycle views and linkage to Sites/installations where supported by the backend contract.

Acceptance targets:

- customer list/detail lifecycle;
- customer/site installation identity visibility;
- safe create/update operations only where backend contracts already authorize them;
- immutable/provenance evidence visible where operationally useful;
- no cross-boundary customer ADMIN privilege escalation.

### P7-03 — License Lifecycle and Installation Binding UI

Expose license state, validity, installation/site binding, and lifecycle operations available in P5.

Acceptance targets:

- license inventory and detail;
- status/validity visibility;
- installation/site association where implemented;
- controlled lifecycle mutation with authenticated SYSTEM_OWNER provenance;
- clear distinction between software entitlement records and external billing/payment state.

### P7-04 — Update Entitlement and Release Eligibility UI

Expose free/paid/update-entitlement records and eligibility decisions already supported by the commercial domain, without pretending that remote OTA delivery exists where it does not.

Acceptance targets:

- entitlement visibility per customer/license/installation as supported;
- controlled entitlement mutation;
- release/update eligibility representation;
- explicit separation between entitlement approval and actual remote update execution;
- append-only commercial-event provenance preserved.

### P7-05 — Maintenance, Calibration and Support Fleet Operations

Provide SYSTEM_OWNER fleet-level oversight for maintenance/calibration/support/update obligations, using existing P5 records and existing site-level calibration evidence without conflating the two domains.

Acceptance targets:

- fleet-level due/overdue/actionable views;
- maintenance/calibration/support records and status filters;
- links/context to relevant customer/site/device/sensor where supported;
- controlled owner mutations with audit/provenance;
- no fabricated scheduling or completion evidence.

### P7-06 — Product UX and Legacy Cleanup

Audit and remove or reconcile stale/dead frontend artifacts and obsolete user-facing text. The known Sprint-14 `FoundationPage`/deferred-description residue is included in this package.

Acceptance targets:

- no obsolete user-facing statements that contradict current implementation;
- remove unused legacy page/code only after reference checks;
- navigation labels/routes consistent with actual capabilities;
- loading/error/empty states reviewed across operational and owner surfaces;
- responsive/accessibility/localization behavior preserved.

### P7-07 — End-to-End Product Workflow Review

Execute a controlled software workflow audit across every currently exposed product area:

- authentication/session lifecycle;
- Workspace/Dashboard;
- Monitored Areas;
- Alarms and acknowledgement;
- Devices;
- Notification Deliveries;
- Sensor Calibration;
- Reports Preview/CSV/PDF;
- Commissioning;
- Configuration;
- Users;
- SYSTEM_OWNER commercial console introduced by P7.

Acceptance targets:

- no dead primary actions;
- permissions match navigation and backend enforcement;
- API errors surface coherently;
- key mutations refresh the relevant UI state;
- export/download actions are exercised in automated or controlled tests where practical.

### P7-08 — Full Regression, Documentation Reconciliation and Software Product Closure

Run the complete backend/frontend quality gates and reconcile current-state documentation after P7 implementation.

Minimum software gate:

- dependency installation in controlled CI;
- backend/frontend typecheck;
- build;
- lint;
- formatting checks;
- automated tests;
- P7 authorization/security regression;
- product-route/navigation regression;
- relevant report/export regression;
- commercial API/UI contract regression.

P7 closure must update `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, `README.md`, `docs/architecture/roadmap.md`, `docs/SPRINT_PROGRESS.md`, and this P7 record with actual PR/CI/merge evidence.

## 4. Explicit Non-Goals / External Integrations

Unless separately approved and implemented during P7, the following are not prerequisites for P7 software completion:

- payment gateway integration;
- invoice/accounting platform integration;
- automatic collection or settlement;
- live remote OTA/update execution;
- final production controller firmware/hardware adapters;
- physical hardware qualification;
- live SIM800L/provider evidence;
- BIO EGYPT physical commissioning/UAT;
- production/customer acceptance.

The UI must label external/not-integrated states honestly rather than simulate them.

## 5. Security Guardrails

- SYSTEM_OWNER remains isolated from customer ADMIN/OPERATOR/VIEWER identities.
- Customer roles must not discover owner-only routes, navigation, customer fleet, licensing, or platform-commercial data.
- All owner mutations derive actor identity from authenticated platform-principal context.
- Existing append-only commercial event/provenance behavior must be preserved.
- No client-supplied actor identity may replace authenticated provenance.
- P7 frontend authorization is defense in depth; backend authorization remains mandatory.

## 6. Documentation Policy

Current-state documents are updated to show P7 as the active approved software phase. Historical P0-P6 closure, Sprint, PR, release, and handoff records remain historical evidence and are not rewritten to pretend P7 existed earlier.

`PROJECT_STATE.md` remains the single current-state authority.

## 7. Release / Version Boundary

Creating this plan does not change `VERSION`, does not publish a release, and does not modify the historical `v0.17.0` release. Source version remains `0.18.0` until implementation work explicitly requires and approves a version change.

## 8. P7 Exit Statement

Only after P7-01 through P7-08 are complete, merged, and CI verified may BIO-EMS be described as **SOFTWARE PRODUCT COMPLETE** for the approved scope.

Even then, the following remain separate gates: physical qualification, live provider evidence, production execution, BIO EGYPT field commissioning, UAT, Quality/customer sign-off, and customer/production acceptance.