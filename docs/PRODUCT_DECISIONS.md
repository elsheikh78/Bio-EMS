# BIO-EMS Product Decisions

## Pilot Readiness Direction

This document records the agreed product decisions for BIO-EMS Pilot readiness.

## Product Versions

### BIO-EMS Standard

- Target: cold rooms, warehouses, general environmental monitoring.
- Temperature sensor: Industrial DS18B20.
- Controller: BIO-EMS Site Controller v1.
- Primary communication: Internet (Ethernet/WiFi).
- Backup communication: 4G/SMS failover.

### BIO-EMS Advanced

- Target: GMP critical applications and validation-focused customers.
- Temperature sensor: PT100 Class A.
- Same BIO-EMS platform and backend.
- Different measurement layer only.

## Site Controller v1 Direction

The selected architecture is All-in-One Site Controller:

- Sensor acquisition.
- MQTT communication.
- Internet primary path.
- 4G backup path.
- SMS emergency alerts.
- Local buffering capability.
- Device health reporting.

## Communication Strategy

Normal operation:

Sensors -> Site Controller -> Internet -> BIO-EMS Backend -> Notifications

Primary notifications:

- WhatsApp / online notifications.

Fallback:

- SMS used when communication failure occurs or during critical offline scenarios.

## BIO EGYPT Pilot Scope

Sites:

- El Manial.
- CPC October.

Monitoring scope:

- Temperature only (Phase 1).

Sensors:

- Cold rooms: 2 sensors per room.
- Anti-chamber: 1 sensor.
- Dry warehouse sensors as defined in site mapping.

## Sensor Lifecycle & Calibration

BIO-EMS will support:

- Sensor grade (STANDARD / ADVANCED).
- Sensor model (DS18B20 / PT100).
- Installation date.
- Calibration status.
- Calibration dates.
- Calibration offset.
- Certificate reference.

Calibration history will be implemented as a separate module.

## Documentation Policy

Documentation is part of the product and will include:

- Product specifications.
- Hardware specifications.
- Installation procedures.
- Calibration procedures.
- Customer pilot documentation.

## Implementation Principle

Changes must preserve existing telemetry and alarm architecture. New capabilities should be added through versioned migrations and backward-compatible changes.

## Platform Ownership and Audit Boundary

- `SYSTEM_OWNER` remains an isolated platform identity and is never a customer role.
- System-wide audit evidence uses one append-only persistence contract with
  service-owned identity and time.
- Customer audit access is ADMIN-only and must be constrained to an explicit Site.
- Platform audit access uses the separate platform authentication trust domain and
  may read across Sites.
- Audit producers must provide structured semantic fields and must never submit
  plaintext credentials; the audit service applies deterministic defense-in-depth
  redaction before persistence.
- Integrating individual mutation families is incremental work and must not be
  inferred merely from availability of the BF-02 foundation.
- Existing User Management is the first integrated audit producer. Successful User
  mutation and audit persistence are one transaction; a missing audit event causes
  rollback rather than unaudited success.
- Password audit events contain action/result/target context only. Validation-rejected
  request bodies and all password/hash values remain outside audit persistence.
- Customer User Management currently has no implemented Site/customer ownership
  relation, so BF-03 does not invent a false `site_id`; future tenant modeling must
  add explicit ownership and isolation.
- Sensor warning/alarm thresholds are editable configuration, not customer-specific
  code constants. Partial updates merge with persisted values and `null` explicitly
  clears a threshold.
- Every configured threshold subset must be strictly increasing in Domain rank:
  `alarm_low < warning_low < warning_high < alarm_high`, and must remain inside a
  configured Sensor measurement range.
- BF-04 changes current effective configuration only. It does not claim historical
  effective dating or reconstruct old reports against later threshold changes.
- BF-05 stores independent Sensor-scoped warning/critical activation delays as
  integer seconds from 0 through 86400. Zero preserves immediate legacy activation.
- Positive delay uses persisted operational candidates. Normal, opposite-direction,
  or severity-changing LIVE observations reset the candidate; REPLAY never affects it.
- Delay changes invalidate pending state atomically. Recovery delay, hysteresis,
  escalation timing, and historical configuration remain separate decisions.
- BF-06 stores notification recipients by Site with normalized Email, SMS, and
  WhatsApp endpoints and per-channel Warning/Critical eligibility. Dedicated
  ADMIN-only permissions protect both read and mutation boundaries.
- Notification contact addresses are operational personal data. They are returned
  only by the dedicated recipient API and are excluded from logs, URLs,
  deduplication keys, and audit prior/new values.
- Recipient resolution is read-only and excludes inactive recipients. BF-06 does
  not send messages, consume the outbox, choose providers, define escalation, or
  embed BIO EGYPT contacts in product constants.
- BF-07 escalation policies are Site-scoped configuration. Each policy owns an
  accountable recipient role, severity eligibility, lifecycle, and contiguous
  role/channel steps whose elapsed delays increase strictly.
- Due-step resolution is deterministic and read-only. It does not resolve actual
  contact addresses, send externally, consume the outbox, or claim that a step has
  been delivered or acknowledged.
