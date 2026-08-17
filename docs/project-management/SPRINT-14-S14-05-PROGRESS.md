# Sprint 14 — S14-05 Monitored Areas Progress

## Status

**IN PROGRESS — S14-05A COMPLETE / S14-05B COMPLETE / S14-05C COMPLETE / S14-05D IMPLEMENTED AND LOCALLY VALIDATED / FINAL REVIEW NEXT**

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

**Status: COMPLETE / COMMITTED / PUSHED**

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

S14-05C remained frontend-only.

No backend, database, migration, MQTT, telemetry ingestion, device lifecycle, alarm-engine, Asset, Monitoring Point, or new Area-domain changes were introduced.

### Validation

S14-05C passed:

- frontend typecheck;
- frontend lint;
- full frontend test suite;
- frontend production build;
- scoped Prettier validation;
- `git diff --check`, apart from non-blocking LF/CRLF working-copy notices.

The production build continued to report the existing non-blocking Vite chunk-size advisory.

### Evidence

- commit: `c1ce9477d54b1f2131aa385b10e0e65797695e1b`;
- commit message: `feat(frontend): add monitored area sensor thresholds`;
- feature branch push completed successfully;
- local and remote feature-branch HEADs were verified identical;
- working tree was clean after push.

## S14-05D — Refresh, Integration, and Hardening

**Status: IMPLEMENTED / LOCALLY VALIDATED / COMMIT PENDING**

Delivered:

- added explicit page-level `Refresh monitored areas` behavior;
- refresh re-fetches Sites, Rooms, and Sensors together;
- prevented duplicate refresh operations while a refresh is already pending;
- added explicit Retry action for failed Monitored Areas resource loading;
- kept successful configured hierarchy rendering unchanged during normal operation;
- retained existing empty-Site, empty-Monitored-Area, and empty-Sensor states;
- localized Refresh, Refreshing, and Retry production-facing copy;
- extended alternative localization resources to preserve localization contract coverage;
- strengthened focused page tests for:
  - Retry availability on resource failure;
  - Retry of Sites, Rooms, and Sensors together;
  - explicit Refresh availability;
  - simultaneous re-fetch of Sites, Rooms, and Sensors;
  - disabling Refresh while a refresh operation is pending;
  - prevention of duplicate refresh execution.

### Existing Regression Coverage Reused

S14-05D intentionally reused existing regression coverage instead of modifying stable cross-cutting infrastructure unnecessarily.

Existing repository coverage already verifies:

- authenticated `/monitored-areas` route availability;
- centralized role-aware routing behavior;
- protected-route authentication boundaries;
- protected API access through `protectedRequest`;
- rejection of malformed Site responses;
- rejection of malformed Room responses;
- rejection of malformed Sensor responses;
- prevention of feature-owned Authorization headers;
- generation-scoped 401 handling;
- protected 401/403 propagation;
- Logout cancellation and protected Query-state clearing;
- prevention of stale protected responses publishing after Logout;
- authentication restoration failure handling.

No new Auth, API-client, routing, backend, database, MQTT, telemetry, device lifecycle, or alarm-engine implementation was required for S14-05D.

### Focused Validation

Focused Monitored Areas and localization regression testing passed:

- 2/2 test files;
- 25/25 tests.

### Full Frontend Validation

S14-05D full frontend validation passed:

- frontend typecheck;
- frontend lint;
- frontend format check;
- full frontend test suite;
- frontend production build;
- `git diff --check`, apart from non-blocking LF/CRLF working-copy notices.

The existing Vite chunk-size advisory remains non-blocking and outside S14-05 scope.

### Files Changed for S14-05D

- `frontend/src/pages/MonitoredAreasPage.tsx`;
- `frontend/src/pages/MonitoredAreasPage.spec.tsx`;
- `frontend/src/localization/resources.ts`;
- `frontend/src/localization/localization.spec.tsx`;
- `docs/project-management/SPRINT-14-S14-05-PROGRESS.md`.

## Current Integration State

S14-05A, S14-05B, and S14-05C are committed and pushed on:

`agent/s14-05-monitored-areas`

S14-05D is implemented and locally validated on the same feature branch, with commit and push pending.

The feature branch was synchronized with `origin/main` before S14-05C and S14-05D implementation.

S14-05 is not yet integrated into `main`.

Sprint 14 remains **IN PROGRESS** until S14-05D final review, commit/push, PR validation, merge, and Sprint 14 closure are complete.

## Immediate Next Step

1. perform final S14-05D diff and scope review;
2. commit S14-05D implementation and progress documentation together;
3. push and verify local/remote feature-branch synchronization;
4. perform final S14-05 PR/CI/code review;
5. merge S14-05 into `main` when all gates pass;
6. complete Sprint 14 closure and documentation reconciliation;
7. move immediately to the BIO-EMS Pilot Readiness Review.

Pilot-readiness remains the post-Sprint-14 critical path. No additional feature expansion should be introduced before the Pilot requirements, hardware/deployment readiness, commissioning flow, and acceptance criteria are formally reconciled.