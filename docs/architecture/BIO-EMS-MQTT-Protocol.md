# BIO-EMS MQTT Protocol
Version: 1.0
Status: Draft
Last Updated: 2026-07-29

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

Format

bioems/{siteCode}/{messageType}/{deviceId}

Examples

bioems/CAIRO01/telemetry/ESP32-0001

bioems/CAIRO01/register/ESP32-0001

bioems/CAIRO01/heartbeat/ESP32-0001

bioems/CAIRO01/command/ESP32-0001

bioems/CAIRO01/response/ESP32-0001

---

# 5. Message Types

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
- Device must be activated.

Room

- Room must exist.

Sensor

- Sensor must exist.
- Sensor must belong to the device.
- Sensor must belong to the room.
- Channel must exist.

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

Ignore message

Invalid JSON

Reject message

Unknown Device

Reject message

Unknown Sensor

Reject message

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