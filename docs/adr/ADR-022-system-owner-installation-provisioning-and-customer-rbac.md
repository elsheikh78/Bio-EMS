# ADR-022 — SYSTEM_OWNER Installation Provisioning and Customer RBAC

**Date:** 2 September 2026  
**Status:** APPROVED / IMPLEMENTATION PENDING

## Context

The current customer RBAC permits `ADMIN` to create Site, Room and Sensor records,
and permits `OPERATOR` to manage Devices and Commissioning. The approved business
model requires BIO-EMS to control the installed customer topology while customer
roles operate only within the handed-over installation.

The SYSTEM_OWNER console currently covers commercial fleet workflows. It does not
yet provide an end-to-end installation-provisioning aggregate or wizard. This ADR
approves that new scope without claiming it is already implemented.

## Decision

### Trust domains

- `SYSTEM_OWNER` remains an isolated platform principal, never a customer role.
- Every customer User, Site, Monitored Area, Device, Telemetry and installation
  revision must have explicit customer/Site ownership enforced by the backend.
- Frontend visibility never replaces server-side authorization and isolation.
- Delegated BIO-EMS roles such as `INSTALLATION_ENGINEER` are deferred.

### Approved responsibility matrix

| Capability | SYSTEM_OWNER | ADMIN | OPERATOR | VIEWER |
| --- | --- | --- | --- | --- |
| Create customer and initial/additional ADMIN accounts | Manage | No | No | No |
| Create/update/disable Site, Monitored Area and Telemetry topology | Manage | No | No | No |
| View assigned installation topology | Cross-customer controlled view | Read | Read | Read |
| Initial Device inventory and topology mapping during provisioning | Manage | No | No | No |
| Post-handover Device create/update/activate/disable | Controlled oversight | Manage | No | No |
| View Device and communication health | Controlled oversight | Read | Read | Read |
| Initial Telemetry configuration during provisioning | Manage | No | No | No |
| Post-handover thresholds, Alarm delays and calibration records | Oversight only | Manage | Read | Read |
| Read Alarms | Controlled oversight | Read | Read | Read |
| Acknowledge Alarms | No | Yes | Yes | No |
| Read reports | Controlled oversight | Yes | Yes | Yes |
| Export reports | No | Yes | Yes | No |
| Manage notification recipients and escalation policies | No | Yes | No | No |
| Read audit evidence | Platform scope | Explicit customer/Site scope | No | No |
| Manage OPERATOR and VIEWER accounts | No | Yes | No | No |
| Manage ADMIN accounts | Yes | No | No | No |
| Execute technical Commissioning and evidence | Yes | No | No | No |
| Accept/reject Commissioning for the customer | No | Yes | No | No |
| Read Commissioning records | Controlled oversight | Yes | Yes | Yes |

`SYSTEM_OWNER` initial provisioning and `ADMIN` post-handover Device management are
separate lifecycle phases. The implementation must not use impersonation or reuse
customer JWT permissions to provide platform actions.

### Installation model

The SYSTEM_OWNER installation workflow captures:

1. customer/company identity;
2. Site count and Site identity/details;
3. Monitored Area count, names, codes and types per Site;
4. Telemetry count and types per Monitored Area;
5. initial configuration for every Telemetry;
6. Device inventory per Site;
7. Device-to-Area and channel-to-Telemetry mapping;
8. validation, configuration delivery, technical Commissioning and customer
   acceptance evidence.

Frontend terminology is `Monitored Area` and `Telemetry`. Existing backend `Room`
and `Sensor` names may remain implementation terms until a separately approved
migration changes them.

### Initial activation states

```text
DRAFT -> VALIDATED -> READY -> PENDING_DELIVERY -> SENT_TO_DEVICE
      -> DEVICE_CONFIRMED -> CONFIGURATION_ACTIVE
```

Validation or delivery failures remain explicit states and never imply activation.
Controller confirmation must match the expected Site, version and integrity receipt.
Delivery alone is not evidence of application.

### Safe changes after activation

Structural changes use an installation revision while the last active configuration
continues operating:

```text
MODIFY_INSTALLATION -> DRAFT_REVISION -> REVIEW_CHANGES -> VALIDATE
                    -> APPLY_CHANGES -> DEVICE_CONFIRMED -> ACTIVE
```

Every revision records actor, reason, prior/new values, version, integrity evidence,
delivery attempts and controller result. A rejected or failed revision does not
replace the last acknowledged valid configuration.

### Commissioning and acceptance

Configuration application and field acceptance remain separate:

```text
CONFIGURATION_ACTIVE -> TECHNICAL_COMMISSIONING -> CUSTOMER_REVIEW -> COMMISSIONED
```

- SYSTEM_OWNER records technical tests and evidence.
- Customer ADMIN independently accepts or rejects the handover.
- Pending acceptance is `CUSTOMER_ACCEPTANCE_PENDING`.
- Rejection is `CORRECTION_REQUIRED` and does not erase earlier evidence.
- SYSTEM_OWNER cannot record customer acceptance on the ADMIN's behalf.

## Consequences

- Current authorization and route behavior must change; documentation alone does
  not change effective permissions.
- Explicit customer ownership and isolation must precede cross-customer provisioning.
- Existing API compatibility requires controlled replacement or denial of formerly
  allowed mutations, with tests proving the new boundaries.
- Audit, revision, controller receipt and Commissioning evidence are mandatory.
- No installation, device application, Commissioning or customer acceptance is
  claimed until corresponding live evidence exists.

