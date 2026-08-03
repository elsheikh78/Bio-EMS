# ADR-016

## Title

Dashboard Widget API Architecture

---

## Status

Accepted

---

## Date

2026-08-03

---

## Context

The BIO-EMS dashboard consists of multiple independent widgets, each presenting a specific business view of the monitoring system.

Examples include:

- Dashboard Summary
- Latest Telemetry
- Room Status
- Alarm Statistics

An architectural decision was required to determine whether the dashboard should expose a single aggregated endpoint or multiple widget-specific endpoints.

The selected approach must support scalability, maintainability, independent evolution of widgets, and efficient frontend integration.

---

## Decision Drivers

- Separation of Concerns
- Independent Widget Development
- API Maintainability
- Frontend Simplicity
- Scalability
- Performance
- Versioning Flexibility
- Testability

---

## Considered Options

### Option 1

Expose a single dashboard endpoint returning all dashboard data.

#### Pros

- Single HTTP request.
- Simple for small dashboards.

#### Cons

- Large payloads.
- Unnecessary data transfer.
- Tight coupling between widgets.
- Difficult caching.
- Difficult versioning.
- Every dashboard change affects all consumers.

---

### Option 2

Expose one REST endpoint per dashboard widget.

#### Pros

- Independent widgets.
- Smaller payloads.
- Better frontend flexibility.
- Independent testing.
- Easier caching.
- Easier API versioning.
- Better scalability.

#### Cons

- Multiple HTTP requests.
- Slightly more routing code.

---

## Decision

BIO-EMS adopts a Widget-per-Endpoint architecture.

Each dashboard widget shall expose its own REST endpoint.

Examples:

GET /api/v1/dashboard/summary

GET /api/v1/dashboard/latest-telemetry

GET /api/v1/dashboard/rooms/status

GET /api/v1/dashboard/alarm-statistics

Each endpoint owns its own response contract (DTO) and business responsibility.

Widgets must remain independent.

---

## Consequences

### Positive

- Loose coupling between dashboard widgets.
- Better API maintainability.
- Independent frontend loading.
- Easier performance optimization.
- Easier API evolution.
- Better automated testing.

### Negative

- Increased number of endpoints.
- Frontend performs multiple API requests.

---

## Affected Documents

- README.md
- PROJECT_STATE.md
- CHANGELOG.md
- API Documentation

---

## Related ADRs

- ADR-015 Dashboard Aggregation Architecture
- ADR-017 Generic Telemetry Query Architecture