# PVR-01 — Platform Integration Recovery

Status: IMPLEMENTED / VERIFICATION PENDING
Date: 2026-08-24
Branch: `agent/pvr-01-platform-integration-recovery`
Base: `origin/main` at `2ccbda7e4405e9fbc7d5d9bbbad2b3781128ad28`

## Business requirement

The protected frontend must accept the exact successful Site representation returned by the
production backend. A successful `/api/v1/sites` response must not be converted into a client-side
failure by a stale runtime schema.

## Observed operational failure

Manual browser evidence showed that the shared Site query failed in:

- Monitored Areas;
- Notification Recipients;
- Escalation Policies;
- customer Audit Log.

Sensor configuration, User Management, and Calibration reporting continued to load because they
do not require the rejected Site collection for their initial view.

## Root cause

The SQLite Site repository returns `SELECT *`, including the schema-owned `created_at` field. The
frontend Site runtime contract was strict but omitted `created_at`. Zod therefore rejected an
otherwise valid successful response. Mocked tests did not include the production field and allowed
the mismatch to pass CI.

## Implemented correction

- the frontend Site contract accepts optional nullable `created_at`;
- the backend Site type documents the returned persistence field;
- Site contract and API tests now use the production response shape;
- strict rejection of unknown fields remains in force.

## Acceptance criteria

- production-shaped Site responses pass runtime validation;
- unknown Site fields remain rejected;
- Monitored Areas, Notification Recipients, Escalation Policies, and Audit Log can consume the
  shared Site query;
- frontend and backend format, lint, typecheck, test, and build gates pass;
- a manual browser smoke test confirms the recovered Site-dependent views before closure.

## Boundaries

PVR-01 repairs integration only. It does not complete the operational Monitored Areas, Alarms,
Devices, Reports, notification delivery, controller runtime, or customer acceptance scope.
