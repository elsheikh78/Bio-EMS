# HW-PWR-01 — El Manial 24 VDC Power Budget & PDU-24 Design

**Date:** 24 September 2026  
**Status:** ENGINEERING DESIGN BASELINE / EXACT MPN PROCUREMENT OPEN  
**Site:** BIO EGYPT — El Manial  
**Parent architecture:** `docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md`

## 1. Objective

Define the El Manial Pilot 24 VDC field-power architecture before selecting exact power-supply,
UPS, battery, branch-protection and field-cable part numbers.

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

`230 VAC -> industrial 24 VDC PSU / DC-UPS path -> protected 24 V branches -> BIO-EMS devices`

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
- DIN-rail DC-UPS/charger if backup is fitted;
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
- battery charging current when the DC-UPS is recovering;
- startup/inrush behavior;
- future service accessory / second-controller expansion where practical.

For this reason the engineering starting point remains:

**24 VDC / 5 A industrial PSU**

Nominal output capacity:

**120 W**

This is intentionally generous for El Manial and allows the PSU to operate well below maximum
continuous rating during normal service.

The exact PSU MPN remains open until the DC-UPS topology and battery charge current are selected.

## 6. Proposed branch structure

```text
230 VAC
   |
[AC isolator / protection]
   |
[24 V industrial PSU]
   |
[DC-UPS / charger if fitted]
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

Environmental monitoring should distinguish:

- field DC still available;
- mains AC has failed;
- battery/UPS is supporting the load;
- battery is low/faulted;
- PSU/charger fault.

PDU-24 therefore needs a dry-contact or isolated status interface available to SC and/or COM-CELL.

Preferred Pilot approach:

- use industrial PSU/DC-UPS diagnostic relay contacts where available;
- otherwise use a dedicated isolated AC-present / DC-OK monitoring module.

The Pilot firmware/platform shall later map these into explicit power-health telemetry rather than
infer AC status only from controller uptime.

## 11. DC-UPS / battery design

The final battery capacity cannot be frozen until the required autonomy is approved.

Using the conservative 27.6 W continuous design load:

| Required field autonomy | Ideal energy | Practical design energy target before battery technology detail |
| --- | ---: | ---: |
| 1 hour | 27.6 Wh | ~40–50 Wh |
| 2 hours | 55.2 Wh | ~80–100 Wh |
| 4 hours | 110.4 Wh | ~160–200 Wh |

Practical capacity must include:

- DC-UPS conversion losses;
- battery aging;
- allowed depth of discharge;
- low-temperature/high-temperature derating;
- recharge time;
- required cellular alarm transmission during outage.

A common 24 V lead-acid arrangement using two 12 V batteries in series may be suitable for the
Pilot because components are readily available and easy to service, but battery chemistry and Ah
rating remain an explicit procurement decision.

The Platform PC itself is outside the PDU-24 DC load unless deliberately converted to a compatible
DC architecture. The customer PC should normally have its own suitable AC UPS. SC/SIM/COM-CELL
field operation must not assume the PC remains powered during every mains failure.

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
- 1 × compatible 24 V DC-UPS/charger module or equivalent bench solution;
- battery set sized to the autonomy trial;
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
- DC-UPS compatibility;
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
7. AC loss -> UPS transfer;
8. AC restoration -> recharge;
9. low-battery indication;
10. DC-OK / AC-fail status path;
11. power-cycle recovery;
12. voltage at the furthest SIM under peak field-bus load;
13. enclosure/terminal thermal check;
14. endurance run with logged voltage/current.

## 15. Current engineering conclusion

For El Manial, the approved starting power architecture is:

- 24 VDC field backbone;
- 18–30 V compatible field devices;
- certified industrial DIN-rail mains PSU;
- 24 V / 5 A engineering starting capacity;
- separate SC, SIM, COM-CELL and spare branches;
- DC-UPS/battery support;
- explicit AC-fail/power-health monitoring;
- no custom 230 VAC PCB for the Pilot.

The only major PDU parameter still requiring a product decision before exact battery procurement is
the required **backup autonomy**.
