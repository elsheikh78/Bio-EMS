# Sprint 14 — S14-05 Monitored Areas Progress

## Status

**IN PROGRESS — S14-05A COMPLETE / S14-05B COMPLETE / S14-05C IMPLEMENTED AND LOCALLY VALIDATED / S14-05D NEXT**

S14-05 replaces the `/monitored-areas` placeholder with a read-only operational hierarchy built exclusively on the existing Site, Room, and Sensor backend domains.

User-facing **Monitored Area** remains presentation terminology for the existing Room domain. No Asset, Monitoring Point, or new Area domain is introduced.

## Approved Hierarchy

**Site → Monitored Area (Room) → Sensor**

Relationships use the existing identifiers only:

- Room → Site through `site_id`;
- Sensor → Room through `room_id`.

## S14-05A — Contracts and Data Access

**Status: COMPLETE / COMMITTED / PUSHED**

Delivered:

- strict Zod contracts/types for Site, Room, and Sensor success payloads;
- dedicated Monitored Areas API functions for existing Site, Room, and Sensor reads;
- protected API access through the S14-03 `protectedRequest` boundary;
- stable React Query feature keys and hooks;
- focused contract, API, and query tests.

Evidence:

- feature branch: `agent/s14-05-monitored-areas`;
- commit: `90e39af` — `feat(frontend): add monitored areas data contracts and queries`;
- local/remote synchronization was verified after push;
- working tree was clean before S14-05B began.

## S14-05B — Site and Monitored Area Hierarchy

**Status: COMPLETE / COMMITTED / PUSHED**

Delivered:

- operational `MonitoredAreasPage`;
- `/monitored-areas` route integration replacing the feature placeholder;
- Site → Room hierarchy rendering with Rooms presented as Monitored Areas;
- Site and Monitored Area identification metadata;
- active/inactive configuration-state presentation;
- Sensor association and basic inventory rendering as groundwork for S14-05C;
- Site-with-no-Room and Room-with-no-Sensor states;
- localized production-facing copy;
- localization regression coverage using alternative resources;
- responsive Material UI hierarchy presentation;
- focused page rendering and association tests.

Final S14-05B gate recorded:

- frontend typecheck: passed;
- frontend lint: passed;
- full frontend suite: 21/21 test files, 189/189 tests passing;
- scoped Prettier check: passed;
- `git diff --check`: passed apart from non-blocking LF/CRLF working-copy notices.

Evidence:

- commit: `bd442e9` — `feat(frontend): add monitored areas hierarchy view`;
- feature branch and remote were verified at zero ahead/behind divergence;
- working tree was clean after push.

## S14-05C — Sensor Inventory per Monitored Area

**Status: IMPLEMENTED / LOCALLY VALIDATED / COMMIT PENDING**

Delivered:

- completed Sensor inventory presentation under the correct Monitored Area;
- retained existing Sensor identification and configuration metadata:
  - sensor name;
  - sensor code;
  - sensor type;
  - engineering unit;
  - channel;
  - enabled/disabled configuration state;
- added explicit configured-threshold presentation for:
  - `min_value`;
  - `warning_low`;
  - `alarm_low`;
  - `warning_high`;
  - `alarm_high`;
  - `max_value`;
- displayed configured threshold values with the Sensor engineering unit;
- represented absent or partial threshold metadata explicitly as `Not configured`;
- kept threshold configuration visually and semantically distinct from:
  - live telemetry;
  - device connectivity or online/offline health;
  - current alarm state;
- added localized threshold labels and explanatory configuration-only copy;
- extended alternative localization resources so the localization contract remains complete;
- strengthened page coverage for:
  - complete threshold metadata;
  - partial threshold metadata;
  - fully absent threshold metadata;
  - Sensor-to-Monitored-Area association;
  - inactive and disabled configuration states.

S14-05C scope remained frontend-only.

No backend, database, migration, MQTT, telemetry ingestion, device lifecycle, alarm-engine, Asset, Monitoring Point, or new Area-domain changes were introduced.

### Local Validation

The S14-05C implementation passed:

- frontend typecheck;
- frontend lint;
- full frontend test suite;
- frontend production build;
- scoped Prettier validation for changed implementation/test files;
- `git diff --check`, apart from non-blocking LF/CRLF working-copy notices.

The production build continues to report the existing non-blocking Vite chunk-size advisory. This is not treated as an S14-05C failure or scope expansion.

### Files Changed for S14-05C

- `frontend/src/pages/MonitoredAreasPage.tsx`;
- `frontend/src/pages/MonitoredAreasPage.spec.tsx`;
- `frontend/src/localization/resources.ts`;
- `frontend/src/localization/localization.spec.tsx`;
- `docs/project-management/SPRINT-14-S14-05-PROGRESS.md`.

Commit and push evidence will be recorded after the implementation is committed and synchronized with the feature branch remote.

## S14-05D — Refresh, Integration, and Hardening

**Status: NOT STARTED / NEXT IMPLEMENTATION SLICE**

Planned after S14-05C commit and synchronization:

- explicit refresh/retry behavior;
- authorization-route regression;
- authentication/session-boundary regression;
- malformed-response, localization, accessibility, responsive-critical, and empty-state hardening;
- complete frontend quality gates;
- final S14-05 code review before PR/merge.

S14-05D must remain within the existing Site → Monitored Area (Room) → Sensor architecture and must not introduce deferred domain expansion.

## Current Integration State

S14-05A and S14-05B are committed and pushed on `agent/s14-05-monitored-areas`.

S14-05C is implemented and locally validated on the same feature branch, with commit and push pending.

The feature branch has already been synchronized with the current `origin/main` baseline before S14-05C implementation.

S14-05 is not yet integrated into `main`.

Sprint 14 remains **IN PROGRESS**.

## Immediate Next Step

1. perform final S14-05C diff and scope review;
2. commit S14-05C implementation and documentation together;
3. push and verify local/remote synchronization;
4. begin S14-05D — Refresh, Integration, and Hardening;
5. complete S14-05 final quality gates and code review before PR/merge.

Pilot-readiness work remains a post-Sprint-14 critical-path concern and must not expand the approved S14-05C or S14-05D implementation scope.