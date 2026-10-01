# Licensing & Update Entitlements UI Closure — 2026-09-28

## Scope

This package closes the SYSTEM_OWNER presentation and mutation gaps between the existing commercial-operations records and the existing Site-bound licensing core without merging their lifecycles.

## Implemented

- Commercial license records expose explicit `ACTIVE / SUSPENDED / EXPIRED / REVOKED` status editing.
- Expiry is explicit and nullable.
- Update entitlement is selected explicitly from `NONE / FREE / PAID`; the previous implicit toggle is removed.
- Every commercial license mutation continues to append `platform_commercial_events` with server-derived SYSTEM_OWNER provenance.
- Site-bound licensing overview now exposes activation-request evidence and immutable signed-certificate metadata.
- The System Owner UI displays activation status, Ed25519 key ID, certificate SHA-256 evidence and recent licensing audit events.
- The UI explicitly separates commercial entitlement records from signed Site-bound licenses.

## Security boundary

Commercial-record mutation does not rewrite a signed Site-bound certificate. A changed signed entitlement requires controlled re-issuance through the licensing activation/signing workflow.

The customer-host System Owner screen never receives the central private signing key. Activation approval/signing remains manufacturer-controlled. The customer-host UI is evidence-only for signed-license activation state.

P8 Installation/Device Provisioning and Licensing Installation remain distinct lifecycles by design. Creating or validating a P8 installation does not itself create a licensing installation, signed license, or authorized-device record.

## Physical boundary

This package does not claim hardware binding, ESP32 qualification, field commissioning, customer acceptance, remote OTA execution, billing settlement or production licensing acceptance. Those require their respective controlled evidence gates.
