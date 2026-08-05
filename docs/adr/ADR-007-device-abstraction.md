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

## Implementation Status

**Implemented for current device configuration.** The `devices` table and
`DeviceRepository` store `device_type`, `protocol`, `manufacturer`, and `model` for a
generic Device record. Hardware-specific adapters for the future device examples are
not implemented.

## Decision

The Device entity represents any hardware capable of communicating with BIO-EMS.

Device-specific behavior is identified using:

- device_type
- protocol
- manufacturer
- model

The rest of the system communicates with the generic Device entity.

## Decision Drivers

- Device identity must remain independent of a particular hardware vendor.
- Telemetry processing resolves devices through the generic `device_id` field.
- Current configuration needs to retain protocol and manufacturer metadata.

## Consequences

- Easier future expansion
- No architecture changes when supporting new hardware
- Multi-vendor support
- Cleaner domain model

## Alternatives Considered

### Device Type-Specific Tables and Services

Rejected because the current backend uses one Device record and does not require
hardware-specific persistence models.

### Treat ESP32 as the Only Supported Device Model

Rejected because the generic Device fields already avoid that architectural coupling.

## References

- `backend/database/sqlite/schema.ts` — current `devices` table and generic metadata fields.
- `backend/src/repositories/device.repository.ts` — Device persistence mapping.
- `backend/src/modules/telemetry/services/telemetry.service.ts` — generic device lookup by `device_id`.
