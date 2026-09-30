# BF-08 — Site Controller Configuration Sync Closure

Status: COMPLETE / MERGED / CI VERIFIED / CLOSED
Date: 2026-08-24
Branch: `agent/bf-08-controller-config-sync`
Base: BF-07 merge `5890629b938a8b4dfe0364b1f41abbc72b2dc16f`

## Delivered

- strict contract-version-1 offline-critical configuration bundle;
- Sensor critical thresholds/delay, SMS failover/targets, and Critical escalation
  minimum subset with cross-reference validation;
- deterministic SHA-256 delivery envelope and tamper rejection;
- explicit APPLIED/REJECTED acknowledgement contract;
- current, never-acknowledged, stale, mismatch, rejected, controller-ahead, and
  Site-mismatch state decisions;
- reconnect actions and fail-safe last-acknowledged/no-valid-bundle behavior.

## Evidence boundary

This is a backend contract foundation. No transport, acknowledgement persistence,
controller firmware/storage, provider delivery, commissioning, or field acceptance
is claimed without separate controller evidence.

## Verification

- backend format, lint, typecheck, build and 71 files / 600 tests PASS;
- unchanged frontend format, lint, typecheck, build and 25 files / 212 tests PASS;
- documentation audit and gap-register reconciliation PASS.

Remote verification: PR #75, GitHub CI run 206 SUCCESS, integration commit
`55a2031dc404d9c9cfdf51fac157261b3d0dd8c7`.
