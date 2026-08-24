# BF-08 — Site Controller Offline-Critical Configuration Sync Contract

Status: IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-08-controller-config-sync`
Base: BF-07 merge `5890629b938a8b4dfe0364b1f41abbc72b2dc16f`

## Versioned bundle

Contract version 1 carries one positive, monotonically increasing effective
configuration version for one Site. The minimum offline-critical subset contains:

- enabled Sensor identity, Device identity/channel, critical low/high thresholds,
  and critical activation delay;
- SMS failover enablement and the primary-communication unavailable threshold;
- active E.164 SMS targets identified by stable recipient UUID;
- contiguous Critical escalation steps with strictly increasing delays and target
  references.

The backend creates a delivery envelope containing the validated bundle and a
lowercase SHA-256 checksum over its canonical representation.

## Acknowledgement and effective state

A controller acknowledgement identifies controller, Site, config version, checksum,
time, and `APPLIED` or `REJECTED`. A bundle is effective on that controller only when
an `APPLIED` acknowledgement exactly matches Site, version, and checksum. Rejected,
missing, older, checksum-mismatched, or unexpectedly newer acknowledgements are not
treated as current.

On reconnect the backend compares the acknowledgement with the current envelope.
`CURRENT` requires no delivery; every other state requires controlled redelivery or
operator investigation. The backend never infers application merely from delivery.

## Safe fallback

The controller contract retains the last acknowledged valid bundle when a newer
delivery cannot be validated/applied and marks itself stale. With no last
acknowledged bundle, offline external notification is disabled and the controller
must signal not-ready; an unacknowledged bundle must never silently become effective.

## Boundaries

BF-08 supplies backend schemas, deterministic checksum/state evaluation, and tests.
It does not implement transport, retries, controller storage, firmware, field
commissioning, provider sending, or actual acknowledgement persistence.

## Verification

- deterministic envelope, tamper rejection, minimum subset validation, sync-state,
  reconnect, and fallback tests PASS;
- backend format, lint, typecheck, build, 71 files / 600 tests PASS;
- unchanged frontend format, lint, typecheck, build, 25 files / 212 tests PASS;
- documentation audit PASS; remote PR/CI/merge evidence remains pending.
