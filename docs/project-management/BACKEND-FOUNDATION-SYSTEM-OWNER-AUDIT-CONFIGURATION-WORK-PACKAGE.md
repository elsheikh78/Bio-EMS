# Backend Foundation — SYSTEM_OWNER, Audit Trail, and Commercial Configuration Work Package

Status: APPROVED IMPLEMENTATION PLAN
Date: 2026-08-23
Related issue: #65
Architecture baseline: `docs/architecture/SYSTEM-OWNER-AUDIT-CONFIGURATION-FOUNDATION.md`

## 1. Objective

Implement the backend foundation required for a commercial, configurable BIO-EMS product before the next configuration-focused frontend work.

This work package must preserve existing authentication, authorization, User Management, Alarm, notification, reporting, and Standard/Advanced product decisions unless a separately reviewed change explicitly modifies them.

## 2. Delivery sequence

The controlled implementation order is:

`BF-01 -> BF-02 -> BF-03 -> BF-04 -> BF-05 -> BF-06 -> BF-07 -> BF-08`

Frontend configuration work may resume incrementally after the backend APIs required by the first UI slice are stable, tested, and documented. The frontend must consume approved contracts rather than invent persistence behavior.

## 3. BF-01 — SYSTEM_OWNER authorization boundary

Implementation status (2026-08-24): COMPLETE / MERGED / CI VERIFIED / CLOSED through
PR #67. See `BF-01-SYSTEM-OWNER-BOUNDARY-CLOSURE.md`.

### Scope

- Introduce platform-level `SYSTEM_OWNER` identity above customer `ADMIN`.
- Keep `SYSTEM_OWNER` outside normal customer User Management.
- Ensure normal customer user-directory APIs do not return owner identities.
- Prevent customer `ADMIN` from creating, assigning, editing, disabling, deleting, resetting credentials for, or impersonating `SYSTEM_OWNER`.
- Enforce the boundary server-side.
- Preserve current `ADMIN`, `OPERATOR`, and `VIEWER` behavior and existing last-active-admin safeguards.
- Do not introduce a hard-coded master password, universal password, backdoor credential, plaintext credential, or frontend-embedded secret.

### Acceptance criteria

- Owner/customer separation is represented explicitly in backend contracts.
- Customer user list endpoints exclude owner identities.
- Customer user mutation endpoints reject owner targets and owner-role assignment.
- Existing authentication and user-management regression tests remain green.
- Tests cover owner/customer separation and denial paths.
- Documentation clearly distinguishes implemented behavior from MFA and future owner-portal target design.

## 4. BF-02 — Audit event persistence foundation

Implementation status (2026-08-24): COMPLETE / MERGED / CI VERIFIED / CLOSED through
PR #68. See `BF-02-AUDIT-FOUNDATION-CLOSURE.md`.

### Scope

Create append-only persistence and service contracts for system audit events.

Minimum event data, where applicable:

- immutable event identifier;
- authoritative timestamp;
- actor identity;
- actor role/privilege snapshot;
- action/event type;
- target entity type and identifier;
- customer/Site scope;
- result such as `SUCCESS`, `DENIED`, or `FAILED`;
- safe structured previous/new values for controlled mutations;
- request/session/correlation context when available;
- reason/comment when required by the controlled workflow.

### Security requirements

Audit events must never persist plaintext passwords, password hashes, access/refresh tokens, MFA secrets, API secrets, private keys, or equivalent credential material.

### Acceptance criteria

- Audit persistence is append-only through normal application APIs.
- Read access has explicit authorization and scope enforcement.
- Redaction behavior is deterministic and tested.
- Repository/service tests cover persistence, ordering/identity, and prohibited-secret handling.

## 5. BF-03 — Integrate existing User Management with audit

Implementation status (2026-08-24): COMPLETE / MERGED / CI VERIFIED / CLOSED through
PR #70. See
`BF-03-USER-AUDIT-INTEGRATION.md` for the approved event and failure policy.

### Scope

Audit security- and compliance-significant User Management actions, including:

- user creation;
- profile changes;
- role changes;
- enable/disable status changes;
- password-management actions;
- privileged denied/failed actions when security/compliance value exists.

Password events record action/result only and must not capture the password or password hash.

### Acceptance criteria

- Existing User Management behavior is preserved.
- Successful mutations create audit evidence.
- Relevant denied/failed operations create safe audit evidence according to the approved failure policy.
- Last-active-admin concurrency protections remain green.

## 6. BF-04 — Editable Sensor alarm thresholds

Implementation status (2026-08-24): COMPLETE / MERGED / CI VERIFIED / CLOSED through
PR #71. See
`BF-04-EDITABLE-ALARM-THRESHOLDS.md` for the approved mutation contract.

### Scope

Add a validated post-creation mutation contract for Sensor alarm thresholds already represented in the current Sensor model.

Target fields include the approved warning/alarm low/high threshold set supported by the Domain.

### Acceptance criteria

- Authorized post-creation update route/service/repository behavior exists.
- Validation prevents invalid or unsupported threshold configurations.
- Old/new effective threshold values are audited.
- Authorization denial is tested.
- Alarm Engine compatibility/regression tests remain green.

## 7. BF-05 — Configurable Alarm persistence/delay

Implementation status (2026-08-24): IMPLEMENTED / LOCAL QUALITY GATES PASS / PR
PENDING. See `BF-05-CONFIGURABLE-ALARM-DELAY.md`.

### Scope

Define and implement configuration for Alarm persistence/delay instead of customer-specific timing assumptions.

The implementation must define:

- configuration scope;
- defaults;
- validation;
- persistence/storage;
- effective-value semantics;
- lifecycle interaction.

### Acceptance criteria

- Delay/persistence values can be changed through an authorized backend contract.
- Invalid values fail closed.
- Changes are audited.
- Alarm lifecycle tests cover configured timing semantics.

## 8. BF-06 — Notification recipient directory and severity/channel eligibility

### Scope

Implement configurable notification recipients without hard-coding BIO EGYPT identities.

Support, as approved by the Domain design:

- recipient identity/role;
- contact endpoint(s);
- notification channel eligibility;
- severity eligibility;
- active/inactive lifecycle;
- customer/Site scope where applicable.

### Acceptance criteria

- Recipient configuration is persisted and authorized.
- Sensitive contact information is handled through approved security boundaries.
- BIO EGYPT-specific names/numbers are not product constants.
- Mutations are audited.
- Validation and authorization tests exist.

## 9. BF-07 — Escalation policy

Implementation status (2026-08-24): COMPLETE / MERGED / CI VERIFIED / CLOSED through
PR #74 and CI run 204. See `BF-07-ESCALATION-POLICY.md`.

### Scope

Implement configurable escalation order, timing, ownership, and eligibility.

### Acceptance criteria

- Escalation rules are deterministic and validated.
- Customer-specific escalation is configuration, not code.
- Mutations are audited.
- Runtime contract is documented and tested before frontend claims completion.

## 10. BF-08 — Site Controller offline-critical configuration synchronization contract

Implementation status (2026-08-24): IMPLEMENTED / LOCAL QUALITY GATES PASS / PR
PENDING. See `BF-08-SITE-CONTROLLER-CONFIG-SYNC-CONTRACT.md`.

### Scope

Define the versioned backend/controller contract required for offline critical evaluation and failover notification.

The contract must address:

- effective configuration version;
- delivery;
- acknowledgement;
- stale-version detection;
- reconnect behavior;
- safe fallback;
- the minimum configuration subset required for offline critical operation.

### Acceptance criteria

- Backend contract and tests exist.
- No field/firmware implementation is claimed without controller evidence.
- Configuration changes are not assumed effective locally until acknowledgement semantics are satisfied.

## 11. BF-09 — Frontend readiness gate

Frontend work may start when the APIs required for a concrete UI slice are stable and tested.

Initial frontend candidates after their backend dependencies are ready:

- Alarm threshold and delay configuration;
- Notification recipients and severity/channel eligibility;
- Escalation configuration;
- Audit Log viewing/search/export as authorized;
- existing User Management UI integration with the extended authorization model.

No frontend control may imply a backend capability that is not implemented and approved.

## 12. Cross-cutting requirements

Every implementation slice must satisfy the following where applicable:

- no BIO EGYPT-specific values hard-coded as commercial product behavior;
- authorization is enforced server-side;
- high-value mutations emit safe audit evidence;
- secrets never enter audit records;
- existing authentication/authorization/user-management behavior remains compatible unless explicitly changed;
- tests cover success, validation failure, authorization denial, and scope separation where applicable;
- migrations are controlled, ordered, and idempotent according to existing project rules;
- documentation is updated when a capability moves from target design to implemented/verified;
- `docs/PRODUCT_DECISIONS.md` remains authoritative for Standard/Advanced hardware tier definitions.

## 13. Branch and PR strategy

Implementation should be delivered in small, reviewable slices rather than one large change.

Recommended branch sequence:

- `agent/bf-01-system-owner-boundary`
- `agent/bf-02-audit-foundation`
- `agent/bf-03-user-audit-integration`
- `agent/bf-04-editable-alarm-thresholds`
- `agent/bf-05-alarm-delay-configuration`
- `agent/bf-06-notification-recipient-configuration`
- `agent/bf-07-escalation-policy`
- `agent/bf-08-controller-config-sync-contract`

Each branch starts from the current verified `main` or an explicitly required merged predecessor. Each PR requires tests and review before merge.

## 14. Definition of Done for this work package

The backend foundation is complete when:

- `SYSTEM_OWNER` is safely separated from customer User Management;
- the system-wide append-only audit foundation is implemented and high-value User Management actions are integrated;
- alarm thresholds and delays are configuration-driven through tested backend contracts;
- recipient/severity/channel and escalation configuration are implemented through tested backend contracts;
- controller offline-critical configuration synchronization semantics are defined and verified at the backend contract level;
- all relevant authorization, validation, redaction, regression, and audit tests pass;
- documentation reflects actual implementation state;
- the frontend readiness gate has been reached for the approved configuration UI slices.
