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

## S14-04 — Next Frontend Increment

**Status: NOT STARTED**

The detailed scope of S14-04 must be defined and reviewed before implementation begins.

Planning constraints:

- build on the merged S14-01 through S14-03 foundation;
- do not weaken ADR-021 authentication/session guarantees;
- use centralized route and permission policy rather than feature-local authorization vocabulary;
- keep backend authorization authoritative;
- preserve responsive and accessible shell behavior;
- preserve CI and test coverage;
- avoid unrelated backend, database, MQTT, telemetry, or domain changes unless explicitly approved by the S14-04 scope.

No implementation branch or code change should be treated as S14-04 work until its scope and acceptance criteria are recorded.

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

As of the S14-03 merge:

- `main`: `3cbe2e66bd893d837b4753460d8392dd4307eb41`;
- S14-01: complete;
- S14-02: complete;
- S14-03: complete and verified;
- S14-04: not started;
- Sprint 14: **IN PROGRESS**.

## Next Gate

Define and approve the S14-04 objective, boundaries, implementation slices, acceptance criteria, and required tests before any S14-04 code is written.
