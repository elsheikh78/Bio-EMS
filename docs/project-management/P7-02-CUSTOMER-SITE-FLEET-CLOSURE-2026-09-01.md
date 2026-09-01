# P7-02 — Customer / Site Fleet Management Closure

**Date:** 1 September 2026  
**Work package:** P7-02  
**PR:** #142  
**Status:** IMPLEMENTED; final merge subject to successful CI on the documented closure state

## Scope Closed

P7-02 exposes the approved P5 customer/fleet identity capability through the isolated SYSTEM_OWNER frontend boundary created in P7-01.

Implemented scope:

- SYSTEM_OWNER-only customer fleet list and customer detail routes;
- safe customer creation through the existing `/platform-operations/customers` contract;
- Site/installation identity visibility using existing Site records and commercial license/service bindings;
- customer creation provenance (`createdBy`) and append-only commercial event metadata;
- customer-linked license/service counts without exposing later-package mutation workflows;
- isolated platform API client usage and platform-query cache clearing across owner session boundaries;
- bilingual owner UI with loading, error, empty, detail, and create states;
- backend repository and frontend contract/UI regression coverage.

## Authorization and Mutation Boundary

Customer ADMIN/OPERATOR/VIEWER permissions are not reused or elevated. P7-02 remains inside the independent SYSTEM_OWNER trust domain.

The current backend contract authorizes customer creation but does not expose customer lifecycle update endpoints. The UI therefore does not present unsupported edit/status mutation actions. License, installation-binding, update-entitlement, and maintenance/service mutations remain assigned to P7-03 through P7-05.

Authenticated platform actor identity remains server-derived; the create-customer frontend contract cannot submit an `actorIdentity` field.

## Evidence and Data Boundary

The owner overview now projects existing Site identity (`code`, `name`, `location`, `timezone`, `active`) and append-only commercial-event metadata needed for owner fleet context. It does not expose commercial event snapshots or customer-user credentials.

A Site is shown as linked to a customer only when an existing commercial license or service record carries that customer/Site association. P7-02 does not invent or infer installation completion from Site existence alone.

## Verification

Source implementation passed the normal backend and frontend gates before documentation closure:

- CI run #512 / workflow run `33542959284`;
- backend: install, typecheck, build, lint, formatting, tests — SUCCESS;
- frontend: install, typecheck, lint, formatting, tests, build — SUCCESS.

A final CI run is required after this closure documentation is committed and before merge.

## Scope Boundary

P7-02 does not claim billing/payment, invoicing, live OTA/update execution, physical installation, field commissioning, provider delivery, customer UAT, Quality sign-off, or production/customer acceptance.

## Next Controlled Work

P7-03 — License Lifecycle and Installation Binding UI.
