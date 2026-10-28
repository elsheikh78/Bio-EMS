# BIO-EMS Backend

Reviewed candidate `d151b1f`, 28 October 2026. [Project state](../PROJECT_STATE.md) controls merge/deployment status.

Express/TypeScript local API and durable operational services. SQLite stores configuration/operations/audit; Influx stores time series. Device pilot HTTPS bridge and separate MQTT ingest share telemetry validation. Customer and System Owner authentication are separate. Source version follows root VERSION (0.20.0).

## Verify from this directory

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Development requires configured JWT, SQLite, MQTT and Influx values using the non-secret `.env.example` template. See the developer guide before `npm run dev`. Production validation: `npm run validate:deployment`. The Windows installer manages protected customer configuration; development `.env` editing is not the customer setup procedure. Customer login throttling and credential-change token invalidation remain open audit findings. Legacy Hardware Lab is authenticated read-only history in the candidate; new tests belong in standalone Tester.

[Current component guide](../docs/current/SOFTWARE-ARCHITECTURE.md) · [Developer/testing guide](../docs/current/DEVELOPER-AND-TESTING.md) · [Audit findings](../docs/audit/2026-10-28/README.md) · [Original pre-audit README](../docs/archive/2026-10-28-pre-audit/backend/README.md)
