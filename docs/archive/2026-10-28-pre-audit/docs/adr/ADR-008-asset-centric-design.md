# ADR-008

## Title

Asset-Centric Domain Model

## Status

Proposed

## Date

2026-07-22

## Context

BIO-EMS is designed to monitor business assets rather than hardware or room structures.

Different customers monitor different types of assets:

- Cold Rooms
- Freezers
- Refrigerators
- Warehouses
- Vehicles
- Incubators
- Clean Rooms
- Production Areas

## Implementation Status

**Not implemented.** The current SQLite schema and repositories use Rooms as a core
configured entity. There is no Asset table, Asset repository, or Monitoring Point
layer in the current backend.

## Decision

This ADR proposes that the Asset become the primary monitored business entity.

If adopted, Rooms would be treated as one possible Asset Type rather than a core
domain entity.

Business Hierarchy

Organization

↓

Site

↓

Asset

Technical Hierarchy

Asset

↓

Monitoring Point

↓

Sensor

↓

Device Channel

↓

Device

## Decision Drivers

- A future model may need to represent monitored business assets beyond Rooms.
- Asset-centric naming could support the heterogeneous examples described in Context.
- The proposal separates a business asset from its sensor hardware.

## Consequences

- Greater flexibility.
- Industry-independent architecture.
- Simpler database design.
- Easier future expansion.

## Alternatives Considered

### Retain Room as the Primary Configured Entity

This is the current implementation. It is retained because the backend schema and
repositories currently model Sites, Rooms, Devices, Sensors, and Alarms.

### Introduce Assets and Monitoring Points

This ADR proposes this alternative, but it has not been implemented in the repository.

## References

- `backend/database/sqlite/schema.ts` — current Site, Room, Device, Sensor, and Alarm tables.
- `backend/src/repositories/room.repository.ts` — current Room persistence mapping.
- `docs/adr/ADR-005-monitoring-points.md` — proposed Monitoring Point architecture.
