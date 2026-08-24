# BF-09 — Frontend Readiness Work Package

Status: BF-09-01 MERGED / BF-09-02 LOCAL IMPLEMENTATION COMPLETE
Date: 2026-08-24
Branch: `agent/bf-09-02-sensor-configuration-ui`
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
- PR #77 merged at `a4e33bf9686141596b1580f5b925a64487348ba0`.

## BF-09-02 acceptance

- the placeholder is replaced by an ADMIN-only Sensor configuration register;
- search and loading/error/empty presentation are explicit;
- the editor uses persisted values and validates effective threshold ordering;
- warning/critical delay fields enforce whole seconds from 0 through 86400;
- mutations use the BF-09-01 protected adapters and refresh shared Sensor data;
- failure does not claim completion and no customer-specific default is introduced.

## Boundaries

BF-09-01 does not add configuration forms, provider delivery, controller UI,
customer-specific defaults, or field/commissioning claims. Server authorization
remains authoritative; frontend permission filtering is presentation defense only.
