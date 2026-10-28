# BIO-EMS Site Controller Integration Contract

## Provisioned identity

Before connection, each controller must have approved, mutually consistent values
for customer Site, `siteCode`, Device identity, activated lifecycle state, firmware
version, channel map, broker identity, and topic ACL. A controller must never infer or
self-assign another Site's identity.

## Transport

- MQTT v3.1.1 or compatible broker behavior;
- production transport: `mqtts` with authenticated credentials;
- telemetry topic: `bioems/{siteCode}/telemetry/{deviceId}`;
- heartbeat topic: `bioems/{siteCode}/heartbeat/{deviceId}`;
- QoS 1 and retained flag false for Pilot telemetry/heartbeat publishing;
- broker ACL restricted to the provisioned Site/Device pair.

## Heartbeat

The controller publishes a strict heartbeat containing ISO `sent_at` and optional
non-negative integer `uptime_seconds`. Device communication health uses backend
receipt time, so controller clock manipulation cannot move `last_seen_at`.

The commissioning test must demonstrate online, stale, offline, and recovery behavior
at the approved S15-03 boundaries.

## Telemetry

Each payload contains non-empty `protocolVersion`, ISO `timestamp`, battery percentage,
signal value, at least one positive integer channel/value pair, and optional `mode`.

- `LIVE` or omitted mode: persist history and evaluate current Alarms.
- `REPLAY`: persist at the original measurement timestamp without re-evaluating a
  historical Alarm episode.

The backend validates Device active state, exact Site match, channel ownership, and
Sensor enabled state before downstream effects.

## Outage and replay

The controller buffers timestamped readings locally when MQTT delivery is unavailable.
After reconnection it must:

1. re-establish authenticated MQTT and heartbeat;
2. publish the current reading as `LIVE`;
3. replay buffered readings as `REPLAY` in chronological order;
4. retain the same timestamp and channel identity used at acquisition;
5. remove local records only after the controller's approved QoS acknowledgment rule;
6. bound storage and report overflow as an operational deviation.

Critical threshold evaluation and emergency SMS during a primary outage follow the
S15-05 local-controller contract. Replayed data must not create delayed emergency SMS.

## Rejection and recovery evidence

Commissioning must capture accepted telemetry plus rejection evidence for unknown
Device, inactive Device, Site mismatch, unknown channel, and disabled Sensor. It must
also demonstrate restart/reconnect, duplicate QoS delivery tolerance, chronological
replay, and no Alarm creation from `REPLAY` payloads.

## Deferred protocol

Registration, command, response, provisioning, OTA, and remote configuration topics
remain unimplemented and must not be enabled by firmware for this Pilot.
