# Sprint 14 Plan — Frontend Application Foundation

## Status

**IN PROGRESS**

Sprint 14 establishes the production-facing frontend application foundation on top of the backend and domain capabilities completed through Sprint 13.

This plan was reconstructed from the repository history after S14-03 was merged. Git history and merged pull requests remain the authoritative evidence for completed work.

## Sprint Objective

Deliver a professional, responsive, secure frontend foundation for BIO-EMS that can support the upcoming operational screens without duplicating backend authorization or domain logic.

The sprint is organized as incremental sub-sprints. Each sub-sprint must preserve CI, existing backend contracts, architectural decisions, and repository cleanliness.

## S14-01 — Frontend Architecture and Project Foundation

**Status: COMPLETE / MERGED**

Purpose:

- establish the frontend application architecture and project foundation;
- introduce the frontend framework/tooling baseline;
- create maintainable application structure and provider boundaries;
- establish frontend testing, linting, formatting, and build gates;
- preserve existing backend behavior and contracts.

Evidence:

- branch: `agent/s14-01-frontend-foundation`;
- implementation commit: `5feb1915e4a2ad3985dd54451e4dbe9e99924678`;
- hardening commit: `864e0036954f20572412761103149173d7b1c1a0`;
- PR #10 merged;
- merge commit: `cc699124bdf49d67cd692d559899642b8d0cfabe`.

## S14-02 — Professional Application Shell and Navigation

**Status: COMPLETE / MERGED**

Purpose:

- provide the professional responsive BIO-EMS application shell;
- establish primary navigation and route structure;
- support desktop and mobile navigation behavior;
- establish accessibility-oriented shell behavior;
- prepare route surfaces for later feature implementation.

Evidence:

- branch: `agent/s14-02-application-shell`;
- PR #11 merged;
- merge commit: `edd74cc7c339fdd09bd183d84c415e0d7c092c8b`.

## S14-03 — Authentication, Session, and Authorization-Aware Routing

**Status: COMPLETE / MERGED / VERIFIED**

Purpose:

- establish the accepted frontend authentication/session architecture;
- add authenticated `GET /api/v1/auth/me` current-principal support;
- implement strict versioned `sessionStorage` persistence;
- restore and revalidate authenticated identity safely;
- enforce local expiry and explicit logout behavior;
- invalidate protected requests safely on authentication failure;
- prevent stale request generations from invalidating newer sessions;
- add accessible Login and safe requested-route return;
- centralize frontend permission vocabulary and authorization-aware navigation;
- keep backend authorization authoritative.

Architecture:

- ADR-021 records the accepted S14-03 authentication/session design.

Evidence:

- branch: `agent/s14-03-auth-session`;
- ADR commit: `0751dfba226f4bc390ea3fa94c25e702226e9d0a`;
- reviewed head: `b9d4bd24a751bbdbcb2e97436c023016e9167f86`;
- PR #12 merged after successful final code review;
- accepted PR CI run: `31589643421`;
- backend tests at accepted head: 378/378 passing;
- frontend tests at accepted head: 130/130 passing;
- merge commit: `3cbe2e66bd893d837b4753460d8392dd4307eb41`.

Post-merge verification confirmed that `main` points to the merge commit above and that the merge contains the exact reviewed S14-03 head as its second parent.

## S14-04 — Operational Dashboard Frontend

**Status: COMPLETE / MERGED / VERIFIED**

### Objective

Replace the Dashboard placeholder with the first production-facing operational screen built on the S14-01 through S14-03 frontend foundation.

The page presents existing backend Dashboard data through the authenticated frontend without introducing new backend domain behavior or weakening the accepted authentication/session architecture.

### Existing Backend Contracts

S14-04 consumes the existing protected Dashboard endpoints only:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/latest-telemetry`
- `GET /api/v1/dashboard/rooms/status`
- `GET /api/v1/dashboard/alarm-statistics`

All Dashboard requests remain protected by the existing `DASHBOARD_READ` permission and are issued only through the approved authenticated request boundary.

### Delivered Scope

- replaced the `/dashboard` placeholder with an operational Dashboard page;
- established strict frontend contracts/schemas for the four existing Dashboard responses;
- routed Dashboard data access through the S14-03 authenticated `protectedRequest` flow;
- presented summary KPIs from the existing summary response;
- presented latest telemetry in an operational view;
- presented room/area status using the existing rooms/status response;
- presented alarm statistics using the existing alarm-statistics response;
- implemented loading, empty, recoverable error, and refreshed-data behavior;
- provided user-controlled refresh without continuous background polling;
- preserved authorization-aware routing and the existing `DASHBOARD_READ` route policy;
- preserved AppShell navigation, localization structure, responsive behavior, and accessibility conventions;
- added focused contract, API, rendering, refresh, authorization, localization, and authentication-boundary tests;
- preserved existing Backend, SQLite, MQTT, telemetry ingestion, Alarm Engine, and authentication behavior.

### Implementation Slices

#### S14-04A — Dashboard Contracts and Data Access

Completed:

- characterized the existing Dashboard response shapes;
- added strict frontend validation schemas/types;
- added the Dashboard data-access layer through `protectedRequest`;
- rejected malformed success responses at the frontend API boundary;
- established Dashboard query keys without continuous polling.

#### S14-04B — Summary and Alarm Overview

Completed:

- implemented the operational Dashboard page;
- rendered summary KPIs;
- rendered alarm statistics;
- implemented loading, empty, and recoverable error behavior.

#### S14-04C — Room Status and Latest Telemetry

Completed:

- rendered monitored-room/area status;
- rendered latest telemetry;
- preserved responsive behavior;
- preserved semantic headings and accessible status communication.

#### S14-04D — Refresh, Integration, and Hardening

Completed:

- implemented explicit user refresh/retry behavior;
- verified current-generation protected-request/session invalidation behavior;
- added authorization, accessibility, malformed-response, empty-state, localization, refresh, and regression coverage;
- added Dashboard-specific authentication-boundary hardening for `401`, stale-generation `401`, and ordinary protected-operation `403`;
- completed final frontend quality gates and code review before merge.

### Verification and Evidence

- implementation branch: `agent/s14-04-operational-dashboard`;
- reviewed implementation head: `9774fb3`;
- PR #15 merged;
- PR CI workflow run #39 completed successfully;
- final local frontend test gate: 17/17 test files passing;
- final local frontend test gate: 161/161 tests passing;
- frontend typecheck passed;
- frontend lint passed;
- frontend formatting checks passed;
- `git diff --check` passed before final push;
- merge commit on `main`: `94c7533`.

Post-merge synchronization verified:

- local branch: `main`;
- local `main` and `origin/main`: zero ahead/behind divergence;
- working tree: clean.

## S14-05 — Monitored Areas Frontend

**Status: PLANNED / NOT STARTED**

### Objective

Replace the `/monitored-areas` placeholder with a production-facing read-only Monitored Areas screen built on the existing Site, Room, and Sensor backend domains.

For S14-05 presentation purposes, a **Monitored Area maps to the existing Room domain**. S14-05 does not introduce a new Asset, Monitoring Point, Area, or other backend domain abstraction.

The screen must allow an authorized user to understand the configured monitoring hierarchy:

**Site → Monitored Area (Room) → Sensor**

using existing backend contracts only.

### Existing Backend Basis

S14-05 consumes the existing protected configuration-reading capabilities for:

- Sites;
- Rooms;
- Sensors.

The current frontend `/monitored-areas` route already participates in the centralized authorization model through the existing configuration-read permission policy.

S14-05 must preserve backend authorization as authoritative and must issue protected requests only through the accepted S14-03 authenticated request boundary.

### Domain Mapping

The frontend hierarchy for S14-05 is:

- **Site** → existing Site domain;
- **Monitored Area** → existing Room domain;
- **Sensor** → existing Sensor domain.

The frontend may join the existing collections client-side using their established identifiers and relationships.

No new backend hierarchy or persistence model is introduced.

### In Scope

- replace the `/monitored-areas` placeholder with a read-only operational Monitored Areas page;
- add strict frontend validation contracts/types for the Site, Room, and Sensor success payloads consumed by this feature;
- add a dedicated Monitored Areas data-access layer using `protectedRequest` only;
- establish stable query keys/cache boundaries without continuous background polling;
- load the existing Site, Room, and Sensor collections required for the hierarchy;
- associate Rooms with their Sites using the existing `site_id` relationship;
- associate Sensors with their Rooms using the existing `room_id` relationship;
- present Sites as the top-level monitoring context;
- present Rooms as user-facing Monitored Areas;
- present the existing Room metadata required for operational identification, including available code/name/description/active information;
- present Sensors associated with each Monitored Area;
- present existing Sensor metadata where operationally useful, including available code/name, sensor type, unit, channel, enabled state, and configured threshold metadata;
- distinguish active/inactive or enabled/disabled configuration states using only existing contract values;
- provide explicit loading, empty, partial-empty, recoverable error, and successful states;
- provide user-controlled refresh/retry behavior without continuous background polling;
- preserve localization architecture and avoid hard-coded production-facing copy;
- preserve semantic headings, keyboard accessibility, status/error communication, responsive layout, and existing AppShell behavior;
- preserve the centralized authorization policy for `/monitored-areas`;
- add focused automated tests for contracts, authenticated API wiring, hierarchy association, rendering, empty/error states, refresh/retry, localization, authorization regression, and authentication/session-boundary behavior;
- preserve existing Backend, SQLite, MQTT, telemetry ingestion, Device lifecycle, Alarm Engine, Dashboard, and authentication behavior.

### Out of Scope

- creating, editing, activating, deactivating, or deleting Sites;
- creating, editing, activating, deactivating, or deleting Rooms/Monitored Areas;
- creating, editing, enabling, disabling, or deleting Sensors;
- new Backend Site, Room, or Sensor endpoints;
- Backend filtering/query endpoints introduced solely for this frontend;
- SQLite schema or migration changes;
- Asset domain introduction;
- Monitoring Point domain introduction;
- replacement or renaming of the existing Room backend domain;
- new telemetry ingestion behavior;
- historical telemetry exploration;
- charts or visualization-library additions;
- live WebSocket/SSE updates;
- continuous background polling;
- alarm acknowledgment/resolution operations;
- Device management;
- threshold/configuration editing;
- new roles, permissions, or authorization semantics;
- changes to ADR-021 authentication/session architecture;
- unrelated frontend refactors or dependency upgrades.

### UX and Product Expectations

The Monitored Areas screen should allow the user to answer:

1. Which Sites are currently configured?
2. Which Monitored Areas belong to each Site?
3. Which Sensors belong to each Monitored Area?
4. What type of parameter does each Sensor represent?
5. What unit and channel information is configured for the Sensor?
6. Is the Site/Monitored Area/Sensor configured as active or enabled where that information exists?
7. What configured threshold metadata is available for the Sensor?

The page must distinguish **configuration state** from **live operational telemetry state**.

S14-05 must not infer or manufacture live status, online/offline status, alarm state, or current telemetry values from Site/Room/Sensor configuration records when those values are not part of the consumed contracts.

Operational clarity and hierarchy comprehension take priority over decorative complexity.

### Implementation Slices

#### S14-05A — Contracts and Data Access

- characterize the exact current Site, Room, and Sensor success payloads consumed by the feature;
- add strict frontend validation schemas/types;
- add the Monitored Areas data-access layer using `protectedRequest` only;
- reject malformed success responses at the frontend API boundary;
- establish feature query keys and cache behavior;
- add focused contract and API tests.

#### S14-05B — Site and Monitored Area Hierarchy

- implement the Monitored Areas page heading and content structure;
- render Sites as the top-level hierarchy;
- associate and render Rooms beneath the correct Site;
- label Rooms as Monitored Areas in user-facing presentation;
- render available Site/Room identification and active-state metadata;
- provide Site/Room empty and partial-empty behavior;
- preserve responsive and accessible hierarchy presentation.

#### S14-05C — Sensor Inventory per Monitored Area

- associate Sensors with the correct Room using the existing relationship;
- render the Sensor inventory within each Monitored Area;
- present existing Sensor type, unit, channel, enabled state, and threshold metadata where available;
- handle Monitored Areas with no configured Sensors;
- avoid presenting configuration metadata as live telemetry or alarm status;
- add focused hierarchy and rendering tests.

#### S14-05D — Refresh, Integration, and Hardening

- provide explicit user refresh/retry behavior;
- verify authorization behavior for the existing `/monitored-areas` route policy;
- verify protected-request/session invalidation behavior remains intact;
- verify ordinary protected-operation `403` behavior does not incorrectly clear the authenticated session;
- add malformed-response, localization, accessibility, empty-state, responsive-critical, and regression coverage;
- run complete frontend quality gates;
- complete final code review before merge.

### Acceptance Criteria

S14-05 is complete only when all of the following are true:

1. `/monitored-areas` no longer renders `FeaturePlaceholderPage`.
2. The screen uses existing Site, Room, and Sensor backend capabilities without introducing a new backend domain.
3. User-facing Monitored Areas map explicitly to the existing Room domain.
4. Site, Room, and Sensor success payloads consumed by the feature are strictly validated before presentation.
5. Malformed success responses fail safely and do not expose unvalidated configuration values.
6. Every S14-05 network request uses the authenticated `protectedRequest` boundary.
7. No feature caller supplies an Authorization header directly.
8. Rooms are associated with the correct Site using the existing relationship.
9. Sensors are associated with the correct Room using the existing relationship.
10. Sites with no Rooms and Rooms with no Sensors are represented safely and clearly.
11. Configuration active/enabled state is not misrepresented as live operational health.
12. No unsupported online/offline, telemetry, or alarm state is manufactured from configuration records.
13. Loading, empty, partial-empty, recoverable error, and successful states are covered by automated tests.
14. User-controlled refresh/retry is available without continuous background polling.
15. Existing centralized authorization prevents unauthorized rendering of `/monitored-areas`.
16. Protected-request `401` behavior continues to respect current authentication-generation semantics.
17. Ordinary protected-operation `403` behavior does not incorrectly clear the authenticated session.
18. Production-facing copy participates in the existing localization architecture.
19. The screen remains usable at mobile and desktop breakpoints.
20. Interactive controls and status/error communication remain accessible.
21. No new runtime dependency is introduced without separately approved need.
22. No Backend, SQLite, MQTT, telemetry-ingestion, Device-lifecycle, Alarm-Engine, or authentication behavior change is included.
23. Frontend typecheck, lint, formatting, tests, and build pass before merge; Backend CI remains unaffected/passing.

### Required Test Evidence

At minimum, automated tests must demonstrate:

- strict validation of consumed Site payloads;
- strict validation of consumed Room payloads;
- strict validation of consumed Sensor payloads;
- successful authenticated requests to the existing Site, Room, and Sensor read paths used by the feature;
- rejection of malformed success responses;
- correct Site → Room association;
- correct Room → Sensor association;
- Site rendering;
- Monitored Area rendering;
- Sensor inventory rendering;
- Sites with no Rooms;
- Rooms with no Sensors;
- loading behavior;
- recoverable network/server/malformed-response behavior;
- manual refresh/retry behavior;
- localization of feature-facing copy;
- authorization-route regression for `/monitored-areas`;
- no direct caller-supplied Authorization header path;
- session invalidation regression coverage for protected Monitored Areas requests;
- ordinary protected-operation `403` session-preservation coverage;
- responsive/accessibility-critical behavior appropriate to the implemented components.

### Implementation Gate

No S14-05 implementation branch should be created until:

- this S14-05 scope and S14-04 status update are merged to `main`;
- the developer local repository is synchronized exactly with the resulting `origin/main`;
- the working tree, index, and untracked-file set are clean;
- local `main` and `origin/main` have zero ahead/behind divergence.

## Sprint 14 Working Rules

1. `main` is the integration baseline; feature work is performed on scoped branches and merged through reviewed pull requests.
2. Each sub-sprint must have explicit scope and acceptance criteria before implementation.
3. Architecture-sensitive changes require an ADR or an explicit update to an existing accepted ADR when appropriate.
4. Backend contracts and frontend contracts must be validated at their boundaries.
5. Authentication and authorization failures must fail closed.
6. Frontend authorization is presentation/control-flow enforcement only; backend authorization remains authoritative.
7. CI, formatting, linting, type checking, build, and relevant automated tests must pass before merge.
8. Race conditions and stale asynchronous operations must be tested when session or protected-data lifecycle is involved.
9. Unrelated refactors are excluded from scoped sub-sprints unless separately approved.
10. Sprint 14 receives a dedicated closure document only after all approved Sprint 14 work is complete.

## Current Baseline

As of S14-05 scope planning:

- `main` contains merged S14-01 through S14-04 work;
- S14-01: complete;
- S14-02: complete;
- S14-03: complete and verified;
- S14-04: complete, merged, and verified;
- S14-05: planned, not started;
- S14-04 merge commit on `main`: `94c7533`;
- developer local `main` was verified synchronized with `origin/main` at zero ahead/behind divergence before S14-05 planning;
- Sprint 14: **IN PROGRESS**.

## Next Gate

Merge this S14-05 scope and S14-04 status update into `main`, synchronize the developer local repository exactly to the resulting `origin/main`, verify a clean zero-divergence baseline, and only then create the S14-05 implementation branch.