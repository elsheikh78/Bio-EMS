# BIO-EMS Company Platform — Cloudflare pilot

Central customer/site registry, site heartbeat, monitor-only license records and
an encrypted remote transport for the existing System Owner interface.
This package is a source candidate, not evidence of an online deployment or
Windows installed-client acceptance. Product version remains 0.20.0.

See [Arabic operating and deployment guide](../docs/current/COMPANY-CLOUD-PILOT-AR.md).

## Local checks

From `frontend`: `npm ci`, `npm run typecheck`, `npm run test:run`.
From `backend`: `npm ci`, `npm run typecheck`, `npm run test:run`, `npm run build`.
From `company-cloud`: `npm ci`, `npm test`, `npm run build`,
`npx wrangler deploy --dry-run`.

`npm run build` builds the existing React owner UI in cloud transport mode and
adds the company portal. Normal client builds retain the direct local API.

## Deploy to a company-owned account

1. Authenticate Wrangler to the owner's Cloudflare account with `npx wrangler login`.
2. Create D1: `npx wrangler d1 create bioems-company`.
3. Replace the placeholder `database_id` in `wrangler.jsonc` with the returned ID.
4. Run `npm run db:migrate`.
5. Set **different randomly generated secrets, each at least 32 characters**:
   `npx wrangler secret put COMPANY_ADMIN_TOKEN` and
   `npx wrangler secret put SESSION_SECRET`. Input values only at the hidden prompts.
6. Run `npm run build` and `npm run deploy`.
7. Use the actual HTTPS `workers.dev` URL returned by deployment.

No domain is registered by source preparation. There are no live credentials in
this repository. Do not commit enrollment tokens, secrets, databases or private keys.

## Trust boundaries

- Company login: secret exchange for a Secure/HttpOnly/SameSite cookie, 30 minutes;
  login rate limits and same-origin checks. Initial pilot has one company operator
  identity; individual company accounts/MFA are a later identity-provider integration.
- Client enrollment: per-site random token, only its SHA-256 hash in D1; first RSA
  public key pinned. Reinstall preserving the DB retains its key. A new key needs
  a new enrollment, never an automatic trust reset.
- Remote operations: explicit local opt-in plus existing local System Owner login,
  MFA, sessions and route validation. Company login alone does not grant owner access.
- AES-GCM payloads and responses, random per-command keys wrapped with RSA-OAEP;
  site/command IDs are authenticated as additional data. No local owner password,
  MFA code or owner bearer token is stored in plaintext in D1.
- Agent configuration/private key are encrypted with a domain-separated key derived
  from the existing owner encryption key and kept in the local SQLite database.
- Commands are atomically claimed once, expire after two minutes, and are never
  automatically retried. Lost results are indeterminate; inspect local state.
- Queue payloads erased after expiry; jobs removed after one day, central audit after
  90 days. Local business audit retains the existing actor/session behavior.

## Pilot limits

Heartbeat once a minute. With remote control enabled the agent polls every 15
seconds (about 7,200 requests/day/site before commands and browser traffic).
Ten enabled sites therefore consume about 72,000 agent requests/day. Watch both
Workers and D1 usage; the Free tier is bounded, not a guaranteed unlimited service.

Remote transport permits the authenticated `platform-auth`, `platform-operations`
and `platform-audit-events` routes, excluding company connection reconfiguration.
Transfers are JSON requests and responses up to 250 KB. Update EXE/backup file
transfer remains local; slow operations can exceed the pilot timeout. Do not treat
transport timeout as proof that an action failed. USB actions operate only on USB
devices physically connected to that client PC.

Heartbeat means the BIO-EMS agent is alive. It is not telemetry/alarm replication
or sensor health assurance. Use the owner UI for the existing operational details.
Central license records do not generate/install signed local certificates or alter
local license enforcement. Such certificate issuance and deployment remain under
the existing local licensing process during this pilot.
