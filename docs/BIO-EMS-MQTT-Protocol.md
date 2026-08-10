# BIO-EMS MQTT Protocol

This file is a concise pointer to the maintained protocol specification:

- [BIO-EMS MQTT Protocol — Architecture](architecture/BIO-EMS-MQTT-Protocol.md)

The implemented telemetry contract is:

```text
bioems/{siteCode}/telemetry/{deviceId}
```

The backend subscription is:

```text
bioems/+/telemetry/+
```

Sprint 12 did not add, rename, version, or migrate MQTT topics or change the telemetry
payload schema. Registration, heartbeat, command, and response topics described as
future design in the architecture document are not implemented by Sprint 12.
