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

## Sprint 13

S13-01 through S13-07 are implemented and merged. The current `main` baseline is
`857834f194afb4bb750c2247ebea5e56fab061f2`, verified by CI run 31504321547 with
30 test files and 359 passing tests and no failures, skips, or todos.

S13-08 is the documentation-correction and closure-evidence activity. Its evidence
requires independent review; this document does not itself close Sprint 13.
Sprint 14 has not started.

## Planned or deferred

- [ ] Monitoring Point architecture and APIs
- [ ] Broader Device discovery, QR, activation-code, and provisioning workflows
- [ ] Asset approval and assignment
- [ ] Notification Engine
- [ ] Frontend and OTA updates
- [ ] Deployment and production operations
