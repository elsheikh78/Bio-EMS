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

The system monitors environmental conditions using ESP32 devices over MQTT.

---

# Technology Stack

Backend

- Node.js
- TypeScript
- Express

Communication

- MQTT
- Mosquitto

Databases

SQLite
- Configuration Data
- Users
- Devices
- Sites
- Rooms
- Alarm Rules

InfluxDB
- Telemetry
- Historical Data
- Events
- Trends

Visualization

- Grafana

---

# System Architecture

ESP32

↓

MQTT Broker

↓

Backend

↓

Telemetry Service

├── SQLite

├── InfluxDB

├── Alarm Engine

└── Notification Engine

---

# Folder Structure

backend/

src/

database/

docs/

testing/

---

# SQLite Responsibilities

Configuration Database

Stores:

- Sites
- Rooms
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

Route

↓

Controller

↓

Service

↓

Repository

↓

SQLite

MQTT

↓

Telemetry Handler

↓

Telemetry Service

↓

InfluxDB

---

# Core Entities

Site

Room

Device

Sensor

User

Alarm Rule

Notification

---

# Project Principles

1. No Controller accesses Database directly.

2. MQTT never writes directly to Database.

3. Business Logic belongs to Services.

4. SQLite stores Configuration.

5. InfluxDB stores Time-Series.

6. Every feature must have REST API.

7. Every package must be tested before commit.

## Monitoring Architecture

Site

├── Rooms

│      └── Monitoring Points

│              └── Sensors

└── Devices

        └── Sensor Channels

Telemetry Flow

ESP32

↓

MQTT

↓

Telemetry Handler

↓

Telemetry Service

├── InfluxDB

├── SQLite

├── Alarm Engine

└── Notification Engine
---

End of Document