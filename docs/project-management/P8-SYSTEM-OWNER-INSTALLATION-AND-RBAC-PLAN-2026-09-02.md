# P8 — SYSTEM_OWNER Installation Provisioning and RBAC Realignment Plan

**Date:** 2 September 2026  
**Status:** APPROVED PLAN / IMPLEMENTATION NOT STARTED  
**Architecture authority:** `docs/adr/ADR-022-system-owner-installation-provisioning-and-customer-rbac.md`

## Goal

Provide a controlled SYSTEM_OWNER installation workflow that creates the customer
topology, Telemetry configuration and Device mapping, safely delivers versioned
configuration, records technical Commissioning, and requires independent customer
ADMIN acceptance. Realign customer permissions with the approved operating model.

P8-01 WhatsApp and Email delivery is already merged. This plan controls P8-02
through P8-08 and does not reopen P0-P7 closure.

## P8-02 — Customer ownership and authorization foundation

### Scope

- Add explicit customer ownership for customer Users and operational Sites.
- Define safe Site/Area/Telemetry scoping for isolated SYSTEM_OWNER APIs.
- Introduce dedicated platform permissions; do not impersonate customer ADMIN.
- Deny cross-customer references at schema, service and repository boundaries.
- Add versioned migrations and tenant-isolation tests.

### Acceptance

- A platform request can target only a validated customer and owned Site.
- Customer sessions cannot cross customer/Site boundaries.
- Existing unowned data receives a controlled migration/backfill decision.
- Audit events contain platform/customer/Site context without secrets.

## P8-03 — RBAC realignment and ADMIN lifecycle

### Scope

- Remove customer `CONFIGURATION_WRITE` topology creation from ADMIN routes.
- Remove `DEVICE_MANAGE` and `COMMISSIONING_MANAGE` from OPERATOR.
- Preserve ADMIN post-handover Device management, thresholds, Alarm delays,
  calibration, recipients and escalation policies.
- Preserve ADMIN/OPERATOR Alarm acknowledgement and report export.
- Preserve VIEWER read-only reports without export or acknowledgement.
- Add SYSTEM_OWNER creation/lifecycle management for customer ADMIN accounts.
- Restrict customer ADMIN User Management to OPERATOR and VIEWER accounts.

### Acceptance

- Backend and frontend permission vocabularies match exactly.
- Formerly allowed but now forbidden mutations return controlled `403` responses
  before validation or persistence.
- No customer role can create, modify, disable or discover SYSTEM_OWNER.
- ADMIN cannot create, elevate, disable or reset another ADMIN.
- Complete route-authorization and UI-navigation regression matrices pass.

## P8-04 — Installation draft and topology provisioning

### Scope

- Add installation aggregate and lifecycle states.
- Create SYSTEM_OWNER APIs/UI for customer, Sites, Monitored Areas, Telemetries and
  initial Device inventory.
- Capture counts as validation summaries derived from actual child records rather
  than duplicating mutable count fields where avoidable.
- Support Site metadata, Area type, Telemetry type/unit/location and Device identity.
- Preserve `Room`/`Sensor` backend compatibility while presenting Area/Telemetry.

### Acceptance

- Wizard supports save/resume as `DRAFT`.
- Every entity has explicit customer/Site ownership and stable identity.
- Counts displayed by the review step equal persisted records.
- Partial drafts never become operational configuration.

## P8-05 — Telemetry configuration, Device mapping and validation

### Scope

- Configure each Telemetry's measurement type, unit, channel, enabled state,
  initial thresholds, Alarm delays, recording/sampling parameters, calibration
  metadata and installation notes where supported by the domain.
- Map Device -> Site -> Monitored Area -> channel -> Telemetry.
- Prevent duplicate Device channels and cross-Site/cross-customer mapping.
- Validate configuration completeness and produce actionable error lists.

### Acceptance

- No Telemetry becomes ready without a valid Device/channel mapping.
- A Device cannot map to a foreign Site or Area.
- Threshold/delay rules reuse the approved domain services.
- Unsupported configuration fields are not invented; each requires a defined
  persistence, synchronization and runtime-consumption contract.

## P8-06 — Versioned revisions and controller application evidence

### Scope

- Preserve the last active configuration while structural changes are drafted.
- Add reviewable prior/new revision diffs, actor, reason and immutable version.
- Reuse BF-08 version/checksum receipts and durable controller recovery behavior.
- Represent pending, sent, confirmed, rejected and failed outcomes.
- Permit controlled retry, cancel and rollback without overwriting evidence.

### Acceptance

- Delivery never equals application.
- Only an exact controller receipt activates the expected version.
- Failure leaves the last acknowledged valid configuration active.
- Audit and receipt evidence survive process restart.
- Stale, duplicate and mismatched receipts fail closed.

## P8-07 — Technical Commissioning and customer acceptance separation

### Scope

- SYSTEM_OWNER executes technical Commissioning and attaches evidence.
- ADMIN independently accepts or rejects customer handover.
- OPERATOR and VIEWER retain read-only Commissioning access.
- Add `CUSTOMER_ACCEPTANCE_PENDING`, `CORRECTION_REQUIRED` and `COMMISSIONED`
  presentation and persistence behavior.
- Prevent self-acceptance by SYSTEM_OWNER.

### Acceptance

- Configuration-active status does not imply Commissioned status.
- Commissioned requires successful technical decision plus ADMIN acceptance.
- Rejection preserves all prior evidence and opens a corrective path.
- Actor identity and time are server-derived and append-only.

## P8-08 — SYSTEM_OWNER wizard, full regression and closure

### Scope

- Deliver the end-to-end bilingual installation wizard and review summary.
- Show Site/Area/Device/Telemetry counts, mappings, readiness and blocking errors.
- Provide Modify Installation, Review Changes and Apply Changes workflows.
- Exercise authorization, customer isolation, revisions, controller receipts,
  Commissioning, customer acceptance, accessibility and responsive behavior.
- Reconcile README, state, roadmap, changelog and operator documentation.

### Acceptance

- A controlled end-to-end software scenario passes from customer draft through
  configuration receipt and pending customer acceptance.
- Full backend/frontend gates pass.
- Closure distinguishes source verification from physical installation, live
  controller evidence, Commissioning execution and customer acceptance.

## Explicitly deferred

- `INSTALLATION_ENGINEER` or other delegated BIO-EMS staff roles.
- Bulk spreadsheet import unless separately approved.
- Physical installation claims without field evidence.
- Live controller receipt, Commissioning and customer acceptance claims before UAT.
- Billing/payment and live OTA execution outside already approved contracts.

## Execution order

P8-02 is the mandatory foundation. P8-03 through P8-07 proceed in order unless a
documented dependency review permits safe parallel work. P8-08 closes only after
all preceding packages are merged and CI verified.

