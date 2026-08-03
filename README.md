# BIO-EMS

Enterprise Environmental Monitoring System (EMS) for pharmaceutical cold rooms, warehouses, laboratories, clean rooms and other regulated environments.

---

# Project Status

**Current Version:** v0.10.0

**Current Phase:** Sprint 10 Completed

**Build Status:** Passing

**Backend Status:** Production-ready Foundation

---

# Overview

BIO-EMS is a modular environmental monitoring platform designed for regulated industries.

The system collects telemetry from distributed devices using MQTT, stores high-frequency time-series data in InfluxDB, maintains configuration data in SQLite, and exposes REST APIs for dashboard visualization and system management.

The architecture is designed to support multi-site deployments while remaining hardware-independent and vendor-independent.

---

# Key Features

## Configuration Management

- Multi-site support
- Room management
- Device management
- Sensor management

## Telemetry

- MQTT telemetry ingestion
- InfluxDB time-series storage
- Generic telemetry query layer
- Latest telemetry API

## Dashboard Backend

- Dashboard Summary API
- Room Status API
- Alarm Statistics API
- Dashboard Aggregation Engine

## Alarm Management

- Alarm repository
- Alarm service
- Alarm REST API
- Alarm acknowledgement workflow

---

# Technology Stack

## Backend

- Node.js
- TypeScript
- Express
- SQLite
- InfluxDB
- MQTT

## Architecture

- Layered Architecture
- Repository Pattern
- Service Layer
- DTO Pattern
- REST API
- Architecture Decision Records (ADR)

---

# Repository Structure

```text
backend/
docs/
diagrams/

README.md
CHANGELOG.md
PROJECT_STATE.md
VERSION
```

---

# Available REST APIs

## Health

```
GET /api/v1/health
```

## Sites

CRUD Operations

## Rooms

CRUD Operations

## Devices

CRUD Operations

## Sensors

CRUD Operations

## Alarms

```
GET /api/v1/alarms
GET /api/v1/alarms/active
GET /api/v1/alarms/{id}
POST /api/v1/alarms/{id}/acknowledge
```

## Dashboard

```
GET /api/v1/dashboard/summary

GET /api/v1/dashboard/latest-telemetry

GET /api/v1/dashboard/rooms/status

GET /api/v1/dashboard/alarm-statistics
```

---

# Documentation

Project documentation is organized under:

```
docs/
```

Documentation includes:

- Architecture
- ADRs
- API Specifications
- Deployment
- Installation
- Requirements
- Security
- Sprint Reports
- Project Management

---

# Current Development Status

Completed

- MQTT Infrastructure
- SQLite Configuration Database
- InfluxDB Integration
- Repository Layer
- Service Layer
- Alarm Engine
- Dashboard Backend APIs

In Progress

- Frontend Dashboard

Planned

- Notification Engine
- User Authentication
- Reporting Module
- Multi-language UI

---

# Development Principles

BIO-EMS follows:

- Architecture First
- Documentation First
- Repository Pattern
- Service-Oriented Business Logic
- Hardware Independence
- Vendor Independence
- Backward Compatibility
- Incremental Sprint Delivery

---

# License

Proprietary License

All rights reserved.

---

# Author

Ahmed A. Elsheikh

Project: BIO-EMS