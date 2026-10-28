# ADR-014

## Title

Home Run Wiring Standard

---

## Status

Accepted

---

## Context

BIO-EMS requires a consistent wiring methodology between field Sensors and the Zone Controller.

The wiring architecture directly affects installation quality, maintenance effort, troubleshooting, scalability, and long-term system reliability.

A standard wiring approach is required for all BIO-EMS deployments.

---

## Implementation Status

**Partially Implemented.** The current Sensor model includes a `device_id` and a
dedicated `channel`, supporting channel-level sensor configuration. The backend has no
Zone Controller or Monitoring Point model and does not validate physical wiring.

---

## Decision Drivers

- Installation simplicity
- Ease of maintenance
- Fault isolation
- Scalability
- Hardware reliability
- Standardized deployment
- Reduced troubleshooting time

---

## Alternatives Considered

### Option 1

Daisy Chain Wiring

#### Pros

- Reduced cable length.
- Lower installation cost.

#### Cons

- Difficult fault isolation.
- Single cable failure may affect multiple Sensors.
- More difficult maintenance.
- Reduced deployment flexibility.

---

### Option 2

Home Run Wiring

Each Sensor is connected directly to the Zone Controller using an independent cable.

#### Pros

- Simple troubleshooting.
- Independent Sensor connections.
- Easier maintenance.
- Better fault isolation.
- Simplified future expansion.
- Consistent installation methodology.

#### Cons

- Increased cable length.
- Slightly higher installation cost.

---

## Decision

BIO-EMS adopts Home Run Wiring as the default wiring standard.

Each Monitoring Point Sensor shall be connected directly to a dedicated Device Channel on the Zone Controller when the proposed Monitoring Point and Zone Controller deployment architecture is adopted.

No intermediate Sensor-to-Sensor wiring shall be used as part of the standard deployment architecture.

Alternative wiring methods may be supported by future hardware platforms but are outside the scope of this architecture decision.

---

## Consequences

### Positive

- Predictable installation.
- Simplified maintenance.
- Improved reliability.
- Better fault isolation.
- Independent Sensor replacement.
- Consistent deployment across all installations.

### Negative

- Increased cabling.
- Slightly higher installation cost.

---

## Affected Documents

- installation documentation
- hardware documentation
- wiring standard

No changes are required to:

- business-domain.md
- domain-model.md
- entity-relationships.md
- database-design.md

---

## Related ADRs

- ADR-011 Zone is an Engineering Concept
- ADR-012 Zone Controller Architecture
- ADR-013 Zone Controller Placement Standard

---

## References

- `backend/database/sqlite/schema.ts` — current Sensor `device_id` and `channel` fields.
- `backend/src/repositories/sensor.repository.ts` — Sensor channel persistence mapping.
- `docs/hardware/wiring-standard.md` — wiring documentation.
- `docs/adr/ADR-005-monitoring-points.md` — proposed Monitoring Point architecture.
- `docs/adr/ADR-012 - Zone Controller Architecture.md` — related controller decision.
