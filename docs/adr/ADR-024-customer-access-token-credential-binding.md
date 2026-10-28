# ADR-024 — Customer access-token credential binding

Status: accepted for the user-authorized audit remediation work package, 28 October 2026; source integration and deployment are separate gates.

## Requirement

Audit A02/A03 requires bounded customer login attempts and rejection of tokens issued before password replacement, including administrator and offline recovery. Keep customer, owner and cloud identities separate. Do not expose credential material in JWT claims or introduce a schema migration solely for this binding.

## Decision

Customer HS256 signing keys are derived using HMAC-SHA256 keyed by the configured customer JWT secret over a domain-separated JSON tuple containing the canonical user ID and current stored bcrypt hash. Verification decodes only the subject for key selection, then verifies algorithm, issuer, audience, expiry and subject before accepting identity. Current credentials are fetched through the UserRepository persistence boundary. Missing/inactive users fail closed. No password hash or derived signing key is sent in a JWT claim.

A password reset creates a new bcrypt hash and therefore changes the per-user signing key, invalidating older tokens without relying on coarse timestamp precision or an in-memory revocation list. The login service supplies the credential snapshot used for bcrypt verification; issuance rejects if a concurrent reset/disable replaced it. Own password change returns a replacement authenticated session; the frontend validates/stores its token and reschedules expiry.

Customer and owner login share a bounded per-process/IP limiter: ten admitted attempts per sixty seconds, with Retry-After on429, independent scopes, maximum1024 tracked clients and no eviction of live buckets. Saturation rejects new clients rather than resetting existing limits. Express trusted-proxy configuration is authoritative; forwarded headers are never read directly. Successful logins count too; no account-wide lockout is introduced.

## Compatibility and operational limits

Deployment invalidates all legacy globally signed customer tokens; users must log in again. The password-change response adds fresh login fields while retaining success/password_change_required. Deploy backend and frontend together. Customer password change revokes other customer sessions; owner/cloud sessions are unchanged. No product release/tag is created by this change.

Credential binding is not a complete session registry: restoring an old credential database with the same global secret may make an old unexpired matching token valid again. Rotate customer JWT secrets under controlled restore/incident procedures when invalidating such tokens is required. Disabling then re-enabling a user with unchanged credentials does not permanently revoke old tokens. Rate limits reset on process restart and are not distributed; reverse-proxy/network protections are separate. Certificate/mTLS, device secure boot, company session revocation and dependency advisories remain separate open work.

## Verification

Required regressions: route-level429 including forged forwarding headers, window reset/client separation/table saturation, own/admin/offline credential replacement rejects old tokens, replacement session accepted, rejected change preserves existing token, stale login snapshot rejected, legacy token rejection, existing JWT algorithm/issuer/audience/expiry rules and owner isolation.
