# ADR-009

> Documentation review: 2026-10-28. Architecture decision retained; implementation is assessed separately. [Current implementation guide](<../README.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/adr/ADR-009-device-registration-policy.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


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

**Implemented for the Sprint 12 trust boundary.** `TelemetryService` resolves the
firmware identity from the existing MQTT topic, requires a registered Device in
`active` status with `activated = 1`, resolves its persisted Site, and requires an
exact Site-code match. Each accepted channel must resolve to a Sensor owned by the
Device with `enabled = 1`.

Unknown or non-operational Devices and invalid Site trust fail the complete message
before Alarm evaluation or InfluxDB persistence. Unknown channels and disabled
Sensors fail only their affected readings. No Device, Site, or Sensor is created or
mutated from telemetry.

## Decision

The policy requires only registered and active devices to send telemetry to the system.

Current enforcement rejects unregistered and non-operational Devices and applies Site
and enabled-Sensor checks. Future security-event generation, device authentication,
and certificate-based identity are not part of this implementation.

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

- `backend/src/modules/telemetry/services/telemetry.service.ts` — current Device,
  Site, channel, and Sensor trust enforcement.
- `backend/src/repositories/device.repository.ts` — Device lookup and activation fields.
- `backend/database/sqlite/schema.ts` — Device `status` and `activated` columns.
