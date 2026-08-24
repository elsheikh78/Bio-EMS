# BF-03 — User Management Audit Integration

Status: IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-03-user-audit-integration`
Base: `main` at `07e65dee84a8f4ea335f857f897d242cd6895098`

## 1. Objective

Integrate the existing customer User Management mutations with the BF-02 audit
foundation without changing customer roles, endpoint success contracts,
authentication behavior, or last-active-ADMIN safeguards.

## 2. Event contract

The controlled actions are:

- `USER.CREATED`;
- `USER.PROFILE_UPDATED`;
- `USER.STATUS_UPDATED`;
- `USER.PASSWORD_UPDATED`.

Successful events use the authenticated customer User snapshot as actor, target the
affected `USER`, use source `USER_MANAGEMENT_API`, and preserve only safe effective
values.

- Creation records the new public username, email, role, and status.
- Profile/role changes record public prior and new email/role values.
- Status changes record prior and new status values.
- Password changes record action and result only. They never include submitted
  password, password hash, or prior/new credential values.

User Management is not currently Site-scoped in the established single-customer
model, so these events have no invented `site_id`. Future tenant/customer ownership
must add explicit scope rather than infer it from User identity.

## 3. Atomic success rule

The accepted User mutation and its SUCCESS audit event execute in one SQLite
transaction. If audit persistence fails, the User mutation rolls back and the API
fails. A successful mutation must never exist without its corresponding audit event.

Password hashing occurs before entering the synchronous SQLite transaction. Only the
approved bcrypt hash reaches the User repository, and no credential value reaches
the audit input.

## 4. Failure policy

- An authenticated customer User denied `USER_MANAGE` creates a `DENIED` event using
  the route-derived action and safe target identifier when available. The request
  body is never copied into this event.
- Controlled failures after authorized execution—such as missing target,
  self-change protection, last-active-ADMIN protection, or duplicate username—create
  a `FAILED` event with a stable application error code as the reason.
- Validation failures occur before an accepted operation and are not BF-03 audit
  events. This avoids storing rejected, potentially hostile request content.
- Unauthenticated requests have no trustworthy actor and are not persisted as User
  activity events.
- An unexpected infrastructure error is returned through the existing generic error
  contract. A best-effort FAILED audit may be attempted only when the database
  remains usable; audit failure must never mask or weaken the original failure.

## 5. Compatibility boundaries

- Customer roles remain `ADMIN`, `OPERATOR`, and `VIEWER`.
- `SYSTEM_OWNER` remains outside customer User Management.
- Existing response bodies and status/error codes remain authoritative.
- Existing self-role, self-disable, and last-active-ADMIN rules remain unchanged.
- No public audit-write endpoint is introduced.
- BF-03 does not add User deletion, password self-service, MFA, tenant ownership, or
  frontend UI.

## 6. Acceptance evidence required

- every successful mutation produces exactly one safe audit event;
- mutation and audit success are atomic;
- relevant denial and controlled-failure events are recorded without request bodies;
- password values and hashes are absent from all audit storage;
- existing User Management and concurrency regressions remain green;
- complete backend and unchanged-frontend quality gates pass;
- closure and product documentation are audited before PR readiness.

## 7. Implemented evidence

- The shared audit service is instantiated once and reused by read and producer
  boundaries.
- UserService owns the transaction that contains the accepted User mutation and its
  SUCCESS audit insert.
- Route-specific authorization derives DENIED actions and only accepts a positive
  numeric target ID; it never reads the submitted body.
- Controlled application errors emit stable FAILED reasons after rollback.
- Unit and application tests cover all four successful action families, denial,
  validation exclusion, controlled failure, password secrecy, and forced audit-insert
  rollback.

## 8. Verification evidence

Backend final local gates:

- TypeScript typecheck: PASS;
- production build: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 63 files / 545 tests PASS.

Frontend source is unchanged from the BF-02 baseline. Final regression gates:

- TypeScript typecheck: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 25 files / 212 tests PASS;
- production build: PASS.

## 9. Documentation audit

- Work package and architecture statuses: BF-01/BF-02 integrated state corrected.
- README and changelog: BF-03 capability and transaction/security rules recorded.
- Project status and sprint progress: branch state recorded without claiming merge.
- Product decisions and Arabic guide: atomicity, password exclusion, and current
  non-Site-scoped User boundary recorded.
- BIO EGYPT commissioning/acceptance status: unchanged and not claimed.

## 10. Integration gate

BF-03 becomes complete only after PR review, GitHub CI success, merge, and integration
evidence update. BF-04 must start from the verified merged BF-03 `main`.
