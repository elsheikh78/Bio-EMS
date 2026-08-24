# BIO-EMS Product Configurability Gap Register

Status: ACTIVE
Date: 2026-08-23

This register distinguishes implemented capability from commercial-product configuration gaps. It does not redefine the Standard/Advanced hardware tiers; `docs/PRODUCT_DECISIONS.md` remains authoritative for those decisions.

| ID      | Domain                        | Current evidence                                                                                      | Required commercial capability                                                           | State                          |
| ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------ |
| CFG-001 | Sensor alarm thresholds       | BF-04 adds authorized post-creation partial update/clear, effective validation, and Site-scoped audit | Historical effective dating remains separate from current configuration mutation         | IMPLEMENTED BACKEND FOUNDATION |
| CFG-002 | Alarm delays                  | BF-05 adds Sensor warning/critical delay configuration and persisted activation candidates            | Recovery delay/hysteresis remains a separate future capability                           | IMPLEMENTED BACKEND FOUNDATION |
| CFG-003 | Notification recipients       | BF-06 adds Site-scoped recipient lifecycle and Email/SMS/WhatsApp endpoints                            | Delivery providers and frontend management remain separate                               | IMPLEMENTED BACKEND FOUNDATION |
| CFG-004 | Severity eligibility          | BF-06 adds per-recipient/channel Warning/Critical eligibility and active-only resolution               | Device events and later severity vocabularies remain separate                             | IMPLEMENTED BACKEND FOUNDATION |
| CFG-005 | Escalation                    | BF-07 adds Site-scoped owner/severity policy and ordered role/channel steps with elapsed timing         | Delivery execution and acknowledgement timers remain separate                            | IMPLEMENTED BACKEND FOUNDATION |
| CFG-006 | Configuration RBAC            | BF-07 adds dedicated ADMIN-only escalation-policy read/manage permissions                              | Apply least-privilege authorization to every later configuration workflow                | PARTIAL / BF-07 VERIFIED       |
| CFG-007 | Configuration audit           | BF-07 policy mutations add Site-scoped atomic prior/new evidence                                       | Extend the same atomic rule to later controlled configuration families                   | PARTIAL / BF-07 VERIFIED       |
| CFG-008 | Controller synchronization    | BF-08 adds versioned checksum envelope, acknowledgement state, reconnect, and safe fallback contract   | Transport, persistence, firmware, and field/controller evidence remain separate          | IMPLEMENTED BACKEND CONTRACT   |
| CFG-009 | Configuration UI              | BF-09-03 adds the Site-scoped ADMIN notification recipient directory                                   | Escalation and integrated Audit/User workflows remain                                     | PARTIAL / RECIPIENT UI VERIFIED |
| CFG-010 | Customer-specific hard-coding | Product already models reusable entities in several domains                                           | Audit new work to prevent BIO EGYPT names/values becoming source-code product rules      | CONTINUOUS CONTROL             |

## Implementation evidence rule

A design document, Pilot decision, or customer approval is not by itself proof that the corresponding product feature is implemented. A gap may be changed to implemented only when code/API/UI behavior and appropriate automated/manual verification evidence exist.

## Frontend dependency

The configuration frontend must not invent persistence contracts. Backend/API contracts for editable thresholds, delays, recipients, severity eligibility, escalation, audit evidence, and controller synchronization must be defined or deliberately sequenced before dependent UI is declared complete.
