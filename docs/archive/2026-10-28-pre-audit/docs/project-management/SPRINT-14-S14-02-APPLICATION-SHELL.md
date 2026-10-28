# Sprint 14 — S14-02 Application Shell and Navigation

## Status

**COMPLETE / MERGED / VERIFIED**

S14-02 established the professional responsive BIO-EMS application shell and the stable navigation/routing surface that later Sprint 14 frontend stories build on.

This document is a retrospective closure and current-state record reconstructed from the merged pull request, ADR-020, GitHub CI evidence, and the later Sprint 14 baseline. Git history and merged pull requests remain the authoritative implementation evidence.

## Objective

Deliver a production-oriented frontend shell that is professional, responsive, accessible, localization-ready, and structurally ready for later authentication and operational feature work without introducing backend coupling, fabricated operational data, or premature authorization behavior.

## Delivered Scope

S14-02 delivered:

- a route-layout `AppShell` built around React Router nested routes and `Outlet`;
- centralized presentational navigation configuration;
- a fixed application header and responsive navigation structure;
- a permanent desktop navigation drawer;
- a temporary tablet/mobile drawer;
- breakpoint-aware layering so the desktop AppBar remains above the permanent Drawer while the temporary mobile Drawer overlays the header and content;
- a functional keyboard-reachable skip link;
- semantic header, navigation, main, and page landmark structure;
- active-route indication using `aria-current`;
- keyboard-operable navigation and Escape dismissal for the temporary drawer;
- focus restoration after temporary navigation dismissal/navigation;
- reduced-motion-aware shell behavior;
- responsive overflow protection including the 320 CSS pixel layout contract;
- localized shell and navigation copy through the replaceable localization resources established in S14-01;
- explicit feature placeholder surfaces for functionality intentionally deferred to later stories;
- Not Found rendering inside the authenticated-independent shell structure;
- `/foundation` compatibility redirect to `/`;
- ADR-020 documenting the accepted application-shell architecture.

## Route Surface at S14-02 Completion

The approved S14-02 route surface was:

- `/` — operational workspace landing surface;
- `/dashboard` — placeholder surface at S14-02 completion;
- `/monitored-areas` — placeholder surface using the presentation label for the existing Room concept;
- `/alarms` — placeholder surface;
- `/devices` — placeholder surface;
- `/configuration` — placeholder surface;
- `/foundation` — redirect to `/`;
- unmatched routes — Not Found rendered inside the shell.

The `/users` route was intentionally absent from S14-02 because role-aware navigation and authorization were deferred wholly to S14-03.

## Architectural Decisions

### Application Shell

`AppShell` is the stable route-layout boundary for the frontend application. Feature pages are rendered through nested routing rather than duplicating shell structure per route.

### Navigation Registry

Navigation was intentionally presentational in S14-02. The navigation registry contained route identity, path, localization label key, and visibility only. It did not contain roles, permissions, or frontend security decisions.

### Localization Boundary

The runtime remained English/LTR during S14-02, but all visible shell/navigation copy was served through replaceable localization resources so later language/RTL work would not require replacing the shell architecture.

### Domain Terminology

`Monitored Areas` was approved as presentation terminology for the already-implemented Room contracts. S14-02 did not introduce Asset, Monitoring Point, or another backend domain abstraction.

### Backend Independence

S14-02 performed no backend API consumption and changed no backend contracts, database behavior, telemetry ingestion, MQTT behavior, alarm-domain behavior, or device lifecycle behavior.

## Accessibility Contract

Accessibility was part of the S14-02 shell contract rather than a later polish task. The delivered behavior included:

- semantic landmarks;
- one main content region;
- keyboard-reachable skip navigation;
- visible focus behavior;
- active-route `aria-current` semantics;
- accessible menu-control names;
- Escape dismissal of the temporary drawer;
- focus restoration after drawer dismissal/navigation;
- keyboard-operable navigation;
- reduced-motion support;
- responsive layout behavior designed not to overflow at 320 CSS pixels.

## Responsive Layering Contract

A specific corrective hardening pass established the accepted Material UI layering behavior:

- desktop AppBar above the permanent Drawer layer;
- temporary mobile Drawer above the AppBar and application content;
- responsive shell remains usable at narrow viewport widths;
- navigation dismissal and focus behavior remain functional across breakpoint changes.

This behavior was regression-tested before merge.

## Verification at Accepted S14-02 Head

### Frontend

- typecheck: passed;
- lint: passed;
- format check: passed;
- tests: **7 files, 43/43 passed**;
- coverage: **97.08% statements, 92.85% branches, 90.62% functions, 97.08% lines**;
- production build: passed;
- npm audit: **0 vulnerabilities**;
- 320px CSS layout contract covered in JSDOM; no real-browser `clientWidth`/`scrollWidth` geometry measurement was claimed because no browser runner was available.

### Backend Regression

- typecheck: passed;
- build: passed;
- lint: passed;
- format check: passed;
- tests: **32 files, 369/369 passed**.

### GitHub CI

Final accepted PR workflow evidence:

- workflow run: `31529786071` — completed / success;
- Backend quality gates job: `93906786891` — completed / success;
- Frontend quality gates job: `93906786947` — completed / success;
- previous correction run `31527526794` also completed successfully for the superseded PR head;
- `git diff --check` passed, with only non-blocking LF/CRLF working-copy notices.

## Review Corrections Included Before Merge

The final accepted S14-02 branch included corrective hardening rather than merging the first implementation unchanged.

Notable corrective commits recorded in PR #11:

- `95971d8` — addressed application-shell review findings, including API/configuration/localization coverage and desktop layering;
- `941b6bd4c07d82291db5118468b3fbb7e6f8e80b` — preserved the temporary mobile Drawer overlay with a breakpoint-aware MUI layering contract and focused regressions.

The final reviewed PR head was:

- `941b6bd4c07d82291db5118468b3fbb7e6f8e80b`.

## Merge Evidence

- implementation branch: `agent/s14-02-application-shell`;
- pull request: **PR #11 — S14-02: Professional responsive application shell and navigation**;
- PR merged: **2026-08-12**;
- merge commit: `edd74cc7c339fdd09bd183d84c415e0d7c092c8b`;
- ADR: `docs/adr/ADR-020-frontend-application-shell.md` — Accepted.

## Explicit Exclusions at S14-02 Completion

S14-02 intentionally did not deliver:

- authentication or Login;
- Logout;
- token/JWT parsing;
- session persistence;
- protected routes;
- authorization-aware navigation;
- roles or permission metadata;
- Not Authorized behavior;
- `/users` route or User Management;
- backend API consumption;
- Arabic translations or language switching;
- full RTL styling;
- dark mode;
- operational Dashboard data;
- fabricated operational data;
- Asset domain;
- Monitoring Point domain;
- deployment changes;
- VERSION or CHANGELOG changes;
- tags or Releases.

These exclusions were deliberate boundaries, not unfinished defects inside S14-02.

## Current-State Evolution After S14-02

S14-02 remains the architectural shell baseline, but later sub-sprints intentionally evolved the application on top of it. These later changes are **not retroactively part of S14-02**.

### S14-03

S14-03 added authentication, session restoration, Login/Logout, protected request handling, centralized permission vocabulary, authorization-aware routing/navigation, Not Authorized behavior, and the `/users` route while preserving the S14-02 shell architecture.

### S14-04

S14-04 replaced the `/dashboard` placeholder with the operational Dashboard while continuing to use the S14-02 AppShell, navigation structure, accessibility conventions, and localization architecture.

### S14-05

S14-05 was scoped after S14-04 to replace the `/monitored-areas` placeholder with a real read-only Site → Monitored Area (Room) → Sensor operational hierarchy. The scope preserves the S14-02 decision that `Monitored Areas` is presentation terminology rather than a new backend domain.

## Current Repository Baseline When This Record Was Added

This retrospective document was added against `main` at:

- `b3f938e8d46fddf6c3e406f38d5ae1f5a28541f1` — Merge PR #16, defining the S14-05 monitored-areas scope.

At that baseline:

- S14-01: complete;
- S14-02: complete / merged / verified;
- S14-03: complete / merged / verified;
- S14-04: complete / merged / verified;
- S14-05: planned on `main` and implementation continued on its scoped feature branch;
- Sprint 14 remained **IN PROGRESS**.

## Relationship to ADR-020

ADR-020 remains the normative architecture decision for the S14-02 shell. This closure record adds implementation evidence, test/CI evidence, merge provenance, exclusions, and later-evolution context; it does not supersede or rewrite ADR-020.

## References

- `docs/adr/ADR-019-frontend-foundation.md`
- `docs/adr/ADR-020-frontend-application-shell.md`
- `docs/project-management/SPRINT-14-PLAN.md`
- `frontend/src/app/AppShell.tsx`
- `frontend/src/navigation/navigationConfig.ts`
- PR #11
- merge commit `edd74cc7c339fdd09bd183d84c415e0d7c092c8b`
