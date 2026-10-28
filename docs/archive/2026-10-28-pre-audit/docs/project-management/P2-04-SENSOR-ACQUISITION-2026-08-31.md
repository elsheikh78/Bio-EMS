# P2-04 — Sensor Acquisition

Date: 2026-08-31
Status: IMPLEMENTED — CI/merge pending

## Objective

Establish a deterministic controller-side acquisition boundary for configured DS18B20 temperature Sensors without claiming physical ESP32 firmware or bench commissioning.

## Implemented scope

- Stable identity mapping using `sensor_uuid`, `device_id`, and `channel` from the acknowledged BF-08 configuration bundle.
- One authoritative timestamp per acquisition cycle.
- DS18B20 Celsius reader abstraction so hardware-specific firmware/driver code can be supplied later without changing alarm logic.
- Explicit sample states: `OK`, `DISCONNECTED`, `INVALID`, and `READ_ERROR`.
- `null` and the conventional `-127 °C` disconnected sentinel are treated as disconnected.
- Non-finite values and readings outside the DS18B20 operating range of `-55 °C` to `125 °C` are rejected as invalid.
- A read exception is isolated to the affected Sensor and does not abort the remaining acquisition cycle.
- Automated tests cover deterministic identity/timestamp behavior, disconnects, invalid values, reader exceptions, and invalid timestamps.

## Boundaries

This slice does not implement ESP32 GPIO/OneWire firmware, physical bus discovery, calibration compensation, MQTT publication, offline alarm evaluation, SMS failover, or field qualification. Those remain later P2 slices and hardware qualification work.

## Next slice

P2-05 — Offline Alarm Evaluation: consume accepted acquisition samples and evaluate configured critical thresholds and activation delays locally while preserving explicit Sensor fault/unknown handling.
