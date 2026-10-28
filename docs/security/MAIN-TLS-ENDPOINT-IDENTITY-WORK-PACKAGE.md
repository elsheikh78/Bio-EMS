# Main TLS endpoint identity — implementation and rollout

28 October 2026. Source candidate: Main `0.1.0-pilot.8`, Hardware Tester `0.6.1`. A05 has a source remediation; deployed and physical acceptance remains OPEN.

## Implemented contract

Both Main HTTPS clients require certificate name checking. Pairing and live/replay refuse non-HTTPS origins. Provisioning validates the installed DER certificate before flash/bind and again before serial credential transfer: exact DNS or IP SAN (no CN fallback/wildcards), current validity, self-signature, non-CA server-auth leaf and the 2500-byte controller bound. This deliberately supports the existing controlled self-signed installation trust model, not arbitrary public CA chains. The existing serial UTC bootstrap runs before pairing; Windows time must be correct.

Fresh Windows installation creates DNS SANs for localhost/computer name and IP SANs for loopback/current preferred LAN IPv4 addresses. This is an issuance snapshot: changing DHCP addresses does not update the certificate. Use a controlled stable address or resolvable DNS identity. The authenticated local provisioner exposes `/validate-tls`; no private key or pairing credential is returned.

## Existing Windows installation

1. Record the installation's controlled HTTPS origin, current public certificate fingerprint, backend service configuration and ACLs. Preserve a protected backup of its current PFX and matching configuration; never commit these files.
2. Validate that exact origin against the current public DER certificate. A verified DNS name already in its SAN may avoid certificate replacement, provided Main can resolve it on the actual network. The provisioner refuses a mismatch before flash.
3. If replacement is necessary, use `installer/windows/New-PlatformTlsCertificate.ps1` with explicit DNS/IP SANs, a SecureString password and new paths in existing protected directories. It prepares a candidate PFX/DER and refuses overwrite; it does not activate, trust or replace the live identity. Example addresses in tests are not installation addresses.
4. In a controlled maintenance window, stop the backend service, back up and replace the configured PFX/public DER together, preserve service-account read-only private-key ACLs and the existing secret configuration, update the Windows trust/public export as required by the installation, then restart. Verify the served fingerprint, validity and exact SAN over the real endpoint before provisioning a controller. Do not replace manufacturer/license trust keys.
5. Install the matched provisioner/backend and governed pilot.8 firmware. Re-provision Main's public certificate for any changed identity. Existing paired controllers retain NVS when flashed normally; old pinned certificates need coordinated replacement. Retain the previous certificate/firmware/configuration for controlled rollback. Rollback to older firmware restores its known name-check exception and is not production approval.

This source change does not perform steps on a user's existing PC or controller. Never rotate a live certificate merely by running the candidate preparation utility.

## Acceptance evidence

Local X509 tests cover exact DNS/IPv4/IPv6, wrong identity, protocol/path/credentials, expired/future certificates, CN-only and malformed input. Runner regression proves a mismatch invokes no serial executor. A Windows CI test generates a native SAN certificate, validates DNS/IP through Node X509, rejects overwrite and SAN injection, and cleans up its temporary key. Native ESP-IDF build and host TLS-policy tests are separate gates.

Still required on Windows/Main: matching actual SAN/resolution, wrong/expired/replaced certificate rejection on pairing and live/replay, cold-boot UTC, queued-history retention during rejection/outage, renewal and recovery. Full per-device PKI/mTLS, revocation and private-key lifecycle are not provided by endpoint validation.
