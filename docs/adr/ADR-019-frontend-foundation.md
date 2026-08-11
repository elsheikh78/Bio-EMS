# ADR-019

## Title

Frontend Architecture and Project Foundation

## Status

Accepted

## Date

2026-08-11

## Context

BIO-EMS has an implemented TypeScript/Express backend but no browser application.
Sprint 14 needs a maintainable frontend foundation before operational screens are
introduced. The foundation must preserve current backend contracts and avoid
presenting proposed Asset or Monitoring Point concepts as implemented.

## Decision

The frontend is an independent application in `frontend/` using React, TypeScript,
and Vite. React Router provides client routing, TanStack Query manages server state,
Zod validates public environment and future external contracts, and Material UI is
configured through reusable design tokens.

The application is English-first and light-only during Sprint 14. Localization is
isolated behind resource and direction abstractions so later Arabic and RTL work does
not require feature rewrites. Future presentation may call current Rooms “Monitored
Areas”, while API routes, schemas, and DTOs retain the implemented Room terminology.

The API base URL is supplied through `VITE_API_BASE_URL`; it is validated at runtime
and is never hard-coded into feature code. Only variables prefixed with `VITE_` are
browser-visible and they must never contain secrets.

Operational polling targets are 15 seconds for alarms, telemetry, and monitored-area
status, and 60 seconds for dashboard summary. These constants do not initiate network
requests in S14-01. Future data freshness labels are `Fresh`, `Stale`, and `No Data`;
`Offline` must not be inferred without a documented backend contract.

The access token strategy approved for S14-03 is `sessionStorage`. This improves
same-tab continuity but exposes a bearer token to successful cross-site scripting.
`localStorage` and refresh tokens are excluded. Mitigations include avoiding dynamic
script sources and unsafe HTML, enforcing a frontend-host CSP, minimizing third-party
scripts, never logging authorization data, and clearing the token on logout or
authentication failure. S14-01 does not implement token storage or login behavior.

The backend enables an exact-origin CORS allowlist and Helmet headers for the JSON
API. Production has no implicit allowed browser origin, wildcard origins are invalid,
and the documented development default is `http://localhost:5173`. Because the
backend does not host frontend assets, the frontend hosting layer remains responsible
for the effective application CSP; API headers must not be represented as protecting
the separate browser bundle.

## Consequences

- Frontend dependencies and quality gates are isolated from backend installation.
- Feature routes can be added without changing the foundation providers.
- Browser integration requires an explicit API URL and production CORS allowlist.
- `sessionStorage` requires a security-focused implementation and review in S14-03.
- The Room-to-Monitored-Area presentation adapter remains future feature work.

## Explicit Boundaries

S14-01 provides only architecture, providers, tokens, validation, an API client
boundary, tests, CI, and a developer placeholder. It does not implement login,
session behavior, an application shell, dashboard widgets, alarms, User Management,
Assets, Monitoring Points, notifications, refresh tokens, Arabic UI, dark mode,
deployment, or production hosting.

## References

- `docs/adr/ADR-005-monitoring-points.md`
- `docs/adr/ADR-008-asset-centric-design.md`
- `frontend/`
- `backend/src/config/cors.config.ts`
- `backend/src/middleware/browser-security.middleware.ts`
