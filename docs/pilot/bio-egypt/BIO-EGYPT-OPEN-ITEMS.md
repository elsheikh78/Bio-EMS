# BIO EGYPT Pilot — Open-Items Register

## Status definitions

- `BLOCKING`: installation or acceptance cannot proceed.
- `NON-BLOCKING`: controlled follow-up allowed with owner and due date.
- `PENDING APPROVAL`: requirement/configuration has been prepared but required customer approval evidence is not yet recorded.
- `DEFERRED`: cannot be completed until a stated predecessor gate is reached; it remains open.
- `CLOSED`: evidence and approval recorded.

## Current register — 23 August 2026

| ID     | Item                                                                                 | Owner                   | Required evidence                                               | Status             |
| ------ | ------------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- | ------------------ |
| BE-001 | Confirm legal Site names, addresses, customer contacts, and access rules             | BIO EGYPT               | `BE001-EV-001` — Signed Site Information & Access Approval       | CLOSED             |
| BE-002 | Complete marked-up floor plans and approved Sensor positions                         | Joint survey            | Signed plans for both Sites                                     | BLOCKING           |
| BE-003 | Confirm controller location/count and released channel/electrical capacity           | BIO-EMS engineering     | Approved controller layout/design                               | BLOCKING           |
| BE-004 | Measure cable routes/lengths and approve cable/termination design                    | Installer/engineering   | Survey and released wiring schedule                             | BLOCKING           |
| BE-005 | Assign controller, Device, channel, Sensor serial, and platform identities           | BIO-EMS commissioning   | Completed Sensor map + signed logical mapping approval           | PENDING APPROVAL   |
| BE-006 | Approve temperature warning/critical thresholds and delay requirements               | BIO EGYPT quality       | Signed requirements                                             | PENDING APPROVAL   |
| BE-007 | Verify calibration certificates/status for all 20 Sensors                            | BIO-EMS quality         | Certificate register                                            | DEFERRED           |
| BE-008 | Confirm mains, protection, backup power, Internet, DNS/NTP/firewall, and 4G coverage | Joint survey            | Electrical/network survey                                       | BLOCKING           |
| BE-009 | Approve primary notification channel, recipients, and escalation ownership           | BIO EGYPT quality/IT    | Notification matrix                                             | BLOCKING           |
| BE-010 | Select SMS implementation location/provider/SIM and approved E.164 test recipients   | Joint technical team    | Approved failover test plan                                     | BLOCKING           |
| BE-011 | Confirm backup/restore, support, incident, maintenance, and handover procedures      | BIO-EMS operations      | Approved operating pack                                         | BLOCKING           |
| BE-012 | Execute field deployment/commissioning using the approved S15-07 baseline            | Joint team              | Signed commissioning record                                     | BLOCKING           |

## Recorded working decisions — not closure evidence

The following decisions have been captured from Pilot planning. They reduce uncertainty but do not close an item unless the required controlled evidence is recorded.

### BE-002 — Sensor quantities pending final marked-up positions

- El Manial: 2 Sensors in the Cold Room, 1 in the Antechamber, and 4 total across Dry Storage / corridor areas — 7 Sensors total.
- CPC / 6th of October: 2 Sensors in each of 3 Cold Rooms, 1 in the Antechamber, and 6 total in Dry Storage — 13 Sensors total.
- The room previously labelled `Freezer` at CPC / 6th of October is operationally a Cold Room for this Pilot.
- Final physical positions on the drawings remain field/documentation evidence and are not inferred from the logical allocation.

### BE-003 — Controller working baseline

- One Site Controller at El Manial and one Site Controller at CPC / 6th of October.
- Each Site Controller is planned inside the corresponding Antechamber.
- Planned channel capacity: 16 channels per Site Controller.
- The Pilot direction is direct Sensor connection to the ESP32-based Site Controller; this Pilot statement does not redefine the authoritative Standard/Advanced product tiers in `docs/PRODUCT_DECISIONS.md`.
- Final released hardware design remains required before procurement/installation.

### BE-004 — Cable constraint

- Planning constraint: each Sensor-to-Controller run is expected not to exceed 20 m.
- Actual routes and measured lengths remain survey evidence and must be recorded before BE-004 closure.

### BE-005 — Logical mapping prepared; physical identity pending

Logical mapping prepared for customer approval:

| Site | Controller | Channel(s) | Logical Sensor ID(s) | Area |
| --- | --- | --- | --- | --- |
| El Manial | `MNL-CTRL-01` | CH01–CH02 | `MNL-CR-01`, `MNL-CR-02` | Cold Room |
| El Manial | `MNL-CTRL-01` | CH03 | `MNL-AT-01` | Antechamber |
| El Manial | `MNL-CTRL-01` | CH04–CH07 | `MNL-DS-01` … `MNL-DS-04` | Dry Storage / Corridor |
| CPC / 6th of October | `OCT-CTRL-01` | CH01–CH02 | `OCT-CR1-01`, `OCT-CR1-02` | Cold Room 1 |
| CPC / 6th of October | `OCT-CTRL-01` | CH03–CH04 | `OCT-CR2-01`, `OCT-CR2-02` | Cold Room 2 |
| CPC / 6th of October | `OCT-CTRL-01` | CH05–CH06 | `OCT-CR3-01`, `OCT-CR3-02` | Cold Room 3 (former Freezer) |
| CPC / 6th of October | `OCT-CTRL-01` | CH07 | `OCT-AT-01` | Antechamber |
| CPC / 6th of October | `OCT-CTRL-01` | CH08–CH13 | `OCT-DS-01` … `OCT-DS-06` | Dry Storage |

- El Manial uses 7/16 planned channels; CPC / 6th of October uses 13/16 planned channels.
- Physical Sensor serial, DS18B20 ROM ID where applicable, calibration certificate reference, final marked-up position, and measured cable length remain TBD until procurement/commissioning.
- The logical mapping approval form has been prepared for Dr. Mayada Samir; signed evidence has not yet been recorded.

### BE-006 — Cold Room initial configuration proposal pending approval

- Confirmed Pilot Cold Room operating range: 2–8 °C.
- Proposed initial Warning Low: `< 2.0 °C`.
- Proposed initial Critical/Alarm Low: `<= 1.0 °C`.
- Proposed initial Warning High: `> 8.0 °C`.
- Proposed initial Critical/Alarm High: `>= 9.0 °C`.
- Proposed Warning persistence: 5 minutes.
- Proposed Critical persistence: 10 minutes.
- These values are proposed initial Pilot configuration, not hard-coded BIO-EMS product rules and not regulatory claims.
- Dry Storage and Antechamber limits remain TBD pending BIO EGYPT Quality requirements.
- Approval form has been prepared for Dr. Mayada Samir; signed evidence has not yet been recorded.

### BE-007 — Procurement dependency

- Pilot Sensors have not yet been purchased.
- Procurement is intentionally after hardware design approval.
- Calibration verification therefore cannot be completed yet.
- Before commissioning, each physical Sensor must be traceable to its logical Sensor identity and applicable serial/ROM identity, calibration certificate reference, calibration date/status, and due date.

### BE-008 — Confirmed planning facts and remaining field tests

- Existing 220 VAC supply is available from an existing outlet at both planned Controller locations.
- UPS backup is planned for the Site Controllers.
- Primary Internet is available at both Sites.
- Wired Ethernet/LAN is available at both Sites and is the planned primary Controller network path.
- Cellular/SIM remains the required backup/failover path rather than an optional product extra for this Pilot architecture.
- DNS, NTP, firewall/required egress, actual 4G signal/coverage at the final Controller location, electrical protection, and field verification remain open survey/test evidence.

### BE-009 — Notification requirement captured; product workflow not yet complete

Current Pilot recipient roles requested:

- Storekeeper;
- General Manager, Quality;
- Projects & Technology Manager / CPTO;
- Assistant Projects Manager / Maintenance Responsible;
- CEO for Critical cases only in the initial Pilot configuration.

The Warehouse Manager is intentionally not included in the current recipient set.

Recipient membership, contact details, severity eligibility, escalation order, and escalation timing are product configuration requirements and MUST NOT be hard-coded for BIO EGYPT. The current notification architecture does not yet constitute a complete recipient-directory/escalation configuration workflow; see `docs/architecture/PRODUCT-CONFIGURABILITY-PRINCIPLE.md` and `docs/architecture/PRODUCT-CONFIGURABILITY-GAP-REGISTER.md`.

## Closure evidence

### BE-001 — Site information and access

- **Status:** `CLOSED`
- **Evidence reference:** `BE001-EV-001`
- **Evidence:** Signed BIO-EMS / BIO EGYPT `BE-001 — Site Information & Access Approval`
- **Customer approver:** Dr. Mayada Samir — General Manager, Quality, BIO EGYPT
- **Approval date:** 23 August 2026
- **Sites covered:** El Manial and CPC / 6th of October
- **Repository handling:** The signed controlled customer record is retained outside the repository; the repository records its evidence reference only.
- **Pilot effect:** `BE-001` is closed. This closure does not constitute installation, commissioning, or Pilot acceptance.

## Register rule

Each closure entry must contain the evidence reference, approver, and date.

Deleting an item is not closure.

Working decisions do not replace controlled evidence.

New survey findings receive the next sequential ID and an explicit impact classification.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
