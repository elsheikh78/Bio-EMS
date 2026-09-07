# LIC-11 through LIC-13 — Production Protection Evidence

**Status:** Implemented and locally verified; PR/CI/merge evidence pending

## Delivered scope

- **LIC-11:** create-only first-install provisioning produces a unique unactivated
  Ed25519 installation identity, DPAPI-protected on Windows, plus a secret-free receipt.
  A machine-readable DEP-01 contract prohibits reusable/preactivated identities and
  requires execution under the final Windows service identity.
- **LIC-12:** automated negative qualification covers copied protected identity,
  modified claims, modified signature, untrusted signing key, wrong Installation/Site,
  materially different host, suspended/revoked/not-started/expired states, finite
  offline grace, cross-Site device/transfer rejection and append-only audit evidence.
  Every runtime rejection preserves the defined monitoring-continuity decision.
- **LIC-13:** an overwrite-safe Ed25519 key generator, secret-safe command behavior and
  controlled generation, custody, rotation, encrypted backup, restore-drill,
  compromise and trust-bundle procedures.

## Commands

- `npm run licensing:provision-installation`
- `npm run licensing:generate-signing-key`

Both require explicit environment configuration. Production signing private material
must remain in an isolated signing authority or approved HSM/secret manager.

## Local evidence

- Targeted LIC-11 through LIC-13 suite: 1 file / 12 tests passed
- Backend typecheck/build/lint/format: passed
- Backend: 112 test files / 781 tests passed
- Frontend typecheck/build/lint/format: passed
- Frontend: 51 test files / 292 tests passed
- Automated total: 163 files / 1,073 tests passed

## Boundary

This package closes the licensing source implementation and automated repository
qualification only after PR/CI/merge evidence is added. It does not create or qualify
the final DEP-01 offline Windows installer. Clean-machine install, reboot, Repair,
Upgrade, rollback, Uninstall, ACL/service-identity and package-signing checks remain
DEP-01 evidence gates. Production deployment, physical hardware, provider delivery,
field Commissioning, UAT and customer acceptance also remain separate.
