# BIO-EMS MQTT Protocol

Version: 1.2
Status: Implemented telemetry and heartbeat subset; other message types are future design
Last Updated: 2026-08-17

---

# 1. Purpose

This document defines the MQTT communication protocol used by the BIO-EMS platform.

The protocol standardizes communication between:

- ESP32 Data Logger
- MQTT Broker
- BIO-EMS Backend
- InfluxDB
- Dashboard
- Alarm Engine

This document is the official communication specification for BIO-EMS.

---

# 2. Design Principles

The firmware must remain simple.

The controller does not own normal backend business configuration such as:

- Sensor type
- normal notification/escalation rules
- Calibration rules
- Dashboard configuration
- Room information

The device only knows:

- Device ID
- Sensor Channel
- Measured Value

Normal business logic belongs to the backend. The only approved exception is the
S15-05 emergency subset: a Site Controller may hold approved critical thresholds and
SMS recipients required for local failover while primary Internet communication is
unavailable.

---

# 3. MQTT Broker

Protocol

MQTT v3.1.1

Development default

`mqtt://localhost:1883`

Production requirement

`mqtts://` with an authenticated broker identity and a stable backend client ID.

Authentication

Username / Password

QoS

QoS 1

Retain

False

---

# 4. Topic Naming Convention

Implemented telemetry format

bioems/{siteCode}/{messageType}/{deviceId}

The backend subscriptions implemented by this document are:

bioems/+/telemetry/+

bioems/+/heartbeat/+

The resulting external telemetry contract is:

bioems/CAIRO01/telemetry/ESP32-0001

The following examples remain future protocol designs:

bioems/CAIRO01/register/ESP32-0001

bioems/CAIRO01/command/ESP32-0001

bioems/CAIRO01/response/ESP32-0001

---

# 5. Message Types

Telemetry and Heartbeat are implemented in the current backend path. Register,
Command, and Response remain future message types and must not be treated as available
features.

Telemetry

Purpose

Sensor measurements

Direction

ESP32 → Backend

---

Register

Purpose

Device registration

Direction

ESP32 → Backend

---

Heartbeat

Purpose

Device online status

Direction

ESP32 → Backend

Implemented topic:

bioems/{siteCode}/heartbeat/{deviceId}

Implemented payload:

```json
{
  "sent_at": "2026-08-17T09:00:00Z",
  "uptime_seconds": 600
}
```

`sent_at` is required protocol evidence. `uptime_seconds` is optional. Device health
uses authenticated backend receipt time rather than trusting the Device clock.

---

Command

Purpose

Backend commands

Direction

Backend → ESP32

---

Response

Purpose

Command acknowledgement

Direction

ESP32 → Backend

---

# 6. Telemetry Payload

```json
{
  "protocolVersion": "1.1",
  "timestamp": "2026-07-29T13:30:20Z",
  "battery": 96,
  "signal": -63,
  "mode": "LIVE",
  "sensors": [
    { "channel": 1, "value": 4.82 },
    { "channel": 2, "value": 5.11 }
  ]
}
```

`mode` is optional and defaults operationally to live processing. `LIVE` readings
are written to history and evaluated by the Alarm Engine. `REPLAY` readings are
written at their original payload timestamp but do not re-trigger historical Alarms.
Device communication health still uses trusted server receipt time.

---

# 7. Registration Payload

```json
{
  "firmware": "1.0.0",

  "hardware": "ESP32",

  "mac": "34:B7:DA:10:22:AB",

  "ip": "192.168.1.120",

  "channels": 8
}
```

---

# 8. Heartbeat Payload

The normative Heartbeat payload is the `sent_at`/optional `uptime_seconds` contract
in Section 5. Earlier uptime/battery/signal heartbeat examples are not supported.

---

# 9. Command Payload

Example

```json
{
  "command": "restart"
}
```

Example

```json
{
  "command": "sync"
}
```

Example

```json
{
  "command": "update"
}
```

---

# 10. Response Payload

```json
{
  "success": true,

  "message": "Command executed successfully"
}
```

---

# 11. Backend Processing Flow

ESP32

↓

MQTT Broker

↓

MQTT Client

↓

Topic Router

↓

Telemetry Handler

↓

Payload Validation

↓

Device Validation

↓

Sensor Validation

↓

Telemetry Service

↓

Alarm Engine

↓

InfluxDB

↓

Dashboard

---

# 12. Validation Rules

Device

- Device must exist.
- Device identity is the `deviceId` segment of the MQTT topic.
- Device must have `status = active` and `activated = 1`.
- Device's persisted Site must exist.
- Persisted `site.code` must exactly match the topic `siteCode`.

Sensor

- Channel must resolve to a Sensor by persisted Device ID and channel.
- Sensor must belong to the Device.
- Sensor must have `enabled = 1`.

Telemetry

- Payload must be valid JSON.
- `protocolVersion` must be a non-empty string.
- `timestamp` must be an ISO datetime.
- Battery must be numeric.
- Signal must be numeric.
- `mode`, when present, must be `LIVE` or `REPLAY`.
- Sensor values must be numeric.

---

# 13. InfluxDB Measurement

Measurement

Configured Sensor type

Tags

site

device

sensor

unit

Fields

value

battery

signal

Timestamp

Validated payload timestamp. A `REPLAY` reading therefore preserves its original
measurement time rather than the reconnect time.

---

# 14. Database Responsibilities

SQLite

Stores

- Sites
- Rooms
- Devices
- Sensors
- Alarm Configuration

InfluxDB

Stores

- Historical Measurements

---

# 15. Alarm Engine

The Alarm Engine is responsible for:

- warning-low and critical-low threshold states;
- warning-high and critical-high threshold states;
- current Alarm trigger/recovery behavior for `LIVE` telemetry.

`REPLAY` telemetry is deliberately excluded from current Alarm evaluation. Device
communication health is a separate derived domain; S15-03 does not persist Device
offline as a Sensor Alarm.

---

# 16. Error Handling

Invalid Topic

Reject the complete message

Invalid JSON

Reject message

Unknown Device

Reject the complete message before Alarm evaluation or InfluxDB persistence

Pending, Disabled, or Lifecycle-Inconsistent Device

Reject the complete message before Alarm evaluation or InfluxDB persistence

Missing or Mismatched Site

Reject the complete message before Alarm evaluation or InfluxDB persistence

Unknown Sensor

Reject the affected reading and continue valid channels in the same payload

Disabled Sensor

Reject the affected reading and continue valid channels in the same payload

Database Error

Reject/stop the affected processing path and log the operational error without
exposing secrets.

---

# 17. Security

Development may use local unauthenticated `mqtt`. Production validation requires
`mqtts`, a stable backend client ID, username/password authentication, and broker
topic ACLs. Certificate-based client authentication is not implemented.

---

# 18. Version History

Version 1.0

Initial protocol definition.

Version 1.1

Documented the Sprint 12 Device/Site/Sensor telemetry trust boundary without changing
the telemetry topic, subscription, or payload contract.

Version 1.2

Documented the implemented heartbeat contract, production MQTT TLS configuration,
payload quality-field persistence, and optional `LIVE`/`REPLAY` recovery semantics.
