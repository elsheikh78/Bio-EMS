# Database Design

## SQLite

SQLite stores configuration and master data.

Current Tables


- sites
- assets (planned)
- devices (planned)
- users (planned)

---

## Table: sites

Stores monitored sites.

Fields

- id
- code
- name
- location
- timezone
- active
- created_at

---

## Table: devices

Stores physical monitoring devices.

Design Decisions

- Every device belongs to exactly one Site.
- Devices are NOT directly assigned to Assets.
- Device telemetry is stored in InfluxDB.
- Configuration is stored in SQLite.

Identity

Every device has three identifiers:

- id (SQLite Primary Key)
- uuid (Internal immutable identifier)
- device_id (External identifier reported by ESP32)