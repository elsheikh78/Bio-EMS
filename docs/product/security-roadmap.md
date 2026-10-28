# Security Roadmap

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<../current/PLATFORM-OPERATIONS.md>) describes the reviewed source baseline; [Project state](<../../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<../archive/2026-10-28-pre-audit/docs/product/security-roadmap.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Version: 1.0

---

## BIO-EMS v1.0

Device Authentication

- Device ID
- Serial Number
- Activation Code (Hashed)
- QR Code Registration
- Manual Approval

---

## BIO-EMS v2.0

Advanced Device Authentication

- Device Certificates
- Mutual TLS
- Secure MQTT
- Certificate Rotation
- Device Trust Management

---

## Design Principle

The v1.0 architecture shall be designed so that future certificate-based authentication can be added without redesigning the database or APIs.
