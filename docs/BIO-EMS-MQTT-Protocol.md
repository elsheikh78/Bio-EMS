# BIO-EMS MQTT Protocol

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<archive/2026-10-28-pre-audit/docs/BIO-EMS-MQTT-Protocol.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


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
adds the heartbeat contract and trusted Device last-seen semantics. S15-07 adds
production MQTT TLS configuration plus optional `LIVE`/`REPLAY` telemetry mode;
replayed readings retain their original timestamp without historical Alarm
re-evaluation. Registration, command, and response topics remain future design.
