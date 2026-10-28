# License Signing-Key Operations, Backup and Recovery

**Work package:** LIC-13  
**Classification:** restricted operational procedure

## Trust model

License certificates use Ed25519. Signing private keys belong only to an isolated
offline signing authority or approved HSM/secret-management service. They must never
be committed to source control, copied into a customer installer, stored in a customer
database, written to support logs or transferred to a customer host. Runtime systems
receive only an approved public-key trust bundle identified by immutable Key IDs.

## Roles and custody

- A Security Custodian controls encrypted key media or the HSM/secret-manager policy.
- A Release Approver authorizes creation, activation, rotation, recovery and retirement.
- No one person may both retrieve a production private key and approve its use.
- Every signing, rotation, restore test and emergency action must create append-only
  evidence containing actor identities, Key ID, purpose, time and certificate/license
  identifiers, but never private key material.

## Generation and activation

1. Use an isolated, patched workstation with networking disabled, encrypted storage
   mounted and terminal recording/log export disabled.
2. Choose a new non-reused Key ID such as `production-2026-01`.
3. Set `BIOEMS_SIGNING_KEY_OUTPUT_DIRECTORY` and `BIOEMS_SIGNING_KEY_ID`, then run
   `npm run licensing:generate-signing-key`.
4. Verify file permissions, record SHA-256 fingerprints of the public key and manifest,
   and compare them independently under two-person control.
5. Import the private key into the approved signing boundary. Securely remove any
   temporary plaintext export according to the organization media-destruction policy.
6. Add only the public key and Key ID to the runtime trust bundle. Deploy and verify the
   trust bundle before issuing any certificate with the new key.

The generator refuses overwrite and does not print private material. Its filesystem
output is a transport format for controlled import, not permission to retain plaintext
production keys on a normal development computer.

## Rotation and retirement

Normal rotation uses an overlap window: deploy the new public key, start signing with
the new Key ID, retain the prior public key while any valid certificate references it,
then retire signing access to the prior private key. Removing a public key before all
dependent certificates are replaced would incorrectly restrict legitimate sites.
Key IDs are never reused, even after retirement.

## Backup

Maintain at least two encrypted, integrity-checked backups in separate controlled
locations. Use independent media or HSM-backed export controls, two-person access and
documented inventory. Each backup record includes Key ID, algorithm, creation date,
public-key fingerprint, backup format/version, custody locations and last restore-test
date. Never back up an unencrypted private key or its decryption material beside it.

## Recovery drill

At least quarterly and before retiring the only active key, restore a backup into an
isolated non-production signing boundary. Sign a synthetic certificate, verify it with
the recorded public key, compare fingerprints, destroy restored working material and
record the result. A drill does not sign or alter a customer license.

## Suspected compromise

1. Stop signing with the affected key and preserve forensic evidence.
2. Open a security incident and identify every certificate and audit event referencing
   its Key ID.
3. Generate a replacement key under two-person control and distribute its public key.
4. Reissue legitimate licenses through the audited activation workflow.
5. Revoke trust in the compromised key only through a controlled runtime release,
   accounting for offline sites and monitoring-continuity policy.
6. Record decisions, affected scope, customer coordination and final key destruction.

Loss of a key without suspected disclosure follows recovery from a verified backup.
If no verified backup exists, create a new key and reissue certificates; never invent
or reuse key material. Monitoring continuity remains explicit: trust changes may
restrict commercial functions but must not silently stop local telemetry, Alarms or
history collection.

