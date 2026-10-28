# ADR-025 — Revocable company portal sessions

Status: accepted for the user-authorized audit remediation candidate, 28 October 2026. Not deployed or migrated remotely by this work.

## Requirement and boundary

Audit A04: browser logout must revoke the copied company cookie for subsequent authorization checks. Keep the existing shared company operator key, thirty-minute lifetime, HMAC signature, Secure/HttpOnly/SameSite cookie, same-origin mutation checks and separate local-owner/customer-Viewer identities. Individual company operator accounts/RBAC are outside this fix.

## Decision

D1 migration 0003 creates company_sessions with SHA-256 cookie hash, company access-key hash and creation/expiry timestamps. Successful login stores the record before sending the cookie. Authorization verifies configured secrets, exactly one well-formed company cookie, HMAC and fixed expiry, then requires an unexpired durable record matching the current company access key. Raw cookies and company secrets are not persisted in that table.

Logout deletes the authenticated row before expiring the browser cookie. A copied cookie no longer authorizes later requests; another independently issued session remains active. Company access-key or session-signing-secret rotation invalidates older sessions. The existing scheduled cleanup removes expired rows. Storage failure fails closed; requests already authorized before logout are not retroactively cancelled.

## Deployment and rollback

Back up D1 and apply 0003 before deploying the matched Worker. Migration is additive and does not move customer/site/viewer data. All legacy stateless company cookies require a new login; there is no fallback accepting a missing session row. A Worker deployed without the table cannot authenticate and must not be called healthy. No remote migration/deployment is performed by source tests or Wrangler dry-run.

Rollback to the old stateless Worker removes server revocation enforcement. Rotate SESSION_SECRET under a controlled rollback to invalidate old copied cookies; preserving the D1 table alone cannot make old code honor revocation. No change is made to Viewer/local-owner/customer JWT purposes.

## Verification

Required tests: valid company session works; copied cookie fails after logout; independent session survives; missing/expired rows fail; key rotation, malformed/duplicate cookies and cross-origin logout fail; no raw tokens/secrets stored; scheduled expiry cleanup; existing company/Viewer/agent isolation. Full cloud suite/build/dry-run supplement these tests, not live acceptance.
