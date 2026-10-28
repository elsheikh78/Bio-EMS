# Business Rules

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/requirements/business-rules.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0

---

## BR-001

Only registered devices may send telemetry.

---

## BR-002

Inactive devices shall not be accepted.

---

## BR-003

Telemetry from unknown devices shall be rejected.

---

## BR-004

Rejected telemetry shall be logged for audit purposes.

---

## BR-005

Devices are registered by authorized users only.
