# BIO-EMS Company Cloud and Customer Viewer

Reviewed candidate `d151b1f`, 28 October 2026. [Project state](../PROJECT_STATE.md) controls merge/deployment status.

Cloudflare Worker/D1 company portal, site-agent jobs/snapshot export and isolated read-only customer Viewer/PWA. Company shared-key cookie, Viewer browser session and native bearer session are distinct authorities.

## Verify from this directory

```sh
npm ci
npm test
npm run build
npx wrangler deploy --dry-run
```

Build prerequisites include the frontend build used by cloud packaging. `wrangler.jsonc` and migrations 0001/0002 define bindings/schema. A dry-run does not deploy or apply D1 migrations. Production secrets are not stored in source. Copied company cookies are not individually revoked by logout; Viewer sessions are D1-backed. Native customer background remote push is not implemented.

[Current component guide](../docs/current/CLOUD-AND-MOBILE.md) · [Developer/testing guide](../docs/current/DEVELOPER-AND-TESTING.md) · [Audit findings](../docs/audit/2026-10-28/README.md) · [Original pre-audit README](../docs/archive/2026-10-28-pre-audit/company-cloud/README.md)

## Pending revocable-session upgrade

The security candidate adds hashed D1 company sessions and server-side logout. Apply migration0003_company_sessions.sql before deploying the matched Worker; legacy company cookies require re-login. Source tests/dry-run do not perform a remote migration or prove live acceptance. See [company session/tooling remediation](../docs/security/COMPANY-SESSIONS-AND-TEST-TOOLING-REMEDIATION.md) and [ADR-025](../docs/adr/ADR-025-revocable-company-sessions.md), including rollback secret rotation requirements. The shared company access-key model is unchanged.
