# HW-PWR-01 — El Manial 24 VDC Power Budget & PDU-24 Design

**Date:** 24 September 2026  
**Status:** ENGINEERING DESIGN BASELINE / EXACT MPN PROCUREMENT OPEN  
**Site:** BIO EGYPT — El Manial  
**Parent architecture:** `docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md`

## 1. Objective

Define the El Manial Pilot 24 VDC field-power architecture before selecting the exact 24 V power-supply, branch-protection and field-cable part numbers. Backup autonomy is provided by upstream Site/customer UPS infrastructure rather than an internal PDU battery system.

The first-site load set is:

- 1 × BIO-EMS SC;
- 2 × BIO-EMS SIM-T2;
- 1 × BIO-EMS SIM-T4;
- 1 × BIO-EMS COM-CELL;
- 1 × PDU-24 assembly;
- one spare/expansion branch.

The PDU-24 design intentionally uses certified industrial DIN-rail mains components for the Pilot.
BIO-EMS should **not** design a custom 230 VAC power-supply PCB for the first Pilot.

## 2. Power-domain decision

Field distribution:

`UPS-backed 230 VAC -> industrial 24 VDC PSU -> protected 24 V branches -> BIO-EMS devices`

Nominal bus:

`24 VDC`

Target device input design range:

`18–30 VDC`

Local low-voltage rails are generated inside each product:

- SC: 24 V -> local 5 V / 3.3 V;
- SIM: 24 V -> local 5 V / 3.3 V;
- COM-CELL: 24 V -> dedicated modem rail plus logic rails.

No site-wide 5 V distribution is approved.

## 3. Why the Pilot PDU is a DIN-rail assembly

For the first Pilot, mains-side safety and reliability are better served by proven industrial
components than by a new custom high-voltage PCB.

The PDU-24 Pilot implementation should therefore use:

- industrial DIN-rail 230 VAC / 24 VDC PSU;
- DIN-rail AC protection/isolation;
- protected/fused 24 V branch terminals;
- PE/earth bar;
- segregated mains and SELV sections;
- labelled terminals and serviceable fuses.

A future commercial integrated PDU PCB may be considered later, but it is not required to validate
the modular architecture.

## 4. Conservative design envelopes

Exact current consumption will be measured on prototypes. Until then the PDU is designed using
conservative engineering envelopes rather than optimistic typical-current figures.

| Load | Qty | Design continuous allowance per unit | Design peak allowance per unit | Continuous subtotal | Peak subtotal |
| --- | ---: | ---: | ---: | ---: | ---: |
| BIO-EMS SC | 1 | 0.30 A @ 24 V | 0.50 A | 0.30 A | 0.50 A |
| SIM-T2 | 2 | 0.10 A @ 24 V | 0.15 A | 0.20 A | 0.30 A |
| SIM-T4 | 1 | 0.15 A @ 24 V | 0.20 A | 0.15 A | 0.20 A |
| COM-CELL | 1 | 0.40 A @ 24 V | 0.80 A | 0.40 A | 0.80 A |
| PDU monitoring / losses allowance | 1 | 0.10 A | 0.15 A | 0.10 A | 0.15 A |
| **Subtotal** |  |  |  | **1.15 A** | **1.95 A** |

These are PDU sizing envelopes, not measured product specifications.

At 24 V:

- continuous design load ≈ **27.6 W**;
- short peak design load ≈ **46.8 W**.

## 5. Expansion / derating reserve

The Pilot power source shall not be sized exactly to the estimated load.

Add:

- minimum 25% continuous engineering reserve;
- allowance for DC/DC conversion losses;
- startup/inrush behavior;
- future service accessory / second-controller expansion where practical.

For this reason the engineering starting point remains:

**24 VDC / 5 A industrial PSU**

Nominal output capacity:

**120 W**

This is intentionally generous for El Manial and allows the PSU to operate well below maximum
continuous rating during normal service.

The exact PSU MPN remains open until the released PDU schematic, efficiency/thermal review and supplier comparison are complete.

## 6. Proposed branch structure

```text
230 VAC
   |
[AC isolator / protection]
   |
[24 V industrial PSU]
   |
[PDU-24 DC distribution]
   |
   +-- BR-01 -> BIO-EMS SC
   +-- BR-02 -> SIM field bus
   +-- BR-03 -> COM-CELL
   +-- BR-04 -> spare / engineering service
   +-- BR-05 -> future second SC / future expansion
```

Initial protection design targets:

| Branch | Load | Initial protection target |
| --- | --- | ---: |
| BR-01 | SC | 1.0 A |
| BR-02 | all El Manial SIMs | 1.0 A |
| BR-03 | COM-CELL | 2.0 A |
| BR-04 | spare/service | 1.0 A |
| BR-05 | future SC/expansion | 1.0 A |

The final fuse/eFuse curves and values must be validated against:

- actual device startup/inrush;
- cable current rating;
- fault-current behavior;
- modem transmit/power-cycle behavior.

The sum of branch fuse ratings may exceed the PSU continuous rating because the branches are not
expected to draw their fuse rating simultaneously; the PSU main protection remains separately
sized.

## 7. SIM field-bus power branch

El Manial SIM loads:

- 2 × SIM-T2;
- 1 × SIM-T4.

Conservative branch allowance:

- continuous ≈ 0.35 A;
- peak ≈ 0.50 A.

The design target for the SIM field bus is to keep normal worst-case voltage drop comfortably below
the device 18 V lower input limit.

For routine Pilot cable sizing, use a stricter engineering target of approximately **5% maximum
voltage drop** from the 24 V source to the furthest active module under expected peak branch load.

Exact cable conductor area is therefore determined from the surveyed route and loop resistance,
not selected from the bus protocol alone.

Example only:

For 20 m one-way copper power run, 0.5 mm² conductors and 0.5 A load:

- loop length = 40 m;
- approximate copper loop resistance ≈ 1.4 ohm;
- voltage drop ≈ 0.7 V;
- drop ≈ 2.9% of 24 V.

This illustrates why 24 V is advantageous. It does not freeze the field-cable part number.

## 8. RS485 + power field cable direction

Preferred field construction:

- one twisted pair: RS485 A/B;
- one power pair: +24 V / 0 V;
- overall shield where required by the released EMC/cable design.

The power conductors must be sized from current and route length. The RS485 pair must meet
controlled impedance/twist requirements suitable for the selected baud rate and environment.

The Pilot starting protocol target remains 19,200 baud, 8N1.

Shield termination is not to be improvised in the field. The baseline direction is a controlled
single-point/chassis termination at the panel side unless EMC testing/released drawings specify
otherwise.

## 9. COM-CELL power branch

The cellular gateway is the most important transient load.

Its final modem rail will likely be in the ~4 V class and may experience high current bursts during
network registration/transmit.

Therefore COM-CELL shall use:

- dedicated local high-current buck regulator;
- short, low-impedance modem supply path;
- low-ESR bulk capacitance close to the modem;
- supervisor-controlled modem power switching;
- input transient/reverse-polarity protection.

The 24 V PDU branch shall be designed to tolerate modem startup and transmit peaks without causing
the 24 V bus to collapse or resetting SC/SIM equipment.

This is one reason COM-CELL has a dedicated branch.

## 10. AC-failure / power-health monitoring

Environmental monitoring should distinguish, where Site signals are available:

- field 24 V DC healthy;
- utility mains failed;
- upstream UPS is carrying the load;
- generator/ATS state;
- PSU fault.

PDU-24 therefore needs a dry-contact or isolated status interface available to SC and/or COM-CELL.

Preferred Pilot approach:

- use dry contacts from the customer UPS/ATS/generator where available;
- otherwise use a dedicated isolated pre-UPS mains-present sensor plus DC-OK monitoring.

The Pilot firmware/platform shall later map these into explicit power-health telemetry rather than
infer AC status only from controller uptime.

## 11. Upstream UPS / generator design

The previously recorded four-hour internal field-battery target is **superseded**.

BIO-EMS PDU-24-S5 no longer includes an internal DC-UPS charger or battery bank as a standard
product requirement.

Backup power is supplied upstream by the customer/site according to its required autonomy. The
standard topology is:

```text
Utility / Generator / ATS
        |
     Site UPS
        |
   +----+-------------------+
   |                        |
Platform PC             PDU-24-S5
                            |
                       SC / SIMs / COM-CELL
```

This is intentionally suited to cold-room/pharmaceutical Sites where standby generation commonly
exists. The UPS bridges short utility interruptions and generator transfer/startup, while the
customer chooses a larger UPS if longer standalone autonomy is required.

For El Manial and every future Site, engineering shall verify rather than assume:

- UPS continuous watt/VA capacity;
- battery/autonomy requirement;
- generator availability;
- actual ATS/generator transfer/start time;
- whether Platform PC, Ethernet switch/router and PDU are all on the backed-up circuit;
- available dry contacts/status outputs.

A working assumption such as “generator available within one minute” may be captured from the
customer but is not a BIO-EMS product constant until verified at that Site.

## 12. Earthing and separation

Pilot panel design must provide:

- protective earth to the PSU and metallic enclosure where applicable;
- dedicated PE bar;
- physical segregation of mains wiring from SELV/RS485 wiring;
- strain relief and finger-safe terminals;
- labelled AC and DC sections;
- no field-service access to exposed mains terminals without panel isolation.

RS485 shield/chassis policy remains an EMC design item; signal 0 V is not to be casually bonded to
PE at multiple field points.

## 13. Prototype purchase direction

Before the exact released BOM, engineering may procure one prototype set in these classes:

- 1 × reputable industrial 24 V / 5 A DIN-rail PSU;
- 1 × two-pole AC protective/isolation device appropriate to the panel;
- DIN-rail fuse/terminal blocks for at least five DC branches;
- PE terminal/bar;
- DIN rail;
- enclosure/panel;
- ferrules, labels and wiring accessories.

Exact brands/MPNs should be selected only after checking:

- local availability;
- technical datasheets;
- operating temperature;
- certification;
- replacement availability.

## 14. Acceptance tests for HW-PWR-01 prototype

The PDU-24 prototype shall not be accepted solely because it outputs 24 V.

Bench tests must include:

1. no-load output;
2. nominal integrated load;
3. simulated COM-CELL current burst;
4. SC + SIM + COM-CELL simultaneous startup;
5. branch short/fault isolation;
6. removal of one branch without resetting others;
7. utility AC loss while PDU is supplied from the approved upstream UPS;
8. generator/ATS transfer test where available;
9. DC-OK / mains-fail / UPS-generator status path;
10. power-cycle recovery;
11. voltage at the furthest SIM under peak field-bus load;
12. enclosure/terminal thermal check;
13. endurance run with logged voltage/current.

## 15. Current engineering conclusion

For El Manial, the approved starting power architecture is:

- 24 VDC field backbone;
- 18–30 V compatible field devices;
- certified industrial DIN-rail mains PSU;
- 24 V / 5 A engineering starting capacity;
- separate SC, SIM, COM-CELL and spare branches;
- compatibility with upstream customer/site UPS backup;
- explicit AC-fail/power-health monitoring;
- no custom 230 VAC PCB for the Pilot.

The earlier four-hour internal battery-bank decision is superseded. Backup duration is now a Site/customer UPS requirement. BIO-EMS verifies that the supplied UPS/generator arrangement covers the Platform/PDU/network loads selected for backup and records the measured transfer/autonomy evidence during commissioning.
