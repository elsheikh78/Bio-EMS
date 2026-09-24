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
| BE-005 | Assign controller, Device, channel, Sensor serial, and platform identities           | BIO-EMS commissioning   | Completed Sensor map + signed logical mapping approval           | PARTIAL - LOGICAL MAPPING APPROVED |
| BE-006 | Approve temperature warning/critical thresholds and delay requirements               | BIO EGYPT quality       | Signed requirements                                             | APPROVED WITH CHANGES - EFFECTIVE VALUES OPEN |
| BE-007 | Verify calibration certificates/status for all 20 Sensors                            | BIO-EMS quality         | Certificate register                                            | DEFERRED           |
| BE-008 | Confirm mains, protection, backup power, Internet, DNS/NTP/firewall, and 4G coverage | Joint survey            | Electrical/network survey                                       | BLOCKING           |
| BE-009 | Approve primary notification channel, recipients, and escalation ownership           | BIO EGYPT quality/IT    | Notification matrix                                             | BLOCKING           |
| BE-010 | Select SMS implementation location/provider/SIM and approved E.164 test recipients   | Joint technical team    | Approved failover test plan                                     | BLOCKING           |
| BE-011 | Confirm backup/restore, support, incident, maintenance, and handover procedures      | BIO-EMS operations      | Approved operating pack                                         | BLOCKING           |
| BE-012 | Execute field deployment/commissioning using the approved S15-07 baseline            | Joint team              | Signed commissioning record                                     | BLOCKING           |

## Recorded working decisions — not closure evidence

The following decisions have been captured from Pilot planning. They reduce uncertainty but do not close an item unless the required controlled evidence is recorded.

### BE-002 — Sensor quantities pending final marked-up positions

- Controlled field/approval template prepared in
  `BE-002-MARKED-UP-SENSOR-POSITION-PACK.md` with evidence target `BE002-EV-001`.
- Template readiness is not closure; both marked-up Site plans and all 20 approved
  position records remain required.

- El Manial: 2 Sensors in the Cold Room, 1 in the Antechamber, and 4 total across Dry Storage / corridor areas — 7 Sensors total.
- CPC / 6th of October: 2 Sensors in each of 3 Cold Rooms, 1 in the Antechamber, and 6 total in Dry Storage — 13 Sensors total.
- The room previously labelled `Freezer` at CPC / 6th of October is operationally a Cold Room for this Pilot.
- Final physical positions on the drawings remain field/documentation evidence and are not inferred from the logical allocation.

### BE-003 — Controller / modular-hardware working baseline

The earlier direct-Sensor/all-in-one Controller assumption is superseded by the approved modular
hardware decision of 24 September 2026.

El Manial detailed-design baseline:

- 1 × BIO-EMS SC;
- 2 × SIM-T4;
- 1 × independent COM-CELL;
- 1 × PDU-24;
- 7 × PT100 3-wire probes;
- 8 available RTD channels / 7 used / 1 spare.

CPC / 6th of October will use the same product blocks, with multiple Site Controllers where
justified by fault-domain separation and verified layout. Its final controller/SIM count remains
a later design output.

24 VDC is the field-power backbone and RS485 is the Sensor Interface field bus. Wired Ethernet is
the preferred fixed-site Platform path.

Detailed architecture authority:
`docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md`

El Manial design/procurement baseline:
`EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md`

BE-003 remains BLOCKING until released electrical design/BOM and physical mounting evidence are
approved.

### BE-004 — Cable / field-bus constraint

- The new modular baseline minimizes long analog RTD runs by placing SIM-T2/T4 locally and carrying digital RS485 plus 24 V field power toward the Site Controller.
- Final PT100-to-SIM lengths, RS485 trunk/stub lengths, conductor sizes, shield policy, containment and termination remain detailed electrical/field-survey outputs.
- The earlier generic 20 m Sensor-to-Controller planning limit is not a released electrical limit for the modular design and must not be copied into installation instructions as a verified maximum.
- Actual routes and measured lengths remain survey evidence and must be recorded before BE-004 closure.

### BE-005 — Logical mapping prepared; physical identity pending

Logical mapping prepared for customer approval:

| Site | Controller | Channel(s) | Logical Sensor ID(s) | Area |
| --- | --- | --- | --- | --- |
| El Manial | `MNL-SIM-T4-A` | CH01–CH02 | `MNL-CR-01`, `MNL-CR-02` | Cold Room |
| El Manial | `MNL-SIM-T4-A` | CH03 | `MNL-AT-01` | Antechamber |
| El Manial | `MNL-SIM-T4-B` | CH01–CH04 | `MNL-DS-01` … `MNL-DS-04` | Dry Storage / Corridor |
| CPC / 6th of October | `OCT-CTRL-01` | CH01–CH02 | `OCT-CR1-01`, `OCT-CR1-02` | Cold Room 1 |
| CPC / 6th of October | `OCT-CTRL-01` | CH03–CH04 | `OCT-CR2-01`, `OCT-CR2-02` | Cold Room 2 |
| CPC / 6th of October | `OCT-CTRL-01` | CH05–CH06 | `OCT-CR3-01`, `OCT-CR3-02` | Cold Room 3 (former Freezer) |
| CPC / 6th of October | `OCT-CTRL-01` | CH07 | `OCT-AT-01` | Antechamber |
| CPC / 6th of October | `OCT-CTRL-01` | CH08–CH13 | `OCT-DS-01` … `OCT-DS-06` | Dry Storage |

- El Manial now uses 7/8 planned SIM RTD channels across two SIM-T4 modules with one spare channel. The Cold Room + Antechamber grouping on SIM-T4-A is subject to field-route verification before installation. CPC / 6th of October logical Sensor IDs remain valid, but its physical Controller/SIM channel allocation must be revised after the modular layout is designed.
- Physical Sensor serial, PT100 probe identity, SIM hardware UID/address, calibration certificate reference, final marked-up position, and measured cable length remain TBD until procurement/commissioning.
- Signed logical mapping evidence `BE005-EV-001` was approved on 24 August 2026. Logical mapping
  is closed; physical Sensor/ROM/certificate/position/cable fields remain open for commissioning.

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
- Signed evidence `BE006-EV-001` was approved with changes on 24 August 2026. The printed values
  are not an unconditional configuration release: final effective thresholds must resolve the
  Quality comment concerning Sensor calibration error/uncertainty. Dry Storage and Antechamber
  limits remain TBD.

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

### BE-002 — Marked-up floor plans and Sensor positions

- **Status:** `BLOCKING / EVIDENCE PACK READY`
- **Evidence target:** `BE002-EV-001`
- **Prepared record:** `BE-002-MARKED-UP-SENSOR-POSITION-PACK.md`
- **Repository readiness:** PR #84; GitHub CI run 225 — SUCCESS; integration commit
  `315a00eb51071c640b6f344477477810df50a4e6`.
- **Required closure evidence:** signed marked-up plans for both Sites and approved
  position schedule for all 20 Map IDs.
- **Current limitation:** customer drawing revisions, field markups, position
  references/rationales, and Quality signature have not been recorded.
- **Pilot effect:** installation remains blocked; no commissioning or acceptance is
  claimed.

## Register rule

Each closure entry must contain the evidence reference, approver, and date.

Deleting an item is not closure.

Working decisions do not replace controlled evidence.

New survey findings receive the next sequential ID and an explicit impact classification.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
