# BIO-EMS Project State

**Version:** v0.12.0 release candidate

**Current Phase:** Sprint 12 Completed

**Branch:** `sprint-12-device-onboarding`

**Pull Request:** Draft PR #2, open and unmerged

## Implemented Platform

- TypeScript/Express backend with layered Controller, Service, Repository, and
  persistence boundaries.
- SQLite configuration and migration infrastructure.
- MQTT telemetry ingestion and InfluxDB time-series persistence.
- Site, Room, Device, Sensor, Alarm, and Dashboard backend capabilities.
- Unified Alarm evaluation and threshold classification.

## Sprint 12 Delivered State

Device represents firmware identity inside a Zone Controller; it does not represent
the physical Zone Controller. The implemented Device API supports validated create,
list, read, approved metadata update, activation, and disablement operations while
preserving the pre-Sprint create/list contracts.

New Devices persist as `pending` with `activated = 0`. The only successful lifecycle
path is `pending/0 -> active/1 -> disabled/0`. Registration and activation require a
valid Site; duplicate identity and persistence constraints map to stable HTTP errors.

Operational telemetry requires:

- A known Device in `active/1` state.
- A persisted Site whose code exactly matches the topic Site.
- A Sensor belonging to the Device and channel with `enabled = 1`.

Message-level trust failures prevent Alarm evaluation and InfluxDB writes. Invalid
channels are rejected individually so valid channels in the same trusted payload can
continue.

## Contracts and Compatibility

- Telemetry topic: `bioems/{siteCode}/telemetry/{deviceId}`.
- MQTT subscription: `bioems/+/telemetry/+`.
- No MQTT topic or telemetry payload migration.
- No SQLite schema change or migration in Sprint 12.
- Device PATCH cannot change identity, Site ownership, lifecycle, or timestamps.

## Verification

- 113 passing tests across 10 test files.
- GitHub Actions `CI / Backend quality gates` passed on Draft PR #2.
- Quality gates cover clean install, typecheck, build, lint, format check, and tests.

## Deferred State

The broader ADR-010 workflow is not complete. Discovery, QR identification,
activation-code verification, Asset approval/assignment, Authentication,
certificates, provisioning, pairing, heartbeat/last-seen, and automatic registration
remain deferred. Monitoring Points, Users/Roles, Notification Engine, Frontend, OTA,
and npm audit remediation are also outside Sprint 12.

## Release State

Sprint 12 implementation and acceptance are complete as the v0.12.0 release
candidate. The branch has not been merged, tagged, published as a GitHub Release, or
deployed.
