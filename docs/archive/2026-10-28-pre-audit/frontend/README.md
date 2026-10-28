# BIO-EMS Frontend

This directory contains the current React/TypeScript/Vite application. Source review: 30 September 2026, `main@6efd78a`. Sprint 14 notes below are historical foundation evidence.

Integrated work:

- S14-01 frontend architecture and quality foundation — complete.
- S14-02 professional responsive AppShell and navigation — complete.
- S14-03 Login, session lifecycle, and authorization-aware routing — complete.
- S14-04 operational Dashboard — complete.
- S14-05 Monitored Areas — complete, merged, and verified.

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

Operational routes also include `/live-board`, `/notification-deliveries`, `/sensors-calibration`, `/reports`, `/commissioning` and `/backup-restore`. System Owner has separate login, installation, provisioning, communication, licensing and backup routes under `/system-owner`. Backend authorization remains authoritative. Monitored Area is presentation terminology for
the existing Room domain.

## S14-05 Delivered Scope

- S14-05A contracts and data access — complete.
- S14-05B Site and Monitored Area hierarchy — complete.
- S14-05C Sensor inventory and threshold metadata — complete.
- S14-05D refresh, retry, integration, and hardening — complete.

The complete S14-05 scope was integrated through PR #19. Sprint 14 closure and current
quality evidence are recorded in `../docs/project-management/SPRINT-14-CLOSURE.md`.
