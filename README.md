# BIO-EMS

![Current Version](https://img.shields.io/badge/version-0.15.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Express](https://img.shields.io/badge/Express-5.2-000000)
![SQLite](https://img.shields.io/badge/SQLite-Implemented-003B57)
![InfluxDB](https://img.shields.io/badge/InfluxDB-Implemented-22ADF6)
![Engineering Handbook](https://img.shields.io/badge/Engineering_Handbook-Approved-4CAF50)

Enterprise Environmental Monitoring System (EMS) for pharmaceutical cold rooms, warehouses, hospitals, laboratories, clean rooms, manufacturing facilities, and other regulated environments.

**Published release:** [`v0.15.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.15.0)

**Backend:** TypeScript / Express

**Frontend:** React / TypeScript / Vite

**License:** Proprietary

## Project Overview

BIO-EMS is a modular environmental monitoring platform for collecting device telemetry, managing monitoring configuration, evaluating alarm conditions, and exposing protected REST APIs and operational frontend views.

The repository currently contains the completed Sprint 14 React application scope and
the completed Sprint 15 Pilot-readiness foundation. This includes the authenticated
AppShell, operational Dashboard and Monitored Areas views, Sensor calibration and
Device-health contracts, durable notification events, SMS failover policy, production
configuration validation, recovery semantics, and controlled BIO EGYPT Pilot records.

Sprint 15 repository scope is closed. Current work combines the approved backend
commercial-foundation sequence with controlled BIO EGYPT field-pilot preparation;
field commissioning and Pilot acceptance have not yet occurred.

## Key Capabilities

- Environmental telemetry collection
- MQTT device communication
- Six-state Alarm evaluation (`critical-low`, `warning-low`, `normal`, `warning-high`, `critical-high`, `unknown`)
- Dashboard backend APIs
- JWT authentication with active-User enforcement
- Centralized role-based authorization
- ADMIN User Management with last-active-ADMIN protection
- Isolated platform-level `SYSTEM_OWNER` authentication boundary
- Append-only, redacted audit-event foundation with scoped reads
- Atomic User Management audit production for success, denial, and controlled failure
- Authorized, validated, auditable post-creation Sensor threshold updates
- Authenticated Alarm acknowledgment audit persistence
- SQLite configuration management
- InfluxDB time-series telemetry storage
- React frontend architecture and responsive AppShell
- Browser Login/session lifecycle and authorization-aware routing
- Operational Dashboard frontend
- Operational Monitored Areas frontend
- Sensor lifecycle and append-only calibration history
- Trusted Device communication-health semantics
- Durable Alarm and Device notification-event contracts
- Provider-neutral, failover-only SMS policy
- Production configuration readiness validation
- MQTT TLS/QoS and LIVE/REPLAY recovery semantics
- Persistent SQLite deployment and backup paths
- Controlled deployment, commissioning, and Pilot evidence documents
- Typed localization architecture
- Engineering Handbook and Architecture Decision Records

## Current Project Status

| Component                             | Status             |
| ------------------------------------- | ------------------ |
| Backend API                           | Active development |
| Dashboard Backend                     | Implemented        |
| Domain Layer                          | Implemented        |
| SQLite Persistence                    | Implemented        |
| InfluxDB Integration                  | Implemented        |
| Device Lifecycle Onboarding           | Implemented        |
| Authentication and RBAC               | Implemented        |
| ADMIN User Management                 | Implemented        |
| SYSTEM_OWNER backend boundary         | Implemented        |
| System-wide Audit foundation          | Implemented        |
| Alarm Acknowledgment Audit            | Implemented        |
| Frontend Architecture                 | Implemented        |
| Frontend AppShell                     | Implemented        |
| Frontend Authentication/Session       | Implemented        |
| Operational Dashboard Frontend        | Implemented        |
| Monitored Areas Frontend              | Implemented        |
| Sensor Calibration Foundation         | Implemented        |
| Device Communication Health           | Implemented        |
| Notification Event Architecture       | Implemented        |
| SMS Failover Contract                 | Implemented        |
| Pilot Deployment-Readiness Foundation | Implemented        |
| BIO EGYPT Field Commissioning         | Not executed       |
| BIO EGYPT Pilot Acceptance            | Not accepted       |
| Monitoring Point Layer                | Proposed           |

## Current Delivery Status

Sprint 14 and Sprint 15 are **COMPLETE / MERGED / VERIFIED / CLOSED**.

- Sprint 14 delivered the authenticated frontend foundation, AppShell, session and
  authorization boundaries, operational Dashboard, and complete read-only Monitored
  Areas hierarchy.
- Sprint 15 delivered Sensor calibration, Device health, notification and SMS
  contracts, the controlled BIO EGYPT Pilot package, and deployment/commissioning
  readiness foundations.

The backend commercial-foundation sequence has completed BF-01 and BF-02 and is
progressing through BF-03. In the parallel Pilot track,
`BE-001` is closed and field gates `BE-002` through `BE-012` remain open. Repository
completion does not represent installation, commissioning, or customer acceptance.

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

| Technology        | Current use                                   |
| ----------------- | --------------------------------------------- |
| Node.js           | Backend runtime; Node.js 22 or later          |
| TypeScript        | Backend and frontend source language          |
| Express           | REST API and middleware framework             |
| React + Vite      | Frontend browser application                  |
| Material UI       | Frontend component/design system              |
| TanStack Query    | Frontend server-state/query boundary          |
| Zod               | External/frontend response validation         |
| SQLite            | Configuration and operational persistence     |
| InfluxDB          | Telemetry time-series persistence and queries |
| MQTT              | Device telemetry transport                    |
| Vitest            | Automated test runner                         |
| ESLint / Prettier | Static analysis and formatting verification   |

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

| Area           | Current endpoints or operations                                |
| -------------- | -------------------------------------------------------------- |
| Health         | `GET /health`                                                  |
| Sites          | Management/read endpoints                                      |
| Rooms          | Management/read endpoints                                      |
| Sensors        | Management/read, threshold update, and calibration operations  |
| Devices        | Create, list, read, metadata update, activate, and disable     |
| Alarms         | List, active, detail, and acknowledgement operations           |
| Dashboard      | Summary, latest telemetry, room status, and alarm statistics   |
| Authentication | Customer login/current-principal support                       |
| Platform Auth  | `POST /platform-auth/login`, `GET /platform-auth/me`           |
| Users          | ADMIN management operations                                    |
| Audit Events   | ADMIN Site-scoped read; authenticated platform cross-Site read |

### SYSTEM_OWNER bootstrap and configuration

BF-01 keeps the platform owner outside customer User Management. Create the first and
only owner through the controlled backend command after supplying
`BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME` and
`BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD` through the deployment environment or
secret store:

```bash
cd backend
npm run bootstrap:system-owner
```

Platform token issuance is disabled unless `BIOEMS_PLATFORM_JWT_SECRET` is set to an
independent secret of at least 32 UTF-8 bytes. Optional platform settings are
`BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES`, `BIOEMS_PLATFORM_JWT_ISSUER`, and
`BIOEMS_PLATFORM_JWT_AUDIENCE`. Do not reuse the customer JWT secret or place any
owner credential in source control, frontend code, documentation, or logs.

BF-01 does not claim completion of MFA, authentication rate limiting/lockout, an Owner
Portal, or commercial owner permissions. BF-02 adds the append-only audit persistence
and read boundary. BF-03 integrates the existing User Management mutation family as
an atomic audit producer; other action-specific producers remain controlled follow-up
work.

Customer ADMIN audit reads use
`GET /api/v1/audit-events?site_id=<positive-id>&limit=<1..500>`. Platform audit reads
use `GET /api/v1/platform-audit-events` with the isolated platform bearer token and
an optional `site_id`. Audit writes are internal-service-only: callers supply
structured semantic fields, while the service owns event identity/time and redacts
sensitive keys and recognized credential patterns before persistence.

See the [Engineering Handbook](docs/engineering/README.md) and current ADRs for the authoritative architecture and security boundaries.

## Frontend Development

Sprint 14 frontend delivery:

1. S14-01 established React, providers, design tokens, localization contracts, frontend configuration, testing, and quality gates.
2. S14-02 established the professional responsive AppShell and navigation.
3. S14-03 added Login, session restoration, protected requests, and authorization-aware routing/navigation.
4. S14-04 replaced the Dashboard placeholder with the operational Dashboard.
5. S14-05 replaced the Monitored Areas placeholder with a read-only Site → Room → Sensor hierarchy, Sensor inventory and thresholds, refresh/retry behavior, and integration hardening.

See [`frontend/README.md`](frontend/README.md), [`docs/project-management/SPRINT-14-PLAN.md`](docs/project-management/SPRINT-14-PLAN.md), and the Sprint 14 closure/progress records for detailed evidence.

## Release Boundary

Release `v0.15.0` contains the approved repository state through the completed Sprint
14 frontend and Sprint 15 Pilot-readiness foundation. It does not represent BIO EGYPT
field commissioning or Pilot acceptance.

## Planned or Deferred Work

- Monitoring Point architecture and APIs
- Broader Device discovery, QR, activation-code, and provisioning workflows
- Asset approval and assignment
- Delivery-channel provider implementations beyond the approved contracts
- Additional operational frontend features and reports
- OTA and broader commercial production operations
- BIO EGYPT field survey, installation, commissioning evidence, and customer acceptance

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
