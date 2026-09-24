# BIO-EMS Product Decisions

## Pilot Readiness Direction

This document records the agreed product decisions for BIO-EMS Pilot readiness.

## Product Versions

### BIO-EMS Standard

- Target: cold rooms, warehouses, general environmental monitoring.
- Current new-hardware measurement baseline: PT100 3-wire through BIO-EMS SIM-T2/SIM-T4.
- Controller: BIO-EMS Site Controller.
- Primary communication: wired Ethernet; Wi-Fi retained as service/fallback capability.
- Backup communication: independent BIO-EMS COM-CELL LTE/SMS gateway.

### BIO-EMS Advanced

- Target: GMP critical applications and validation-focused customers.
- Uses the same modular hardware family; final differentiation is to be defined by released measurement accuracy, calibration/validation evidence, redundancy, environmental/mechanical rating and security/qualification profile rather than by assuming a different direct-wired Sensor bus.
- Same BIO-EMS platform and backend.

## Modular Hardware Architecture (Approved 2026-09-24)

The previous direct-DS18B20 / all-in-one Site Controller hardware direction is superseded for new
BIO-EMS Pilot hardware by the approved modular architecture documented in:

`docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md`

Approved product blocks:

- `BIO-EMS SC` — Site Controller;
- `BIO-EMS SIM-T2` — two-channel RTD interface;
- `BIO-EMS SIM-T4` — four-channel RTD interface;
- `BIO-EMS COM-CELL` — independent LTE/SMS gateway;
- `BIO-EMS PDU-24` — 24 VDC protected power/distribution unit.

Current Pilot temperature measurement baseline is PT100, 3-wire, with an independent MAX31865-class
front end per populated channel. SIM-T2 and SIM-T4 should share one four-channel PCB/DNP strategy
where practical.

24 VDC is the approved field-power backbone; field devices target an 18–30 VDC input design range
and create local 5 V / 3.3 V rails.

RS485 is the approved field-bus physical layer. Ethernet is the preferred fixed-site Platform
network path from the Site Controller. Cellular is separated from the Site Controller so one
COM-CELL can serve the Site and remain independently replaceable.

For El Manial, the approved design baseline is:

- 1 × SC;
- 2 × SIM-T2;
- 1 × SIM-T4;
- 1 × COM-CELL;
- 1 × PDU-24;
- 7 × PT100 3-wire probes.

Exact electronic manufacturer part numbers, cable lengths, PSU/UPS selection and released PCB
design remain open engineering outputs and are not implied by this architecture approval.

## Site Controller v1 Direction

Historical note: the earlier All-in-One Site Controller direction is superseded by the modular 24 V / RS485 architecture approved on 24 September 2026. The Site Controller retains local processing, buffering, MQTT/platform communication and health reporting, while RTD acquisition is delegated to SIM-T2/T4 and LTE/SMS is delegated to COM-CELL.

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
- BF-08 contract version 1 treats controller configuration as effective only after
  an `APPLIED` acknowledgement exactly matches Site, positive config version, and
  SHA-256 checksum. Delivery alone is never proof of application.
- A controller keeps its last acknowledged valid bundle and marks it stale when a
  replacement fails. Without one, offline external notification is disabled and the
  controller signals not-ready. Firmware, transport, and field evidence remain
  required before claiming deployed capability.
- BF-09 frontend permission vocabulary must mirror the backend exactly. Frontend
  visibility is presentation defense; server authorization remains authoritative.
- The mutation-capable Configuration route requires `CONFIGURATION_WRITE`. Read-only
  Monitored Areas and Calibration presentation continue to use
  `CONFIGURATION_READ`.
- BF-09-01 establishes runtime-validated API adapters only. Their presence is not
  evidence that configuration management screens or workflows are complete.

## SYSTEM_OWNER Installation Provisioning and Customer RBAC

- ADR-022 approves SYSTEM_OWNER-controlled customer installation provisioning.
- SYSTEM_OWNER creates customer ADMIN accounts and the Site/Monitored Area/Telemetry
  topology; customer ADMIN cannot create or structurally mutate that topology.
- SYSTEM_OWNER owns initial Device inventory/mapping and initial Telemetry setup;
  customer ADMIN retains approved post-handover Device lifecycle, thresholds, Alarm
  delay, calibration, recipient and escalation management.
- OPERATOR retains Alarm acknowledgement and report export but loses Device and
  Commissioning mutation permissions. VIEWER remains read-only without export or
  acknowledgement.
- Structural changes to an active installation use validated revisions and exact
  controller receipts. Delivery is not application evidence.
- SYSTEM_OWNER records technical Commissioning; customer ADMIN independently accepts
  or rejects handover. Configuration-active never implies Commissioned.
- Delegated BIO-EMS roles such as INSTALLATION_ENGINEER are deferred.
- These are approved requirements, not implemented behavior, until their P8 packages
  pass code review, tests, PR/CI and merge.


## Device Trust and Replaceable Platform Host (Approved 2026-09-11)

- Every Site Controller/ESP32 or future gateway has an individual cryptographic identity and client certificate.
- The platform and controllers trust BIO-EMS-controlled CA roots; they must never share one certificate or private key.
- Device communication requires mTLS and backend authorization against Customer, Site, Installation, device registry and signed license entitlements.
- A controller remains bound to its licensed Customer/Site and is rejected when unknown, revoked, replaced or presented against another Site.
- The customer platform computer is a replaceable Host, not the permanent Site identity.
- On planned or emergency PC replacement, the existing logical Installation and valid device certificates are retained; the new Host receives a new key/fingerprint, signed license binding and server TLS certificate, while the old Host is retired/revoked.
- Transfer, recovery, device issue/revocation and certificate lifecycle actions must be audited.
- These are approved implementation requirements, not claims of currently deployed capability.


## Pilot-First Execution Priority (Approved 2026-09-11)

- Communication Channel Administration COM-01 through COM-06 is the immediate software priority.
- After COM source merge, generate a fresh internal Pilot Setup and qualify it on multiple clean Windows computers.
- Hardware bench validation and BIO EGYPT field commissioning follow the repeatable Setup baseline.
- Telegram remains the interim online Pilot channel while Meta WhatsApp onboarding is externally blocked.
- Final production Device PKI/mTLS, Secure Boot/Flash Encryption, host-transfer and commercial anti-copy qualification are deferred until Pilot software/hardware stability is established.
- This sequencing is intentional: it avoids repeated certificate/host-protection rework while the Pilot is still being installed and tested across multiple computers.
- Existing licensing source work remains preserved; deferral applies to the final production-grade protection/device-trust completion and qualification.
- Current authority: `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, and `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`.
