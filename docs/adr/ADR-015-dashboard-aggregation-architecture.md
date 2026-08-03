# ADR-015

## Title

Dashboard Aggregation Architecture

---

## Status

Accepted

---

## Date

2026-08-03

---

## Context

BIO-EMS Dashboard widgets require information originating from multiple data sources.

Configuration data is stored in SQLite and includes:

- Sites
- Rooms
- Devices
- Sensors
- Alarm Configuration

Operational telemetry is stored independently in InfluxDB.

The dashboard must present a unified business view without exposing database implementation details to API consumers.

A dedicated architectural approach is required to combine configuration and telemetry into dashboard-ready responses.

---

## Decision Drivers

- Separation of Concerns
- Single Source of Truth
- Multi-Database Architecture
- Dashboard Performance
- Reusable Business Logic
- Future Dashboard Scalability
- Maintainability

---

## Considered Options

### Option 1

Query SQLite and InfluxDB directly from Controllers.

#### Pros

- Simple initial implementation.

#### Cons

- Business logic spreads into Controllers.
- Poor maintainability.
- Difficult testing.
- Code duplication across endpoints.

---

### Option 2

Create a dedicated Dashboard Repository.

#### Pros

- Centralized data access.

#### Cons

- Repository becomes responsible for business logic.
- Violates Repository Pattern.
- Difficult to extend.

---

### Option 3

Introduce a Dashboard Aggregation Service.

#### Pros

- Preserves Repository responsibilities.
- Business logic remains inside the Service layer.
- Supports multiple data sources.
- Reusable by future Dashboard APIs.
- Simplifies testing.
- Scales naturally as new widgets are introduced.

#### Cons

- Additional service layer.
- Slight increase in implementation complexity.

---

## Decision

BIO-EMS adopts a dedicated Dashboard Aggregation Service.

The DashboardService is responsible for:

- Retrieving configuration data from SQLite repositories.
- Retrieving telemetry from InfluxDB.
- Combining information into business-oriented DTOs.
- Performing dashboard aggregation.
- Producing widget-ready responses.

Repositories remain responsible only for data access.

Controllers remain responsible only for HTTP request handling.

---

## Consequences

### Positive

- Clear separation between infrastructure and business logic.
- Reusable aggregation layer.
- Simplified Controller implementation.
- Consistent Dashboard DTO generation.
- Easier future widget development.
- Supports multiple databases without architectural changes.

### Negative

- Additional abstraction layer.
- DashboardService becomes a strategic component requiring proper testing.

---

## Affected Documents

- PROJECT_STATE.md
- README.md
- CHANGELOG.md
- Dashboard Backend documentation

---

## Related ADRs

- ADR-004 Device Architecture
- ADR-007 Device Abstraction
- ADR-008 Asset-Centric Domain Model
- ADR-017 Generic Telemetry Query Architecture