# LIC-07 through LIC-10 — Licensing Governance Evidence

**Status:** Complete / merged / CI verified

## Delivered scope

- **LIC-07:** a license may authorize only Devices belonging to its bound Site. Device identities are unique per license, lifecycle-controlled and audited.
- **LIC-08:** periodic validation evidence records `VALID`, `OFFLINE_GRACE` or `RESTRICTED`. Grace is calculated from the last successful validation and is finite; restriction continues to preserve local telemetry, Alarm and history continuity.
- **LIC-09:** suspend/reactivate/expire/revoke transitions use the controlled lifecycle. Revocation also revokes the installation. Transfer is allowed only to a new installation for the same Customer and Site; the old signed license becomes `SUPERSEDED` and cannot be copied to the replacement host. A new certificate must be issued through activation.
- **LIC-10:** the authenticated SYSTEM_OWNER operations response now includes licensing installations, signed-license lifecycle, authorized Devices and recent append-only events. The bilingual license screen presents governance totals and recent audit evidence.

## Persistence and API

Migration 024 creates authorized-device bindings, periodic validation evidence and immutable transfer history.

Authenticated SYSTEM_OWNER endpoints:

- `POST /api/v1/platform-operations/licensing/licenses/:licenseId/devices`
- `POST /api/v1/platform-operations/licensing/licenses/:licenseId/validations`
- `PATCH /api/v1/platform-operations/licensing/licenses/:licenseId/status`
- `POST /api/v1/platform-operations/licensing/licenses/:licenseId/transfer`

## Local evidence

- Backend typecheck/build/lint/format: passed
- Backend: 111 test files / 769 tests passed
- Frontend typecheck/build/lint/format: passed
- Frontend: 51 test files / 292 tests passed
- Automated total: 162 files / 1,061 tests passed

## Boundary

LIC-11 installer integration, LIC-12 negative/security qualification and LIC-13 operational signing-key management remain open. The Production Installer and commercial production readiness remain prohibited until those gates pass.

## Integration evidence

- PR: #175
- CI: #603 — passed
- Merge: `39bb230bbef7217a81073d9d8d39933ea46c3ada`

LIC-07 through LIC-10 are complete. LIC-11 — installer integration — is the controlled next package.
