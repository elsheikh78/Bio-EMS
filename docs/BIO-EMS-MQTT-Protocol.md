# BIO-EMS MQTT Protocol

This file is a concise pointer to the maintained protocol specification:

- [BIO-EMS MQTT Protocol — Architecture](architecture/BIO-EMS-MQTT-Protocol.md)

The implemented telemetry and heartbeat contracts are:

```text
bioems/{siteCode}/telemetry/{deviceId}
bioems/{siteCode}/heartbeat/{deviceId}
```

The backend subscription is:

```text
bioems/+/telemetry/+
bioems/+/heartbeat/+
```

Sprint 12 established telemetry without changing its existing payload schema. S15-03
adds the heartbeat contract and trusted Device last-seen semantics. Registration,
command, and response topics remain future design.
