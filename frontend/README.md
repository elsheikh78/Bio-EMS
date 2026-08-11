# BIO-EMS Frontend Foundation

This directory contains the S14-01 browser-application foundation and the S14-02
professional responsive application shell. S14-02 adds presentational navigation and
explicit feature placeholders only. Login, operational dashboard widgets,
monitored-area data, and the Alarm Center remain deferred.

## Prerequisites

- Node.js 22 or newer
- The backend dependencies and environment described in `../backend/README.md`

## Environment

Copy `.env.example` to a local `.env` and set:

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Only public browser configuration may use the `VITE_` prefix. Never place tokens,
credentials, or other secrets in frontend environment files.

## Local Development

Start the backend from `backend/`:

```powershell
npm.cmd install
npm.cmd run dev
```

In another terminal, start the frontend from `frontend/`:

```powershell
npm.cmd install
npm.cmd run dev
```

Vite serves the frontend at `http://localhost:5173`. The backend development CORS
default allows exactly this origin. Deployments must set
`BIOEMS_CORS_ALLOWED_ORIGINS` to a comma-separated list of exact HTTPS origins.

## Quality Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:run
npm.cmd run test:coverage
npm.cmd run build
```

## Security Boundary

The frontend is hosted separately from the JSON API. Helmet protects API responses,
but the frontend hosting layer must enforce the browser application's CSP. S14-01
does not store an access token. The approved `sessionStorage` implementation, logout,
expiry handling, and authorization-aware routing belong to S14-03.

## S14-02 Route Boundary

The shell defines `/`, `/dashboard`, `/monitored-areas`, `/alarms`, `/devices`, and
`/configuration`; feature routes are honest placeholders and perform no API requests.
`Monitored Areas` is display terminology for current Room contracts. There are no
User Management, Asset, Monitoring Point, Login, protected-route, role, or permission
decisions in S14-02.
