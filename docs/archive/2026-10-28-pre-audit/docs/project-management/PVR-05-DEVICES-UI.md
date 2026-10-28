# PVR-05 — Devices operational UI

## Decision

PVR-05 replaces the staged Devices route with the existing registry and health contracts. DEVICE_READ users can inspect identity, Site ownership, lifecycle, last communication, and the server-derived health policy. DEVICE_MANAGE users can edit bounded metadata and execute the existing activate/disable transitions.

## Boundaries

- Lifecycle rules remain server-authoritative; the UI does not synthesize a state.
- Health is loaded per Device and remains distinct from lifecycle status.
- This review does not claim field commissioning or historical health evidence.

## Acceptance

- Runtime responses are strictly validated.
- Management controls are hidden without DEVICE_MANAGE.
- Loading, empty, retry, mutation-conflict, health, and metadata-edit paths are represented.
- Frontend gates and GitHub CI are required before closure.
