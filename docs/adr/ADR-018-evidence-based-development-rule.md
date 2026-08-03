# ADR-018

## Title

Evidence-Based Development Rule

---

## Status

Accepted

---

## Date

2026-08-03

---

## Context

During the implementation of Sprint 10, several architectural and implementation decisions depended on the actual state of the codebase rather than design assumptions.

Examples included:

- Repository method availability
- InfluxDB query behavior
- Database schema verification
- Dashboard aggregation logic
- End-to-End API validation

These activities demonstrated that implementation based on assumptions introduces unnecessary technical debt, rework, and unstable code.

A development rule was required to standardize how future implementation decisions are validated before code is written.

---

## Decision Drivers

- Code Correctness
- Maintainability
- Architectural Consistency
- Reduced Rework
- Reliable Documentation
- Production Readiness
- Team Collaboration

---

## Considered Options

### Option 1

Implement features based on design assumptions.

#### Pros

- Faster initial implementation.
- Less time spent reviewing existing code.

#### Cons

- Frequent refactoring.
- Incorrect assumptions about repositories and APIs.
- Higher bug rate.
- Increased technical debt.
- Documentation diverges from implementation.

---

### Option 2

Validate implementation decisions using project evidence before coding.

Evidence includes:

- Existing repositories
- Entity definitions
- Database schema
- Query implementations
- Runtime testing
- Build verification
- End-to-End API validation

#### Pros

- Lower implementation risk.
- Better architectural consistency.
- Fewer integration defects.
- Reliable documentation.
- Reduced technical debt.
- Higher confidence before merging.

#### Cons

- Requires additional analysis before implementation.

---

## Decision

BIO-EMS adopts an Evidence-Based Development approach.

Before implementing any feature that depends on existing functionality, developers shall validate the implementation using project evidence rather than assumptions.

Evidence may include:

- Repository implementations
- Entity definitions
- Database schema
- MQTT payloads
- InfluxDB queries
- Existing APIs
- Build verification
- End-to-End testing

No architectural or implementation decision shall rely solely on inferred behavior when project evidence is available.

---

## Consequences

### Positive

- More reliable implementation.
- Reduced technical debt.
- Fewer integration failures.
- Better documentation accuracy.
- More predictable sprint execution.
- Improved maintainability.

### Negative

- Slightly longer analysis phase before implementation.

---

## Affected Documents

- PROJECT_RULES.md
- CONTRIBUTING.md
- IMPLEMENTATION_PLAN.md
- Development Standards

---

## Related ADRs

- ADR-015 Dashboard Aggregation Architecture
- ADR-016 Dashboard Widget API Architecture
- ADR-017 Generic Telemetry Query Architecture