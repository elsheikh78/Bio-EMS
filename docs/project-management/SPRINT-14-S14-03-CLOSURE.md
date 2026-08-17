# Sprint 14 — S14-03 Authentication and Session Closure

## Status

**COMPLETE / MERGED / VERIFIED**

S14-03 established the accepted frontend authentication, session-restoration, and authorization-aware routing architecture for BIO-EMS.

## Delivered Scope

- authenticated current-principal support through the existing backend auth domain;
- strict frontend authentication response validation;
- versioned session persistence and restoration;
- local expiry handling and explicit Logout behavior;
- the authenticated `protectedRequest` boundary for protected frontend API calls;
- generation-scoped invalidation so stale protected requests cannot invalidate a newer session;
- accessible Login and safe internal return routing;
- centralized frontend permission vocabulary and authorization-aware navigation;
- protected route enforcement including the Users route;
- backend authorization preserved as authoritative;
- ADR-021 accepted as the normative authentication/session design.

## Verification Evidence

- implementation branch: `agent/s14-03-auth-session`;
- reviewed head: `b9d4bd24a751bbdbcb2e97436c023016e9167f86`;
- PR #12 merged;
- accepted PR CI run: `31589643421`;
- backend tests at accepted head: 378/378 passing;
- frontend tests at accepted head: 130/130 passing;
- merge commit: `3cbe2e66bd893d837b4753460d8392dd4307eb41`.

Post-merge verification confirmed that `main` contained the exact reviewed S14-03 head before subsequent Sprint 14 work proceeded.

## Architectural Boundary

Frontend permission checks remain a presentation/navigation control, not the security authority. Protected frontend feature requests must continue through the accepted authenticated request boundary and must preserve the session-generation behavior established in S14-03.

## Closure Decision

S14-03 is formally closed. Later Sprint 14 stories must preserve ADR-021, current-generation `401` invalidation semantics, stale-generation protection, and ordinary protected-operation `403` session preservation unless a separately reviewed architecture change supersedes them.
