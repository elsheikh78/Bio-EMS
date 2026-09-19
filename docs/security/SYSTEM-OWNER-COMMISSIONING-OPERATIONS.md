# System Owner Commissioning Security Operations

Status: required production control for SEC-OWNER-01  
Audience: BIO-EMS manufacturer security and release personnel only

Arabic operator references:

- `SYSTEM-OWNER-MANUFACTURER-KEY-GUIDE-AR.md` — exact offline key ceremony and public
  keyring creation steps.
- `SEC-OWNER-01-STATUS-AND-MERGE-CHECKLIST-AR.md` — current evidence, owner actions,
  remaining Production acceptance work, and the final merge gate.

## Security boundary

The customer Setup creates only the customer ADMIN. It does not create, display, reset,
disable, delete, or disclose SYSTEM_OWNER credentials.

SYSTEM_OWNER commissioning uses an installation request created on the customer host and
a short-lived Ed25519-signed response created by the manufacturer offline. The private
signing key must never enter GitHub, CI logs, a Setup artifact, a customer host, a support
laptop, email, chat, or a ticket attachment.

The current BIO EGYPT artifact is an internal Pilot build. It must not be represented as a
production-secure owner commissioning build until an approved manufacturer public-key
keyring is embedded by the controlled Production build and installed as
`manufacturer-owner-trust.json` beside the protected installation identity.

## Key custody

1. Generate the Ed25519 key on an offline, encrypted manufacturer-controlled workstation
   or hardware security device.
2. Assign an immutable Key ID such as `owner-primary-2026`.
3. Keep the private key encrypted at rest under two-person control.
4. Maintain two encrypted backups in separate controlled locations.
5. Record the public-key SHA-256 fingerprint, Key ID, creation date, custodians, backup
   locations, and most recent restore-test date.
6. Export only the public key into the Production trust keyring.
7. Never reuse the owner commissioning key for code signing, TLS, licensing, devices, or
   any customer-specific purpose.

## Production trust keyring

The protected file has this structure:

```json
{
  "schemaVersion": 1,
  "keys": [
    {
      "keyId": "owner-primary-2026",
      "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
      "status": "active"
    }
  ]
}
```

The Production build must fail if the keyring is missing or invalid. Each Key ID must be
unique. Only Ed25519 public keys are accepted. The import command selects the key by the
signed package's Key ID and rejects unknown or revoked entries. Runtime users cannot
select an alternative public-key path.

## Commissioning procedure

1. Install BIO-EMS and let the host create its installation identity.
2. Create the owner commissioning request on that host. The request contains no private
   manufacturer material.
3. Transfer the request through the approved company channel and verify the customer,
   site, installation ID, requester, and ticket.
4. On the offline signing station, issue a package with the minimum practical lifetime;
   the default operational target is 15 minutes.
5. Transfer only the signed package to the customer host.
6. Import the package. Reject and investigate any wrong-installation, expired, replayed,
   altered, unknown-key, or revoked-key result.
7. Enroll MFA immediately. Before MFA activation, the password produces only a five-minute
   enrollment token and cannot open the owner console.
8. Confirm that `SYSTEM_OWNER_COMMISSIONED`, MFA enrollment, and subsequent login events
   exist in the redacted audit log.
9. Delete transient request and response transfer copies according to the ticket retention
   policy. Never record the password, TOTP secret, code, or token in the ticket.

## Rotation

1. Generate a new offline Ed25519 key and assign a new immutable Key ID.
2. Add its public key to the Production keyring as `active`.
3. Release and verify a signed Setup/update containing both old and new active public keys.
4. Begin signing new packages with the new private key.
5. After the approved overlap window, mark the old key `revoked` and release the updated
   keyring.
6. Preserve audit evidence and public fingerprints. Destroy retired working private-key
   copies under two-person control; retain only the approved encrypted archive if policy
   requires it.

## Suspected compromise and revocation

1. Stop commissioning immediately and isolate the signing station.
2. Preserve forensic evidence and identify every package issued with the affected Key ID.
3. Mark the affected public key `revoked` in the keyring.
4. Generate a replacement key under two-person control.
5. Release a signed emergency update containing the revoked status and replacement public
   key before resuming commissioning.
6. Revoke active owner sessions and temporary support grants on affected installations.
7. Reset the affected owner credential, re-enroll MFA, and review audit events.
8. Do not remove the incident record or reuse the compromised Key ID.

## Backup recovery test

At least twice per year:

1. Restore one encrypted private-key backup on an isolated offline workstation.
2. Verify its public fingerprint against the custody register.
3. Sign a non-production test request and verify it with the recorded public key.
4. Record the test participants, result, and timestamp.
5. Securely destroy the restored working copy.

## Customer host replacement

A replacement computer is a new installation trust identity.

1. Revoke all owner sessions and support grants on the old host.
2. Preserve the customer operational backup and required audit evidence.
3. Do not copy `installation-identity.json`, commissioning receipts, active sessions,
   MFA encryption keys, or the SYSTEM_OWNER database record to the replacement host.
4. Install the current signed Production Setup on the replacement host and generate a new
   installation identity.
5. Restore only the approved customer operational data through the controlled migration
   procedure.
6. Create a new commissioning request bound to the new installation ID.
7. Validate customer, site, replacement approval, and old-host disposition before signing.
8. Import the new short-lived package, enroll MFA, and verify the audit trail.
9. Revoke or retire the old installation and licensing identity. A package for the old
   installation must never be accepted by the replacement.

## Temporary support

Never share the permanent owner password. The owner issues a scoped support token with a
reason, site, and expiry of no more than eight hours. The token is purpose-bound and
cannot act as an owner access token or MFA enrollment token. Every request checks the live
grant record; expiry or revocation invalidates it immediately. Issuance and revocation are
audited without storing the token.

## Release acceptance

Production approval requires all of the following:

- approved public keyring embedded and installed in the protected licensing directory;
- private key absent from source, artifact, host, logs, and support material;
- clean Windows install and health check;
- wrong key, revoked key, tamper, replay, expiry, and wrong-installation rejection tests;
- MFA, lockout, revocable session, support-grant, negative authorization, and audit
  redaction tests;
- recorded key fingerprint and successful backup restore test;
- security review sign-off and artifact checksum/signature evidence.
