# BIO-EMS Engineering Glossary

| Item           | Value                |
| -------------- | -------------------- |
| Document       | Engineering Glossary |
| Version        | 1.0                  |
| Status         | Approved             |
| Applies To     | BIO-EMS Engineering  |
| Owner          | Engineering Team     |
| Classification | Internal             |
| Last Updated   | 2026-08-06           |

## 1. Purpose

This glossary defines the official engineering terminology used in the BIO-EMS
repository, engineering handbook, and Architecture Decision Records.

It reduces ambiguity between implemented code, accepted architecture decisions, and
proposed concepts. It is a repository-oriented reference, not a product roadmap.

## 2. Scope

The glossary covers the current BIO-EMS backend, its engineering documents, release
artifacts, and ADR collection.

Terms are included only when they appear in the repository, Engineering Handbook, or
existing ADRs. A term MAY be documented as proposed, but MUST NOT be described as
implemented without repository evidence.

## 3. How to Use This Glossary

- Use the glossary as the official project terminology reference.
- Prefer repository-first definitions over assumptions or generic industry usage.
- Cross-reference the listed document when a term needs architectural or operational detail.
- Use the status table before describing a concept as implemented.
- Engineering documents SHOULD use these terms consistently and avoid casual synonyms.

## Glossary Usage Summary

| Rule                                   | Purpose                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| Use Official BIO-EMS Terminology       | Maintain a single engineering vocabulary across the project. |
| Repository Definitions Take Precedence | Repository evidence overrides generic industry definitions.  |
| Distinguish Implemented vs Proposed    | Prevent incorrect capability claims.                         |
| Cross-Reference Related Documents      | Provide architectural and engineering context.               |
| Avoid Synonyms for Core Concepts       | Preserve consistency throughout the Engineering Handbook.    |

These rules provide a quick reference for engineering documents, ADRs, reviews,
release notes, and AI-assisted development.

## 4. Terminology Status

| Term                    | Status              |
| ----------------------- | ------------------- |
| Site                    | Implemented         |
| Room                    | Implemented         |
| Sensor                  | Implemented         |
| Device                  | Implemented         |
| Dashboard               | Implemented         |
| Alarm Evaluation Engine | Implemented         |
| SQLite                  | Implemented         |
| MQTT                    | Implemented         |
| InfluxDB                | Implemented         |
| Monitoring Point        | Proposed            |
| Asset                   | Proposed            |
| Zone                    | Engineering Concept |
| Zone Controller         | Proposed            |
| Notification            | Proposed            |

Implementation status reflects the current repository rather than future plans,
historical rationale, or accepted architectural intent.

## 5. Glossary

### ADR

**Definition:** Architecture Decision Record documenting a significant architectural decision and rationale.

**Current BIO-EMS usage:** Stored under `docs/adr/` and governed by `ADR_POLICY.md`.

**Related documents:** `ADR_POLICY.md`, `ARCHITECTURE_PRINCIPLES.md`.

### Alarm

**Definition:** A persisted operational record created for a sensor condition and lifecycle state.

**Current BIO-EMS usage:** SQLite `alarms` records support triggered, acknowledged, and recovered states.

**Related documents:** `DOMAIN_GUIDELINES.md`, `ADR-009-device-registration-policy.md`.

### Alarm Evaluation Engine

**Definition:** The Domain engine that classifies a sensor reading against configured thresholds.

**Current BIO-EMS usage:** `evaluateAlarm` returns status, severity, color, alarm flag, and message key.

The six classifications are `CRITICAL_LOW`, `WARNING_LOW`, `NORMAL`,
`WARNING_HIGH`, `CRITICAL_HIGH`, and `UNKNOWN`. MQTT telemetry processing and
Dashboard room status both consume this Domain result.

**Related documents:** `DOMAIN_GUIDELINES.md`, `ARCHITECTURE_PRINCIPLES.md`.

### Application Service

**Definition:** A service that orchestrates a use case across repositories, Domain behavior, and integrations.

**Current BIO-EMS usage:** Site, Device, Room, Sensor, Alarm, Telemetry, and Dashboard services.

**Related documents:** `ENGINEERING_PLAYBOOK.md`, `ARCHITECTURE_PRINCIPLES.md`.

### Asset

**Definition:** A proposed primary monitored business entity broader than a Room.

**Current BIO-EMS usage:** Not implemented; ADR-008 records the Asset-centric model as Proposed.

**Related documents:** `ADR-008-asset-centric-design.md`, `ADR-005-monitoring-points.md`.

### Build

**Definition:** TypeScript compilation of the backend into `dist/`.

**Current BIO-EMS usage:** Performed with `npm.cmd run build` from `backend/`.

**Related documents:** `TESTING_GUIDELINES.md`, `RELEASE_PROCESS.md`.

### CHANGELOG

**Definition:** The repository release-notes file recording implemented release contents.

**Current BIO-EMS usage:** `CHANGELOG.md` records the `0.12.0` Sprint 12 release candidate.

**Related documents:** `RELEASE_PROCESS.md`, `GIT_WORKFLOW.md`.

### ChatGPT

**Definition:** The AI assistant used for architecture discussion, review, ADR support, planning, and documentation guidance.

**Current BIO-EMS usage:** Advises; it does not own final approval or direct repository implementation.

**Related documents:** `AI_DEVELOPMENT_WORKFLOW.md`.

### Codex

**Definition:** The AI coding assistant used to inspect, edit, build, test, and document the repository.

**Current BIO-EMS usage:** Implements approved scoped changes and reports verification evidence.

**Related documents:** `AI_DEVELOPMENT_WORKFLOW.md`, `CODE_REVIEW_CHECKLIST.md`.

### Dashboard

**Definition:** The implemented backend API area providing monitoring summaries and status views.

**Current BIO-EMS usage:** Includes summary, latest telemetry, room status, and alarm statistics endpoints.

**Related documents:** `ADR-015-dashboard-aggregation-architecture.md`, `ADR-016-dashboard-widget-api-architecture.md`.

### Dashboard Widget

**Definition:** An independent dashboard business view with a dedicated REST endpoint and response contract.

**Current BIO-EMS usage:** Summary, latest telemetry, room status, and alarm statistics are widgets.

**Related documents:** `ADR-016-dashboard-widget-api-architecture.md`.

### Device

**Definition:** A generic configured hardware identity associated with one Site.

**Current BIO-EMS usage:** SQLite Device records include `device_id`, type, protocol, manufacturer, and status metadata.

**Related documents:** `ADR-004-device-design.md`, `ADR-007-device-abstraction.md`.

### Domain

**Definition:** The pure business-rule layer independent from HTTP, persistence, MQTT, and configuration.

**Current BIO-EMS usage:** Contains alarm evaluation enums, value objects, constants, and engine.

**Related documents:** `DOMAIN_GUIDELINES.md`, `ARCHITECTURE_PRINCIPLES.md`.

### DTO

**Definition:** A TypeScript data-transfer shape used at an API or application boundary.

**Current BIO-EMS usage:** Dashboard summary and telemetry types define established response contracts.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `ADR-016-dashboard-widget-api-architecture.md`.

### Engineering Handbook

**Definition:** The collection of engineering documents under `docs/engineering/`.

**Current BIO-EMS usage:** Defines architecture, Domain, review, testing, Git, ADR, AI, and release practices.

**Related documents:** `ENGINEERING_PLAYBOOK.md`.

### Entity

**Definition:** A data-oriented TypeScript interface representing a configured BIO-EMS record.

**Current BIO-EMS usage:** `src/entities/` includes Site, Room, Device, Sensor, Alarm, and User interfaces.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`.

### Express API

**Definition:** The Express-based REST presentation boundary of the backend.

**Current BIO-EMS usage:** Routes call controllers, controllers call services, and error middleware serializes failures.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `CODE_REVIEW_CHECKLIST.md`.

### Git Tag

**Definition:** An immutable Git reference identifying an approved repository release state.

**Current BIO-EMS usage:** Existing tags include `v0.1.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, and `v0.10.0`.

**Related documents:** `GIT_WORKFLOW.md`, `RELEASE_PROCESS.md`.

### Hotfix

**Definition:** An urgent, narrow correction to released or operational behavior.

**Current BIO-EMS usage:** Governed as a `hotfix/*` branch and hotfix release category.

**Related documents:** `GIT_WORKFLOW.md`, `RELEASE_PROCESS.md`.

### Implementation Status

**Definition:** A statement of whether an ADR decision is implemented, partially implemented, or proposed.

**Current BIO-EMS usage:** ADR updates use it to distinguish code evidence from architectural intent.

**Related documents:** `ADR_POLICY.md`, `ADR-005-monitoring-points.md`.

### InfluxDB

**Definition:** The time-series database that owns telemetry values and related tags.

**Current BIO-EMS usage:** Writer and query modules store and retrieve sensor telemetry.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `ADR-017-generic-telemetry-query-architecture.md`.

### Monitoring Point

**Definition:** A proposed physical measurement location between a Room and Sensor.

**Current BIO-EMS usage:** Not implemented; there is no table, repository, or API layer.

**Related documents:** `ADR-005-monitoring-points.md`, `ADR-008-asset-centric-design.md`.

### MQTT

**Definition:** The messaging integration used for device telemetry ingestion.

**Current BIO-EMS usage:** MQTT routing dispatches telemetry to the telemetry module for known devices and sensors.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `ADR-009-device-registration-policy.md`.

### Migration

**Definition:** A versioned, ordered, and repeat-safe SQLite schema change recorded in migration history.

**Current BIO-EMS usage:** `schema_migrations` records applied versions; migration 002 adds
the `warning_low` and `warning_high` sensor columns and is idempotent.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `TESTING_GUIDELINES.md`.

### Owner

**Definition:** The Product / Engineering Owner with final scope, acceptance, and release authority.

**Current BIO-EMS usage:** Approves implementation direction, final review, and releases.

**Related documents:** `AI_DEVELOPMENT_WORKFLOW.md`, `RELEASE_PROCESS.md`.

### Patch Release

**Definition:** A backward-compatible correction or maintenance release.

**Current BIO-EMS usage:** Defined as a manual release category; version tags follow semantic format.

**Related documents:** `RELEASE_PROCESS.md`, `GIT_WORKFLOW.md`.

### Pull Request

**Definition:** A reviewed change proposal containing scope, verification, and documentation evidence.

**Current BIO-EMS usage:** Build and tests must pass before review and merge approval.

**Related documents:** `CODE_REVIEW_CHECKLIST.md`, `GIT_WORKFLOW.md`.

### Repository

**Definition:** A persistence boundary that performs SQLite access and record mapping.

**Current BIO-EMS usage:** Site, Device, Room, Sensor, Alarm, and Migration repositories access SQLite.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `DOMAIN_GUIDELINES.md`.

### Room

**Definition:** An implemented configured location belonging to a Site.

**Current BIO-EMS usage:** Sensors directly link to Rooms through `room_id`.

**Related documents:** `ADR-004-device-design.md`, `ADR-005-monitoring-points.md`.

### Sensor

**Definition:** An implemented configured measurement channel linking a Device and Room.

**Current BIO-EMS usage:** Stores type, unit, critical and warning thresholds,
`device_id`, `room_id`, and channel.

**Related documents:** `ADR-004-device-design.md`, `DOMAIN_GUIDELINES.md`.

### Service

**Definition:** An application-layer component that orchestrates a use case.

**Current BIO-EMS usage:** Services coordinate repositories, Domain behavior, InfluxDB, and MQTT modules.

**Related documents:** `ENGINEERING_PLAYBOOK.md`, `ARCHITECTURE_PRINCIPLES.md`.

### Site

**Definition:** An implemented top-level configured monitoring location.

**Current BIO-EMS usage:** Devices and Rooms belong to Sites through `site_id`.

**Related documents:** `ADR-004-device-design.md`, `ARCHITECTURE_PRINCIPLES.md`.

### Sprint Release

**Definition:** A release recording a completed reviewed engineering increment.

**Current BIO-EMS usage:** Sprint 12 is complete as the `0.12.0` release candidate;
merge, tag, GitHub Release, and deployment remain separate approval steps.

**Related documents:** `RELEASE_PROCESS.md`, `CHANGELOG.md`.

### SQLite

**Definition:** The relational database that owns configuration and operational records.

**Current BIO-EMS usage:** Stores sites, devices, rooms, sensors, alarms, and migration history.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `ADR-004-device-design.md`.

### Telemetry

**Definition:** Time-series sensor measurements received from devices.

**Current BIO-EMS usage:** MQTT telemetry is resolved to known devices/sensors and written to InfluxDB.

**Related documents:** `ARCHITECTURE_PRINCIPLES.md`, `ADR-017-generic-telemetry-query-architecture.md`.

### Telemetry Query

**Definition:** An InfluxDB query module that retrieves telemetry records for application use.

**Current BIO-EMS usage:** Room Status is generic; Latest Telemetry currently filters to temperature.

**Related documents:** `ADR-017-generic-telemetry-query-architecture.md`, `ADR-015-dashboard-aggregation-architecture.md`.

### Version

**Definition:** The manual semantic identifier for a BIO-EMS release state.

**Current BIO-EMS usage:** Current published root version is `0.15.0`; release tags use a `v` prefix. Newer repository development remains under `Unreleased` until approved for publication.

**Related documents:** `RELEASE_PROCESS.md`, `GIT_WORKFLOW.md`.

### VERSION File

**Definition:** The root repository file containing the current project version.

**Current BIO-EMS usage:** `VERSION` contains `0.13.0` and aligns with the backend package and Health API.

**Related documents:** `RELEASE_PROCESS.md`.

### Vitest

**Definition:** The current automated test runner for the backend.

**Current BIO-EMS usage:** Runs 113 Domain, persistence, REST, integration, telemetry,
and migration tests across 10 files through `npm run test:run`.

**Related documents:** `TESTING_GUIDELINES.md`.

### Widget

**Definition:** A dashboard-specific independently consumable API view.

**Current BIO-EMS usage:** Each implemented Dashboard Widget has its own endpoint and response contract.

**Related documents:** `ADR-016-dashboard-widget-api-architecture.md`.

### Zone

**Definition:** An engineering deployment concept, not a current business Domain entity.

**Current BIO-EMS usage:** Documented for Zone Controller deployment boundaries; absent from backend schema and API.

**Related documents:** `ADR-011-Zone is an Engineering Concept.md`, `ADR-012 - Zone Controller Architecture.md`.

## 6. Terminology Rules

- One meaning per term MUST be used within the repository.
- Repository terminology takes precedence over generic or assumed terminology.
- Proposed concepts MUST be identified as Proposed or Not Implemented.
- Core architectural terms MUST NOT receive casual synonyms in engineering documents.
- Engineering documents SHOULD use glossary terminology consistently.
- An ADR status MUST NOT be confused with its implementation status.

## 7. Common Terminology Mistakes

| Mistake                              | Correct distinction                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Monitoring Point = Sensor            | A Sensor is implemented; a Monitoring Point is proposed.                                |
| Asset = Device                       | Asset is proposed business modeling; Device is implemented hardware identity.           |
| Zone = Room                          | Zone is an engineering deployment concept; Room is an implemented configuration entity. |
| Alarm = Alarm Evaluation Engine      | Alarm is a persisted lifecycle record; the engine evaluates reading state.              |
| Dashboard Widget = Dashboard Service | A Widget is an API view; DashboardService aggregates its data.                          |
| Implementation Status = ADR Status   | ADR Status records decision state; implementation status records repository evidence.   |

These distinctions MUST be preserved in ADRs, reviews, and release notes.

## 8. Related Concepts

| Concept    | Related Concepts                                 |
| ---------- | ------------------------------------------------ |
| Sensor     | Device, Room, Telemetry, Alarm Evaluation Engine |
| Alarm      | Alarm Evaluation Engine, AlarmStatus, SQLite     |
| Dashboard  | Widget, DashboardService, DTO, InfluxDB          |
| Repository | SQLite, Entity, Application Service              |
| Telemetry  | MQTT, InfluxDB, Telemetry Query                  |
| Device     | Site, Sensor, MQTT, Device Channel               |

## Lessons Learned

The following observations were derived from practical BIO-EMS engineering work.

- Consistent terminology significantly reduces ambiguity across engineering documents.
- Clearly distinguishing implemented and proposed concepts improves architectural accuracy.
- Repository-first terminology prevents documentation drift.
- Shared terminology improves code reviews and ADR quality.
- A common engineering vocabulary improves AI-assisted development and long-term maintainability.

These observations represent the current BIO-EMS engineering experience and MAY
evolve as the project grows.

## 9. Cross References

| Document                                      | Relationship                                          |
| --------------------------------------------- | ----------------------------------------------------- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md`    | General engineering terminology and responsibilities. |
| `docs/engineering/ARCHITECTURE_PRINCIPLES.md` | Layer and data-ownership definitions.                 |
| `docs/engineering/DOMAIN_GUIDELINES.md`       | Domain concepts and alarm vocabulary.                 |
| `docs/engineering/ADR_POLICY.md`              | ADR and implementation-status terminology.            |
| `docs/engineering/RELEASE_PROCESS.md`         | Version and release terminology.                      |

## 10. Revision History

| Version | Date       | Status   | Change                                                                                 |
| ------- | ---------- | -------- | -------------------------------------------------------------------------------------- |
| 1.0     | 2026-08-05 | Approved | Initial repository-oriented engineering glossary.                                      |
| 1.1     | 2026-08-06 | Approved | Added Sprint 11 alarm states, warning thresholds, migrations, and version terminology. |
| 1.2     | 2026-08-10 | Approved | Aligned release, testing, and Device onboarding terminology with Sprint 12.            |
