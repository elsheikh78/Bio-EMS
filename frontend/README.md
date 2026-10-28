# BIO-EMS Frontend

Reviewed candidate `d151b1f`, 28 October 2026. [Project state](../PROJECT_STATE.md) controls merge/deployment status.

React/TypeScript/MUI local operational and System Owner UI. Role-aware navigation supplements server authorization. Candidate removes Hardware Lab testing UI while preserving installation/provisioning operations. Package0.0.0 is not the product release version.

## Verify from this directory

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Run `npm run dev` separately from backend for development. Configure approved API origin using the non-secret environment template and exact backend CORS allowlist. Vite dev/preview is not production customer hosting. Build success does not prove browser UAT, deployment headers, every permission path or field acceptance.

[Current component guide](../docs/current/PLATFORM-OPERATIONS.md) · [Developer/testing guide](../docs/current/DEVELOPER-AND-TESTING.md) · [Audit findings](../docs/audit/2026-10-28/README.md) · [Original pre-audit README](../docs/archive/2026-10-28-pre-audit/frontend/README.md)
