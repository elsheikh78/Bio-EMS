# P3-04 — Configuration, Sensor Mapping and Calibration Verification

**Date:** 1 September 2026  
**Status:** SOFTWARE COMPLETE / AUTOMATED TESTS VERIFIED  
**Evidence boundary:** physical label inspection, sensor installation, calibration certificate approval and field commissioning remain external.

## Implemented contract

- Protected `GET /api/v1/sites/:siteId/commissioning-readiness` endpoint with optional ISO `asOf` timestamp.
- Site-scoped inventory projection from authoritative Site → Room → Device → Sensor records.
- Readiness blockers for disabled Sensors, inactive Devices, non-valid or expired calibration and missing certificate references.
- Cross-Site and Sensor → Device ownership enforcement when commissioning checks reference controlled assets.
- No duplicate commissioning copy of configuration or calibration evidence is created.

## Acceptance behavior

The endpoint reports software readiness only. A Site is ready when it has at least one Sensor and every returned Sensor passes the persisted configuration/calibration prerequisites. This result does not create physical evidence, mark a check `PASS`, or accept a commissioning session.

## Automated evidence

- Route tests cover VIEWER read access and strict query validation.
- Service tests cover authoritative readiness summaries and cross-Site asset rejection.
- Backend typecheck, lint, format and tests remain required in CI.
