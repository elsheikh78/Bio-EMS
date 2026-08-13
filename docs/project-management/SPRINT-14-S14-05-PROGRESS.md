# Sprint 14 — S14-05 Monitored Areas Progress

## Status

**IN PROGRESS — S14-05A COMPLETE / S14-05B COMPLETE / S14-05C NEXT**

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

**Status: NOT STARTED / NEXT IMPLEMENTATION SLICE**

Next scope:

- complete Sensor inventory presentation under the correct Monitored Area;
- present existing sensor type, unit, channel, enabled state, and configured threshold metadata;
- include existing `min_value`, `warning_low`, `alarm_low`, `warning_high`, `alarm_high`, and `max_value` values where available;
- keep configuration state distinct from live telemetry, alarm, or online/offline state;
- strengthen hierarchy/rendering tests around threshold and partial metadata behavior.

No S14-05C implementation has been started in this documentation reconciliation.

## S14-05D — Refresh, Integration, and Hardening

**Status: NOT STARTED**

Planned after S14-05C:

- explicit refresh/retry behavior;
- authorization-route regression;
- authentication/session-boundary regression;
- malformed-response, localization, accessibility, responsive-critical, and empty-state hardening;
- complete frontend quality gates and final code review before PR/merge.

## Current Integration State

S14-05A and S14-05B are committed and pushed on `agent/s14-05-monitored-areas` but are not yet integrated into `main`. The documentation branch records this feature-branch progress without representing it as merged production baseline.

Sprint 14 remains **IN PROGRESS**.
