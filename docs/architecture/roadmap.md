# BIO-EMS Development Roadmap

Version: 0.11.0

Repository status: Sprint 11 completed on 2026-08-06. Sprint 12 has not started.

---

# Phase 1 - Foundation ✅

Completed

- Project Structure
- Documentation Structure
- MQTT Integration
- InfluxDB Integration
- SQLite Integration
- Migration System
- Repository Pattern
- Sites Module
- REST Client Testing

---

# Phase 2 - Domain Design

Completed through Sprint 11

- Domain Model
- Entity Relationships
- Architecture Decisions
- Database Design
- Unified Alarm Evaluation Engine
- Six-state threshold classification

---

# Phase 3 - Core Modules

Planned

- Devices
- Rooms
- Monitoring Points
- Sensors

---

# Phase 4 - Monitoring

In Progress

- Telemetry Service (implemented)
- Alarm Engine (implemented and consolidated in Sprint 11)
- Event Engine
- Notification Engine

---

# Phase 5 - Management

Planned

- Users
- Roles
- Authentication
- Authorization

---

# Phase 6 - Dashboard

In Progress

- Dashboard APIs (implemented)
- Threshold-based room status (implemented in Sprint 11)
- Grafana Integration
- Reports

---

# Sprint 11 - Engineering Foundation and Alarm Consolidation ✅

Completed

- Unified Domain Alarm Evaluation Engine
- MQTT and Dashboard classification consolidation
- Warning-low and warning-high thresholds
- Versioned SQLite migrations and migration history
- Idempotent warning-threshold migration
- Alarm Domain, persistence, REST API, and migration tests (13 total)
- ESLint flat config, Prettier, and quality gates
- Version alignment at 0.11.0

Sprint 12 remains future work and is not started by this release.

---

# Phase 7 - Production

Planned

- OTA Updates
- Backup
- Restore
- Deployment
- Monitoring
