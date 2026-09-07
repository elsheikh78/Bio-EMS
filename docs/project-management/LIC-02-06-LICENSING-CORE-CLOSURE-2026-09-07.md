# LIC-02 through LIC-06 — Licensing Core Evidence

**Status:** Implemented and locally verified; PR/CI/merge evidence pending

## Delivered scope

### LIC-02 — Installation identity and protected key storage

- Creates a unique Installation ID and Ed25519 installation key pair.
- Stores only an encrypted private-key envelope with owner-only filesystem permissions.
- Uses Windows DPAPI CurrentUser protection on Windows.
- Requires an external 256-bit `BIOEMS_INSTALLATION_IDENTITY_KEK` outside Windows; there is no plaintext fallback.
- Prevents silent identity overwrite by using create-only persistence.

### LIC-03 — Hardware fingerprint and tolerance

- Hashes individual machine, system, board, disk and network signals before persistence.
- Requires at least three stable signals.
- Uses weighted comparison with a 70% acceptance threshold: replacement of a disk or network adapter is tolerated, while material host replacement fails binding.

### LIC-04 — Signed license certificate

- Defines strict schema-versioned claims for Customer, Site, Installation, hardware, lifecycle, modules, limits, update entitlement and offline grace.
- Signs canonical claims using Ed25519.
- Customer/runtime verification requires only the public key.
- Any local claim modification invalidates the signature.
- Central signing private key is read only from `BIOEMS_LICENSE_SIGNING_PRIVATE_KEY_PEM`; it is not stored in customer records or source configuration.

### LIC-05 — Activation API and Platform Owner workflow

- Adds authenticated SYSTEM_OWNER endpoints to record activation requests and approve them.
- Atomically binds Customer, Site, Installation identity, fingerprint, certificate and normalized entitlements.
- Stores immutable signed certificates and append-only activation/license events.
- Adds migration 023 for identity, activation-request and certificate evidence.

Endpoints:

- `POST /api/v1/platform-operations/licensing/activation-requests`
- `POST /api/v1/platform-operations/licensing/activation-requests/:requestId/approve`

The central signing service requires both `BIOEMS_LICENSE_SIGNING_KEY_ID` and `BIOEMS_LICENSE_SIGNING_PRIVATE_KEY_PEM`. Missing signing configuration fails closed.

### LIC-06 — Local runtime validator

- Verifies signature, active state, validity dates, Installation ID, Site ID and tolerant hardware binding locally.
- Invalid licenses return an explicit restricted decision.
- Every restricted decision carries `monitoringContinuity: true`; this layer does not stop telemetry collection, Alarm evaluation or local history because Internet or licensing validation is unavailable.

## Explicit boundaries

LIC-07 device/gateway binding, LIC-08 periodic validation/grace lifecycle, LIC-09 transfer/revocation, LIC-10 dashboard, installer integration and security qualification remain separate work.

No production-readiness, installer qualification, field commissioning or customer acceptance is claimed.

## Local verification

- Backend typecheck: passed
- Backend lint: passed
- Backend formatting: passed
- Backend full regression: 110 files / 765 tests passed
- Backend build: passed

PR, CI and merge evidence remain required before LIC-02 through LIC-06 are declared complete.
