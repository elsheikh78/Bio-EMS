# BIO-EMS MQTT Protocol
Version: 1.1
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

The device should NOT know:

- Sensor type
- Alarm limits
- Calibration rules
- Dashboard configuration
- Room information

The device only knows:

- Device ID
- Sensor Channel
- Measured Value

All business logic belongs to the backend.

---

# 3. MQTT Broker

Protocol

MQTT v3.1.1

Default Port

1883

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

--------------------------------------------------

Register

Purpose

Device registration

Direction

ESP32 → Backend

--------------------------------------------------

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

--------------------------------------------------

Command

Purpose

Backend commands

Direction

Backend → ESP32

--------------------------------------------------

Response

Purpose

Command acknowledgement

Direction

ESP32 → Backend

---

# 6. Telemetry Payload

```json
{
    "timestamp":"2026-07-29T13:30:20Z",

    "battery":96,

    "signal":-63,

    "sensors":[
        {
            "channel":1,
            "value":4.82
        },
        {
            "channel":2,
            "value":5.11
        },
        {
            "channel":3,
            "value":58.20
        }
    ]
}
```

---

# 7. Registration Payload

```json
{
    "firmware":"1.0.0",

    "hardware":"ESP32",

    "mac":"34:B7:DA:10:22:AB",

    "ip":"192.168.1.120",

    "channels":8
}
```

---

# 8. Heartbeat Payload

```json
{
    "uptime":152300,

    "battery":95,

    "signal":-60,

    "freeMemory":185640
}
```

---

# 9. Command Payload

Example

```json
{
    "command":"restart"
}
```

Example

```json
{
    "command":"sync"
}
```

Example

```json
{
    "command":"update"
}
```

---

# 10. Response Payload

```json
{
    "success":true,

    "message":"Command executed successfully"
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

InfluxDB

↓

Alarm Engine

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

Room

- Room must exist.

Sensor

- Channel must resolve to a Sensor by persisted Device ID and channel.
- Sensor must belong to the Device.
- Sensor must have `enabled = 1`.

Telemetry

- Payload must be valid JSON.
- Battery must be numeric.
- Signal must be numeric.
- Sensor values must be numeric.

---

# 13. InfluxDB Measurement

Measurement

telemetry

Tags

application

site

room

device

sensor

channel

sensor_type

Fields

value

battery

signal

Timestamp

MQTT Timestamp

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

- High Alarm
- Low Alarm
- Sensor Offline
- Device Offline
- Communication Failure

This component will be implemented in a later version.

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

Log error

Continue processing

---

# 17. Security

Authentication

MQTT Username

MQTT Password

Future Enhancements

TLS

Certificate Authentication

Encrypted Communication

---

# 18. Version History

Version 1.0

Initial protocol definition.

Version 1.1

Documented the Sprint 12 Device/Site/Sensor telemetry trust boundary without changing
the telemetry topic, subscription, or payload contract.
