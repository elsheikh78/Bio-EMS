# BIO-EMS Product Configurability Principle

Status: APPROVED PRODUCT DIRECTION
Date: 2026-08-23

## Product principle

BIO-EMS is a commercial environmental monitoring product. A customer Pilot validates and configures the product; it must not turn the product into customer-specific software.

Business and operational values that legitimately vary by customer, Site, Monitored Area, Controller/Device, Sensor, notification policy, or operating procedure MUST be configuration-driven unless a documented security, safety, integrity, regulatory, protocol, or validated-hardware constraint requires a fixed invariant.

## Configuration hierarchy

Configuration should be scoped at the appropriate level:

Customer -> Site -> Monitored Area -> Controller/Device -> Sensor

Where inheritance is supported, defaults and overrides must have deterministic precedence.

## Required configurable domains

The commercial product must avoid customer-specific hard-coding for at least:

- customer, Site, and Monitored Area identities;
- Controller/Device/Sensor logical mapping and enabled channels;
- supported operational metadata;
- Warning Low, Warning High, Critical/Alarm Low, and Critical/Alarm High thresholds;
- alarm persistence/delay values where supported;
- notification recipients and recipient roles;
- notification channel eligibility by severity;
- escalation order, timing, and ownership;
- reporting filters and customer/site presentation settings;
- safe network/failover deployment configuration.

The existing Standard/Advanced hardware product definitions are NOT redefined here. `docs/PRODUCT_DECISIONS.md` remains the authoritative product decision reference for those tiers.

## Controlled configuration

Configurability does not mean unrestricted editing. Configuration changes must be protected by authorization appropriate to the operation, validated before persistence, and auditable where they affect monitored operation, alarms, notifications, calibration, security, or compliance evidence.

For controlled configuration changes, the target design must preserve enough evidence to identify who changed what, when, and the previous/new effective values.

## Alarm configuration

Temperature thresholds and alarm delays are configuration, not BIO EGYPT-specific source-code rules. Pilot-approved values are initial customer configuration and may later be changed by an authorized workflow without code modification.

The current backend already models per-Sensor warning/alarm thresholds at Sensor creation. The current Sensor REST surface exposes create/list plus calibration operations; an editable post-creation threshold configuration workflow is therefore a product implementation gap until separately implemented and verified.

## Notification and escalation configuration

Notification recipients, severity eligibility, escalation order, and escalation timing are configuration. The current S15-04 notification architecture deliberately excludes recipient directory, escalation timing, and frontend configuration. S15-05 defines provider-neutral SMS failover policy but leaves recipient resolution and deployment configuration for later work.

Therefore BIO EGYPT recipient decisions are Pilot configuration requirements, not evidence that the full commercial configuration workflow already exists.

## Offline failover synchronization

The approved failover architecture requires local critical-alarm behavior when primary Internet is unavailable. The Site Controller must therefore receive and retain the controlled subset of effective configuration required for offline critical evaluation and failover notification.

A backend configuration change must not be assumed active on a Controller until synchronization/acknowledgement semantics are defined and verified. Versioning, acknowledgement, safe fallback, and reconnect behavior remain implementation work unless separately evidenced.

## Fixed invariants

The following classes of behavior may remain fixed when justified and documented:

- security and authentication invariants;
- data-integrity constraints;
- protocol contracts;
- migration invariants;
- validated hardware/electrical limits;
- fail-safe behavior that must not be weakened by customer configuration.

## Documentation rule

Documentation must distinguish clearly between:

- implemented and verified capability;
- documented requirement/design;
- customer-approved Pilot configuration;
- pending development;
- pending customer approval;
- pending field/commissioning evidence.

A requirement or design document alone is not implementation evidence.
