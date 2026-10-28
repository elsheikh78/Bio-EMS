# ADR-013

## Title

Zone Controller Placement Standard

---

## Status

Accepted

---

## Context

BIO-EMS uses Zone Controllers as the physical hardware platform responsible for hosting the BIO-EMS Device and interfacing with field Sensors.

To ensure consistent deployments, simplify maintenance, and improve hardware accessibility, a standard installation location is required.

The installation location should minimize environmental stress on the hardware while maintaining efficient sensor connectivity.

---

## Implementation Status

**Not implemented in the backend.** This placement standard is deployment
documentation for a Zone Controller architecture that is not represented by a backend
entity, API, or configuration model.

---

## Decision Drivers

- Hardware reliability
- Ease of maintenance
- Standardized deployment
- Reduced installation complexity
- Reduced sensor cable lengths
- Protection from extreme environmental conditions

---

## Alternatives Considered

### Option 1

Install the Zone Controller inside the monitored Asset.

#### Pros

- Short sensor wiring.

#### Cons

- Exposure to harsh environmental conditions.
- Difficult maintenance.
- Increased hardware stress.

---

### Option 2

Install the Zone Controller inside the Ambient Area.

#### Pros

- Easy access.
- Normal operating conditions.

#### Cons

- Longer sensor wiring.
- Less consistent deployment across different site layouts.

---

### Option 3

Install the Zone Controller inside the Ante Chamber whenever available.

#### Pros

- Standard deployment location.
- Easy maintenance access.
- Protected operating environment.
- Balanced sensor cable lengths.
- Consistent installation methodology.

#### Cons

- Not applicable to sites without an Ante Chamber.

---

## Decision

The Ante Chamber is the default installation location for a Zone Controller whenever an Ante Chamber exists.

If an Ante Chamber is not available, an alternative installation location may be selected according to the Installation Guide.

The placement decision is independent of the Business Domain and only affects the deployment architecture.

---

## Consequences

### Positive

- Consistent installation standard.
- Improved hardware reliability.
- Easier maintenance.
- Reduced deployment variability.
- Better protection for electronic components.

### Negative

- Alternative placement rules are required for sites without an Ante Chamber.

---

## Affected Documents

- system-design.md
- installation documentation
- hardware documentation

No changes are required to:

- business-domain.md
- domain-model.md
- entity-relationships.md
- database-design.md

---

## Related ADRs

- ADR-011 Zone is an Engineering Concept
- ADR-012 Zone Controller Architecture

---

## References

- `docs/hardware/installation-guide.md` — installation documentation.
- `docs/hardware/zone-controller.md` — Zone Controller hardware documentation.
- `docs/adr/ADR-011-Zone is an Engineering Concept.md` — Zone boundary decision.
- `docs/adr/ADR-012 - Zone Controller Architecture.md` — related controller decision.
