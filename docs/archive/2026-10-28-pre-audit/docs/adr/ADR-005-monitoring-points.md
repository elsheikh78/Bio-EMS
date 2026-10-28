# ADR-005

## Title

Monitoring Point Architecture

## Status

Proposed

## Date

2026-07-21

## Context

The current SQLite schema contains no Monitoring Point table or repository. Sensors
are configured with both `device_id` and `room_id`, which directly provides the
implemented relationship between Devices and Rooms.

## Implementation Status

**Implementation Status: Not Implemented.** The current schema has no Monitoring
Point table or repository. This ADR documents intended future architecture rather
than the current implementation.

## Decision

This ADR proposes a Monitoring Point layer between Rooms and Sensors.

Hierarchy

Site
    ├── Rooms
    │       └── Monitoring Points
    └── Devices
            └── Sensors

A Monitoring Point represents a physical measurement location inside a room.

Examples

- Door
- Center
- Evaporator
- Ceiling
- Floor

If adopted, sensors would be assigned to Monitoring Points instead of directly to
Rooms.

## Rationale

This design allows:

- Multiple measurement locations inside one room.
- Replacing devices without changing room configuration.
- Moving sensors between devices.
- Future support for multiple sensor types.
- Better scalability.

## Consequences

Room configuration becomes independent from hardware.

Historical telemetry remains valid after hardware replacement.

## Alternatives Considered

### Retain Direct Sensor-to-Room Mapping

This is the current implementation. It remains in use because sensors already provide
the relationship between Devices and Rooms through `device_id` and `room_id`.

### Introduce Monitoring Points

This ADR proposes the Monitoring Point layer as a future architectural alternative. It
has not been implemented in the current backend.

## References

- `backend/database/sqlite/schema.ts` — current sensor `device_id` and `room_id` columns.
- `backend/src/repositories/sensor.repository.ts` — current Sensor persistence mapping.
- `docs/adr/ADR-004-device-design.md` — implemented Device-to-Site design.
