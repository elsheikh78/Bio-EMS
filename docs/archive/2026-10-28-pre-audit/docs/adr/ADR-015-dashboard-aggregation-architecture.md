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

## Implementation Status

**Implemented.** `DashboardService` retrieves configuration through SQLite
repositories, reads latest telemetry through InfluxDB query modules, and serves the
implemented dashboard endpoints. Alarm status evaluation is delegated to
`AlarmEvaluationEngine` before dashboard status mapping.

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

## Alternatives Considered

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
- Dashboard aggregation orchestration remains inside the Service layer.
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

Alarm evaluation remains a Domain responsibility. `DashboardService` orchestrates
data retrieval and maps Domain results to the established dashboard API contract.

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

---

## References

- `backend/src/services/dashboard.service.ts` — implemented dashboard aggregation and status mapping.
- `backend/src/controllers/dashboard.controller.ts` — dashboard controller boundary.
- `backend/src/routes/dashboard.route.ts` — implemented dashboard endpoints.
- `backend/database/influx/queries/telemetry.query.ts` — latest telemetry query.
- `backend/database/influx/queries/room-status.query.ts` — room telemetry query.
- `backend/src/domain/engines/alarm-evaluation.engine.ts` — Domain alarm evaluation.
- `docs/adr/ADR-017-generic-telemetry-query-architecture.md` — related telemetry-query decision.
