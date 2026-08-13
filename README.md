# BIO-EMS

![Current Version](https://img.shields.io/badge/version-0.13.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Express](https://img.shields.io/badge/Express-5.2-000000)
![SQLite](https://img.shields.io/badge/SQLite-Implemented-003B57)
![InfluxDB](https://img.shields.io/badge/InfluxDB-Implemented-22ADF6)
![Engineering Handbook](https://img.shields.io/badge/Engineering_Handbook-Approved-4CAF50)

Enterprise Environmental Monitoring System (EMS) for pharmaceutical cold rooms, warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other regulated environments.

**Published release:** [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

**Backend:** TypeScript / Express

**Frontend:** React / TypeScript / Vite

**License:** Proprietary

## Project Overview

BIO-EMS is a modular environmental monitoring platform for collecting device telemetry, managing monitoring configuration, evaluating alarm conditions, and exposing protected REST APIs and operational frontend views.

The repository currently contains an authenticated and role-authorized backend plus the Sprint 14 React frontend foundation, professional AppShell, browser authentication/session lifecycle, authorization-aware routing, and operational Dashboard.

S14-05 Monitored Areas frontend work is in progress on `agent/s14-05-monitored-areas`. S14-05A and S14-05B are complete and pushed; S14-05C is the next implementation slice.

## Key Capabilities

- Environmental telemetry collection
- MQTT device communication
- Six-state Alarm evaluation (`critical-low`, `warning-low`, `normal`, `warning-high`, `critical-high`, `unknown`)
- Dashboard backend APIs
- JWT authentication with active-User enforcement
- Centralized role-based authorization
- ADMIN User Management with last-active-ADMIN protection
- Authenticated Alarm acknowledgment audit persistence
- SQLite configuration management
- InfluxDB time-series telemetry storage
- React frontend architecture and responsive AppShell
- Browser Login/session lifecycle and authorization-aware routing
- Operational Dashboard frontend
- Typed localization architecture
- Engineering Handbook and Architecture Decision Records

## Current Project Status

| Component | Status |
| --- | --- |
| Backend API | Active development |
| Dashboard Backend | Implemented |
| Domain Layer | Implemented |
| SQLite Persistence | Implemented |
| InfluxDB Integration | Implemented |
| Device Lifecycle Onboarding | Implemented |
| Authentication and RBAC | Implemented |
| ADMIN User Management | Implemented |
| Alarm Acknowledgment Audit | Implemented |
| Frontend Architecture | Implemented |
| Frontend AppShell | Implemented |
| Frontend Authentication/Session | Implemented |
| Operational Dashboard Frontend | Implemented |
| Monitored Areas Frontend | In progress — S14-05A/B complete on feature branch |
| Monitoring Point Layer | Proposed |

## Sprint 14 Status

Sprint 14 is **IN PROGRESS**.

- **S14-01 — Frontend architecture and project foundation:** COMPLETE / MERGED / CLOSED.
- **S14-02 — Professional responsive application shell and navigation:** COMPLETE / MERGED / VERIFIED.
- **S14-03 — Authentication, session, and authorization-aware routing:** COMPLETE / MERGED / VERIFIED.
- **S14-04 — Operational Dashboard frontend:** COMPLETE / MERGED / VERIFIED.
- **S14-05 — Monitored Areas frontend:** IN PROGRESS.
  - S14-05A contracts/data access: COMPLETE / COMMITTED / PUSHED (`90e39af`).
  - S14-05B Site/Monitored Area hierarchy: COMPLETE / COMMITTED / PUSHED (`bd442e9`).
  - S14-05C Sensor inventory/threshold metadata: NOT STARTED / NEXT.
  - S14-05D refresh/integration/hardening: NOT STARTED.

S14-05A/B are feature-branch progress and are not yet integrated into `main`.

## Domain Terminology

For S14-05, **Monitored Area** is presentation terminology for the existing Room domain. The current hierarchy is:

**Site → Monitored Area (Room) → Sensor**

There is no implemented Monitoring Point backend table, repository, or API. Asset and Monitoring Point work remains separately scoped future work.

## Architecture Overview

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

The browser application uses React Router, TanStack Query, Zod boundary validation, Material UI, typed localization resources, and the authenticated request/session architecture established during Sprint 14.

## Technology Stack

| Technology | Current use |
| --- | --- |
| Node.js | Backend runtime; Node.js 22 or later |
| TypeScript | Backend and frontend source language |
| Express | REST API and middleware framework |
| React + Vite | Frontend browser application |
| Material UI | Frontend component/design system |
| TanStack Query | Frontend server-state/query boundary |
| Zod | External/frontend response validation |
| SQLite | Configuration and operational persistence |
| InfluxDB | Telemetry time-series persistence and queries |
| MQTT | Device telemetry transport |
| Vitest | Automated test runner |
| ESLint / Prettier | Static analysis and formatting verification |

## Repository Structure

```text
backend/              TypeScript Express backend, databases, services, and tests
frontend/             React TypeScript browser application
docs/                 Engineering, ADR, API, architecture, project, and product documentation
diagrams/             Architecture, ERD, MQTT, and sequence diagrams
CHANGELOG.md          Published and repository release history
VERSION               Published repository version metadata
```

## Quick Start

Backend:

```bash
git clone <repository-url>
cd bio-ems-project/backend
npm install
npm run dev
```

Frontend:

```bash
cd ../frontend
npm install
npm run dev
```

Typical quality checks:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run format:check
```

On Windows PowerShell environments where `npm.ps1` is restricted, use `npm.cmd` in place of `npm`.

## Available API Areas

The current API prefix is normally `/api/v1`.

| Area | Current endpoints or operations |
| --- | --- |
| Health | `GET /health` |
| Sites | Management/read endpoints |
| Rooms | Management/read endpoints |
| Sensors | Management/read endpoints |
| Devices | Create, list, read, metadata update, activate, and disable |
| Alarms | List, active, detail, and acknowledgement operations |
| Dashboard | Summary, latest telemetry, room status, and alarm statistics |
| Authentication | Login/current-principal support |
| Users | ADMIN management operations |

See the [Engineering Handbook](docs/engineering/README.md) and current ADRs for the authoritative architecture and security boundaries.

## Frontend Development

Sprint 14 frontend evolution:

1. S14-01 established React, providers, design tokens, localization contracts, frontend configuration, testing, and quality gates.
2. S14-02 established the professional responsive AppShell and navigation.
3. S14-03 added Login, session restoration, protected requests, and authorization-aware routing/navigation.
4. S14-04 replaced the Dashboard placeholder with the operational Dashboard.
5. S14-05 is replacing the Monitored Areas placeholder with a read-only Site → Room → Sensor hierarchy using existing backend contracts only.

See [`frontend/README.md`](frontend/README.md), [`docs/project-management/SPRINT-14-PLAN.md`](docs/project-management/SPRINT-14-PLAN.md), and the Sprint 14 closure/progress records for detailed evidence.

## Release Boundary

The immutable `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.

Later Sprint 13 and Sprint 14 work is newer repository development and is not retroactively part of the `v0.13.0` artifact.

## Planned or Deferred Work

- S14-05C Sensor inventory and threshold metadata
- S14-05D refresh, integration, and hardening
- Monitoring Point architecture and APIs
- Broader Device discovery, QR, activation-code, and provisioning workflows
- Asset approval and assignment
- Notification Engine
- Additional operational frontend features and reports
- OTA, deployment, backup/restore, and production operations

## Engineering Standards

BIO-EMS follows repository-first engineering, evidence-based reviews, ADR-driven architecture, scoped Pull Requests, and documentation synchronized with implementation.

Start with [`docs/engineering/README.md`](docs/engineering/README.md).

## Contributing

Contributors should follow the Engineering Handbook, applicable ADRs, current Sprint documentation, and repository quality gates. Submit focused reviewed Pull Requests with successful validation evidence.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Proprietary License. All rights reserved. See [LICENSE](LICENSE).

---

Project: BIO-EMS

Author: Ahmed A. Elsheikh
