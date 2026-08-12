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

**Status: PLANNED / NOT STARTED**

### Objective

Replace the Dashboard placeholder with the first production-facing operational screen built on the S14-01 through S14-03 frontend foundation.

The page must present existing backend Dashboard data through the authenticated frontend without introducing new backend domain behavior or weakening the accepted authentication/session architecture.

### Existing Backend Contracts

S14-04 consumes the existing protected Dashboard endpoints only:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/latest-telemetry`
- `GET /api/v1/dashboard/rooms/status`
- `GET /api/v1/dashboard/alarm-statistics`

All Dashboard requests remain protected by the existing `DASHBOARD_READ` permission and are issued only through the approved authenticated request boundary.

### In Scope

- replace the `/dashboard` placeholder with an operational Dashboard page;
- expose strict frontend contracts/schemas for the four existing Dashboard responses at the API boundary;
- fetch Dashboard data only through the S14-03 authenticated `protectedRequest` flow;
- present high-value summary KPIs from the existing summary response;
- present latest telemetry in a readable operational view;
- present room/area status using the existing rooms/status response;
- present alarm statistics using the existing alarm-statistics response;
- provide explicit loading, partial-loading where appropriate, empty, recoverable error, and refreshed-data states;
- provide a user-controlled refresh action without creating background polling unless separately approved;
- preserve authorization-aware routing and existing `DASHBOARD_READ` route policy;
- preserve current AppShell navigation, responsive layout, keyboard access, focus behavior, localization structure, reduced-motion behavior, and accessibility conventions;
- add focused tests for data contracts, authenticated request wiring, success rendering, loading, empty/error behavior, refresh behavior, permission routing regression, and protected-request/session invalidation integration;
- preserve current Backend, SQLite, MQTT, telemetry ingestion, alarm engine, and authentication behavior.

### Out of Scope

- new or modified Backend Dashboard endpoints;
- changes to SQLite schema or migrations;
- changes to MQTT, telemetry ingestion, telemetry trust boundaries, or Device lifecycle;
- charts requiring a new visualization library unless separately approved after a demonstrated product need;
- historical telemetry exploration, time-range selectors, analytics, exports, or reporting;
- live WebSocket/SSE updates or background polling;
- alarm acknowledgment or resolution operations from the Dashboard;
- Device management, configuration editing, Site/Room/Sensor CRUD, or User management;
- new roles, permissions, route-policy vocabulary, or authorization semantics;
- refresh tokens, server sessions, token revocation, or changes to ADR-021;
- unrelated frontend refactors or dependency upgrades.

### UX and Product Expectations

The Dashboard should answer, at a glance:

1. What is the current monitored-system status?
2. Are there active or abnormal alarms requiring attention?
3. Which monitored rooms/areas are normal or abnormal?
4. What are the most recent telemetry readings available from the existing API?

The first increment should favor operational clarity over visual complexity. Dense decorative charts are not required for S14-04. Cards, status summaries, compact tables/lists, and clear severity/status presentation are acceptable where they represent the existing backend data accurately.

### Implementation Slices

#### S14-04A — Dashboard Contracts and Data Access

- characterize the exact current JSON shapes of all four Dashboard endpoints;
- add strict frontend validation schemas/types;
- add a Dashboard data-access layer using `protectedRequest` only;
- reject malformed success responses at the frontend API boundary;
- establish query keys and cache behavior without continuous polling.

#### S14-04B — Summary and Alarm Overview

- implement the Dashboard page shell/content heading;
- render summary KPIs from `/summary`;
- render alarm statistics from `/alarm-statistics`;
- provide loading, empty, and recoverable error presentation.

#### S14-04C — Room Status and Latest Telemetry

- render room/area status from `/rooms/status`;
- render latest telemetry from `/latest-telemetry`;
- ensure responsive behavior for narrow and wide layouts;
- preserve semantic headings and accessible status communication.

#### S14-04D — Refresh, Integration, and Hardening

- provide explicit user refresh/retry behavior;
- verify current-generation protected-request/session invalidation behavior remains intact;
- add route, authorization, accessibility, malformed-response, empty-state, and regression tests;
- complete final frontend CI gates and code review before merge.

### Acceptance Criteria

S14-04 is complete only when all of the following are true:

1. `/dashboard` no longer renders `FeaturePlaceholderPage` and instead renders the operational Dashboard.
2. The four existing Dashboard endpoints are consumed without any backend contract or route change.
3. Every Dashboard network request uses the authenticated `protectedRequest` boundary; no caller supplies an Authorization header directly.
4. Dashboard success payloads are strictly validated before being exposed to presentation code.
5. Malformed success responses fail safely and do not render unvalidated operational values.
6. A User without `DASHBOARD_READ` cannot render the Dashboard route through the existing centralized route policy.
7. A protected-request `401` continues to invalidate only the applicable current authentication generation according to ADR-021/S14-03 behavior.
8. Ordinary protected-operation `403` behavior does not incorrectly clear an authenticated session.
9. Loading, empty, recoverable error, and successful states are covered by automated tests.
10. User-controlled refresh/retry is available and does not introduce continuous background polling.
11. The page is usable at mobile and desktop breakpoints and does not regress the AppShell navigation behavior.
12. Interactive controls are keyboard accessible and status/error information is exposed accessibly.
13. No new charting/runtime dependency is added without a separately approved need.
14. No Backend, SQLite, MQTT, telemetry ingestion, Device lifecycle, or Alarm Engine behavior changes are included.
15. Frontend typecheck, lint, formatting, tests, and build pass before merge; Backend CI remains unaffected/passing.

### Required Test Evidence

At minimum, automated tests must demonstrate:

- strict validation of each Dashboard endpoint success contract;
- successful authenticated requests to all four endpoint paths;
- summary KPI rendering;
- alarm-statistics rendering;
- room-status rendering;
- latest-telemetry rendering;
- loading and empty-state behavior;
- recoverable network/server/malformed-response behavior;
- manual refresh/retry behavior;
- authorization-route regression for `DASHBOARD_READ`;
- no direct caller-supplied Authorization header path;
- session invalidation regression coverage for protected Dashboard requests;
- responsive/accessibility-critical behavior appropriate to the implemented components.

### Implementation Gate

No S14-04 implementation branch should be created until:

- this scope is merged to `main`;
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

As of S14-04 scope planning:

- `main` before this scope update: `45f20af1d5aee6165b05a6242c5543d33624a0fb`;
- S14-01: complete;
- S14-02: complete;
- S14-03: complete and verified;
- S14-04: planned, not started;
- Sprint 14: **IN PROGRESS**.

## Next Gate

Merge this S14-04 scope into `main`, synchronize the developer local repository exactly to the resulting `origin/main`, verify a clean zero-divergence baseline, and only then create the S14-04 implementation branch.
