# Platform Operations and Responsibilities

Implementation guide for candidate `d151b1f`, 28 October 2026. Use [PROJECT_STATE](../../PROJECT_STATE.md) to determine whether the candidate is merged or installed.

## Identities and daily operation

Customer users authenticate to the local platform with customer roles ADMIN/OPERATOR/VIEWER. System Owner uses a separate commissioning/authentication/MFA/session boundary and governs installation and platform operations. A customer ADMIN is not automatically a System Owner; installing a client must not silently create an owner principal. Permission checks are server enforced; a visible/hidden control is not authorization evidence.

Use the operational workspace for monitored areas, sensors/devices, live readings, alarm handling and reports. Configure thresholds/delays, recipient directory, escalation and provider settings only within the role/permission policy in the current UI/API. Older documents proposing customer topology editing do not override implemented permissions. Record any policy discrepancy as a product decision rather than using a privileged engineering workaround.

For an alarm, inspect current/stale readings, event chronology, acknowledgement and return-to-normal state separately. Acknowledgement does not manufacture recovery. Provider test success, actual message arrival and human response are separate records. Export reports for the controlled scope/date/timezone and retain calibration/reference context.

## Installation and device provisioning

System Owner defines the logical installation and validates its revision. Provisioning connects the intended supported controller, selects the logical device and governed network configuration, flashes/binds through the platform workflow, checks hardware UID/binding and receives configuration. Preserve installation identity and audited revision history through restore/transfer. Standalone bench flashing does not pair a device or invent its platform credentials.

Source navigation: `frontend/src/` owner/installation features; `backend/src/modules/installation/`, `modules/device-pairing/`, platform operations routes and provisioning services. Detailed retained operating instructions are in installation identity, provisioning and commissioning documents; their dated evidence is not a new acceptance result.

## Hardware tests

All **new qualification** belongs in [standalone Hardware Tester](HARDWARE-AND-FIRMWARE.md). In the candidate there is no System Owner Hardware Lab test UI. Former API writes are retired (410); historical reads remain authenticated and preserved. Do not call legacy repository mutators directly, delete historical rows, or assume old platform runs have been imported into Tester.

Tester evidence uses its own local `qc.sqlite`, exported records and PDFs. Link the unit serial, physical assembly labels, source/image hashes and run IDs into controlled commissioning evidence. Keep provisioning evidence and hardware qualification reports separately identifiable.

## Recoveries and escalation

Use governed customer password recovery or manufacturer-authorized offline ADMIN recovery. Owner recovery is a separate workflow with separate trust material. Do not expose manufacturer private keys or signing tools on a customer machine. Current customer tokens are not immediately revoked by a password change; treat suspected compromise as a security incident and follow the audit remediation plan, rather than treating password change alone as complete containment.

Use the [build/recovery guide](BUILD-RELEASE-AND-RECOVERY.md) for backups, restore and signed updates. Do not replace a running database file by hand or assume copying SQLite recovers Influx history. Field commissioning remains gated by the [acceptance matrix](QUALIFICATION-AND-ACCEPTANCE.md).
