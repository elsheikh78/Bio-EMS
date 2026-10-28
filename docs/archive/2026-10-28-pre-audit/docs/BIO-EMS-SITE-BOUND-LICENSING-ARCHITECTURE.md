# BIO-EMS Site-Bound Licensing & Anti-Cloning Architecture

**Status:** Approved architecture for future implementation  
**Decision date:** 2026-09-05  
**Primary objective:** Prevent an authorized BIO-EMS installation from being copied and reused on another computer, another customer site, or another site belonging to the same customer without a separately authorized license.

## 1. Licensing principle

BIO-EMS licensing is **site/installation bound**, not merely customer bound.

A customer owning a valid BIO-EMS license for one site does not automatically gain the right or technical ability to reuse that installation at another site.

Target identity chain:

`Customer → Licensed Site → Installation → Host Identity → Authorized Gateways/Devices → Signed License`

Each commercial installation must have an independently issued installation identity and license.

## 2. Threat scenarios to prevent

The implementation must explicitly defend against:

1. Copying the BIO-EMS application directory to another PC.
2. Copying the complete installation including configuration files.
3. Copying SQLite and/or telemetry databases to another PC.
4. Reusing one customer's licensed installation at another customer.
5. Reusing a license at another site belonging to the same customer.
6. Editing a local database field or configuration value to mark an installation as licensed.
7. Modifying license limits such as expiration, site, enabled modules, device count or sensor count.
8. Reusing a copied installation with unauthorized BIO-EMS gateways/devices.
9. Cloning a virtual or physical installation where practical controls can detect the clone.

## 3. Installation identity

On first installation, BIO-EMS should generate a unique **Installation ID** and an installation cryptographic identity.

Candidate identity elements:

- Installation ID
- Installation public/private key pair
- Hardware fingerprint
- Customer ID
- Site ID
- Authorized gateway/device identities

The installation private key must be stored using an appropriate protected operating-system mechanism and must not be exported as an ordinary plaintext configuration value.

## 4. Hardware fingerprint

The license must not rely only on a MAC address because MAC addresses are replaceable/spoofable.

R&D/implementation should define a composite hardware fingerprint derived from multiple reasonably stable machine properties. Only a one-way representation/hash needed for licensing should be retained where possible.

The design must include a **Hardware Change Tolerance Policy** so that legitimate maintenance such as replacement of one disk or network adapter does not unnecessarily destroy a valid installation.

A material host change or replacement must trigger reactivation or license transfer.

## 5. Site binding

Every license must reference a specific BIO-EMS Site ID.

Example:

`Customer: BIO EGYPT`

- `Site: Manial → independent licensed installation`
- `Site: 6th October → independent licensed installation`

A license issued for one site must not authorize another site, even if both sites belong to the same legal customer.

Software-only site naming is not considered sufficient proof of physical location. Where appropriate, site binding should be strengthened using registered gateway/device identity and periodic platform validation.

## 6. Signed license certificate

The authoritative license must be cryptographically signed by BIO-EMS.

Candidate signed claims include:

- License schema/version
- Customer ID
- Customer display name
- Site ID
- Site display name
- Installation ID
- Hardware fingerprint/binding data
- License issue date
- License status/type
- Expiration/maintenance dates where applicable
- Enabled product modules / industry profiles
- Maximum gateways/devices
- Maximum sensors/channels where commercially applicable
- Authorized gateway/device IDs where configured
- Update entitlement
- Offline/grace policy

BIO-EMS central licensing infrastructure holds the **private signing key**. Customer installations receive only the public verification key required to validate licenses.

Changing a signed license field locally must invalidate its signature.

The central signing private key must never be embedded in the installer, application, customer database, source bundle distributed to customers, or field gateway firmware.

## 7. Activation workflow

Target activation flow:

1. Install BIO-EMS.
2. Generate Installation ID and installation key pair.
3. Calculate hardware fingerprint.
4. Create an Activation Request containing the required non-secret identity information.
5. Platform Owner assigns/validates Customer and Site.
6. Platform Server evaluates license entitlement.
7. Platform Server issues a signed site-bound license certificate.
8. Customer installation validates the signature and binding claims.
9. Installation enters Activated state.

The architecture should support both online activation and a controlled offline activation workflow for sites without reliable Internet connectivity.

## 8. Runtime validation

License validation must occur in trusted backend/application-service logic and must not rely on hiding UI elements.

Runtime checks should include, as applicable:

- Cryptographic signature validity
- Installation ID match
- Hardware binding match/tolerance
- Site/license identity match
- License status
- Entitlement limits
- Authorized device/gateway identity
- License schema compatibility

Frontend code must not be the authoritative licensing enforcement point.

## 9. Gateway/device binding

BIO-EMS should support binding licensed installations/sites to authorized gateways/devices.

Target model:

`License ↔ Site ↔ Installation ↔ Authorized Gateway/Device IDs`

A copied installation presented with an unauthorized gateway should not silently become a valid second deployment.

Device/gateway binding is an additional anti-cloning layer and should complement, not replace, cryptographic license and host binding.

## 10. Database-copy resistance

License validity must not depend on a simple mutable database field such as `licensed=true`.

Copying SQLite, InfluxDB or application configuration must not create a valid second installation.

The authoritative proof is the combination of:

`Signed License + Installation Identity + Host Binding + Site Binding + optional Gateway/Device Binding`

Database restore to a legitimate replacement machine must use the controlled license-transfer/reactivation procedure.

## 11. Offline operation and monitoring continuity

BIO-EMS is an environmental monitoring product and may operate at sites with unreliable Internet connectivity.

The target architecture is:

`Controlled Activation → Signed Local License → Offline Verification → Periodic Platform Validation when available`

Loss of Internet connectivity alone must not immediately stop telemetry collection, critical alarms, local history or safety-relevant monitoring.

Commercial enforcement must be designed separately from monitoring continuity. Expiration, validation failure or maintenance entitlement issues should use a defined warning/grace/restriction policy rather than unexpectedly disabling critical monitoring.

Exact grace periods and restriction behavior are implementation/product-policy decisions to be finalized before release.

## 12. License transfer / hardware replacement

A formal transfer workflow is required for legitimate PC failure or replacement.

Target process:

1. Identify existing Customer/Site/Installation.
2. Revoke or retire the old installation binding.
3. Preserve/restore customer data according to backup/restore procedure.
4. Install BIO-EMS on replacement host.
5. Generate a new installation identity/fingerprint.
6. Platform Owner authorizes transfer.
7. Issue a replacement signed license.
8. Record the transfer in the platform audit history.

Where the old machine is unavailable, Platform Owner must be able to perform an audited administrative recovery/transfer.

## 13. Revocation and entitlement management

The future Platform Server should support at minimum:

- Activate
- Reactivate
- Transfer
- Revoke
- Suspend where commercially/legal appropriate
- Renew
- Change entitlements
- Add/remove authorized gateways/devices
- Record license history
- Record installation history

All privileged license-management operations must be auditable.

## 14. Platform Server role

The central BIO-EMS platform is the licensing authority and should maintain a model similar to:

`Customer → Sites → Installations → Licenses → Entitlements → Devices/Gateways → Version/Update Entitlement → License Events`

The central platform should never be required for every sensor reading. Its role is licensing/entitlement governance and periodic validation, not becoming a single point of failure for local environmental monitoring.

## 15. Installer integration

The future BIO-EMS Windows Setup Package must integrate with this licensing architecture.

Installation should not ship a reusable pre-activated identity. Each installed instance must create or obtain its own installation identity.

The installer/package design should eventually also include code signing, package integrity verification and protected service/configuration setup, but those security controls are complementary to site-bound licensing.

## 16. Product-protection layers

Anti-cloning should use multiple independent controls:

1. Signed license certificate
2. Unique Installation ID
3. Installation cryptographic key pair
4. Composite hardware fingerprint
5. Site ID binding
6. Authorized gateway/device binding
7. Backend-side enforcement
8. Central activation/revocation/transfer authority
9. Protected local key storage
10. Audited licensing events

No single hardware identifier or obfuscation mechanism should be treated as sufficient product protection.

## 17. Explicit non-goals and limitations

No client-side software protection can guarantee that copying or reverse engineering is mathematically impossible when an attacker has full administrative/physical control of the customer machine.

The engineering objective is to make unauthorized reuse difficult, cryptographically invalid, detectable and commercially impractical while maintaining reliable monitoring for legitimate customers.

Code obfuscation/minification may be evaluated as an additional IP-protection layer but is not the licensing trust root.

## 18. Implementation work packages to prepare

Before coding, break implementation into controlled work packages covering:

- LIC-01 — Licensing domain/data model
- LIC-02 — Installation identity and protected key storage
- LIC-03 — Hardware fingerprint and tolerance policy
- LIC-04 — License certificate schema and cryptographic signing/verification
- LIC-05 — Activation API and Platform Owner workflow
- LIC-06 — Local runtime license validator
- LIC-07 — Site and gateway/device binding
- LIC-08 — Offline activation and offline/grace behavior
- LIC-09 — Transfer/reactivation/revocation workflows
- LIC-10 — Platform licensing dashboard and audit history
- LIC-11 — Installer integration
- LIC-12 — Anti-tamper/negative/security tests
- LIC-13 — Operational key-management and signing-key backup/recovery procedure

Each package requires tests and documentation before closure.

## 19. Acceptance scenarios

Implementation is not considered complete until automated/manual acceptance testing demonstrates at least:

- Valid installation activates successfully.
- Application-folder copy to another host does not activate.
- Full local database/configuration copy does not create another licensed installation.
- Signed license modification is rejected.
- License for Site A cannot simply authorize Site B.
- Unauthorized gateway/device is rejected where device binding is enabled.
- Temporary Internet outage does not stop permitted local monitoring.
- Legitimate hardware replacement can be transferred through an audited workflow.
- Revoked/retired installation behavior follows defined product policy.
- Platform Owner can trace activation, transfer, entitlement and revocation history.

## 20. Implementation status rule

This document is an **approved architecture and implementation requirement**, not evidence that licensing is currently implemented.

Actual implementation status must be reflected separately in `IMPLEMENTATION_PLAN.md`, `PROJECT_STATE.md`, release documentation and test evidence as work packages are completed.


## 21. Approved device trust and replaceable-host clarification (2026-09-11)

The following clarification is approved for implementation:

- Each ESP32/gateway receives its own unique key pair and client certificate.
- Devices and the platform share a certificate authority trust chain, never a shared private key or reusable certificate.
- MQTT/API device communication uses mutual TLS plus backend registry, Site, license and topic authorization.
- ESP32 production security must evaluate Secure Boot, Flash Encryption, encrypted credential storage and, for the preferred commercial profile, a non-exportable hardware secure element.
- The logical Installation ID survives an approved PC replacement; the Host ID, host key, hardware fingerprint, signed license binding and server TLS certificate are reissued.
- Valid field-device certificates remain unchanged when only the platform PC is replaced.
- Planned and emergency transfer workflows must atomically retire/revoke the old host and audit the change.
- Offline transfer is supported through signed request/response packages and must not depend on editable database flags.
- Monitoring continuity and safety-relevant data collection follow a defined grace/restricted policy; license failure must not destroy customer data.

Detailed requirements and acceptance criteria are authoritative in:

- `docs/security/device-registration.md`
- `docs/security/activation-workflow.md`
