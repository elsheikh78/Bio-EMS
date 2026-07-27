# ADR-007 Device Abstraction

## Status

Accepted

## Context

BIO-EMS should not be limited to ESP32 devices.

Future installations may include:

- ESP32
- PLC
- Raspberry Pi
- Industrial PC
- Data Loggers
- Modbus Gateways

## Decision

The Device entity represents any hardware capable of communicating with BIO-EMS.

Device-specific behavior is identified using:

- device_type
- protocol
- manufacturer
- model

The rest of the system communicates with the generic Device entity.

## Consequences

- Easier future expansion
- No architecture changes when supporting new hardware
- Multi-vendor support
- Cleaner domain model