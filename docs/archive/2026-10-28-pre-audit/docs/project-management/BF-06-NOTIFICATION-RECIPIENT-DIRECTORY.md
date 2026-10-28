# BF-06 — Notification Recipient Directory

Status: COMPLETE / MERGED / CI VERIFIED / CLOSED
Date: 2026-08-24
Branch: `agent/bf-06-notification-recipient-directory`
Base: `main` at `d67ea4ac5ccecc07840a9e391df83d74911e7328`

## 1. Objective

Persist Site-scoped notification recipients, contact endpoints, and per-channel
Alarm-severity eligibility without hard-coding customer identities or activating an
external delivery provider.

## 2. Authorization and API

Because contact addresses are personal/operational data, BF-06 introduces two
ADMIN-only permissions:

- `NOTIFICATION_RECIPIENT_READ`;
- `NOTIFICATION_RECIPIENT_MANAGE`.

Routes:

- `GET /api/v1/notification-recipients?site_id=<positive-id>`;
- `POST /api/v1/notification-recipients`;
- `PATCH /api/v1/notification-recipients/:recipientUuid`;
- `PATCH /api/v1/notification-recipients/:recipientUuid/status`.

List access is explicitly Site-scoped. Mutation bodies carry the authoritative
`site_id` on create and preserve Site ownership thereafter.

## 3. Recipient contract

A recipient contains:

- server/client UUID identity;
- positive `site_id`;
- display name;
- role from `PRIMARY_CONTACT`, `QUALITY`, `ENGINEERING`, `SECURITY`, `MANAGEMENT`,
  or `OTHER`;
- `active` or `inactive` lifecycle state;
- one or more contact endpoints.

Each endpoint contains:

- channel `EMAIL`, `SMS`, or `WHATSAPP`;
- an address valid for that channel;
- a non-empty unique subset of `WARNING` and `CRITICAL` Alarm severities.

EMAIL uses a validated email address. SMS and WHATSAPP use E.164. Duplicate channels
within one recipient are rejected. BF-06 does not define Push endpoint identity,
Device-event eligibility, schedules, templates, or escalation ordering.

## 4. Persistence and sensitive-data boundary

Migration 012 stores Site-scoped recipients and normalized endpoints. Foreign keys,
unique recipient/channel constraints, and lifecycle/channel/severity checks provide
database defense in depth.

Contact addresses are returned only through the dedicated ADMIN-only read boundary.
They are never logged, used in URLs, placed in deduplication keys, or copied into
audit prior/new values. BF-06 does not claim database-at-rest encryption or provider
secret management; those deployment controls remain separate.

## 5. Eligibility semantics

The repository/service can resolve active endpoints for an explicit Site, channel,
and Alarm severity. Inactive recipients are excluded. Resolution is deterministic by
recipient identity and does not send a message or consume the notification outbox.

## 6. Audit and atomicity

Successful create, profile/endpoints update, and status update commit atomically with
a Site-scoped audit event. Safe events record display identity, role, lifecycle,
channel names, and eligible severities only. Contact addresses are always excluded.
Authenticated denial is route-derived and body-free. Audit failure rolls back the
recipient mutation.

## 7. Explicit exclusions

- no BIO EGYPT names, numbers, emails, or approvals in product constants;
- no external Email/SMS/WhatsApp provider or delivery worker;
- no escalation order/timing (BF-07);
- no notification templates, schedules, retry worker, or frontend directory;
- no recipient deletion or historical/effective-dated configuration ledger;
- no claim that Pilot recipient approval or commissioning is complete.

## 8. Acceptance evidence

- fresh/upgrade migration parity and database constraints;
- strict channel-specific validation and Site scoping;
- ADMIN-only read/manage authorization and body-free denial;
- create/update/status atomic audit with contact-value exclusion and rollback;
- active Site/channel/severity resolution with inactive exclusion;
- backend format, lint, typecheck, 68 files / 587 tests, and build pass;
- unchanged frontend format, lint, typecheck, 25 files / 212 tests, and build pass;
- documentation audit complete;
- PR #73, GitHub CI run 202 SUCCESS, integration commit
  `0532d2557d6d190275d611df27cf38cb857f43c6`.
