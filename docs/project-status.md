# Project Status

## Current Version

0.12.0 release candidate

## Completed

- [x] Project Architecture
- [x] MQTT Integration
- [x] InfluxDB Integration
- [x] SQLite Integration and Migration System
- [x] Sites Module
- [x] Device REST validation, read, and metadata update
- [x] Device lifecycle transitions
- [x] Device registration integrity
- [x] Telemetry trust-boundary enforcement
- [x] Alarm Engine and Dashboard APIs
- [x] ESLint, Prettier, and GitHub Actions quality gates

## Sprint 12

Implementation and acceptance are complete on `sprint-12-device-onboarding`. The
release candidate provides the Device `pending/0 -> active/1 -> disabled/0` lifecycle,
Site and identity constraints, and Device/Site/enabled-Sensor telemetry authorization.
The suite reports 113 passing tests across 10 files, and Draft PR #2 has a successful
`CI / Backend quality gates` check.

The branch has not been merged, tagged, released, or deployed.

## Deferred

- [ ] Discovery, QR identification, and activation codes
- [ ] Asset approval or assignment
- [ ] Monitoring Points
- [ ] Users, Roles, Authentication, and Authorization
- [ ] Notification Engine
- [ ] Frontend and OTA Updates
- [ ] Provisioning, pairing, heartbeat, and last-seen
