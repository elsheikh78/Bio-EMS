# ADR-004

## Title

Device Architecture

## Status

Accepted

## Date

2026-07-21

## Decision

Devices are attached to Sites only.

Devices are NOT directly attached to Rooms.

Room assignment will be handled later through monitoring points (Sensors).

Each device has three identifiers:

- id
- uuid
- device_id

## Rationale

This design allows:

- Moving devices between rooms without changing device identity.
- Replacing hardware while preserving historical data.
- Supporting devices with multiple sensors.
- Better scalability for future monitoring requirements.

## Consequences

Device history remains independent from room assignment.

Future Sensor Mapping becomes much simpler.