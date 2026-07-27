# ADR-008

## Title

Asset-Centric Domain Model

## Status

Accepted

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

## Decision

The Asset becomes the primary monitored business entity.

Rooms are treated as one possible Asset Type rather than a core domain entity.

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

## Consequences

- Greater flexibility.
- Industry-independent architecture.
- Simpler database design.
- Easier future expansion.