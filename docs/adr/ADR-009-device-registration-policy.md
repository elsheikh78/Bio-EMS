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

## Decision

Only registered and active devices are allowed to send telemetry to the system.

If telemetry is received from an unknown device:

- The telemetry shall not be stored.
- No device shall be created automatically.
- The event shall be logged.
- The event may generate a security event in the future.

## Consequences

- Better security.
- Better auditability.
- Compliance with regulated environments.
- No unauthorized devices inside the monitoring system.