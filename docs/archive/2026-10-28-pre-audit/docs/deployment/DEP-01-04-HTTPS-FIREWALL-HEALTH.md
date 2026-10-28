# DEP-01-04 HTTPS, Firewall and Post-Install Health

**Status:** Complete / merged / CI verified through PR #180 and CI #618
**Target:** Windows 11 Pro x64 fresh installation

## Delivered

- The Backend supports an installer-generated PFX and serves the API plus built
  frontend through one HTTPS endpoint on port 443.
- Setup creates a 3072-bit RSA/SHA-256 certificate for `localhost` and the machine
  name, trusts its public certificate locally, and restricts the PFX and passphrase
  to the protected Backend configuration ACL.
- Exactly one inbound BIO-EMS Firewall rule allows TCP 443 from `LocalSubnet` on
  Domain and Private profiles. MQTT 1883 and InfluxDB 8086 remain loopback-only and
  no BIO-EMS rule exposes 3001 or 8883.
- `Test-PostInstallHealth.ps1` verifies all three services, Backend HTTPS, InfluxDB,
  MQTT loopback reachability, frontend payload, LIC-11 identity/receipt and the
  expected Firewall rule.
- The health result is written without credentials to
  `C:\ProgramData\BIO-EMS\logs\post-install-health.json`; a failed check returns a
  non-zero Setup result.

## Boundary

The certificate is a machine-local trust bootstrap, not a customer PKI certificate.
Remote access by a DNS name or IP not present in the certificate requires a later
controlled certificate workflow. Repository tests validate source contracts only;
they do not prove Windows certificate-store operations, Firewall enforcement,
service reboot persistence or clean-machine installation.

DEP-01-05 owns Repair/Upgrade/rollback/retained-data Uninstall behavior. Executable
signing and the clean-machine qualification matrix remain later gates.
