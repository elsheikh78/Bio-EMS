# BIO-EMS Product Decisions

## Pilot Readiness Direction

This document records the agreed product decisions for BIO-EMS Pilot readiness.

## Product Versions

### BIO-EMS Standard
- Target: cold rooms, warehouses, general environmental monitoring.
- Temperature sensor: Industrial DS18B20.
- Controller: BIO-EMS Site Controller v1.
- Primary communication: Internet (Ethernet/WiFi).
- Backup communication: 4G/SMS failover.

### BIO-EMS Advanced
- Target: GMP critical applications and validation-focused customers.
- Temperature sensor: PT100 Class A.
- Same BIO-EMS platform and backend.
- Different measurement layer only.

## Site Controller v1 Direction

The selected architecture is All-in-One Site Controller:

- Sensor acquisition.
- MQTT communication.
- Internet primary path.
- 4G backup path.
- SMS emergency alerts.
- Local buffering capability.
- Device health reporting.

## Communication Strategy

Normal operation:

Sensors -> Site Controller -> Internet -> BIO-EMS Backend -> Notifications

Primary notifications:
- WhatsApp / online notifications.

Fallback:
- SMS used when communication failure occurs or during critical offline scenarios.

## BIO EGYPT Pilot Scope

Sites:
- El Manial.
- CPC October.

Monitoring scope:
- Temperature only (Phase 1).

Sensors:
- Cold rooms: 2 sensors per room.
- Anti-chamber: 1 sensor.
- Dry warehouse sensors as defined in site mapping.

## Sensor Lifecycle & Calibration

BIO-EMS will support:
- Sensor grade (STANDARD / ADVANCED).
- Sensor model (DS18B20 / PT100).
- Installation date.
- Calibration status.
- Calibration dates.
- Calibration offset.
- Certificate reference.

Calibration history will be implemented as a separate module.

## Documentation Policy

Documentation is part of the product and will include:
- Product specifications.
- Hardware specifications.
- Installation procedures.
- Calibration procedures.
- Customer pilot documentation.

## Implementation Principle

Changes must preserve existing telemetry and alarm architecture. New capabilities should be added through versioned migrations and backward-compatible changes.
