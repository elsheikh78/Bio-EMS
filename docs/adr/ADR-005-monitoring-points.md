# ADR-005

## Title

Monitoring Point Architecture

## Status

Accepted

## Date

2026-07-21

## Decision

The system introduces a Monitoring Point layer between Rooms and Sensors.

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

Sensors are assigned to Monitoring Points instead of directly to Rooms.

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