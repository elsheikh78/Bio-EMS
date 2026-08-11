# Project Status

## Current version

Published release: [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

The release tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
Current `main` is newer and includes post-release S13-06 and S13-07 merges.

## Implemented

- [x] Project architecture and persistence foundations
- [x] MQTT and InfluxDB integration
- [x] Site, Device, Sensor, Alarm, and Dashboard backend foundations
- [x] Device lifecycle and telemetry trust-boundary enforcement
- [x] JWT Authentication and active-User validation
- [x] Centralized RBAC route enforcement
- [x] Authenticated Alarm acknowledgment audit persistence
- [x] ADMIN User Management
- [x] Last-active-ADMIN transactional and concurrency protection
- [x] Security hardening and regression coverage
- [x] ESLint, Prettier, and GitHub Actions quality gates
- [x] S14-01 frontend architecture and quality foundation

## Sprint 13

S13-01 through S13-07 are implemented and merged. The current `main` baseline is
`857834f194afb4bb750c2247ebea5e56fab061f2`, verified by CI run 31504321547 with
30 test files and 359 passing tests and no failures, skips, or todos.

S13-08 is merged and Sprint 13 is closed. S14-01 is merged and formally closed at
main commit `cc699124bdf49d67cd692d559899642b8d0cfabe`, with CI run 31520085478
attempt 2 successful.

Sprint 14 has started. S14-02 implements the professional responsive application
shell on a Draft PR pending independent review; it is not closed. S14-03 has not
started.

## Planned or deferred

- [ ] Monitoring Point architecture and APIs
- [ ] Broader Device discovery, QR, activation-code, and provisioning workflows
- [ ] Asset approval and assignment
- [ ] Notification Engine
- [ ] Operational frontend features and OTA updates
- [ ] Deployment and production operations
