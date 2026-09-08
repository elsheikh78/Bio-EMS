# DEP-01-02 Input Freeze and Build Source Closure

**Date:** 8 September 2026  
**Branch:** `agent/dep-01-02-deterministic-staging`  
**Status:** IMPLEMENTED LOCALLY / PR AND CI PENDING

## Delivered

- exact, schema-validated vendor input and Inno Setup compiler lock;
- checksum-enforcing vendor acquisition;
- explicit-path, deterministic application/runtime staging;
- fail-closed package validation before compilation;
- initial x64 Inno Setup source and controlled build-evidence generation;
- commercial Inno Setup license-evidence gate without storing its contents; and
- regression tests for input shape, security exclusions and build gates.

## Verification

- Backend typecheck/build/lint/format and 113 test files / 789 tests: PASS.
- Frontend typecheck/lint/format, 51 test files / 292 tests and production build: PASS.
- Automated total: 164 files / 1,081 tests.
- Repository diff validation: PASS.
- GitHub PR, CI and merge: pending.

## Scope boundary and handoff

No Setup executable or vendor binary is committed. This package does not claim
service registration/startup, protected first-run configuration, LIC-11 execution
under a final Windows service identity, firewall configuration, health checks,
Repair/Upgrade/rollback/retained-data Uninstall, signing or clean-machine
qualification.

The next controlled package is DEP-01-03: implement protected configuration and the
Windows service lifecycle for Backend, Mosquitto and InfluxDB, then integrate LIC-11
at the final identity/ACL boundary. It must start from reconciled GitHub `main` and
must not convert this source closure into installer qualification evidence.
