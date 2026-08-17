# BIO-EMS Pilot Deployment Architecture

## Controlled topology

```text
Site Controller(s)
  -> authenticated MQTT over TLS
  -> MQTT broker
  -> BIO-EMS backend
       -> persistent SQLite volume
       -> InfluxDB over TLS
       -> protected REST API
  -> HTTPS frontend
```

The Pilot uses one software platform for Standard and Advanced product grades. The
BIO EGYPT Phase 1 scope uses Standard industrial DS18B20 Sensors only.

## Deployment units

| Unit        | Responsibility                                                   | Required persistence/security                           |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| MQTT broker | Telemetry and heartbeat transport                                | TLS, authenticated identities, topic ACLs               |
| Backend     | Trust boundary, configuration, Alarms, notification events, REST | Stable runtime identity; secrets outside source control |
| SQLite      | Configuration, identity, Alarm/calibration/notification evidence | Dedicated volume; WAL-aware backup and restore test     |
| InfluxDB    | Time-series telemetry                                            | TLS; persistent storage; vendor-supported backup        |
| Frontend    | Browser operational UI                                           | HTTPS; exact API origin; no embedded secrets            |

## Availability boundary

This architecture does not claim high availability. SQLite is a single-writer
configuration store and the backend is deployed as one active instance for the
Pilot. Horizontal scaling, broker clustering, Influx clustering, and zero-downtime
upgrade are outside the approved Pilot baseline.

## Network boundary

- Only required inbound HTTPS is exposed to users.
- The backend uses outbound/authenticated MQTT and Influx connections according to
  the selected topology.
- Broker ACLs permit each Site Controller to publish only its approved Site/Device
  telemetry and heartbeat topics.
- Database ports and files are not publicly exposed.
- Production MQTT, Influx, frontend, and API paths use encrypted transport.

## Persistence boundary

`BIOEMS_SQLITE_PATH` must target an absolute persistent-volume path. The application
working-directory default remains development-only. `BIOEMS_SQLITE_BACKUP_DIR` names
a separate absolute backup destination used by the operating procedure; it is not a
substitute for an external/off-host backup.

InfluxDB backup/restore follows the deployed Influx version's supported tooling and
must be demonstrated with Pilot data before acceptance.
