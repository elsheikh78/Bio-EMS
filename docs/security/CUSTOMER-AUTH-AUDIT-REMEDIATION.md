# Customer Authentication Audit Remediation

28 October 2026. Requirement and decision: [ADR-024](../adr/ADR-024-customer-access-token-credential-binding.md). This candidate addresses audit A02/A03 only; original [audit findings](../audit/2026-10-28/FINDINGS.md) remain immutable point-in-time observations.

Ten customer login attempts per IP per minute are admitted before429/Retry-After. Both successful and failed attempts count; a shared workstation/network may need to wait before another login. Malformed JSON is rejected by the parser before route middleware; valid JSON invalid-body requests count. The bounded memory policy is per process and resets on restart; no distributed or persistent lockout is claimed. Owner login remains separately counted.

Password replacement changes the credential-bound JWT signing key and invalidates all older tokens for that customer user. The own-password-change response supplies a fresh session; a matching updated frontend installs it and its new expiry. Other browsers must sign in again. On initial upgrade, all previous customer tokens require re-login. Admin/offline recovery inherit invalidation from the changed stored bcrypt hash. No private credential material is a public JWT claim.

The backend and frontend must be deployed together and checked on the intended Windows package. This source change does not alter the owner commissioning/MFA or cloud Viewer session model. Restore of an old credential database under unchanged JWT secret can resurrect matching unexpired old tokens; follow the approved restore/secret rotation policy. This is credential-change invalidation, not a full per-device session/revocation registry.

Source completion requires typecheck/lint/format/test/build gates and desired security regressions. Do not call the change deployed or all security findings closed merely because the PR exists. Dependencies, company-cookie revocation, Main certificate name checking and final device trust remain open.
