# BIO-EMS Product Configurability Gap Register

Status: ACTIVE
Date: 2026-08-23

This register distinguishes implemented capability from commercial-product configuration gaps. It does not redefine the Standard/Advanced hardware tiers; `docs/PRODUCT_DECISIONS.md` remains authoritative for those decisions.

| ID      | Domain                        | Current evidence                                                                                                            | Required commercial capability                                                           | State                          |
| ------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------ |
| CFG-001 | Sensor alarm thresholds       | BF-04 adds authorized post-creation partial update/clear, effective validation, and Site-scoped audit                       | Historical effective dating remains separate from current configuration mutation         | IMPLEMENTED BACKEND FOUNDATION |
| CFG-002 | Alarm delays                  | Alarm lifecycle exists; Pilot requires configurable persistence/delay                                                       | Configurable delay/persistence policy at appropriate scope                               | GAP / DESIGN REQUIRED          |
| CFG-003 | Notification recipients       | Notification architecture/outbox exists                                                                                     | Recipient directory configurable without code changes                                    | GAP                            |
| CFG-004 | Severity eligibility          | SMS failover policy exists                                                                                                  | Configure which recipient/role receives Warning/Critical/etc.                            | GAP                            |
| CFG-005 | Escalation                    | Architecture intentionally deferred escalation timing                                                                       | Configurable escalation order, ownership, and timing                                     | GAP                            |
| CFG-006 | Configuration RBAC            | `CONFIGURATION_READ` / `CONFIGURATION_WRITE` permissions exist; BF-04 enforces write permission before threshold validation | Apply least-privilege authorization to every later configuration workflow                | PARTIAL / BF-04 VERIFIED       |
| CFG-007 | Configuration audit           | BF-02 persistence, BF-03 User audit, and BF-04 Site-scoped threshold prior/new evidence exist                               | Extend the same atomic rule to later controlled configuration families                   | PARTIAL / BF-04 VERIFIED       |
| CFG-008 | Controller synchronization    | Site Controller/failover architecture exists                                                                                | Versioned delivery/acknowledgement of effective offline-critical configuration           | GAP / DESIGN REQUIRED          |
| CFG-009 | Configuration UI              | Application shell exists                                                                                                    | Admin UX for alarm/notification/escalation configuration with validation and permissions | GAP                            |
| CFG-010 | Customer-specific hard-coding | Product already models reusable entities in several domains                                                                 | Audit new work to prevent BIO EGYPT names/values becoming source-code product rules      | CONTINUOUS CONTROL             |

## Implementation evidence rule

A design document, Pilot decision, or customer approval is not by itself proof that the corresponding product feature is implemented. A gap may be changed to implemented only when code/API/UI behavior and appropriate automated/manual verification evidence exist.

## Frontend dependency

The configuration frontend must not invent persistence contracts. Backend/API contracts for editable thresholds, delays, recipients, severity eligibility, escalation, audit evidence, and controller synchronization must be defined or deliberately sequenced before dependent UI is declared complete.
