# BF-09 — Frontend Readiness Work Package

Status: BF-09-01 IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-09-01-frontend-readiness`
Base: final BF-01 through BF-08 documentation merge `6297d0d083e5864488a2ce1cdd7f421fd519bff9`

## Objective and slices

BF-09 converts stable backend contracts into controlled ADMIN frontend workflows:

1. BF-09-01 — permission parity, route readiness, and typed API contracts;
2. BF-09-02 — Sensor threshold and Alarm-delay editor;
3. BF-09-03 — notification recipient directory;
4. BF-09-04 — escalation-policy management;
5. BF-09-05 — Audit Log and existing User Management integration;
6. BF-09-06 — final accessibility, UX, documentation, and regression closure.

## BF-09-01 acceptance

- frontend permission vocabulary mirrors the backend exactly;
- mutation-capable Configuration navigation is ADMIN-only;
- read-only Monitored Areas and Calibration routes retain their approved access;
- typed, runtime-validated contracts cover BF-04 through BF-07 APIs;
- request adapters use the authenticated protected-request boundary;
- no placeholder is presented as a completed management screen;
- frontend/backend gates and documentation audit pass before PR.

## BF-09-01 verification

- frontend format, lint, typecheck, build, 27 files / 223 tests: PASS;
- backend format, lint, typecheck, build, 71 files / 600 tests: PASS;
- permission, navigation, direct-route denial, contract rejection, and API mapping
  tests: PASS;
- documentation audit: PASS;
- PR, GitHub CI, and merge evidence remain pending.

## Boundaries

BF-09-01 does not add configuration forms, provider delivery, controller UI,
customer-specific defaults, or field/commissioning claims. Server authorization
remains authoritative; frontend permission filtering is presentation defense only.
