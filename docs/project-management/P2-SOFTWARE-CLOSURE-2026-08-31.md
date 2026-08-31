# P2 Site Controller Runtime — Software Closure

Date: 31 August 2026

Status: **SOFTWARE COMPLETE / MERGED / CI VERIFIED — PHYSICAL QUALIFICATION OPEN**

## Closure Scope

P2-01 through P2-09 and the audit-driven durability hardening are integrated into `main` through PR #124.

Implemented source capabilities include deterministic Site Controller runtime state/watchdog behavior, BF-08 receipt/integrity, durable complete known-good BF-08 configuration recovery, DS18B20 acquisition abstraction, offline Alarm evaluation, local emergency SMS failover contract/runtime, reconnect reconciliation, LIVE/REPLAY evidence, controller health evidence, bench qualification gating, durable replay acceptance, and duplicate replay suppression.

## Integration Evidence

- P2-09 PR #123: merged after CI run #380 SUCCESS.
- P2 durability hardening PR #124: merged after CI run #382 SUCCESS.
- P2 closure merge baseline: `453ea1fe6f983528c861667dc638bcc424710eff`.

## Qualification Boundary

This closure is a **software closure only**. It does not assert:

- final ESP32 production firmware/hardware qualification;
- physical power-cycle PASS;
- live industrial DS18B20 bench PASS;
- live SIM800L carrier delivery;
- deployed MQTT endurance PASS;
- 72-hour hardware endurance PASS;
- BIO EGYPT commissioning;
- customer UAT or acceptance.

Those remain controlled external evidence gates.

## Audit Blockers Closed

The P2-09 review identified two source-level blockers before meaningful physical power-loss qualification:

1. the durable store retained only acknowledged configuration identity rather than the complete BF-08 offline-critical bundle;
2. replay acceptance suppression existed only in process memory.

PR #124 closes both source-level blockers by persisting/revalidating the complete known-good BF-08 envelope and by making replay acceptance durable across process restart, while also suppressing duplicates within one replay batch.

## Next Phase

Proceed to P3-P6 controlled execution. Physical controller/hardware validation may run in parallel once the initial test kit is available, but its evidence must be recorded separately from source CI.