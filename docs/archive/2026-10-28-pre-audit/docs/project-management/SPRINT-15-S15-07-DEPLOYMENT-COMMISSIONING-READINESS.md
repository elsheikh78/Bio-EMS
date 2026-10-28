# Sprint 15 — S15-07 Deployment & Commissioning Readiness

## Objective

Validate and harden the repository-side path from configured Site/controller/Sensor
through secure transport, telemetry history, Alarm/notification behavior, outage
recovery, operational procedures, and acceptance evidence.

## Delivered scope

- production environment readiness validator and CLI gate;
- MQTT TLS protocol support with validated configuration;
- configurable SQLite persistent-volume path;
- telemetry timestamp/battery/signal persistence;
- explicit LIVE versus REPLAY behavior preventing historical Alarm re-triggering;
- Site Controller integration and outage/replay contract;
- deployment architecture and production runbook;
- backup, restore, upgrade, rollback, smoke, and handover procedures;
- evidence matrix distinguishing repository readiness from unperformed field work.

## Boundary

S15-07 can close the Sprint's software/documentation readiness work after CI and
review. It cannot declare BIO EGYPT commissioned or accepted. That decision requires
closure evidence for the S15-06 open-item register and signed field commissioning.
