# Project Status

## Current Version

Published release: [`v0.13.0`](https://github.com/elsheikh78/Bio-EMS/releases/tag/v0.13.0)

The release tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
Current repository development is newer and includes later Sprint 13 work plus Sprint 14 frontend work.

## Implemented

- [x] Project architecture and persistence foundations
- [x] MQTT and InfluxDB integration
- [x] Site, Room, Device, Sensor, Alarm, and Dashboard backend foundations
- [x] Device lifecycle and telemetry trust-boundary enforcement
- [x] JWT Authentication and active-User validation
- [x] Centralized RBAC route enforcement
- [x] Authenticated Alarm acknowledgment audit persistence
- [x] ADMIN User Management
- [x] Last-active-ADMIN transactional and concurrency protection
- [x] Security hardening and regression coverage
- [x] ESLint, Prettier, and GitHub Actions quality gates
- [x] S14-01 frontend architecture and quality foundation
- [x] S14-02 professional responsive AppShell and navigation
- [x] S14-03 frontend authentication/session lifecycle and authorization-aware routing
- [x] S14-04 operational Dashboard frontend

## Sprint 14

Sprint 14 is **IN PROGRESS**.

- S14-01: COMPLETE / MERGED / CLOSED.
- S14-02: COMPLETE / MERGED / VERIFIED through PR #11.
- S14-03: COMPLETE / MERGED / VERIFIED through PR #12.
- S14-04: COMPLETE / MERGED / VERIFIED through PR #15.
- S14-05: IN PROGRESS on `agent/s14-05-monitored-areas`.

S14-05 feature-branch progress:

- S14-05A contracts/data access: COMPLETE / COMMITTED / PUSHED (`90e39af`).
- S14-05B Site/Monitored Area hierarchy: COMPLETE / COMMITTED / PUSHED (`bd442e9`).
- S14-05C Sensor inventory/threshold metadata: NOT STARTED / NEXT.
- S14-05D refresh/integration/hardening: NOT STARTED.

S14-05A/B are not yet merged to `main`.

## Current Frontend Boundary

The merged frontend baseline includes the professional AppShell, Login/session lifecycle, authorization-aware routing/navigation, and operational Dashboard. The active S14-05 feature branch additionally contains the read-only Site → Monitored Area (Room) → Sensor hierarchy through S14-05B.

`Monitored Areas` is presentation terminology for the existing Room domain. Monitoring Points remain proposed and have no implemented backend table, repository, or API.

## Planned or Deferred

- [ ] S14-05C Sensor inventory and threshold metadata
- [ ] S14-05D refresh, integration, and hardening
- [ ] Monitoring Point architecture and APIs
- [ ] Broader Device discovery, QR, activation-code, and provisioning workflows
- [ ] Asset approval and assignment
- [ ] Notification Engine
- [ ] Additional operational frontend features and OTA updates
- [ ] Deployment and production operations
