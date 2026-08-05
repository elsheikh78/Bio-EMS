# ADR-010

## Title

Device Onboarding Workflow

## Status

Accepted

## Date

2026-07-22

## Context

BIO-EMS must provide a secure and user-friendly process for introducing new devices into the system.

## Implementation Status

**Not implemented.** The current backend can create Device records with `status` and
`activated` fields, but it has no Discovery flow, Pending Devices list, QR processing,
Activation Code verification, approval endpoint, or Asset assignment layer.

## Decision

This ADR defines an intended four-phase device onboarding workflow. It does not
describe a current implemented workflow.

### 1. Discovery

The device announces itself.

The device appears in the Pending Devices list.

Operational telemetry is rejected.

### 2. QR Identification

The installer scans the device QR Code.

The QR Code contains:

- Device ID
- Serial Number
- Activation Code

### 3. Activation

BIO-EMS verifies the Activation Code.

Only devices with a valid Activation Code may continue.

### 4. Approval

An authorized user assigns:

- Site
- Asset

The device becomes Active.

Only Active devices may publish operational telemetry.

## Decision Drivers

- Device introduction should be traceable in regulated environments.
- A future onboarding flow should separate identification, activation, and approval.
- Operational telemetry should remain distinct from unverified device discovery.

## Consequences

- No manual typing of device identifiers.
- Unauthorized devices cannot become active.
- Fast installation.
- Better security.
- Better user experience.

## Alternatives Considered

### Direct Device Creation Through the Current REST API

This is the current implementation. A Device can be created through the Device API,
but the API does not implement the four onboarding phases.

### Fully Automated Device Enrollment

Not adopted because current telemetry rejects unknown devices and no automatic
registration workflow is implemented.

## References

- `backend/src/routes/device.route.ts` — current Device creation and listing routes.
- `backend/src/repositories/device.repository.ts` — Device status and activation fields.
- `backend/src/modules/telemetry/services/telemetry.service.ts` — current telemetry acceptance path.
- `docs/security/device-registration.md` — related registration documentation.
- `docs/security/activation-workflow.md` — related activation documentation.
