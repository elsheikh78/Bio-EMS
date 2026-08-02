# Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**.

This project follows **Semantic Versioning (SemVer)**.

---

## [0.6.0] - 2026-07-29

### Added

#### Architecture Documentation

- Added `BIO-EMS-Architecture.md`
- Added `BIO-EMS-Design-Rules.md`
- Added `BIO-EMS-MQTT-Protocol.md`
- Added `BIO-EMS-Database.md`

#### System Architecture

- Defined the official BIO-EMS layered architecture.
- Adopted Controller → Service → Repository architecture.
- Defined telemetry processing pipeline.
- Defined backend responsibilities.
- Defined firmware responsibilities.
- Defined dashboard responsibilities.

#### Database

- Defined SQLite as the configuration database.
- Defined InfluxDB as the telemetry database.
- Documented complete entity relationships.
- Defined indexing strategy.
- Documented data ownership rules.

#### MQTT

- Standardized MQTT topic naming.
- Standardized telemetry payload.
- Added heartbeat payload specification.
- Added device registration payload specification.
- Added command payload specification.
- Added command response payload specification.

#### Design Rules

- Adopted Single Source of Truth.
- Backend owns business logic.
- Firmware performs data acquisition only.
- MQTT transports data only.
- Telemetry is immutable.
- Alarm rules are centralized.
- Multi-Site architecture adopted.

#### Telemetry Pipeline

- Added telemetry DTO structure.
- Added telemetry payload validation.
- Added MQTT telemetry listener.
- Added device validation layer.
- Added unknown device rejection.
- Added sensor resolution using device_id + channel.
- Added multi-device telemetry support.
- Added dynamic sensor mapping.
- Added InfluxDB telemetry writer.
- Added InfluxDB 2.x telemetry storage integration.
- Added end-to-end MQTT to InfluxDB testing.

#### Documentation

- Introduced official architecture documentation.
- Introduced protocol specification.
- Introduced database specification.
- Introduced design rules specification.
- Updated MQTT telemetry documentation based on implemented pipeline.

### Changed

- Adopted Documentation First workflow.
- Adopted Sprint-based development process.
- Standardized project documentation structure.
- Standardized architecture terminology.
- Updated telemetry storage model from fixed fields to generic sensor measurements.

### Completed

#### Sprint 7 – Telemetry Pipeline

Completed:

- Telemetry DTOs
- Validation Layer
- Sensor Resolver
- Device Validation
- InfluxDB Writer v2
- Telemetry Service
- MQTT Integration Tests
- Multi-device validation tests

### Planned

- Alarm Engine
- Grafana Dashboard
- Device Heartbeat Monitoring
- Notification System

---

## [0.1.0-alpha] - 2026-07-21

### Added

#### Backend

- Backend project foundation.
- Repository / Service / Controller architecture.
- MQTT integration.
- InfluxDB integration.
- SQLite integration.
- Migration system.
- Sites CRUD (Create + Get).
- REST API testing (.http).

#### Documentation

- Project documentation structure.
- Initial architecture documentation.
- ADR documentation.
- Project development rules.
- Project roadmap.
- Domain model documentation.

#### Architecture Decisions

- ADR-004 Device Architecture.
- ADR-005 Monitoring Point Architecture.
- ADR-006 Domain Naming Convention.

#### Infrastructure

- Initial GitHub repository published.

## v0.7.0 - Sprint 08 Alarm Lifecycle

### Added

- Alarm lifecycle management
- Duplicate alarm prevention
- Automatic alarm recovery
- Alarm service and evaluator integration

### Verified

- HIGH temperature trigger
- Duplicate alarm blocking
- Alarm recovery flow
- SQLite alarm history
- InfluxDB telemetry storage