# P2 Durability Hardening — Full BF-08 Configuration and Replay Acceptance

Date: 2026-08-31

Status: IMPLEMENTED — CI/merge pending.

## Scope

This hardening closes two software durability gaps identified by the P2-09 bench qualification package.

### 1. Full BF-08 known-good configuration persistence

The controller durable configuration record is upgraded from identity-only persistence to a complete verified BF-08 `ConfigDeliveryEnvelope`.

The durable record now stores:

- controller identity
- complete BF-08 configuration bundle
- BF-08 checksum
- persistence timestamp
- outer durable-record SHA-256 integrity checksum

On load, the controller validates:

- durable record schema/version
- outer SHA-256 integrity
- controller identity
- Site UUID
- embedded BF-08 envelope schema and checksum

A corrupt, mismatched, or tampered record is rejected and is not used to declare the controller ready.

After an accepted configuration, the full verified envelope becomes the runtime known-good configuration. A fresh process boot can recover sensor mapping, warning/alarm thresholds, delays, SMS failover settings, recipients, and escalation steps for offline execution.

Invalid, stale, Site-mismatched, and same-version checksum-conflicting candidates do not overwrite the last known-good durable configuration.

Identity-only boot input remains supported as a legacy host-side runtime input when no durable store is supplied, but it does not provide a recovered full BF-08 envelope.

### 2. Durable replay acceptance ledger

Reconnect replay acceptance is no longer process-memory only when a durable ledger is supplied.

The ledger:

- persists server-accepted deterministic replay IDs
- uses an integrity-protected file record
- writes through a temporary file plus atomic rename
- uses restrictive file mode `0600`
- reloads accepted IDs after process restart
- suppresses already-accepted records after restart
- suppresses duplicate records inside the same replay batch before server acceptance

The service still marks replay IDs durable only after the caller records server acceptance. Merely constructing or transmitting a replay batch does not suppress it.

## Qualification impact

This closes the software blocker previously documented for `POWER_LOSS_RESTART`: the last verified BF-08 configuration bundle can now survive a process/power restart at the host-side runtime layer.

It also closes the identified process-memory replay suppression gap.

These changes do **not** claim:

- physical controller power-loss qualification
- flash/filesystem endurance on the final ESP32 hardware
- SIM800L carrier delivery evidence
- deployed MQTT broker reconciliation evidence
- 72-hour hardware endurance
- BIO EGYPT commissioning or customer acceptance

Those remain physical/external validation activities under the hardware and pilot gates.
