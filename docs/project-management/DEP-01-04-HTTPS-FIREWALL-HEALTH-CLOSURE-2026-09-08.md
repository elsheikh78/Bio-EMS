# DEP-01-04 HTTPS, Firewall and Health Closure

**Date:** 8 September 2026
**Branch:** `agent/dep-01-04-https-health`
**Status:** COMPLETE / MERGED / CI VERIFIED

## Implementation

- Installer-generated local certificate and protected PFX configuration.
- HTTPS Backend/API and React frontend on the single public port 443.
- One Domain/Private LocalSubnet-scoped Firewall rule.
- Secret-free fail-closed post-install health evidence.
- Source tests for TLS, Firewall exposure and component-health coverage.

## Verification

- Targeted Backend checks: 2 files / 36 tests PASS.
- Backend typecheck/build/lint/format and 113 test files / 796 tests: PASS.
- Frontend typecheck/lint/format, 51 test files / 292 tests and production build: PASS.
- Automated total: 164 files / 1,088 tests.
- GitHub PR #180: merged.
- GitHub Actions CI #618: PASS.
- Merge commit: `07c57f2744e75678f572e0450e295877031b5749`.

## Handoff

DEP-01-05 is next: controlled Repair, Upgrade, backup/rollback and retained-data
Uninstall. It must start from reconciled GitHub `main`. No compiled Setup,
clean-machine qualification, field commissioning, UAT or customer acceptance is
inferred from this source closure.
