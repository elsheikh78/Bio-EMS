# S15-03 Closure — Device / Communication Health

## Status

**COMPLETE / MERGED / VERIFIED / CLOSED**

S15-03 is closed. Its approved implementation was integrated into `main` through
PR #25.

Feature commit: `ce969ff3b9fefa781823e1ee31a87ef952a953f5`.

Integration commit: `daa64bed7bf6b6a7a5932ebc40c9c31da9536d1b`.

## Objective achieved

BIO-EMS now distinguishes Device communication health from Device onboarding
lifecycle and normal Sensor alarm conditions using trusted server-side last-seen
semantics.

The delivered read-time states are `NOT_OPERATIONAL`, `NEVER_SEEN`, `ONLINE`,
`STALE`, and `OFFLINE`, with a fixed 120-second stale threshold and 300-second
offline threshold.

## Trust and integrity evidence

Migration 007 adds nullable `last_seen_at` and `last_heartbeat_at` Device fields
without changing existing lifecycle values.

Only trusted telemetry and valid heartbeat messages from an existing `active/1`
Device with an exact configured Site match can advance communication timestamps.
Server receipt time is authoritative, updates are monotonic, and a concurrent
lifecycle change stops telemetry before downstream Sensor, Alarm, or InfluxDB side
effects.

## API and protocol evidence

- `GET /api/v1/devices/:deviceId/health` exposes lifecycle and communication health
  separately under the existing Device read permission.
- `bioems/{siteCode}/heartbeat/{deviceId}` accepts a strict heartbeat payload with
  required ISO `sent_at` and optional non-negative integer `uptime_seconds`.
- Dashboard `offlineDevices` is derived from communication health rather than the
  Device lifecycle column.

## Quality evidence

PR #25 contained one focused implementation commit and 31 changed files.

Verification before merge included:

- TypeScript typecheck: PASS;
- backend build: PASS;
- ESLint: PASS;
- Prettier: PASS;
- 98 focused migration/repository/health/heartbeat/telemetry/MQTT/API/RBAC assertions:
  PASS;
- GitHub Backend quality gates: PASS;
- GitHub Frontend quality gates: PASS.

GitHub Actions run: `32042791967`.

Backend job: `95424974461`.

Frontend job: `95424974415`.

PR #25 was verified at feature HEAD
`ce969ff3b9fefa781823e1ee31a87ef952a953f5` as `CLEAN` and `MERGEABLE` before merge.

## Scope boundary preserved

S15-03 did not introduce communication Alarm persistence, notifications, SMS
failover, a frontend health screen, firmware changes, registration or
command/response protocols, scheduling workers, or configurable threshold UI.

These remain separate future concerns. S15-04 owns the channel-independent
notification boundary.

## Closure decision

All approved S15-03 implementation, trust-boundary, API, protocol, CI, and
documentation evidence is complete and integrated. No known blocker remains.

**Decision: close S15-03 and proceed to S15-04 — Notification Architecture.**
