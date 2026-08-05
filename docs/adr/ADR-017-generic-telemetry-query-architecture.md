# ADR-017

## Title

Generic Telemetry Query Architecture

---

## Status

Accepted

---

## Date

2026-08-03

---

## Context

BIO-EMS stores telemetry data in InfluxDB using measurements representing different sensor types.

Current sensor types include:

- Temperature

Future releases will introduce additional telemetry measurements such as:

- Humidity
- Door Status
- Differential Pressure
- CO₂
- Particle Count
- Battery Level

The dashboard and future reporting modules require a query strategy that remains independent of individual sensor types.

A decision was required to determine whether telemetry queries should be implemented separately for each measurement or through a generic query layer.

---

## Implementation Status

**Partially Implemented.** `room-status.query.ts` retrieves latest telemetry without a
measurement-specific filter and returns sensor type with each record. However,
`telemetry.query.ts` currently filters the latest-telemetry query to `temperature`.

---

## Decision Drivers

- Scalability
- Reusability
- Maintainability
- Sensor Independence
- Performance
- Future Expansion
- Reduced Code Duplication

---

## Alternatives Considered

### Option 1

Create one query implementation for each sensor type.

Examples:

- temperature.query.ts
- humidity.query.ts
- door.query.ts

#### Pros

- Simple implementation.
- Easy to understand for individual measurements.

#### Cons

- High code duplication.
- Difficult maintenance.
- Every new sensor type requires a new query implementation.
- Inconsistent behavior across telemetry modules.

---

### Option 2

Implement a generic telemetry query layer.

The query retrieves the latest value for each measurement and sensor combination regardless of sensor type.

#### Pros

- Single reusable implementation.
- Supports future sensor types automatically.
- Eliminates duplicated query logic.
- Simplifies dashboard development.
- Easier maintenance.
- Consistent telemetry contract.

#### Cons

- Slightly more complex query implementation.
- Consumers must interpret measurement types.

---

## Decision

BIO-EMS adopts a Generic Telemetry Query Architecture.

The generic query approach shall retrieve measurements without hardcoding individual
sensor types. The current Room Status query follows this approach; the current Latest
Telemetry query remains temperature-specific.

Each telemetry record shall include:

- sensorCode
- sensorType
- deviceCode
- siteCode
- value
- time

Business logic is responsible for interpreting telemetry records based on sensorType.

---

## Consequences

### Positive

- New sensor types require no query redesign.
- Generic dashboard widgets.
- Reusable reporting layer.
- Reduced maintenance effort.
- Consistent telemetry model.
- Better scalability.

### Negative

- Business services must classify telemetry by sensorType.
- Generic queries require consistent measurement naming.

---

## Affected Documents

- BIO-EMS MQTT Protocol
- Dashboard Backend Documentation
- README.md
- CHANGELOG.md

---

## Related ADRs

- ADR-015 Dashboard Aggregation Architecture
- ADR-016 Dashboard Widget API Architecture
- ADR-008 Asset-Centric Domain Model

---

## References

- `backend/database/influx/queries/room-status.query.ts` — generic latest room telemetry query.
- `backend/database/influx/queries/telemetry.query.ts` — current temperature-filtered latest telemetry query.
- `backend/database/influx/writer.ts` — telemetry measurement is set from sensor type.
- `backend/src/services/dashboard.service.ts` — current query consumers.
- `docs/adr/ADR-015-dashboard-aggregation-architecture.md` — aggregation-service decision.
