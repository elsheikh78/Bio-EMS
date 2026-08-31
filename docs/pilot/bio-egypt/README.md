# BIO EGYPT Pilot Documentation Package

## Document control

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Customer           | United Company for Biological Industries — BIO EGYPT |
| Package status     | Pilot baseline — field verification required         |
| Sprint             | S15-06                                               |
| Platform           | BIO-EMS Standard                                     |
| Measurement        | Temperature only — Phase 1                           |
| Controlled sites   | El Manial; CPC / 6th of October                      |
| Baseline inventory | 8 monitored areas; 20 temperature Sensors            |

This package converts the approved Pilot baseline into controlled installation and
commissioning records. It does not claim that field-dependent values have already
been surveyed or accepted.

## Package contents

1. [Controlled scope](BIO-EGYPT-PILOT-SCOPE.md)
2. [Sensor and channel map](BIO-EGYPT-SENSOR-MAP.md)
3. [Installation and wiring requirements](BIO-EGYPT-INSTALLATION-WIRING.md)
4. [Commissioning and acceptance record](BIO-EGYPT-COMMISSIONING.md)
5. [Open-items register](BIO-EGYPT-OPEN-ITEMS.md)
6. [Controlled Site Survey Pack](BIO-EGYPT-SITE-SURVEY-PACK.md)
7. [BE-002 Marked-up Sensor Position Evidence Pack](BE-002-MARKED-UP-SENSOR-POSITION-PACK.md)
8. [Software UAT Guide](BIO-EGYPT-SOFTWARE-UAT-GUIDE.md)

## Deployment and readiness references

The S15-06 customer package is executed using the approved S15-07 repository
baseline:

1. [Production runbook](../../deployment/production-runbook.md)
2. [Deployment architecture](../../deployment/deployment-architecture.md)
3. [Site Controller integration contract](../../deployment/site-controller-integration-contract.md)
4. [S15-07 readiness evidence](../../deployment/S15-07-READINESS-EVIDENCE.md)

Sprint 15 repository scope is closed. The BIO EGYPT Pilot remains **NOT COMMISSIONED /
NOT ACCEPTED** until the open-item and commissioning evidence is completed and signed.

## Control rule

Items marked `TBD — Field Survey`, `TBD — Customer`, or `TBD — Commissioning` are
gates, not optional notes. They must be completed, reviewed, and signed before Pilot
acceptance. A changed area count or Sensor quantity requires an approved revision to
the controlled scope and Sensor map.
