# ADR-012

## Title

Zone Controller Architecture

---

## Status

Accepted

---

## Context

BIO-EMS is designed around business assets rather than hardware devices.

The Domain Model defines business entities independently from the underlying hardware implementation.

During the hardware architecture review, a decision was required to define how Sensors communicate with the BIO-EMS platform while maintaining hardware independence and preserving the Asset-Centric Design.

The architecture needed a standard hardware component responsible for collecting sensor data, communicating with the backend, and isolating business logic from hardware implementation details.

---

## Decision Drivers

- Preserve Asset-Centric Design.
- Hardware Independence.
- Vendor Independence.
- Product Standardization.
- Scalability.
- Maintainability.
- Deployment Simplicity.
- Future Hardware Flexibility.

---

## Considered Options

### Option 1

Each Asset communicates using its own dedicated controller.

### Pros

- Simple hardware topology.
- Easy to understand.

### Cons

- Increased hardware cost.
- Poor scalability.
- Higher maintenance effort.
- Larger hardware inventory.

---

### Option 2

Use a generic hardware device without architectural definition.

### Pros

- Flexible implementation.

### Cons

- No product standard.
- Hardware responsibilities become inconsistent.
- Difficult to maintain across multiple deployments.

---

### Option 3

Introduce a dedicated BIO-EMS Zone Controller.

### Pros

- Standard hardware architecture.
- Consistent deployment model.
- Hardware implementation becomes replaceable.
- Supports multiple Assets.
- Simplifies maintenance.
- Simplifies future hardware evolution.

### Cons

- Requires dedicated hardware specification.
- Requires installation standards.

---

## Decision

BIO-EMS adopts the Zone Controller as the standard hardware component responsible for field data acquisition and communication.

AThe Zone Controller hosts exactly one BIO-EMS Device.

The Device represents the firmware identity responsible for:

- Collecting measurements from Sensors.
- Managing Device Channels.
- Publishing telemetry.
- Receiving backend commands.
- Reporting device health.
- Reporting firmware information.

The Zone Controller represents the physical hardware.

The Device represents the software identity running on that hardware.

The Zone Controller represents the hardware boundary between field devices and the BIO-EMS backend.

The Zone Controller is an architectural component.

Its implementation is hardware independent.

The first supported implementation is ESP32-based.

Future implementations may use different hardware platforms without affecting the Business Domain.

---

## Consequences

### Positive

- Standard hardware architecture.
- Hardware abstraction is preserved.
- Business Domain remains independent.
- Easier maintenance.
- Easier future hardware migration.
- Simplified deployment.
- Consistent device behavior.

### Negative

- Requires dedicated hardware documentation.
- Requires installation standards.
- Requires hardware lifecycle management.

---

## Affected Documents

- system-design.md
- hardware documentation
- installation documentation
- firmware architecture

No changes are required to:

- business-domain.md
- domain-model.md
- entity-relationships.md

---

## Related ADRs

- ADR-004 Device Design
- ADR-007 Device Abstraction
- ADR-008 Asset-Centric Design
- ADR-011 Zone is an Engineering Concept