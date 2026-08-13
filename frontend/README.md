# BIO-EMS Frontend

This directory contains the Sprint 14 browser application.

Integrated work:

- S14-01 frontend architecture and quality foundation — complete.
- S14-02 professional responsive AppShell and navigation — complete.
- S14-03 Login, session lifecycle, and authorization-aware routing — complete.
- S14-04 operational Dashboard — complete.
- S14-05 Monitored Areas — in progress.

On `agent/s14-05-monitored-areas`, S14-05A and S14-05B are complete and pushed. S14-05C is next.

## Prerequisites

- Node.js 22 or newer
- Backend dependencies and environment described in `../backend/README.md`

## Environment

Copy `.env.example` to `.env` and configure:

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Only public browser configuration may use the `VITE_` prefix.

## Local Development

Backend:

```powershell
npm.cmd install
npm.cmd run dev
```

Frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

## Quality Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:run
npm.cmd run test:coverage
npm.cmd run build
```

## Authentication and Authorization Boundary

S14-03 established versioned browser session persistence, restoration, expiry handling, Login/Logout, the authenticated protected-request boundary, generation-scoped invalidation, and authorization-aware routing/navigation. Backend authentication and authorization remain authoritative.

## Current Routes

The application includes `/`, `/dashboard`, `/monitored-areas`, `/alarms`, `/devices`, `/configuration`, and `/users`, subject to the centralized route policy.

`/dashboard` is operational. `/monitored-areas` is the active S14-05 feature. Monitored Area is presentation terminology for the existing Room domain.

## S14-05 Progress

- S14-05A contracts and data access — complete at `90e39af`.
- S14-05B Site and Monitored Area hierarchy — complete at `bd442e9`.
- S14-05C Sensor inventory and threshold metadata — next / not started.
- S14-05D refresh, integration, and hardening — not started.

The latest recorded S14-05B frontend gate passed 21/21 test files and 189/189 tests.
