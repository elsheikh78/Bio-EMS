# BIO-EMS Design Rules

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<README.md>) describes the reviewed source baseline; [Project state](<../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<archive/2026-10-28-pre-audit/docs/BIO-EMS-Design-Rules.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0.0

Status: Active

---

# 1. Purpose

This document defines the architectural rules and development guidelines for the BIO-EMS platform.

These rules ensure:

- Maintainable code.
- Hardware independence.
- Scalable architecture.
- Multi-site capability.
- Clear separation between business logic and infrastructure.

---

# 2. Layer Separation Rule

The system must follow clear separation between layers.

Architecture:
