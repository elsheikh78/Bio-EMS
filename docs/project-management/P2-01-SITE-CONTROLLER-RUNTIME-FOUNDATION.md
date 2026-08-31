# P2-01 — Site Controller Runtime Foundation

Status: COMPLETE / PR CI VERIFIED / READY TO MERGE
Date: 2026-08-31

## Purpose

P2-01 establishes the deterministic software foundation for the future BIO-EMS Site Controller runtime without claiming production ESP32 firmware, field hardware qualification, or commissioning.

The foundation is intentionally host-side and testable. Later P2 slices can reuse the same state and boundary semantics while hardware-specific adapters are introduced.

## Runtime package

`backend/src/modules/controller-runtime/`

- `runtime.contract.ts` — runtime/build identity, hardware profile, Site/controller boundary, acknowledged configuration identity, boot input, runtime state, and watchdog snapshot contracts.
- `site-controller.runtime.ts` — deterministic boot/connectivity/config/watchdog/restart state machine.
- `site-controller.runtime.spec.ts` — host-side test harness for startup, offline recovery posture, boundary enforcement, connectivity transitions, and watchdog behavior.

## Identity and configuration boundaries

Every runtime instance has explicit:

- runtime name and version;
- immutable build identifier;
- `STANDARD` or `ADVANCED` hardware profile;
- controller identifier;
- Site UUID;
- supported configuration contract version.

A persisted acknowledged configuration identity is accepted at startup only when its Site UUID exactly matches the runtime Site boundary. P2-01 does not yet accept or verify a new BF-08 configuration envelope; that is P2-02.

## Deterministic startup states

- matching acknowledged config + primary transport available → `READY_ONLINE`;
- matching acknowledged config + primary transport unavailable → `READY_OFFLINE`;
- no acknowledged config → `NOT_READY_NO_CONFIG`;
- persisted config from another Site → `NOT_READY_SITE_MISMATCH`;
- watchdog expiry → `RESTART_REQUIRED`.

The runtime does not silently convert a Site-mismatched candidate into an effective configuration.

## Watchdog and restart expectations

The reference runtime defines a 30-second watchdog window. A heartbeat at or before the deadline preserves runtime state. A missed deadline moves the runtime to `RESTART_REQUIRED`. Restart preserves the already acknowledged effective configuration identity, resets the watchdog heartbeat, increments restart evidence, and deterministically derives the ready/offline state from current transport availability.

Hardware watchdog integration and physical restart evidence are deferred to the hardware/runtime adapter and P2-09 bench qualification.

## Test harness acceptance

Automated tests cover:

1. clean boot with matching acknowledged configuration;
2. offline boot retaining the acknowledged configuration identity;
3. no-config not-ready behavior;
4. Site mismatch rejection;
5. online/offline connectivity transitions without discarding effective config;
6. watchdog timeout boundary and deterministic restart;
7. rejection of cross-Site acknowledged configuration identity.

PR #115 CI run #322 passed both backend and frontend quality gates before this documentation-only status update. The updated PR head must pass CI again before merge.

## Boundaries / non-claims

P2-01 does not implement:

- BF-08 envelope receipt or SHA-256 verification;
- durable local storage or power-loss-safe writes;
- DS18B20 acquisition;
- offline alarm evaluation;
- SIM800L/SMS control;
- MQTT reconnect reconciliation;
- ESP32 firmware build/flash pipeline;
- physical watchdog validation;
- field commissioning or customer acceptance.

These remain assigned to P2-02 through P2-09.
