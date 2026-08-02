# BIO-EMS

Enterprise Environmental Monitoring System (EMS) for pharmaceutical cold rooms, warehouses, laboratories and other regulated environments.

---

## Overview

BIO-EMS is a modular monitoring platform designed to collect, store and visualize environmental data from multiple sites and assets.

The system focuses on reliability, scalability and regulatory readiness by separating business domains from hardware implementation.

---

## Key Features

- Multi-site architecture
- Asset-centric monitoring
- MQTT communication
- InfluxDB telemetry storage
- SQLite configuration database
- Temperature & humidity monitoring
- Multiple sensor support
- Device registration & activation workflow
- Alarm engine (planned)
- Notification engine (planned)
- Web dashboard (planned)
- Multi-language support (Arabic / English)

---

## Technology Stack

Backend

- Node.js
- TypeScript
- Express
- SQLite
- InfluxDB
- MQTT

Frontend

- (Under Development)

Firmware

- ESP32 (planned)
- Hardware-independent architecture

---

## Repository Structure

```
backend/
frontend/
firmware/
gateway/
hardware/
deployment/
docs/
config/
scripts/
tools/
```

---

## Architecture Principles

BIO-EMS follows:

- Domain Driven Design
- Layered Architecture
- Repository Pattern
- Documentation First
- Architecture First
- Hardware Independence
- Vendor Independence

Business logic belongs to Services.

Repositories handle data access only.

---

## Current Project Status

Current Release

**0.1.0-alpha**

Current implementation includes:

- Backend foundation
- SQLite configuration database
- MQTT infrastructure
- InfluxDB integration
- Repository / Service architecture
- Site module
- Health endpoint
- Project documentation
- Architecture Decision Records (ADRs)

Telemetry Pipeline is the next major milestone.

---

## Roadmap

Phase 1
Repository Foundation

✔ Completed

Phase 2
Database Layer

✔ Completed

Phase 3
MQTT Infrastructure

✔ Completed

Phase 4
Device Registration

In Progress

Phase 5
Telemetry Pipeline

Next

---

## Documentation

Project documentation is located under:

```
docs/
```

Important documents include:

- Architecture
- ADRs
- Implementation Plan
- Business Domain
- Domain Driven Design
- Project Rules
- Risk Register

---

## License

Proprietary License

All rights reserved.

---

## Author

Ahmed A. Elsheikh
