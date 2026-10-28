# Security, Identity and Known Gaps

Reviewed candidate `d151b1f`, 28 October 2026. This is observed implementation and operational guidance, not a penetration-test certificate. [Audit findings](../audit/2026-10-28/FINDINGS.md) remain open until verified fixes close them.

## Authentication boundaries

Main at `c8d4e4f` retains the audit A02/A03 gaps. The `fix/customer-auth-audit` candidate binds customer HS256 signing keys to the current stored credential using a domain-separated HMAC; current credentials are read via UserRepository. Password replacement invalidates old tokens immediately, including direct offline recovery updates. Current middleware still reloads active user/role and enforces forced password change. Missing/inactive principals fail closed. Initial deployment invalidates all legacy customer tokens and requires re-login; deploy backend and frontend together. Own password change returns a replacement session that the updated frontend validates/stores with a new expiry. No password hash/derived key is exposed in claims.

The candidate admits ten login attempts per client IP per minute then429/Retry-After, independently from owner login. The shared bounded limiter refuses new clients at saturation rather than evicting live buckets. Limits are per process, reset on restart and are not a distributed defense. Express proxy trust is authoritative; raw forwarded headers are ignored. See [design/rollout](../security/CUSTOMER-AUTH-AUDIT-REMEDIATION.md) and [ADR-024](../adr/ADR-024-customer-access-token-credential-binding.md) for restore/re-enable limitations and exact desired regressions. Source fixes are not deployed acceptance.

Platform owner JWT purpose/session claims, active owner record and database session check are separate from customer tokens. Owner commissioning/recovery, manufacturer trust and MFA must remain isolated; support grants have their own narrow scope. A customer ADMIN token cannot be treated as owner authorization.

Merged-main company cloud uses a shared admin key and stateless HMAC cookie; logout expires the browser's cookie without invalidating a copied signed cookie. A copied cookie may remain usable until its fixed expiry; rotating the session secret affects all such sessions and needs controlled rollout. Customer Viewer sessions are D1-backed and revoked on password reset/disable; native Viewer bearer purpose is separately enforced.

## Secrets and signing

Never commit real environment credentials, runtime databases, private signing keys, recovery packages or deployment tokens. Public trust files and example config are not private keys. Manufacturer signing stays in manufacturer tools; customer installation receives only public trust/verification material. Release/update signing, manufacturer recovery signing, cloud sessions and controller identity are distinct trust domains; do not reuse keys.

Package hashes support corruption detection and source traceability. They do not prove commercial publisher trust if an attacker can replace both a file and its manifest. Pilot development signing is not production public certificate trust.

## Transport, isolation and device trust

Production config validation requires controlled HTTPS/TLS endpoints, exact CORS origins, credentialed MQTT with stable identity and absolute persistent paths. Backend Helmet/CORS applies to its response surface; inspect the deployed frontend/reverse-proxy headers as a separate boundary. Cloud responses apply CSP/no-store/frame/content controls. Merged baseline Main pilot pairing and sample HTTPS clients set `skip_cert_common_name_check=true` while supplying a provisioned certificate; the later pilot.8 candidate requires name validation and certificate SAN preflight. This skips endpoint name checking; it is not evidence that all certificate validation is disabled. Exposure depends on the installed certificate/trust scope. Remove the pilot exception with controlled hostname/certificate provisioning before production (audit A05). No live TLS configuration or deployed secret rotation was tested here.

Device pairing binds hardware UID/device/installation and rate-limits short-lived claims, but the pilot implementation does not supply the full approved per-device PKI/mTLS, secure hardware key storage, Secure Boot, Flash Encryption, signed-device firmware and revocation/clone protections. Those remain explicit production gaps, not controls demonstrated by pairing success.

Site/customer scoping, device binding, replay timestamps, schema bounds and authenticated archive access are critical regression areas. Tests exist across these domains; this audit does not establish complete attack-path or code coverage. No broad fuzzing, external penetration test, live host ACL review or physical fault injection was performed.

## Dependency response

The [dependency report](../audit/2026-10-28/DEPENDENCIES.md) preserves registry advisory evidence and distinguishes runtime from development. Critical/High entries require triage of installed versions, code reachability, deployment configuration and patched versions. Avoid automatic major-version upgrades without compatibility review; add desired regression tests, rerun component and packaging gates, and record the exact fixed tree. The original documentation audit changed no runtime behavior. The separate customer-auth remediation candidate changes token/login behavior and updates backend/frontend runtime dependency locks; its production npm scans report zero entries. Remaining development/tooling and other-component advisories are still open. See the remediation guide and its new evidence without altering the original audit snapshot.

Incident response must preserve logs/evidence and separate account containment, token/session invalidation, secret rotation, host/network containment and recovery. Disabling a compromised customer user blocks middleware access immediately; operational impact and re-enable/session behavior require controlled review. Password change by itself is currently insufficient session containment.

## Security phase-two candidate

The pending security candidate replaces stateless-only company authorization with a hashed D1 company_sessions record, current access-key fingerprint, signature and expiry validation. Logout deletes the current row; copied-cookie replay fails on subsequent authorization. Additive migration0003 must precede Worker deployment and legacy sessions require re-login. Backend/frontend/cloud full dependency scans, including test tools, report zero affected entries in the candidate. This is not a mobile/vendor/whole-product security certificate. See the [phase-two guide](../security/COMPANY-SESSIONS-AND-TEST-TOOLING-REMEDIATION.md) and [TLS work package](../security/MAIN-TLS-ENDPOINT-IDENTITY-WORK-PACKAGE.md). Main source exceptions are removed in the pilot.8 candidate; installed-site acceptance and final device trust remain open. See [current device/mobile status](../security/DEVICE-PROTECTION-AND-MOBILE-STATUS.md).
