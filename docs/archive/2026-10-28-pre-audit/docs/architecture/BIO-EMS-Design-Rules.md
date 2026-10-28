# BIO-EMS Design Rules
Version: 1.0
Status: Approved
Last Updated: 2026-07-29

---

# Purpose

This document defines the permanent design rules of the BIO-EMS platform.

These rules are architecture decisions.

They should not change unless there is a major platform redesign.

---

# Rule 1
## Single Source of Truth

Every piece of information has exactly one authoritative source.

No duplicated ownership is allowed.

---

# Rule 2
## Backend Owns Business Logic

The backend is responsible for:

- Validation
- Alarm Logic
- Configuration
- Data Processing
- Security

Clients never implement business rules.

---

# Rule 3
## Firmware is Data Acquisition Only

ESP32 firmware is responsible only for:

- Reading sensors
- Collecting values
- Publishing MQTT messages
- Executing backend commands

Firmware never stores business rules.

---

# Rule 4
## MQTT is Transport Only

MQTT transports data.

MQTT does not define business logic.

MQTT messages must remain simple.

---

# Rule 5
## SQLite Stores Configuration

SQLite stores:

- Sites
- Rooms
- Devices
- Sensors
- Alarm Limits
- User Configuration
- System Configuration

SQLite is never used for telemetry history.

---

# Rule 6
## InfluxDB Stores Time-Series Data

InfluxDB stores:

- Sensor Measurements
- Historical Values
- Environmental Data

InfluxDB never stores system configuration.

---

# Rule 7
## Grafana is Read-Only

Grafana visualizes data.

Grafana never modifies system configuration.

---

# Rule 8
## Every Device Belongs to One Site

A device cannot belong to multiple sites.

---

# Rule 9
## Every Room Belongs to One Site

Rooms always belong to exactly one site.

---

# Rule 10
## Every Sensor Belongs to One Room

A sensor cannot belong to multiple rooms.

---

# Rule 11
## Every Sensor Belongs to One Device

Each sensor is connected to one physical device.

---

# Rule 12
## Channel Identifies Sensor

Inside every device:

Channel Number → Sensor

Example

Device ESP32-001

Channel 1 → Room Temperature

Channel 2 → Glycol Temperature

Channel 3 → Humidity

---

# Rule 13
## Backend Resolves Sensor Metadata

MQTT payload contains:

- Channel
- Value

Backend determines:

- Sensor Name
- Sensor Type
- Unit
- Alarm Limits
- Calibration

---

# Rule 14
## Telemetry is Immutable

Telemetry records are never edited.

If a measurement is incorrect, a new measurement is recorded.

---

# Rule 15
## Alarm Rules Are Centralized

Alarm limits exist only inside SQLite.

Firmware never stores alarm limits.

Dashboard never calculates alarm limits.

---

# Rule 16
## Device Status is Calculated

Device status is determined from:

- Last Heartbeat
- Last Telemetry
- MQTT Connection

Device status is never manually edited.

---

# Rule 17
## Room Status is Calculated

Room status is determined from:

- Sensor Values
- Alarm State
- Device Status

Room status is never stored.

---

# Rule 18
## Dashboard Uses Processed Data

Dashboard displays processed information.

It should never implement business calculations.

---

# Rule 19
## Validation Before Persistence

Every incoming message must pass:

1. Topic Validation

2. JSON Validation

3. Device Validation

4. Sensor Validation

5. Data Validation

Only then is data stored.

---

# Rule 20
## API is the Only Configuration Interface

All configuration changes happen through Backend APIs.

Direct database modifications are prohibited.

---

# Rule 21
## Every Module Has One Responsibility

Each module performs one well-defined task.

Examples

Device Module

- Device Management

Room Module

- Room Management

Sensor Module

- Sensor Management

Telemetry Module

- Data Processing

Alarm Module

- Alarm Processing

---

# Rule 22
## Fail Safely

Invalid messages must never stop the system.

The backend should:

- Log the error
- Reject the message
- Continue processing

---

# Rule 23
## Design for Multi-Site

Every component must support multiple sites.

No hardcoded site assumptions are allowed.

---

# Rule 24
## Backward Compatibility

Changes to MQTT Protocol or APIs should preserve compatibility whenever possible.

Breaking changes require a new protocol version.

---

# Rule 25
## Keep the Pilot Simple

During the Pilot phase:

- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Avoid architectural refactoring.
- Prefer small incremental improvements.

Stability is more important than complexity.

---

# Architecture Summary

Backend
│
├── SQLite
│       Configuration
│
├── MQTT
│       Communication
│
├── InfluxDB
│       Telemetry
│
├── Alarm Engine
│       Processing
│
└── Dashboard API
        Visualization

---

# Golden Principle

Backend is the brain.

Firmware is the hands.

MQTT is the messenger.

InfluxDB is the memory.

SQLite is the configuration database.

Grafana is the window.