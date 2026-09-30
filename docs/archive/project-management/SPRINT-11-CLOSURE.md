# Sprint 11 — Engineering Foundation and Alarm Consolidation

Status: Completed  
Version: 0.11.0  
Date: 2026-08-06

## Delivered Scope

- One Domain Alarm Evaluation Engine for MQTT telemetry and Dashboard room status.
- Six classifications: critical-low, warning-low, normal, warning-high,
  critical-high, and unknown.
- Warning-low and warning-high sensor thresholds.
- Versioned SQLite migrations with persisted migration history.
- Idempotent migration 002 for existing sensor tables.
- Fresh-schema support for warning thresholds.
- Alarm Domain, persistence, REST API, and migration tests: 13 total.
- ESLint flat configuration, Prettier, and repeatable quality scripts.
- Version alignment across `VERSION`, the backend package, and Health API.

## Compatibility Boundary

The release does not change Room, Sensor, MQTT, Telemetry, Dashboard, or Alarm API
contracts. MQTT topics and existing entity relationships remain unchanged.

## Verification

The closure requires successful typecheck, build, lint, Prettier check, automated
tests, and `git diff --check`. Results are captured in the implementation handoff.

## Excluded Scope

Sprint 12 has not started and no Sprint 12 features are included.
