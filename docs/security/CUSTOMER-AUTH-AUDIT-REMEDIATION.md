# Customer Authentication Audit Remediation

Phase-one checkpoint at 0246c0d; later test-tool and company-session work is described in the [phase-two guide](COMPANY-SESSIONS-AND-TEST-TOOLING-REMEDIATION.md). Its new evidence supersedes the remaining test-tool counts below without rewriting the original audit.

28 October 2026. Requirement and decision: [ADR-024](../adr/ADR-024-customer-access-token-credential-binding.md). This candidate addresses audit A02/A03 only; original [audit findings](../audit/2026-10-28/FINDINGS.md) remain immutable point-in-time observations.

Ten customer login attempts per IP per minute are admitted before429/Retry-After. Both successful and failed attempts count; a shared workstation/network may need to wait before another login. Malformed JSON is rejected by the parser before route middleware; valid JSON invalid-body requests count. The bounded memory policy is per process and resets on restart; no distributed or persistent lockout is claimed. Owner login remains separately counted.

Password replacement changes the credential-bound JWT signing key and invalidates all older tokens for that customer user. The own-password-change response supplies a fresh session; a matching updated frontend installs it and its new expiry. Other browsers must sign in again. On initial upgrade, all previous customer tokens require re-login. Admin/offline recovery inherit invalidation from the changed stored bcrypt hash. No private credential material is a public JWT claim.

The backend and frontend must be deployed together and checked on the intended Windows package. This source change does not alter the owner commissioning/MFA or cloud Viewer session model. Restore of an old credential database under unchanged JWT secret can resurrect matching unexpired old tokens; follow the approved restore/secret rotation policy. This is credential-change invalidation, not a full per-device session/revocation registry.

Source completion requires typecheck/lint/format/test/build gates and desired security regressions. Do not call the change deployed or all security findings closed merely because the PR exists. Remaining development/mobile/cloud dependency advisories, company-cookie revocation, Main certificate name checking and final device trust remain open.

## Dependency remediation in this candidate

Backend runtime affected entries reduced from 9 (one Critical, six High, two Moderate) to 0; frontend runtime from one High to 0, using npm audit --omit=dev. All-dependency scans still report development/tooling findings around Vitest/Tinypool/mocker (and coverage tooling); these are open and require a separately validated test-runner major migration. This does not certify mobile/cloud/Python/vendor packages. Current [scan evidence](evidence/CUSTOMER-AUTH-DEPENDENCIES-2026-10-28.json) is separate from the immutable original audit snapshot.

Locked updates include Axios 1.21.0, compression 1.8.2, Zod 4.6.7, proxy-addr 2.0.8, body-parser 2.4.0, follow-redirects 1.16.2, qs 6.17.0, ip-address 10.7.5, Nodemailer 10.2.1 and Vite 7.3.7. Nodemailer is a deliberate major update; the installed library builds a real RFC email in the offline stream-transport regression. Existing provider/notification contracts and the full platform suites pass. Real SMTP/TLS/provider delivery and the Windows package remain separate acceptance gates. No automatic npm audit force-fix was used.
