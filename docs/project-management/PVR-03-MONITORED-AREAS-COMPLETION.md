# PVR-03 — Monitored Areas Completion

Status: IMPLEMENTED / VERIFICATION PENDING
Date: 2026-08-24
Branch: `agent/pvr-03-monitored-areas-completion`
Base: PVR-02 merged at `46e718dc90c7f4c87d34da53dd624ec99aacb0b1`

## Business requirement

Monitored Areas must combine the configured Site/Room/Sensor hierarchy with available operational
room evidence without hiding valid configuration when the telemetry store is unavailable.

## Implemented scope

- retains Site, Room, Sensor, thresholds, lifecycle, and calibration metadata;
- adds room online/offline state, temperature/humidity snapshot, Alarm count, status, and last update;
- treats the operational snapshot as a recoverable overlay;
- keeps configuration visible and emits a warning if telemetry status fails;
- refreshes configuration and operational evidence through one action.

## Boundaries

The view presents current recorded snapshots, not a historical trend or field commissioning claim.
Per-Sensor current telemetry identity remains subject to the existing dashboard query contract.
