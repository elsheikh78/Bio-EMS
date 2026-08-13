# Sprint 14 Plan — Frontend Application

## Status

**IN PROGRESS — S14-05C NEXT**

Sprint 14 establishes the production-facing BIO-EMS frontend on top of the backend and domain capabilities completed through Sprint 13.

Git history, merged pull requests, accepted ADRs, and scoped feature-branch commits are the authoritative implementation evidence.

## Sprint Objective

Deliver a professional, responsive, secure, localized-ready frontend that consumes existing backend contracts without duplicating backend authorization or inventing unsupported domain behavior.

## Current Sprint 14 Summary

| Slice | Status | Evidence |
| --- | --- | --- |
| S14-01 Frontend foundation | COMPLETE / MERGED / CLOSED | PR #10 |
| S14-02 AppShell and navigation | COMPLETE / MERGED / VERIFIED | PR #11, merge `edd74cc7...` |
| S14-03 Authentication/session/routing | COMPLETE / MERGED / VERIFIED | PR #12, merge `3cbe2e66...` |
| S14-04 Operational Dashboard | COMPLETE / MERGED / VERIFIED | PR #15, merge `04c7533c...` |
| S14-05A Monitored Areas contracts/data | COMPLETE / COMMITTED / PUSHED | `90e39af` |
| S14-05B Monitored Areas hierarchy UI | COMPLETE / COMMITTED / PUSHED | `bd442e9` |
| S14-05C Sensor inventory/thresholds | NOT STARTED / NEXT | — |
| S14-05D Refresh/integration/hardening | NOT STARTED | — |

S14-05A/B are complete on `agent/s14-05-monitored-areas` but are not yet merged to `main`.

## S14-01 — Frontend Architecture and Project Foundation

**Status: COMPLETE / MERGED / CLOSED**

Delivered:

- React + TypeScript + Vite application foundation;
- provider composition and design-token baseline;
- typed localization and RTL-ready resource contracts;
- public frontend environment validation;
- API client boundary;
- independent frontend typecheck, lint, format, test, coverage, and build gates;
- browser-readiness/security foundations documented by ADR-019.

Evidence:

- branch `agent/s14-01-frontend-foundation`;
- PR #10 merged;
- merge commit `cc699124bdf49d67cd692d559899642b8d0cfabe`.

## S14-02 — Professional Application Shell and Navigation

**Status: COMPLETE / MERGED / VERIFIED**

Delivered:

- nested-route `AppShell`;
- permanent desktop navigation and temporary mobile/tablet drawer;
- localized presentational navigation;
- semantic landmarks, skip link, focus restoration, Escape dismissal, reduced-motion support, and responsive overflow protection;
- stable route surfaces for later frontend features;
- ADR-020.

Evidence:

- branch `agent/s14-02-application-shell`;
- reviewed head `941b6bd4c07d82291db5118468b3fbb7e6f8e80b`;
- PR #11 merged;
- merge commit `edd74cc7c339fdd09bd183d84c415e0d7c092c8b`;
- final accepted frontend test evidence: 7 files / 43 tests;
- final GitHub CI run `31529786071`: success.

See `SPRINT-14-S14-02-APPLICATION-SHELL.md`.

## S14-03 — Authentication, Session, and Authorization-Aware Routing

**Status: COMPLETE / MERGED / VERIFIED**

Delivered:

- authenticated current-principal support;
- strict frontend auth contracts;
- versioned `sessionStorage` lifecycle;
- restoration, local expiry, Login, Logout, and safe requested-route return;
- authenticated `protectedRequest` boundary;
- generation-scoped session invalidation protecting newer sessions from stale requests;
- centralized frontend permission vocabulary;
- authorization-aware route/navigation behavior and Users route proof;
- backend authorization retained as authoritative;
- ADR-021.

Evidence:

- branch `agent/s14-03-auth-session`;
- reviewed head `b9d4bd24a751bbdbcb2e97436c023016e9167f86`;
- PR #12 merged;
- CI run `31589643421` accepted;
- backend tests 378/378;
- frontend tests 130/130;
- merge commit `3cbe2e66bd893d837b4753460d8392dd4307eb41`.

See `SPRINT-14-S14-03-CLOSURE.md`.

## S14-04 — Operational Dashboard Frontend

**Status: COMPLETE / MERGED / VERIFIED**

Delivered:

- strict Dashboard frontend contracts;
- authenticated API/query layer for the four existing Dashboard endpoints;
- summary KPIs;
- monitored-area status;
- latest telemetry;
- alarm lifecycle/severity statistics;
- loading, empty, error, success, and explicit refresh behavior;
- localization/accessibility/responsive integration;
- authentication/session regression hardening.

Existing protected endpoints consumed:

- `GET /api/v1/dashboard/summary`;
- `GET /api/v1/dashboard/latest-telemetry`;
- `GET /api/v1/dashboard/rooms/status`;
- `GET /api/v1/dashboard/alarm-statistics`.

Evidence:

- branch `agent/s14-04-operational-dashboard`;
- reviewed head `9774fb3e08345fb600dc511b0a4c8e847c6e9ef3`;
- PR #15 merged;
- final recorded frontend gate 17/17 files and 161/161 tests;
- merge commit `04c7533ca78b721184467d56e94329209f20ea75`.

See `SPRINT-14-S14-04-CLOSURE.md`.

## S14-05 — Monitored Areas Frontend

**Status: IN PROGRESS — A/B COMPLETE, C NEXT**

### Objective

Replace the `/monitored-areas` placeholder with a production-facing read-only hierarchy using existing Site, Room, and Sensor backend domains only.

For presentation purposes, **Monitored Area maps to the existing Room domain**.

Hierarchy:

**Site → Monitored Area (Room) → Sensor**

No Asset, Monitoring Point, or new Area backend abstraction is introduced.

### Existing Backend Basis

S14-05 consumes the existing protected Site, Room, and Sensor read capabilities and issues requests only through the S14-03 authenticated request boundary.

Relationships are joined client-side using established identifiers:

- Room → Site through `site_id`;
- Sensor → Room through `room_id`.

### S14-05A — Contracts and Data Access

**Status: COMPLETE / COMMITTED / PUSHED**

Delivered:

- strict Site, Room, and Sensor frontend schemas/types;
- dedicated Monitored Areas API functions;
- authenticated requests through `protectedRequest`;
- stable feature query keys/hooks;
- focused contract/API/query tests.

Evidence:

- commit `90e39af` — `feat(frontend): add monitored areas data contracts and queries`.

### S14-05B — Site and Monitored Area Hierarchy

**Status: COMPLETE / COMMITTED / PUSHED**

Delivered:

- `MonitoredAreasPage` and `/monitored-areas` route integration;
- Site → Room hierarchy with Room presented as Monitored Area;
- Site/Room identification and active-state metadata;
- Room → Sensor association and initial Sensor inventory rendering;
- Site-with-no-Room and Room-with-no-Sensor states;
- localized production-facing copy and alternative-resource regression coverage;
- focused hierarchy/rendering tests.

Final recorded S14-05B gate:

- typecheck: passed;
- lint: passed;
- full frontend suite: 21/21 test files, 189/189 tests;
- scoped Prettier: passed;
- `git diff --check`: passed apart from non-blocking LF/CRLF notices.

Evidence:

- commit `bd442e9` — `feat(frontend): add monitored areas hierarchy view`.

### S14-05C — Sensor Inventory per Monitored Area

**Status: NOT STARTED / NEXT**

Planned scope:

- complete Sensor inventory presentation under the correct Monitored Area;
- present existing Sensor type, unit, channel, and enabled state;
- present configured threshold metadata where available: `min_value`, `warning_low`, `alarm_low`, `warning_high`, `alarm_high`, `max_value`;
- keep configuration metadata clearly distinct from live telemetry, online/offline health, and alarm state;
- strengthen focused hierarchy/rendering tests for threshold and partial metadata behavior.

### S14-05D — Refresh, Integration, and Hardening

**Status: NOT STARTED**

Planned scope:

- explicit user refresh/retry behavior;
- route authorization regression;
- current/stale authentication-generation regression;
- ordinary protected-operation `403` session-preservation regression;
- malformed-response, localization, accessibility, responsive-critical, and empty-state hardening;
- complete frontend quality gates and final code review before PR/merge.

### S14-05 Acceptance Boundary

S14-05 must:

- use existing Site/Room/Sensor backend contracts only;
- validate consumed success payloads before presentation;
- issue all protected requests through `protectedRequest`;
- associate Rooms with Sites and Sensors with Rooms correctly;
- represent configuration active/enabled state without manufacturing live health;
- provide clear loading, empty, partial-empty, error, success, refresh, and retry behavior by completion;
- preserve centralized authorization, localization, accessibility, responsiveness, and S14-03 session semantics;
- introduce no unrelated backend, database, MQTT, telemetry-ingestion, Device-lifecycle, Alarm-Engine, dependency, or deployment changes.

See `SPRINT-14-S14-05-PROGRESS.md` for the current feature-branch evidence.

## Sprint 14 Working Rules

1. `main` is the integration baseline; feature work occurs on scoped branches and is merged through reviewed Pull Requests.
2. Backend authorization remains authoritative.
3. Frontend response data crossing external/API boundaries is validated before use where the story establishes strict contracts.
4. Architectural decisions are recorded in ADRs and preserved unless explicitly superseded.
5. Feature stories do not invent unavailable backend domains or fabricated operational data.
6. Documentation distinguishes merged `main` state from feature-branch progress.
7. Quality gates and repository cleanliness are required before merge.
8. Unrelated refactors, dependency upgrades, schema changes, release work, and deployment work require separately approved scope.

## Current Next Action

Complete documentation reconciliation, synchronize it through PR #17, then begin **S14-05C** on the existing `agent/s14-05-monitored-areas` feature branch from the already pushed S14-05B baseline.
