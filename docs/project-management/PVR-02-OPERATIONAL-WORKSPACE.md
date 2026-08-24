# PVR-02 — Operational Workspace

Status: IMPLEMENTED / VERIFICATION PENDING
Date: 2026-08-24
Branch: `agent/pvr-02-operational-workspace`
Base: PVR-01 merged at `3ab9f1139e5888ff11e7fc2784c9960624c0b3ab`

## Business requirement

The authenticated root route must be a useful, permission-aware operational entry point. It must
not present the application shell as the only completed capability or refer operators to stale
Sprint placeholders.

## Implemented scope

- replaces the old shell-readiness placeholder;
- presents role-filtered links to currently available controlled workflows;
- exposes an explicit platform-completion status without claiming staged tabs are complete;
- states that backend authorization remains authoritative;
- keeps Alarms, Devices, and remaining report families visibly scheduled for later PVR slices.

## Acceptance criteria

- ADMIN receives all permitted operational and administration entry points;
- VIEWER does not receive protected administration actions;
- staged functionality is labelled rather than implied complete;
- route policy remains the shared permission source;
- frontend quality gates and production build pass.

## Boundaries

PVR-02 does not implement Alarms, Devices, additional reporting families, provider delivery,
controller runtime, field commissioning, or customer acceptance.
