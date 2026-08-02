# BIO-EMS Database Design
Version: 1.0
Status: Approved
Last Updated: 2026-07-29

---

# 1. Purpose

This document defines the database architecture of BIO-EMS.

The platform uses two databases:

- SQLite (Configuration Database)
- InfluxDB (Telemetry Database)

Each database has a single responsibility.

---

# 2. Database Overview

| Database | Purpose |
|----------|---------|
| SQLite | Configuration and Master Data |
| InfluxDB | Telemetry Time-Series Data |

---

# 3. SQLite Data Model

SQLite stores only configuration data.

It never stores historical telemetry.

---

# 4. Entity Relationship Diagram

                   Site
                 (1)
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
   Room (N)              Device (N)
      │                       │
      └───────────┬───────────┘
                  ▼
             Sensor (N)

Telemetry is stored separately in InfluxDB.

---

# 5. Sites Table

Purpose

Represents customer sites or facilities.

Columns

id

uuid

code

name

description

enabled

created_at

updated_at

Rules

- Site code must be unique.
- UUID must be unique.

Indexes

PRIMARY KEY(id)

UNIQUE(uuid)

UNIQUE(code)

---

# 6. Rooms Table

Purpose

Represents monitored rooms.

Columns

id

uuid

site_id

code

name

room_type

description

enabled

created_at

updated_at

Relationships

Many Rooms belong to one Site.

Indexes

PRIMARY KEY(id)

UNIQUE(uuid)

UNIQUE(site_id, code)

INDEX(site_id)

Foreign Keys

site_id → sites(id)

---

# 7. Devices Table

Purpose

Represents physical ESP32 data loggers.

Columns

id

uuid

site_id

code

serial_number

firmware_version

hardware_version

ip_address

mac_address

enabled

created_at

updated_at

Relationships

Many Devices belong to one Site.

Indexes

PRIMARY KEY(id)

UNIQUE(uuid)

UNIQUE(serial_number)

UNIQUE(code)

INDEX(site_id)

Foreign Keys

site_id → sites(id)

---

# 8. Sensors Table

Purpose

Represents physical sensors.

Columns

id

uuid

room_id

device_id

channel

code

name

sensor_type

unit

min_value

max_value

alarm_low

alarm_high

enabled

created_at

updated_at

Relationships

Many Sensors belong to one Device.

Many Sensors belong to one Room.

Indexes

PRIMARY KEY(id)

UNIQUE(uuid)

UNIQUE(device_id, channel)

INDEX(room_id)

INDEX(device_id)

Foreign Keys

room_id → rooms(id)

device_id → devices(id)

---

# 9. Data Integrity Rules

Site

- Site Code is unique.

Room

- Room Code is unique within a Site.

Device

- Device Code is unique.
- Serial Number is unique.

Sensor

- Channel numbers are unique per Device.
- Every Sensor belongs to exactly one Room.
- Every Sensor belongs to exactly one Device.

---

# 10. InfluxDB Schema

Measurement

telemetry

---

Tags

site

room

device

sensor

channel

sensor_type

---

Fields

value

battery

signal

---

Timestamp

MQTT timestamp

---

# 11. Telemetry Record Example

Measurement

telemetry

Tags

site = CAIRO01

room = CR-01

device = ESP32-0001

sensor = TEMP-01

channel = 1

sensor_type = temperature

Fields

value = 4.82

battery = 96

signal = -63

Timestamp

2026-07-29T13:30:20Z

---

# 12. Data Ownership

SQLite owns

- Sites
- Rooms
- Devices
- Sensors
- Alarm Configuration

InfluxDB owns

- Historical Measurements

Backend owns

- Validation
- Business Rules
- Alarm Processing

---

# 13. Query Strategy

Configuration Queries

SQLite

Telemetry Queries

InfluxDB

Dashboard Queries

InfluxDB

Configuration APIs

SQLite

Alarm Evaluation

SQLite + InfluxDB

---

# 14. Referential Integrity

Site

↓

Rooms

↓

Sensors

Site

↓

Devices

↓

Sensors

A Sensor cannot exist without both:

- Room
- Device

---

# 15. Index Strategy

SQLite

idx_sites_code

idx_rooms_site

idx_rooms_code

idx_devices_site

idx_devices_code

idx_devices_serial

idx_sensors_room

idx_sensors_device

idx_sensors_channel

InfluxDB

Tags are indexed automatically.

Use tags only for filtering.

Use fields only for measured values.

---

# 16. Future Tables

The following tables are planned for future releases.

users

roles

permissions

alarm_history

notifications

notification_templates

audit_logs

device_commands

firmware_versions

system_settings

maintenance_logs

---

# 17. Database Principles

Configuration belongs to SQLite.

Telemetry belongs to InfluxDB.

Never duplicate data.

Never store telemetry in SQLite.

Never store configuration in InfluxDB.

Always preserve referential integrity.

---

# 18. Summary

SQLite is the system configuration database.

InfluxDB is the historical telemetry database.

Together they provide a scalable and maintainable storage architecture for BIO-EMS.