# Domain Driven Design

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/SOFTWARE-ARCHITECTURE.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/architecture/domain-driven-design.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0

---

# Goal

BIO-EMS is an Enterprise Environmental Monitoring Platform.

The platform is designed around business domains instead of database tables.

Implementation always follows approved design.

---

# Design Philosophy

Product Design

↓

Software Architecture

↓

Implementation

---

# Core Rules

- No implementation starts before the Product Design and Software Architecture are approved.
- Business drives Software.
- Software never drives Business.
- Design drives Code.
- Code never drives Design.

---

# Design Principles

- Single Responsibility
- Separation of Concerns
- Hardware Independence
- Vendor Independence
- Scalable Architecture
- Documentation First
- Design Drives Code

---

# Domain Ownership

Each business domain owns:

- its entities
- its services
- its APIs
- its documentation

No domain directly owns another domain.
