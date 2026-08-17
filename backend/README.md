# BIO-EMS Backend

The backend provides authenticated REST APIs, MQTT telemetry ingestion, SQLite
configuration and operational persistence, InfluxDB time-series writes, Alarm-domain
evaluation, Device health, calibration evidence, and durable notification events.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Run the backend quality gates:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

## Browser Development

The backend and frontend run as separate development processes. Outside production,
the backend CORS default allows exactly `http://localhost:5173`. Configure a different
or production origin with a comma-separated exact allowlist:

```dotenv
BIOEMS_CORS_ALLOWED_ORIGINS=https://ems.example.com
```

Wildcard origins, origins containing paths or credentials, and malformed URLs are
rejected during configuration loading. Production with no value uses an empty
allowlist. Helmet secures JSON API responses; the separate frontend hosting layer is
responsible for the effective frontend Content Security Policy.

## Deployment Readiness

Copy `.env.example` to an environment-specific configuration and never commit real
credentials. Production readiness is fail-closed and can be checked before startup:

```bash
npm run validate:deployment
```

Production validation requires, among other controls, MQTT over TLS with credentials
and a stable client ID, HTTPS InfluxDB configuration, an approved CORS origin, a
strong JWT secret, and absolute persistent SQLite database and backup paths.

MQTT subscriptions use QoS 1. LIVE telemetry is stored and evaluated against current
Alarm rules. REPLAY telemetry preserves its historical timestamp but does not
re-trigger historical Alarms. Device health remains based on trusted backend receipt
time.

The authoritative operational instructions and evidence boundaries are:

- `../docs/deployment/production-runbook.md`;
- `../docs/deployment/deployment-architecture.md`;
- `../docs/deployment/site-controller-integration-contract.md`;
- `../docs/deployment/S15-07-READINESS-EVIDENCE.md`.
