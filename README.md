# BIO-EMS

![Current Version](https://img.shields.io/badge/version-0.13.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Express](https://img.shields.io/badge/Express-5.2-000000)
![SQLite](https://img.shields.io/badge/SQLite-Implemented-003B57)
![InfluxDB](https://img.shields.io/badge/InfluxDB-Implemented-22ADF6)
![Engineering Handbook](https://img.shields.io/badge/Engineering_Handbook-Approved-4CAF50)

Enterprise Environmental Monitoring System (EMS) for pharmaceutical cold rooms,
warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other
regulated environments.

**Current repository version:** [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0) — Released
**Backend:** TypeScript / Express
**License:** Proprietary

## Project Overview

BIO-EMS is a modular environmental monitoring backend for collecting device telemetry,
managing monitoring configuration, evaluating alarm conditions, and exposing REST APIs
for operational dashboard views.

Its engineering goals are reliability, traceability, maintainability, hardware
independence, and clear separation between business rules, configuration data, and
time-series telemetry.

The current repository scope is the backend foundation: authenticated and
role-authorized site, room, device, sensor, alarm, and dashboard APIs; MQTT telemetry;
and SQLite/InfluxDB persistence.

## Key Capabilities

- Environmental telemetry collection
- MQTT device communication
- Alarm evaluation
- Six-state threshold classification (`critical-low`, `warning-low`, `normal`,
  `warning-high`, `critical-high`, and `unknown`)
- Dashboard APIs
- JWT authentication and active-user enforcement
- Centralized role-based authorization for protected APIs
- Atomic Alarm acknowledgement with authenticated-user audit persistence
- SQLite configuration management
- InfluxDB time-series telemetry storage
- Engineering Handbook
- Architecture Decision Records (ADR)

> The capabilities listed above reflect the current repository implementation and do
> not describe planned functionality.

## Current Project Status

| Component                   | Status                |
| --------------------------- | --------------------- |
| Backend API                 | ✅ Active Development |
| Dashboard Backend           | ✅ Implemented        |
| Engineering Handbook        | ✅ Complete           |
| ADR Repository              | ✅ Complete           |
| Domain Layer                | ✅ Implemented        |
| SQLite Persistence          | ✅ Implemented        |
| InfluxDB Integration        | ✅ Implemented        |
| Device Lifecycle Onboarding | ✅ Implemented        |
| Authentication and RBAC     | ✅ Implemented        |
| Alarm Acknowledgement Audit | ✅ Implemented        |
| Monitoring Point Layer      | 📋 Proposed           |

Status reflects repository evidence. Sprint 13 adds JWT authentication, active-user
enforcement, centralized role-based authorization across protected routes, and atomic
Alarm acknowledgement with authenticated-user audit persistence. Monitoring Points
remain proposed: there is no Monitoring Point backend table, repository, or API.

## Repository Highlights

| Area                 | Current State        |
| -------------------- | -------------------- |
| Architecture         | Layered Architecture |
| Engineering Handbook | Complete             |
| ADR Repository       | Complete             |
| Documentation        | Repository-aligned   |
| Testing              | Vitest               |
| Release Process      | Documented           |

These highlights summarize the current engineering maturity of the repository.

## Architecture Overview

BIO-EMS uses a layered backend architecture:

```text
REST API / MQTT ingestion
          |
          v
Application Services and Dashboard Services
          |
          v
Domain Layer: alarm evaluation
          |
          v
SQLite configuration repositories / InfluxDB telemetry queries and writes
```

- **Express API** exposes management, alarm, health, and dashboard endpoints.
- **Domain Layer** evaluates alarm state from readings and configured thresholds.
- **SQLite** owns configuration and operational records such as sites, rooms, devices,
  sensors, alarms, and migration history.
- **InfluxDB** owns time-series telemetry values.
- **MQTT** receives device telemetry and routes it to the telemetry module.
- **Dashboard Services** combine configuration, telemetry, and domain results into
  established dashboard response contracts.

## Technology Stack

| Technology        | Current use                                             |
| ----------------- | ------------------------------------------------------- |
| Node.js           | Backend runtime; Node.js 22 or later is required.       |
| TypeScript        | Backend source language and compilation.                |
| Express           | REST API and middleware framework.                      |
| SQLite            | Configuration and operational persistence.              |
| InfluxDB          | Telemetry time-series persistence and queries.          |
| MQTT              | Device telemetry transport.                             |
| Vitest            | Current automated test runner.                          |
| ESLint / Prettier | TypeScript static analysis and formatting verification. |

## Repository Structure

```text
backend/              TypeScript Express backend, databases, and tests
docs/                 Engineering, ADR, API, architecture, and product documentation
  hardware/           Hardware and installation reference documentation
  product/            Product vision and journey documentation
diagrams/              Architecture, ERD, MQTT, and sequence diagrams
CHANGELOG.md          Implemented release history
VERSION               Current repository version
```

## Quick Start

Prerequisites: Node.js 22 or later, a configured MQTT broker, and InfluxDB settings
for telemetry features.

```bash
git clone <repository-url>
cd bio-ems-project/backend
npm install
```

Copy or create backend environment configuration from `.env.example`, then configure
the MQTT and InfluxDB values for the target environment.

```bash
# Build
npm run build

# Development mode
npm run dev

# Run the automated test suite once
npm run test:run

# Run quality checks
npm run typecheck
npm run lint
npm run format:check
```

On Windows PowerShell environments where `npm.ps1` is restricted, use `npm.cmd` in
place of `npm`.

## Available API Areas

The current API prefix is normally `/api/v1`.

| Area      | Current endpoints or operations                              |
| --------- | ------------------------------------------------------------ |
| Health    | `GET /health`                                                |
| Sites     | Management endpoints                                         |
| Devices   | Create, list, read, metadata update, activate, and disable   |
| Rooms     | Management endpoints                                         |
| Sensors   | Management endpoints                                         |
| Alarms    | List, active, detail, and acknowledgement operations         |
| Dashboard | Summary, latest telemetry, room status, and alarm statistics |

See [`docs/api/`](docs/api/) for API reference material.

## Documentation

- [`docs/engineering/README.md`](docs/engineering/README.md) is the entry point to
  the BIO-EMS Engineering Handbook. It links the current architecture, Domain,
  review, testing, Git, release, ADR, AI workflow, and terminology standards.
- [`docs/adr/`](docs/adr/) contains Architecture Decision Records, including decisions
  that are implemented, partially implemented, and proposed.

The handbook and ADR collection are repository-oriented: code and schema evidence take
precedence over assumptions or roadmap language.

## Engineering Standards

BIO-EMS follows:

- **Repository-first engineering:** inspect the implementation before making claims or changes.
- **Evidence-based reviews:** review conclusions are supported by repository evidence.
- **ADR-driven architecture:** architectural rationale is retained in `docs/adr/`.
- **Documentation synchronized with implementation:** documents distinguish current
  behavior from proposed architecture.

For detailed standards, start with the [Engineering Handbook](docs/engineering/README.md).

## Project Roadmap

Current release: **Sprint 13 — Centralized Role-Based Authorization and Alarm
Acknowledgement Audit** ([`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)).
The release is published after successful validation of 303 automated tests across
25 test files, plus typecheck, build, lint, formatting, and GitHub Actions checks.

The following work remains planned and has not started:

- Monitoring Point architecture
- Broader Device onboarding: discovery, QR, activation codes, and Asset approval
- User Management beyond the current authentication and authorization foundation
- Asset model
- Additional device types

These roadmap items are planned work and are not claims of current implementation.

## Contributing

Contributors should:

1. Follow the [Engineering Handbook](docs/engineering/README.md).
2. Follow applicable ADRs in [`docs/adr/`](docs/adr/).
3. Keep documentation synchronized with implemented behavior.
4. Submit focused, reviewed Pull Requests with successful build and test evidence.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository contribution guidance.

## License

Proprietary License.

All rights reserved. See [LICENSE](LICENSE) for licensing terms.

---

## Engineering Handbook

The BIO-EMS Engineering Handbook defines the engineering standards governing this
repository.

For architecture, engineering standards, ADRs, development workflow, testing,
releases, and terminology, begin with:

[`docs/engineering/README.md`](docs/engineering/README.md)

---

Project: BIO-EMS
Author: Ahmed A. Elsheikh
