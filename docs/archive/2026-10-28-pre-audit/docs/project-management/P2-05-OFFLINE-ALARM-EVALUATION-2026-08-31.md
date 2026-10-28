# P2-05 — Offline Alarm Evaluation

Status: IMPLEMENTED — CI/merge pending

## Objective

Provide deterministic Site Controller alarm evaluation from the verified controller configuration and P2-04 sensor acquisition samples without depending on server connectivity.

## Implemented scope

- Extends the existing BF-08 sensor configuration contract with optional warning thresholds and warning activation delay while preserving compatibility with existing critical-only bundles.
- Preserves the server alarm ordering: critical low, warning low, critical high, warning high, then normal.
- Evaluates each configured sensor by stable `sensor_uuid`, `device_id`, and channel identity.
- Uses acquisition `sampled_at` timestamps for delay calculations.
- Supports `NORMAL`, `PENDING`, `ACTIVE`, and `FAULT` phases.
- Applies warning and critical delays independently.
- Restarts the activation timer when alarm direction or severity changes.
- Clears pending or active local alarm state after recovery to normal.
- Maps P2-04 `DISCONNECTED`, `INVALID`, and `READ_ERROR` samples to `SENSOR_FAULT` and resets threshold timing.
- Rejects identity mismatch and backwards/non-monotonic timestamps while an alarm condition is being timed.

## Contract compatibility

Existing BF-08 bundles remain valid because the new fields are optional:

- `warning_low`
- `warning_high`
- `warning_delay_seconds`

Critical thresholds remain mandatory exactly as before. Additional validation prevents warning thresholds from crossing the associated critical thresholds.

## Explicit boundaries

This slice does not yet:

- send SMS;
- publish MQTT alarm events;
- persist active/pending alarm state across controller restart;
- replace the server alarm repository;
- qualify behavior on ESP32 or physical DS18B20 hardware;
- claim customer or pilot acceptance.

Those operational boundaries remain for P2-06 onward and P2-09 bench qualification.

## Next slice

P2-06 — Local Emergency SMS Failover.
