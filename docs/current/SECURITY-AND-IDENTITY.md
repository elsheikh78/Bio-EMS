# Security, Identity and Known Gaps

Reviewed candidate `d151b1f`, 28 October 2026. This is observed implementation and operational guidance, not a penetration-test certificate. [Audit findings](../audit/2026-10-28/FINDINGS.md) remain open until verified fixes close them.

## Authentication boundaries

Customer JWTs use HS256 with explicit issuer/audience/expiry/subject and ≥32-byte secret. Middleware requires a single Authorization header, verifies the token and reloads the active user/role; disabled/deleted users are rejected and forced-password-change users are restricted. **Credential replacement alone does not invalidate an already-issued customer token.** Default lifetime is30 minutes, configurable with no upper cap enforced by the shown config loader. Password change/recovery must not be described as revoking all sessions. Add credential/session versioning and regression tests under a dedicated remediation change.

The customer login route has validation but no application rate limiter;21 consecutive failed attempts returned401 in the isolated probe. Owner login, recovery, pairing and cloud login have separate limiter implementations, which do not protect customer `/api/v1/auth/login`. An external reverse-proxy control was not assessed and must not be assumed.

Platform owner JWT purpose/session claims, active owner record and database session check are separate from customer tokens. Owner commissioning/recovery, manufacturer trust and MFA must remain isolated; support grants have their own narrow scope. A customer ADMIN token cannot be treated as owner authorization.

Company cloud uses a shared admin key and stateless HMAC cookie; logout expires the browser's cookie without invalidating a copied signed cookie. A copied cookie may remain usable until its fixed expiry; rotating the session secret affects all such sessions and needs controlled rollout. Customer Viewer sessions are D1-backed and revoked on password reset/disable; native Viewer bearer purpose is separately enforced.

## Secrets and signing

Never commit real environment credentials, runtime databases, private signing keys, recovery packages or deployment tokens. Public trust files and example config are not private keys. Manufacturer signing stays in manufacturer tools; customer installation receives only public trust/verification material. Release/update signing, manufacturer recovery signing, cloud sessions and controller identity are distinct trust domains; do not reuse keys.

Package hashes support corruption detection and source traceability. They do not prove commercial publisher trust if an attacker can replace both a file and its manifest. Pilot development signing is not production public certificate trust.

## Transport, isolation and device trust

Production config validation requires controlled HTTPS/TLS endpoints, exact CORS origins, credentialed MQTT with stable identity and absolute persistent paths. Backend Helmet/CORS applies to its response surface; inspect the deployed frontend/reverse-proxy headers as a separate boundary. Cloud responses apply CSP/no-store/frame/content controls. Main pilot pairing and sample HTTPS clients explicitly set `skip_cert_common_name_check=true` while supplying a provisioned certificate. This skips endpoint name checking; it is not evidence that all certificate validation is disabled. Exposure depends on the installed certificate/trust scope. Remove the pilot exception with controlled hostname/certificate provisioning before production (audit A05). No live TLS configuration or deployed secret rotation was tested here.

Device pairing binds hardware UID/device/installation and rate-limits short-lived claims, but the pilot implementation does not supply the full approved per-device PKI/mTLS, secure hardware key storage, Secure Boot, Flash Encryption, signed-device firmware and revocation/clone protections. Those remain explicit production gaps, not controls demonstrated by pairing success.

Site/customer scoping, device binding, replay timestamps, schema bounds and authenticated archive access are critical regression areas. Tests exist across these domains; this audit does not establish complete attack-path or code coverage. No broad fuzzing, external penetration test, live host ACL review or physical fault injection was performed.

## Dependency response

The [dependency report](../audit/2026-10-28/DEPENDENCIES.md) preserves registry advisory evidence and distinguishes runtime from development. Critical/High entries require triage of installed versions, code reachability, deployment configuration and patched versions. Avoid automatic major-version upgrades without compatibility review; add desired regression tests, rerun component and packaging gates, and record the exact fixed tree. No dependency or auth behavior was changed by this documentation audit.

Incident response must preserve logs/evidence and separate account containment, token/session invalidation, secret rotation, host/network containment and recovery. Disabling a compromised customer user blocks middleware access immediately; operational impact and re-enable/session behavior require controlled review. Password change by itself is currently insufficient session containment.
