# Non Functional Requirements

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/requirements/non-functional-requirements.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0

---

## Performance

The system shall support at least 10,000 telemetry messages per minute.

---

## Availability

The system shall continue operating if InfluxDB is temporarily unavailable.

---

## Scalability

The system shall support multiple Sites and Assets.

---

## Security

REST APIs shall require authentication.

---

## Reliability

Telemetry shall never be lost silently.

---

## Maintainability

Every feature shall be documented.

---

## Portability

The system shall run on Windows and Linux.

---

## Extensibility

New device types shall be supported without redesigning the database.
