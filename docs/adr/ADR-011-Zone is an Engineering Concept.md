# ADR-011

## Title

Zone is an Engineering Concept

---

## Status

Accepted

---

## Context

BIO-EMS is designed around business assets rather than hardware.

During the architecture review, a new concept called "Zone" emerged while designing the hardware deployment model.

A Zone represents a deployment boundary managed by a single Zone Controller.

The design team had to decide whether Zone should become a business entity within the Domain Model or remain an infrastructure concept used only by the deployment architecture.

---

## Decision Drivers

- Maintain Domain Model simplicity.
- Preserve Asset-Centric Design.
- Keep Business Domain independent from hardware.
- Avoid unnecessary database complexity.
- Allow flexible hardware deployment.

---

## Considered Options

### Option 1

Treat Zone as a Business Entity.

### Pros

- Explicit representation of hardware deployment.
- Easier visualization of controller coverage.

### Cons

- Adds unnecessary complexity to the Business Domain.
- Couples business entities with hardware topology.
- Requires additional database tables and APIs.
- Licensing becomes dependent on deployment topology.

---

### Option 2

Treat Zone as an Engineering Concept.

### Pros

- Keeps the Domain Model focused on business entities.
- Preserves Asset-Centric Design.
- Allows hardware topology to evolve independently.
- Simplifies database design.
- Simplifies REST API design.

### Cons

- Zone information exists only within system architecture and deployment documentation.

---

## Decision

BIO-EMS defines a Zone as an Engineering Concept.

A Zone is not a Business Entity.

A Zone represents the deployment boundary managed by a Zone Controller.

Business entities remain:

- Organization
- Site
- Asset
- Monitoring Point
- Sensor

Zone information belongs to the System Design, Hardware Design, Installation Documentation, and Deployment Architecture.

---

## Consequences

### Positive

- Business Domain remains hardware independent.
- Asset-Centric Design is preserved.
- Database design remains simple.
- REST APIs remain business oriented.
- Hardware architecture can evolve without changing the Domain Model.

### Negative

- Deployment documentation becomes responsible for defining Zones.
- Zone relationships are not represented inside the Business Domain.

---

## Affected Documents

- system-design.md
- hardware documentation
- installation documentation

No changes are required to:

- domain-model.md
- business-domain.md
- entity-relationships.md

---

## Related ADRs

- ADR-007 Device Abstraction
- ADR-008 Asset-Centric Design