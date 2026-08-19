# S16-07-02 — Calibration History Preview

## Scope

This slice implements the canonical preview adapter for `CALIBRATION-HISTORY` contract version `1.0`.

- Endpoint: `POST /api/v1/reports/preview`
- Permission: `REPORT_READ`
- Source of truth: SQLite operational calibration ledger
- Range semantics: half-open `[from,to)`
- Maximum range: 366 days
- Required context: selected Sensor identifiers, IANA time zone, and `en` or `ar` language

## Result guarantees

The backend owns one canonical result containing report identity, scope, provenance, quality warnings, summary, current Sensor snapshots, and immutable calibration attempts. Current due classification is evaluated once at the report `generatedAt` instant.

The complete request is rejected with `REPORT_SCOPE_INVALID` when any requested Sensor is unknown. Missing hardware identity or a certificate reference is represented explicitly as a quality warning; it is never silently fabricated.

## Availability

Preview is available. PDF and CSV remain unavailable until their renderers consume this same canonical result in later slices.
