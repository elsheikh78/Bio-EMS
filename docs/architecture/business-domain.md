# Business Domain

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/architecture/business-domain.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0

## Business Goal

BIO-EMS is an enterprise platform for monitoring physical assets.

## Asset Definition

An Asset is any physical object or area that requires environmental monitoring.

Examples

- Cold Room
- Freezer
- Refrigerator
- Warehouse
- Laboratory
- Incubator
- Stability Chamber
- Clean Room
- Production Line
- Vehicle
- Container
- Ambient Area
- Ante Chamber

Assets are business entities.

Devices are infrastructure.

The system is designed around Assets, not hardware.
