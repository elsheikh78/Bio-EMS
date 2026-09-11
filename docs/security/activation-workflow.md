# BIO-EMS Activation, License Transfer & Host Recovery Workflow

**Status:** Approved security architecture; not yet implementation evidence  
**Decision date:** 2026-09-11

## 1. Principle

BIO-EMS licensing binds commercial entitlement to Customer + Site + logical installation, while the current computer is a replaceable licensed host.

The system must prevent two active hosts from using one installation entitlement, but must support a legitimate computer failure or replacement without changing valid controller identities or losing telemetry history.

## 2. Identities kept separate

- **Customer ID:** commercial owner.
- **Site ID:** licensed physical/operational site.
- **Installation ID:** logical BIO-EMS installation that survives an approved host replacement.
- **Host ID:** identity of the current computer; changes on replacement.
- **Device ID:** identity of each ESP32/gateway; does not change when only the PC changes.
- **License certificate:** signed entitlement connecting the Customer, Site, Installation, current Host and authorized Devices.
- **Server TLS certificate:** identifies the current platform endpoint; replaced/renewed independently from device certificates.

## 3. First activation

1. Installer generates a new host key pair and composite hardware fingerprint.
2. It creates an activation request containing Customer/Site/Installation request, host public key, fingerprint and requested entitlements.
3. Platform Owner verifies the commercial and commissioning record.
4. Licensing authority issues a signed license for the current Host and authorized device set/limits.
5. A server TLS certificate is issued for the installation endpoint.
6. Backend validates the license before enabling protected commercial configuration.
7. Activation is written to append-only audit history.

Private signing keys never enter the installer or customer machine.

## 4. Planned computer replacement

1. System Owner starts `Prepare migration`.
2. Produce an encrypted, integrity-protected migration backup containing operational databases, configuration, audit data and device registry.
3. Do not export central CA or license-signing private keys.
4. Install BIO-EMS on the new PC; it generates a new Host ID, key pair and fingerprint.
5. Create a transfer request referencing the existing Customer, Site and Installation ID.
6. Platform Owner verifies both old and new host identities.
7. Atomically retire the old Host binding and issue the replacement license/server certificate.
8. Restore and validate the backup on the new PC.
9. Keep the same site endpoint name where practical.
10. Controllers reconnect with their existing individual certificates.
11. Complete validation and record transfer evidence.
12. Old host enters `RETIRED` and cannot resume licensed operation.

A short controlled overlap may be used only for migration validation and must be time-limited, explicitly authorized and audited. Both hosts must not collect authoritative production data simultaneously.

## 5. Emergency replacement when old PC is unavailable

1. Customer provides Customer/Site identity and approved support evidence.
2. New PC creates a recovery activation request with new Host ID/key/fingerprint.
3. Platform Owner selects the prior Installation and invokes `Emergency transfer`.
4. Licensing authority revokes/retires the missing old Host.
5. Issue a replacement signed license and server certificate.
6. Restore the latest authenticated backup, if available.
7. Reconcile device registry with the signed license and central record.
8. Controllers retain their certificates and are not factory-reset solely because the PC failed.
9. Record reason, operator, timestamps, affected versions and validation outcome.

## 6. Offline transfer

For a disconnected customer site:

- export a signed activation/transfer request;
- process it using the BIO-EMS owner-side licensing tool;
- return a signed response package;
- import it on the new host;
- use a signed revocation/retirement record for the old host;
- complete central synchronization when connectivity returns.

An offline transfer must not be authorized by editing a database flag.

## 7. Backup requirements

A recoverable installation requires scheduled encrypted backups covering:

- relational configuration and audit database;
- telemetry database/history according to retention policy;
- controller registry and certificate metadata;
- notification/escalation configuration;
- signed license and non-secret trust anchors;
- server endpoint configuration;
- backup schema/version and cryptographic manifest.

Backups must be encrypted and authenticated, tested by restore drills, and protected from ordinary customer-user access.

Device private keys remain on devices. Central CA and license-signing private keys remain outside the customer backup.

## 8. Hardware change tolerance

Minor maintenance, such as one disk or network adapter replacement, should use a documented weighted fingerprint tolerance and audit the change.

A material identity change, motherboard replacement, OS reinstallation outside tolerance, or full-PC replacement requires reactivation/transfer.

Exact fingerprint inputs and scoring must be selected only after Windows hardware tests; MAC address alone is prohibited.

## 9. Failure-safe operating policy

Because BIO-EMS performs environmental monitoring:

- licensing or Internet failure must not abruptly destroy data;
- active alarms and local collection should continue through a defined grace/restricted state where safety requires;
- structural configuration, new device enrollment, entitlement expansion and updates may be restricted;
- warnings must be visible to System Owner and audited;
- exact grace duration and post-grace behavior require an explicit product decision before implementation.

## 10. Acceptance criteria

- copied application/database on a second PC does not activate;
- planned transfer enables the new PC and retires the old one;
- emergency transfer works without the old PC;
- device certificates remain valid after a PC-only replacement;
- old host cannot resume after transfer;
- restored registry cannot add devices beyond signed entitlement;
- corrupted or altered backup is rejected;
- wrong Customer/Site backup is rejected;
- offline transfer cannot create two valid permanent hosts;
- audit history records activation, transfer, emergency recovery and revocation.
