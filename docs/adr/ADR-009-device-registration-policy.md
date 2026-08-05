# ADR-009

## Title

Registered Devices Only Policy

## Status

Accepted

## Date

2026-07-22

## Context

BIO-EMS operates in regulated environments such as pharmaceutical warehouses, hospitals, laboratories and industrial facilities.

Accepting telemetry from unknown devices may compromise data integrity and regulatory compliance.

## Implementation Status

**Partially Implemented.** `TelemetryService` rejects telemetry when no Device record
matches the incoming `device_id`. The current telemetry path does not enforce the
Device `activated` flag or require an active status before accepting telemetry.

## Decision

The policy requires only registered and active devices to send telemetry to the system.

Current enforcement rejects unregistered devices; active-device enforcement remains
incomplete.

If telemetry is received from an unknown device:

- The telemetry shall not be stored.
- No device shall be created automatically.
- The event shall be logged.
- The event may generate a security event in the future.

## Decision Drivers

- Telemetry must be attributable to a configured Device.
- Unknown senders must not create configuration records implicitly.
- Regulated monitoring requires a clear boundary between recognized and unknown devices.

## Consequences

- Better security.
- Better auditability.
- Compliance with regulated environments.
- No unauthorized devices inside the monitoring system.

## Alternatives Considered

### Automatically Register Unknown Devices

Rejected because the current system deliberately rejects unknown `device_id` values
and does not create Device records from telemetry.

### Accept All Telemetry and Flag It Later

Rejected because unrecognized telemetry would enter the time-series store before the
device identity is verified.

## References

- `backend/src/modules/telemetry/services/telemetry.service.ts` — current unknown-device rejection.
- `backend/src/repositories/device.repository.ts` — Device lookup and activation fields.
- `backend/database/sqlite/schema.ts` — Device `status` and `activated` columns.
