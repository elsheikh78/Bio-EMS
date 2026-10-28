# BIO-EMS System Owner, Audit, and Configuration Foundation

Status: APPROVED PRODUCT DIRECTION / IMPLEMENTATION BASELINE
Date: 2026-08-23

## 1. Purpose

Define the commercial-product security and accountability baseline required before the next configuration and frontend implementation work.

This document extends, and does not replace, the existing authentication, authorization, user-management, notification, alarm, and product-configurability contracts.

## 2. SYSTEM_OWNER identity

BIO-EMS requires a platform-level identity above customer `ADMIN` named `SYSTEM_OWNER`.

`SYSTEM_OWNER` represents the BIO-EMS platform owner/operator and is not a normal customer/tenant user role.

### Required boundaries

- Customer `ADMIN`, `OPERATOR`, and `VIEWER` remain customer-facing roles.
- `SYSTEM_OWNER` MUST NOT be returned by normal customer user-directory APIs or displayed in customer User Management UI.
- Customer administrators MUST NOT create, edit, disable, delete, reset credentials for, assign, or impersonate `SYSTEM_OWNER`.
- `SYSTEM_OWNER` authorization MUST be enforced server-side; hiding navigation or routes is not an authorization control.
- Owner access MUST use a separate controlled authentication boundary or equivalent platform-level flow.
- No hard-coded master password, universal password, backdoor credential, or recoverable plaintext password may exist in source code, repository configuration, frontend bundles, or database records.
- Passwords are stored only through the approved password-hashing mechanism.
- Owner authentication target design requires MFA/TOTP or an equivalently strong second factor before production release.
- Rate limiting, failed-authentication controls, session controls, and security audit events apply to owner authentication.
- `SYSTEM_OWNER` activity is auditable; owner privileges do not create an audit bypass.

A non-advertised owner route may reduce accidental discovery, but secrecy of a URL is never treated as a security boundary.

## 3. Platform versus customer administration

The architecture must keep platform ownership distinct from customer administration.

Examples of platform-level responsibilities may include customer/tenant lifecycle, licensing, platform maintenance, controlled support, update policy, platform-wide evidence access, and owner-only security operations when those capabilities are implemented.

Customer `ADMIN` remains responsible only for the customer scope and permissions granted by the commercial product contract.

Future multi-customer implementation must preserve tenant isolation even for privileged support workflows and must record the target customer/site scope of owner actions.

## 4. System-wide User Activity Audit Trail

BIO-EMS requires an append-only audit trail for security-, compliance-, configuration-, operational-, and evidence-significant user actions.

The requirement is not to record every mouse click or menu navigation. Low-value UI interaction telemetry is not the regulated/system audit trail.

### Minimum event classes

Audit coverage must include, as applicable:

- authentication success, failure, logout, session invalidation, and security lockout events;
- user creation and profile changes;
- role, permission, status, and credential-management actions;
- Site, Monitored Area, Device/Controller, Sensor, and relevant identity/configuration changes;
- alarm threshold and persistence/delay changes;
- notification recipient, channel, severity-eligibility, and escalation changes;
- calibration actions and calibration-evidence changes;
- Alarm acknowledgment and other controlled Alarm actions;
- controlled report generation/export where access to evidence is significant;
- backup/restore, maintenance, support, owner, and security-sensitive administrative actions;
- denied/failed privileged operations where security or compliance value exists.

### Minimum audit record

Where applicable an audit event should preserve:

- immutable event identifier;
- authoritative timestamp;
- actor identity and role/privilege snapshot;
- action/event type;
- target entity type and identifier;
- customer/Site scope where applicable;
- result (`SUCCESS`, `DENIED`, or `FAILED` as appropriate);
- previous and new effective values for controlled mutations, with safe structured redaction;
- request/session/correlation identifier where available;
- reason/comment where the controlled workflow requires one;
- source/application context needed for investigation.

### Sensitive-data rule

Audit records MUST NOT contain plaintext passwords, password hashes, access/refresh tokens, MFA secrets, API secrets, private keys, full sensitive credentials, or other secrets. Sensitive fields must be omitted or safely redacted by design.

### Integrity and access

- Audit records are append-only through normal application workflows.
- Normal customer users cannot mutate or delete audit history.
- Customer `ADMIN` must not have a UI mechanism to erase audit history.
- Audit viewing/export requires explicit authorization and customer/tenant scope enforcement.
- Retention is a controlled policy and must not be implemented as arbitrary user deletion.
- Any future archival/purge mechanism must be policy-driven, privileged, auditable, and compatible with applicable customer/regulatory requirements.

## 5. Configuration foundation

The approved commercial configurability principle remains authoritative. Backend contracts must precede UI claims for capabilities that require persistence.

The next implementation package must cover or explicitly sequence:

1. post-creation editable Sensor alarm thresholds;
2. configurable Alarm persistence/delay;
3. notification recipient directory;
4. severity/channel eligibility;
5. escalation order, timing, and ownership;
6. configuration authorization;
7. configuration mutation audit evidence;
8. versioned Site Controller synchronization/acknowledgement for the subset required by offline critical operation;
9. frontend Configuration UX only after the applicable persistence contracts are approved and tested.

## 6. Existing User Management

Current customer User Management is an implemented foundation and must be extended rather than rebuilt. Existing safeguards such as preventing self-role change, self-disable, and loss of the last active administrator remain authoritative unless separately changed through reviewed requirements.

Introducing `SYSTEM_OWNER` must not weaken these safeguards or make owner identity part of normal customer user administration.

## 7. Implementation gates

Before declaring this foundation implemented:

- the authorization model must distinguish platform owner from customer roles;
- database/storage design must preserve the owner boundary without exposing owner credentials to customer APIs;
- authentication and authorization tests must cover owner/customer separation and denial paths;
- audit schema/service/middleware or equivalent architecture must have deterministic event semantics;
- high-value existing mutations, including User Management, must be integrated into the audit mechanism;
- secrets/redaction tests must demonstrate that prohibited credential material is not persisted in audit records;
- new configuration mutations must emit audit evidence transactionally or with a documented failure policy;
- frontend routes must never be the sole enforcement boundary;
- documentation must distinguish implemented behavior from target design.

## 8. Frontend sequencing

Frontend work resumes after the required backend contracts are stable enough to avoid fictitious controls. The frontend work package will consume, rather than invent, the approved APIs for configuration, user administration, audit viewing, and owner/customer authorization boundaries.

## 9. Implemented BF-01 and BF-02 boundaries

BF-01 is merged through PR #67 and implements the first backend authorization
boundary:

- `SYSTEM_OWNER` is stored in the singleton `platform_principals` table created by
  SQLite migration 009, outside the customer `users` table.
- Customer role schemas remain limited to `ADMIN`, `OPERATOR`, and `VIEWER`.
- Customer User Management has no repository, route, service, or schema path to
  enumerate, assign, or mutate the platform principal.
- Platform login and current-principal APIs are isolated under
  `/api/v1/platform-auth` and use a separate JWT secret, issuer, audience, claims,
  verification middleware, and persisted active-principal lookup.
- The first and only owner is provisioned through an environment-driven backend
  bootstrap command. Passwords are validated and bcrypt-hashed through the approved
  password service and are never printed or returned.
- Platform authentication fails closed when its JWT trust domain is not configured.
- Both customer and platform authentication reject duplicate `Authorization` header
  fields before token verification.

BF-02 is merged through PR #68 and implements the append-only audit persistence and
read foundation:

- migration 010 creates `audit_events` with immutable identity/time, actor, action,
  target, Site, result, safe prior/new values, request context, reason, and source;
- database triggers reject normal UPDATE and DELETE operations;
- the audit service owns event identity/time and performs deterministic redaction;
- customer reads require ADMIN `AUDIT_READ` and an explicit Site;
- platform reads use the separate platform authentication boundary and may span
  Sites;
- audit writes remain internal-service-only.

### Not implemented by BF-01 or BF-02

BF-01 does not implement or claim:

- MFA/TOTP or another second factor;
- rate limiting, failed-login lockout, or production session-management controls;
- an Owner Portal or frontend owner route;
- commercial platform permissions such as customer lifecycle, licensing, support,
  updates, or cross-customer evidence access;
- owner action audit integration and action-specific audit producers beyond BF-02;
- a customer-visible or API-driven owner-management lifecycle.

Those items remain controlled follow-up work. BF-03 begins the action-specific audit
integration with existing customer User Management. Production owner activation must
not be declared until applicable authentication hardening, audit, deployment-secret,
and operational controls are implemented and verified.
