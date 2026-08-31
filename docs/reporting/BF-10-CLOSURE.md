# BF-10 Reporting Software Closure

**Date:** 31 August 2026  
**Software version:** 0.16.0  
**Status:** Source complete; integration verification required

## Delivered report families

| Report family               | Durable source                         | User workflows      |
| --------------------------- | -------------------------------------- | ------------------- |
| Calibration History         | Immutable calibration records          | Preview / CSV / PDF |
| Temperature Performance     | Historical telemetry range query       | Preview / CSV / PDF |
| Alarm History               | Alarm lifecycle records                | Preview / CSV / PDF |
| Device Communication Health | Append-only communication-event ledger | Preview / CSV / PDF |
| Audit and Operations        | Immutable Audit events                 | Preview / CSV / PDF |

All operational projections use selected Sensor scope and `[from,to)` range semantics. Generated
results carry report identity, scope, provenance, quality disclosure, record counts, and source
records. Existing authentication and report permissions remain the access boundary.

## Device history boundary

Migration 014 creates `device_communication_events` and append-only update/delete guards. Trusted
telemetry and heartbeat acceptance writes a ledger event in the same SQLite transaction that
updates Device communication state. Consequently, Device Health history is available from migration
deployment onward; this limitation is disclosed in previews and is not backfilled from current-state
timestamps.

## Acceptance boundary

Automated tests and production builds establish repository evidence only. This closure does not
claim deployment, MQTT endurance, hardware commissioning, BIO EGYPT UAT, or customer acceptance.
Those activities require environment-specific execution and signed evidence.
