# ADR-006

> Documentation review: 2026-10-28. Architecture decision retained; implementation is assessed separately. [Current implementation guide](<../README.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/adr/ADR-006-domain-naming.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


## Title

Domain Naming Convention

## Status

Accepted

## Date

2026-07-21

## Context

The current backend uses Site, Room, Sensor, Device, Telemetry, and Alarm in its
SQLite schema and source code. Monitoring Point and Notification appear in
architecture documentation but do not have implemented backend layers.

## Implementation Status

**Partially Implemented.** The implemented terminology is used for Sites, Rooms,
Sensors, Devices, Telemetry, and Alarms. Monitoring Point and Notification remain
documented architectural terms, not implemented backend entities or modules.

## Decision

The project adopts the following domain names as the official naming convention.

- Site
- Room
- Monitoring Point
- Sensor
- Device
- Telemetry
- Alarm
- Notification

These names will be used consistently where the corresponding concept is implemented
or formally documented. Monitoring Point and Notification MUST NOT be described as
implemented solely because they appear in this convention.

The implemented terms are used consistently across:

- Database
- Source Code
- REST APIs
- MQTT
- Documentation
- Diagrams

No alternative names shall be introduced without a new ADR.

## Decision Drivers

- Stable terminology reduces ambiguity between configuration, telemetry, and alarms.
- Current source and schema names must remain understandable across REST, MQTT, and
  persistence boundaries.
- Reserved architectural terms should remain distinguishable from implemented entities.

## Rationale

Keeping the terminology stable improves:

- Readability
- Documentation consistency
- API consistency
- Maintainability
- Team communication

## Alternatives Considered

### Use Different Names per Technical Layer

Rejected because divergent names for the same implemented concept would weaken API,
database, and documentation consistency.

### Treat All Documented Terms as Implemented Entities

Rejected because Monitoring Point and Notification are not implemented in the current
backend.

## References

- `backend/database/sqlite/schema.ts` — implemented Site, Room, Device, Sensor, and Alarm tables.
- `backend/src/modules/telemetry/services/telemetry.service.ts` — current telemetry terminology.
- `docs/adr/ADR-005-monitoring-points.md` — proposed Monitoring Point architecture.
