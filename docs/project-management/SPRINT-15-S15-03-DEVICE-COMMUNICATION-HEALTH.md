# Sprint 15 — S15-03 Device / Communication Health

## Objective

Distinguish Device communication loss from Device onboarding lifecycle and normal
Sensor alarm conditions through trusted server-side last-seen semantics.

## Communication states

- `NOT_OPERATIONAL`: Device lifecycle is not `active/1`.
- `NEVER_SEEN`: operational Device has no trusted communication timestamp.
- `ONLINE`: trusted communication was received within 120 seconds.
- `STALE`: last trusted communication is older than 120 seconds and no older than
  300 seconds.
- `OFFLINE`: last trusted communication is older than 300 seconds.

States are derived at read time; they are not written into the Device lifecycle
column. Future policy configurability is outside S15-03.

## Trusted communication

Migration 007 adds nullable `last_seen_at` and `last_heartbeat_at` fields without
changing existing rows.

Only these paths can advance health timestamps:

- telemetry from an existing `active/1` Device whose configured Site exactly matches
  the MQTT topic;
- a valid heartbeat passing the same Device lifecycle and Site trust boundary.

Server receipt time is authoritative. Device-supplied time is validated as protocol
evidence but cannot move health. Timestamp updates are monotonic. A lifecycle race
that prevents the atomic health update stops telemetry before Sensor, Alarm, or
InfluxDB side effects.

## MQTT and REST contracts

- heartbeat topic: `bioems/{siteCode}/heartbeat/{deviceId}`;
- payload: strict JSON with required ISO `sent_at` and optional non-negative integer
  `uptime_seconds`;
- health read: `GET /api/v1/devices/:deviceId/health` under `DEVICE_READ` permission.

The response separates `lifecycle_status` from `communication_status` and includes
last-seen timestamps, age, and the active stale/offline policy thresholds.

## Dashboard correction

Dashboard `offlineDevices` now derives from communication health instead of comparing
the Device lifecycle status to an impossible `offline` lifecycle value.

## Scope boundaries

- No communication Alarm persistence or notification emission is introduced.
- No SMS failover, scheduling worker, frontend health display, firmware change,
  registration flow, command/response protocol, or configurable threshold UI is
  introduced.
- S15-04 owns the channel-independent notification boundary.

## Verification

Coverage includes migration compatibility/idempotency, repository lifecycle and
monotonic updates, health boundary states, heartbeat trust rejection, telemetry
trust/race behavior, MQTT routing, REST output, RBAC inventory, and dashboard offline
derivation.
