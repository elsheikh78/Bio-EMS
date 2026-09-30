# SYSTEM_OWNER Pilot End-to-End Acceptance — 23 September 2026

## Scope

This record captures the physical BIO-EMS Pilot-host validation of the manufacturer-controlled
`SYSTEM_OWNER` commissioning and MFA entry path completed on 23 September 2026.

This is **Pilot operational evidence**, not BIO EGYPT field commissioning, customer UAT, or
Production security acceptance.

## Result

**PASS — end-to-end SYSTEM_OWNER Pilot entry path verified on the installed Windows Pilot host.**

The following sequence was exercised successfully:

1. Launch customer-side **BIO-EMS System Owner Provisioning**.
2. Create an installation-bound commissioning request.
3. Transfer only the request to the company-side Manufacturer Owner Signer.
4. Issue a short-lived signed activation package using the approved manufacturer signing flow.
5. Import the signed package on the same customer installation.
6. Create the isolated `SYSTEM_OWNER` principal.
7. Open `https://localhost/system-owner/login`.
8. Start MFA enrollment and display the TOTP QR/setup material.
9. Activate MFA with a valid six-digit TOTP.
10. Sign in again with username, password, and current TOTP.
11. Reach `https://localhost/system-owner` and verify the console is signed in as
    `system-owner`.

The System Owner console rendered the current platform-operation modules, including Customer
fleet, Customer ADMIN accounts, Communication channels, Installation configuration,
Licenses & installations, Update entitlements, Maintenance/calibration/support, and
Backup & Restore.

## Physical evidence observed

Before MFA activation, a read-only local database diagnostic confirmed:

- username: `system-owner`;
- status: `active`;
- no account lockout;
- no enabled MFA timestamp;
- no stored MFA secret before enrollment.

After the enrollment flow, a second read-only diagnostic confirmed:

- `mfa_secret_exists = 1`;
- `mfa_enabled_at = 2026-09-23T10:46:20.827Z`;
- the account remained active and not locked.

The final browser session then reached the protected System Owner console successfully.

No password, TOTP code, MFA secret, private signing key, or private-key passphrase is recorded
in this evidence document.

## Defects found and corrected during the exercise

The physical exercise exposed four concrete defects in the installed flow:

### PR #248 — customer Node runtime discovery

The provisioning utility assumed a fixed Node path that did not match the packaged runtime.
The fix recursively discovers the installed `node.exe` and validates provisioning against the
real installed Windows layout.

Merged commit:
`958454f6fd22057b2d6dd48b0515a4f8dec5e74d`

### PR #249 — protected backend environment during owner-package import

The standalone commissioning/recovery import scripts did not reliably load the protected
installed `backend.env` before opening SQLite. The fix loads the protected service environment,
fails closed when the SQLite path is unavailable, and surfaces an actionable import diagnostic
instead of masking every failure.

Merged commit:
`2b23c0d609a613fa55852f412856eda48f179246`

### PR #250 — MFA enrollment-token handoff

The first owner login correctly returned a short-lived MFA enrollment token, but the frontend
attempted to provide it through a raw caller-supplied `Authorization` header. The shared API
client intentionally rejects caller-supplied Authorization headers before `fetch`, so the MFA
enrollment request never reached the backend.

The fix introduced an adapter-controlled short-lived bearer-token path while preserving the
ban on arbitrary caller-supplied Authorization headers.

Merged commit:
`d5ba8cb9074989ff7feeefd7644344f38414676f`

### PR #251 — resume pending MFA enrollment

If the five-minute MFA enrollment token expired after the encrypted MFA secret had already been
stored, a new login could receive a fresh enrollment token but enrollment could not resume.

The fix resumes the same pending encrypted secret until MFA is enabled, without replacing the
secret and while continuing to block enrollment replay after activation.

Merged commit:
`6d2b25ef35f48d5a87df0f2073e46cddd6deca48`

## Automated evidence supporting the final fix

For PR #251 head `9b97b7c21f03770ab28861d4335acd3ae9530c9c`:

- CI run ID `35855353673`: Backend and Frontend quality gates passed.
- Internal Windows Setup run ID `35855353686`: signed Pilot Setup build, install and health
  workflow passed.
- Resulting customer Setup artifact digest:
  `sha256:4680f50dd69d1a97e51ddcc45452038e2efe5b83f5c61fbcd08126946477b497`.

## Security observations

- The manufacturer private key remains outside the customer machine, repository, CI and Setup.
- Customer ADMIN remains separate from `SYSTEM_OWNER`.
- MFA is required before a full System Owner session is issued.
- Failed-login lockout and rate-limit controls remain part of the owner authentication path.
- Any MFA setup secret displayed or captured during Pilot troubleshooting must not be treated as
  Production enrollment evidence. Production enrollment must use controlled, non-exposed setup
  material.

## What this closes

This evidence closes the immediate Pilot-host verification item for:

- SYSTEM_OWNER entry route;
- manufacturer-controlled commissioning request/sign/import flow;
- owner creation;
- MFA enrollment;
- MFA activation;
- MFA-protected login;
- protected System Owner console entry.

## What remains open

This record does **not** close:

- COM-07 live provider/hardware acceptance;
- second-machine/multi-machine Windows qualification;
- hardware bench qualification;
- BIO EGYPT physical installation, calibration, field commissioning or customer UAT;
- final Production key ceremony/security review;
- final Device Trust/commercial anti-copy protection;
- Production signing/publication.

BIO EGYPT therefore remains **NOT COMMISSIONED / NOT ACCEPTED**.
