# S15-07 Deployment and Commissioning Readiness Evidence

## Decision

**SOFTWARE BASELINE READY FOR CONTROLLED DEPLOYMENT PREPARATION**

**BIO EGYPT FIELD COMMISSIONING NOT EXECUTED / PILOT NOT YET ACCEPTED**

S15-07 verifies the repository-side deployment and commissioning boundary. It does
not close the S15-06 field-survey open items or manufacture customer signatures.

## Repository evidence matrix

| Path                     | Evidence                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Production configuration | Fail-closed `validate:deployment` command and unit tests                                 |
| MQTT transport           | Configurable `mqtt`/`mqtts`; production gate requires TLS, credentials, stable client ID |
| SQLite persistence       | Configurable absolute persistent-volume path; backup directory gate                      |
| Site/Device trust        | Existing active lifecycle, exact Site, channel, and enabled-Sensor checks                |
| Heartbeat/health         | Trusted server-receipt timestamps and online/stale/offline boundaries                    |
| LIVE telemetry           | Influx value, battery, signal, and original payload timestamp; Alarm evaluation          |
| REPLAY telemetry         | Original timestamp retained; historical Alarm re-evaluation suppressed                   |
| Alarm lifecycle          | Trigger, recover, acknowledge, actor audit, transactional notification event             |
| Notification/SMS         | Durable event outbox and failover-only SMS decision contract                             |
| Commissioning            | Controlled 20-Sensor map, test matrix, open-item register, acceptance form               |
| Operations               | Deployment, backup, restore, upgrade/rollback, smoke, incident runbook                   |

## Field gates that remain open

The `BE-001` through `BE-012` register remains authoritative. In particular, field
survey, controller/channel electrical design, routes/lengths, serial assignment,
threshold approval, calibration certificates, network/4G evidence, notification
recipients/provider, restore rehearsal, and signed commissioning evidence cannot be
completed from the repository alone.

These are deployment execution gates, not missing software claims. The Pilot may move
to field preparation only after named owners close them with controlled evidence.
