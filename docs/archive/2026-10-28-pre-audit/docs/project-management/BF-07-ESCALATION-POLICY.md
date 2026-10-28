# BF-07 — Escalation Policy

Status: COMPLETE / MERGED / CI VERIFIED / CLOSED
Date: 2026-08-24
Branch: `agent/bf-07-escalation-policy`
Base: BF-06 merge `0532d2557d6d190275d611df27cf38cb857f43c6`

## Contract

An escalation policy belongs to one Site and has a stable UUID, display name,
owner role, active/inactive state, Warning/Critical eligibility, and ordered steps.
Each step has a one-based position, elapsed delay in seconds, target recipient role,
and one or more Email/SMS/WhatsApp channels.

Steps must start at position 1 without gaps. Delay is 0 through 604800 seconds and
must increase strictly with position. Channels and severities are unique canonical
sets. The runtime resolver accepts explicit Site, severity, and elapsed seconds and
returns due active steps deterministically; it does not send messages or consume the
notification outbox.

## Authorization and API

Dedicated `ESCALATION_POLICY_READ` and `ESCALATION_POLICY_MANAGE` permissions are
ADMIN-only. The API supports Site-scoped list, create, profile/rules update, and
status update. Successful mutations and Site-scoped prior/new audit evidence commit
atomically. Denials are body-free.

## Boundaries

No customer identity, timing, provider, schedule, acknowledgement timer, message
template, delivery worker, or frontend is hard-coded or activated. Policy target
roles resolve against BF-06 recipients at runtime in a later delivery workflow.

## Acceptance evidence

- fresh/upgrade migration and constraint tests;
- deterministic validation and runtime resolution tests;
- ADMIN-only route inventory and body-free denial tests;
- atomic mutation/audit rollback tests;
- complete backend/frontend gates and documentation audit before PR.

## Verification

- backend format, lint, typecheck, build, 70 files / 596 tests: PASS;
- unchanged frontend format, lint, typecheck, build, 25 files / 212 tests: PASS;
- documentation consistency audit: PASS;
- PR #74, GitHub CI run 204 SUCCESS, integration commit
  `5890629b938a8b4dfe0364b1f41abbc72b2dc16f`.
