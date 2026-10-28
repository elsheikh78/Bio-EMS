# Database Design

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/architecture/database-design.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


## Implemented persistence — 30 September 2026

The historical table notes below are not the current implementation inventory. Devices and users are implemented. SQLite schema and migrations through 030 include rooms/sensors, alarm/notification evidence, isolated platform principals, audit, installation lifecycle, licensing, managed communication, password recovery, backup scheduling and device-platform pairing. Read `backend/database/sqlite/schema.ts` and the versioned migrations for exact fields. InfluxDB holds telemetry history; SQLite is not the telemetry time-series store.

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
