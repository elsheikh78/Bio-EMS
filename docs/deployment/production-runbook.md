# BIO-EMS Pilot Production Runbook

## 1. Release input

- Use an approved immutable commit/tag and record its full SHA.
- Build backend and frontend from the same approved source baseline.
- Run Backend and Frontend GitHub quality gates.
- Record Node.js and dependency installation evidence.
- Never copy a developer database or `.env` file into production.

## 2. Configuration gate

Create deployment-controlled backend environment values from `.env.example` and run:

```bash
cd backend
npm ci
npm run validate:deployment
```

The command returns only issue codes and must report `PASS`. It requires production
mode, valid port/API prefix, MQTT TLS with stable authenticated identity, HTTPS
InfluxDB, valid JWT/CORS configuration, and absolute SQLite data/backup paths.

Frontend `VITE_API_BASE_URL` must be the deployed HTTPS API prefix. Secrets and
customer phone numbers must not be placed in frontend environment variables.

## 3. First deployment

1. Provision persistent SQLite and Influx storage with least-privilege ownership.
2. Provision authenticated broker identities and Site/Device topic ACLs.
3. Apply backend environment/secrets through the deployment secret mechanism.
4. Run `npm ci`, `npm run build`, and the deployment readiness gate.
5. Start the backend from `backend/` so relative non-production behavior is never
   accidentally used; production must still set `BIOEMS_SQLITE_PATH` explicitly.
6. Run migrations once through normal application startup and retain logs.
7. Bootstrap the first ADMIN using the environment-driven command, then remove the
   bootstrap password from the runtime environment.
8. Build and publish the frontend with the exact HTTPS API URL.

## 4. Smoke verification

Using an authorized test account and non-production Pilot test identities:

- authenticate and read the protected Health endpoint;
- verify Sites, Monitored Areas, Devices, Sensors, Dashboard, and Alarms;
- publish one approved heartbeat and LIVE telemetry payload;
- verify Device online state, Influx timestamp/battery/signal/value fields, and
  expected Alarm behavior;
- publish a REPLAY payload and verify historical storage without Alarm re-evaluation;
- execute the S15-06 commissioning identity and rejection matrix.

## 5. Backup

Before configuration changes or upgrades:

1. quiesce backend writes or use a SQLite-online-backup method that correctly includes
   WAL state;
2. write a timestamped backup outside the active SQLite volume;
3. record source SHA, schema migration versions, size, checksum, operator, and date;
4. run the deployed InfluxDB version's supported backup command;
5. copy both backups to the approved protected/off-host location;
6. test restore in an isolated environment.

Copying only `configuration.db` while WAL writes are active is not an approved backup.

## 6. Restore rehearsal

1. Stop the isolated target services.
2. preserve the failed target for investigation;
3. restore SQLite and Influx backups matching the recorded point in time;
4. start dependencies, then backend, then frontend;
5. verify migration history, ADMIN authentication, configuration counts, latest
   telemetry, Alarm history, notification outbox, and calibration records;
6. execute heartbeat/LIVE/REPLAY smoke tests;
7. record recovery point and recovery time evidence.

Production restore requires approved change/incident authority and must never be
tested destructively against the only live copy.

## 7. Upgrade and rollback

- Back up and verify restore before upgrade.
- Record old/new SHA and migration range.
- Database migrations are forward-only; do not improvise schema downgrade.
- Rollback is permitted only to a tested application/database combination or by full
  restore to the recorded pre-upgrade backup.
- Re-run readiness and commissioning smoke gates after change.

## 8. Incident and handover

Record service owner, customer contacts, notification recipients, escalation path,
backup owner, calibration owner, support window, log retention, and evidence location.
No Pilot acceptance is valid while these fields or any S15-06 blocking item remain
open.
