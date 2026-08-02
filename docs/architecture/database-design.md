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

### Design Decisions

- Every device belongs to exactly one Site.
- Devices are NOT directly assigned to Assets.
- Device telemetry is stored in InfluxDB.
- Configuration is stored in SQLite.

### Identity

Every device has three identifiers:

- id (SQLite Primary Key)
- uuid (Internal immutable identifier)
- device_id (External identifier reported by the hardware)

### Fields

- id
- uuid
- device_id
- site_id
- device_type
- protocol
- manufacturer
- model
- firmware_version
- status
- activated
- created_at
- updated_at

### Relationships

devices.site_id

→ sites.id

One Site

↓

Many Devices

### Notes

Configuration data is stored in SQLite.

Operational telemetry is stored in InfluxDB.

Device activation is handled through the Device Registration workflow.

A Device becomes operational only after successful activation and approval.