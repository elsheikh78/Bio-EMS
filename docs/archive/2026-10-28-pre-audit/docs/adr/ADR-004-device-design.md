# ADR-004

## Title

Device Architecture

## Status

Accepted

## Date

2026-07-21

## Context

BIO-EMS configuration distinguishes the identity of a physical device from the room
in which a sensor is used. The current SQLite schema assigns each device to a Site.
Sensors carry both `device_id` and `room_id`, linking a device channel to a room.

## Implementation Status

**Implemented.** Devices belong to Sites and do not belong directly to Rooms. The
current `sensors` table and `SensorRepository` link Devices and Rooms through sensors;
no Monitoring Point persistence layer is implemented.

## Decision

Devices are attached to Sites only.

Devices are NOT directly attached to Rooms.

Sensors currently link Devices and Rooms through `device_id` and `room_id`.

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

## Alternatives Considered

### Attach Devices Directly to Rooms

Rejected because a device may provide multiple channels used by sensors in different
room contexts, and direct room ownership would couple device identity to placement.

### Introduce Monitoring Points Now

Not adopted in the current implementation. Monitoring Points remain a proposed
architectural layer and are not required for the implemented Sensor-to-Room mapping.

## References

- `backend/database/sqlite/schema.ts` — `devices.site_id`, `sensors.device_id`, and `sensors.room_id`.
- `backend/src/repositories/device.repository.ts` — device persistence access.
- `backend/src/repositories/sensor.repository.ts` — sensor persistence and room/device linkage.
- `docs/adr/ADR-005-monitoring-points.md` — proposed Monitoring Point architecture.
