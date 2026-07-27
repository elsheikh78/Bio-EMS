# BIO-EMS Enterprise Monitoring System

Version: 1.0

---

# System Overview

BIO-EMS is an enterprise environmental monitoring system designed for:

- Pharmaceutical Warehouses
- Cold Rooms
- Freezers
- Hospitals
- Blood Banks
- Laboratories
- Clean Rooms
- Industrial Facilities

The system monitors environmental conditions using BIO-EMS Devices over MQTT.

The first supported device family is ESP32-based Zone Controllers.

---

# Technology Stack

## Backend

- Node.js
- TypeScript
- Express

## Communication

- MQTT
- Mosquitto

## Databases

### SQLite

Configuration Database

Stores:

- Users
- Sites
- Assets
- Devices
- Alarm Rules
- Notification Settings
- System Settings

### InfluxDB

Time-Series Database

Stores:

- Telemetry
- Historical Data
- Events
- Trends

---

# System Architecture

```text
Sensors
    │
    ▼
Zone Controller (Physical Hardware)
    │
    ▼
Device (Firmware Identity)
    │
    ▼
MQTT Broker
    │
    ▼
Backend
    │
    ├── Telemetry Service
    ├── Alarm Engine
    ├── Notification Engine
    ├── SQLite
    └── InfluxDB
```

---

# Folder Structure

```text
backend/
src/
database/
docs/
testing/
```

---

# SQLite Responsibilities

Configuration Database

Stores:

- Sites
- Assets
- Devices
- Users
- Alarm Rules
- Notification Settings
- System Settings

---

# InfluxDB Responsibilities

Time-Series Database

Stores:

- Temperature
- Humidity
- Battery
- Signal
- Door Status
- Historical Measurements

---

# Core Layers

```text
REST API
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
SQLite


MQTT
    │
    ▼
Telemetry Handler
    │
    ▼
Telemetry Service
    │
    ├── InfluxDB
    ├── Alarm Engine
    └── Notification Engine
```

---

# Core Entities

- Site
- Asset
- Device
- Device Channel
- Sensor
- Monitoring Point
- User
- Alarm Rule
- Notification

---

# Monitoring Architecture

```text
Site
├── Assets
│      └── Monitoring Points
│              └── Sensors
└── Devices
       └── Device Channels
```

---

# Telemetry Flow

```text
Sensors
    │
    ▼
Zone Controller
    │
    ▼
Device
    │
    ▼
MQTT
    │
    ▼
Telemetry Handler
    │
    ▼
Telemetry Service
    ├── InfluxDB
    ├── Alarm Engine
    └── Notification Engine
```

---

# Project Principles

1. No Controller accesses the Database directly.
2. MQTT never writes directly to a Database.
3. Business Logic belongs to Services.
4. SQLite stores configuration data.
5. InfluxDB stores time-series data.
6. Every feature must expose a REST API.
7. Every package must be tested before commit.

---

End of Document