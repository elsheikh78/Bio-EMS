# DEP-01 Windows Installer Foundation

**Status:** Foundation implemented; runtime freeze and Setup build not yet complete  
**Target baseline:** Windows 11 Pro x64  
**Installer technology:** Inno Setup 6, single offline Setup executable

## Frozen foundation

The Production Setup uses separate application and persistent roots:

- `C:\Program Files\BIO-EMS` — immutable application/runtime payload.
- `C:\ProgramData\BIO-EMS` — configuration, installation identity, SQLite, InfluxDB,
  MQTT state, logs, backups and retained customer evidence.

The controlled service set is `BIOEMS-Backend`, `BIOEMS-MQTT` and
`BIOEMS-InfluxDB`. Only the customer HTTPS entry point may be publicly exposed. Ports
3001, 8086 and 8883 are internal/local or explicitly scoped to approved controllers;
the installer must not create broad public firewall exposure.

The selected package inventory is exactly:

1. built BIO-EMS backend;
2. built BIO-EMS frontend;
3. approved Node.js x64 runtime;
4. approved Mosquitto x64 runtime;
5. approved InfluxDB OSS x64 runtime;
6. approved WinSW x64 service wrapper.

Every input requires an exact version, SHA-256 checksum and retained redistribution
evidence in `package-manifest.json`. `npm run validate:windows-installer` fails closed
for incomplete inventory, unsafe paths, missing files or checksum mismatch. It also
rejects `.env`, installation identity, activation receipt, license certificate and
private signing-key payloads.

The machine-readable baseline is `installer/windows/package-contract.json`. The
LIC-11 provisioning hook remains mandatory after the final service identity and ACLs
exist and before activation.

## Still open before a Setup executable exists

- select and verify exact redistributable versions and vendor license evidence;
- create the deterministic staging builder and Inno Setup source;
- implement protected configuration and service registration;
- implement health, Repair, Upgrade, backup/rollback and retained-data Uninstall;
- sign the executable and publish checksums; and
- execute the complete clean-machine Windows qualification matrix.

This foundation is not a customer installer and does not change the DEP-01 acceptance
boundary.

