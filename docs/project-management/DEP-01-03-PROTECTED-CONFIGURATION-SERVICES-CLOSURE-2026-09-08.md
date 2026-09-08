# DEP-01-03 Protected Configuration and Services Closure

**Date:** 8 September 2026
**Branch:** `agent/dep-01-03-service-lifecycle`
**Status:** COMPLETE / MERGED / CI VERIFIED

## Implementation record

- Three exact WinSW services with isolated virtual service identities.
- Runtime-generated credentials and ACL-protected persistent configuration.
- Authenticated loopback-only Mosquitto and local InfluxDB onboarding.
- Backend environment-file indirection with no secret-bearing WinSW XML.
- LIC-11 provisioned by Backend pre-start under the final DPAPI service identity.
- Fail-closed partial identity handling and service-registration cleanup on failure.
- Setup integration and source-level regression coverage.

## Verification

- Targeted Backend installer contract: 1 file / 12 tests PASS.
- Backend typecheck/build/lint/format and 113 test files / 793 tests: PASS.
- Frontend typecheck/lint/format, 51 test files / 292 tests and production build: PASS.
- Automated total: 164 files / 1,085 tests.
- GitHub PR #179: merged.
- GitHub Actions CI #615: PASS.
- Merge commit: `0d5a4527ab69fa4972f9c2b0a7dc09464e422804`.

## Handoff

DEP-01-04 is next and must start from reconciled GitHub `main`. It owns the local
HTTPS/front-door, restricted firewall exposure and complete post-install health
evidence. Windows execution, Repair/Upgrade/rollback/Uninstall and clean-machine
qualification remain open and must not be inferred from this source package.
