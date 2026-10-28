# Main TLS Endpoint Identity — Open Work Package

28 October 2026. Audit A05 remains OPEN; no physical certificate replacement, firmware update or production device trust is approved as completed by this document.

## Observed source gap

Main main.c pairing and sample HTTPS clients set skip_cert_common_name_check=true while providing provisioned certificate trust. Windows Install-DEP0103Services.ps1 currently generates DNS names localhost and COMPUTERNAME. Device provisioning accepts a configured HTTPS platform URL and copies the DER certificate without an X509 SAN/hostname preflight. A LAN-IP URL therefore may not match the installed certificate. This explains why deleting the exception alone can break the pilot path.

## Required implementation and acceptance

1. Define the controlled stable DNS name or LAN IP for each installation and its certificate SAN requirements. Certificate identity is distinct from system-owner/manufacturer keys.
2. Add certificate/URL identity preflight to provisioning before flash/bind/credential transfer. Verify chain/trust, validity and exact DNS/IP identity; errors must identify a mismatch without exposing credentials.
3. Add a governed Windows certificate issuance/renewal/restore path supporting that identity, preserving private-key ACLs, backend service configuration and verified public certificate export. Never silently replace a live site's TLS identity or infer DHCP stability.
4. Remove both firmware name-check exceptions only with the matching provisioning/certificate path, build the governed image and document the required coordinated rollout.
5. Negative tests must reject wrong SAN/name/IP, expired/untrusted/replaced certificates on pairing and live/replay requests. Verify correct DNS/IP endpoints, trusted UTC bootstrap, stored history retention on rejection, outage recovery and certificate renewal on the actual Windows/Main hardware path.

Existing installed controllers and site certificates were not inspected. Source tests/CI cannot establish LAN resolution, correct installed SANs or physical continuity. Final device PKI/mTLS, Secure Boot/Flash Encryption and key lifecycle remain their existing approved production track; do not burn eFuses or change field credentials as part of this documentation work.
