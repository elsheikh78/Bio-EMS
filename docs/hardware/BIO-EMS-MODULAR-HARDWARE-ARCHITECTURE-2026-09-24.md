# BIO-EMS Modular Hardware Architecture — Approved Pilot Baseline

**Decision date:** 24 September 2026  
**Status:** APPROVED ARCHITECTURE / DETAILED ELECTRICAL DESIGN IN PROGRESS  
**Applies to:** BIO-EMS Pilot hardware and the first El Manial procurement/design baseline  
**Supersedes for new Pilot hardware:** direct multi-sensor wiring into one all-in-one Site Controller and the previous direct-DS18B20 Pilot hardware direction

## 1. Decision

BIO-EMS adopts a modular field-hardware architecture built from five product blocks:

1. **BIO-EMS SC** — Site Controller.
2. **BIO-EMS SIM-T2** — two-channel RTD Sensor Interface Module.
3. **BIO-EMS SIM-T4** — four-channel RTD Sensor Interface Module.
4. **BIO-EMS COM-CELL** — independent cellular/SMS communication gateway.
5. **BIO-EMS PDU-24** — 24 VDC power and protected distribution unit.

The Site Controller is no longer the direct analog/RTD acquisition point. Temperature probes are
terminated at local Sensor Interface Modules; the SIM layer performs measurement conversion and
reports digital data to the Site Controller over the field bus.

This decision deliberately separates:

- measurement electronics;
- site control/processing;
- cellular communication;
- power distribution.

The purpose is to reduce long analog sensor runs, isolate failure domains, simplify maintenance,
allow product-family expansion, and avoid making every Site Controller a customer-specific
hardware assembly.

## 2. Temperature measurement baseline

The first released SIM family targets:

- **Sensor technology:** PT100 RTD;
- **Pilot wiring baseline:** 3-wire;
- **front end:** one MAX31865-class RTD interface per channel;
- **SIM-T2:** 2 active RTD channels;
- **SIM-T4:** 4 active RTD channels.

Each RTD channel has an independent measurement front end. The design shall not multiplex several
PT100 probes through one MAX31865 in Revision 1.

SIM-T2 and SIM-T4 should use one common four-channel PCB where practical:

- SIM-T4: channels 1–4 populated;
- SIM-T2: channels 1–2 populated, channels 3–4 DNP.

The common-board objective is to reduce PCB variants, firmware variants, inventory, test fixtures,
and spare-parts complexity.

The exact PT100 class, probe construction, reference resistor tolerance/TCR, terminal technology,
and environmental enclosure are detailed-design/BOM decisions and must pass bench/calibration
validation before procurement freeze.

## 3. 24 VDC field-power standard

BIO-EMS adopts **24 VDC as the field power backbone**.

Target device input design range:

`18–30 VDC`

Distributed 5 V power is not the field standard. Each device locally converts 24 V to the required
5 V / 3.3 V rails.

Reasons:

- lower current for a given load;
- materially lower percentage voltage drop on long field runs;
- better compatibility with industrial sensors/transmitters and future 4–20 mA modules;
- simpler power distribution and protection;
- easier integration with industrial DIN-rail PSU/DC-UPS equipment.

## 4. BIO-EMS SC — Site Controller

The Site Controller is responsible for:

- communication with SIM modules;
- local device/channel mapping;
- buffering and recovery;
- MQTT/Platform communication;
- controller heartbeat and health;
- application of configuration revisions;
- controlled local alarm/emergency logic where later required.

Revision-1 design direction:

- ESP32-S3 family controller;
- wired Ethernet as the primary platform-network path;
- Wi-Fi retained as service/fallback capability, not the preferred fixed-site path;
- two RS485 interfaces:
  - RS485-A: primary Sensor Interface field bus;
  - RS485-B: expansion/service/emergency/future bus;
- 24 VDC input with local protected conversion;
- hardware watchdog/supervision;
- RTC/time-retention strategy;
- local non-volatile buffering/storage sized during detailed design;
- service USB;
- status/diagnostic indicators;
- future secure-element footprint / production Device Trust accommodation.

The Site Controller does not contain the cellular modem in the approved modular architecture.

## 5. BIO-EMS SIM-T2 / SIM-T4

Each SIM contains:

- PT100 terminal block(s);
- independent MAX31865-class front end per populated channel;
- small low-cost MCU;
- shared SPI bus with independent chip-select per RTD front end;
- RS485 transceiver;
- 24 V input protection and local conversion;
- hardware watchdog;
- module serial/UID;
- logical field-bus address;
- status/diagnostic indicator;
- field connector and enclosure suited to the installation environment.

The selected MCU shall be deliberately smaller/lower-cost than the Site Controller and need not
provide Wi-Fi/Bluetooth. Final MCU selection is a detailed-design step based on cost, availability,
temperature rating, required SPI/UART/GPIO, watchdog, unique ID, flash and production tooling.

## 6. Field-bus baseline

The Pilot field-bus design direction is:

- physical layer: RS485;
- application protocol: Modbus RTU or an explicitly versioned BIO-EMS RTU profile built on the
  same deterministic master/slave principles;
- baseline serial rate for bench validation: 19,200 baud, 8N1;
- topology: trunk/daisy chain where practical;
- 120-ohm termination only at the two physical ends of the bus;
- master-side biasing;
- twisted pair for A/B;
- 24 V / 0 V carried as a separate power pair where one field cable is used;
- shield/earth policy finalized after the installation and EMC design is reviewed.

Star wiring and large uncontrolled stubs are not the baseline.

Final cable part number, conductor size, shield termination, galvanic-isolation boundary and surge
protection are detailed-design outputs and must not be guessed from this architecture document.

## 7. BIO-EMS COM-CELL

Cellular communication is a separate Site device rather than a modem duplicated in every Site
Controller.

The COM-CELL role includes:

- LTE/SIM interface;
- SMS transport;
- cellular signal/operator diagnostics;
- future cellular IP backup where approved;
- modem watchdog and hard power-cycle control;
- communication with the Platform and/or Site Controllers;
- emergency/fallback path that remains architecturally independent from one specific Site
  Controller.

Revision-1 direction:

- 24 VDC input;
- dedicated high-current cellular power stage;
- LTE Cat-1-class modem, final model selected after Egypt carrier/band/availability review;
- SIM holder;
- external antenna connector;
- Ethernet and/or RS485 interface as finalized in detailed design;
- MCU supervising the modem and local fallback logic.

The commercial design must not be permanently tied to SIM800L/2G. A 4G-capable part family is the
preferred direction for a new product design.

## 8. BIO-EMS PDU-24

The PDU-24 is a protected distribution assembly, not merely a power supply.

Baseline structure:

```text
230 VAC
   |
Industrial 24 VDC PSU / future DC-UPS stage
   |
PDU-24
   +-- protected branch -> Site Controller(s)
   +-- protected branch -> SIM field bus(es)
   +-- protected branch -> COM-CELL
   +-- protected spare/expansion branch
```

Each major load group shall have independent protection so that a short circuit in one field
branch does not remove power from the entire Site.

Detailed design shall define:

- PSU continuous and surge rating;
- branch fuse/PTC/electronic protection;
- reverse-polarity protection where applicable;
- surge/transient protection;
- terminal blocks;
- power-good / AC-fail monitoring;
- enclosure/DIN-rail arrangement;
- earthing/chassis treatment;
- DC-UPS/battery interface and autonomy options.

A nominal **24 V / 5 A** supply is the current engineering starting point for Pilot sizing, not a
released procurement value. The final rating must follow the measured load budget and approved
backup-autonomy target.

## 9. El Manial first-site hardware allocation

The controlled Pilot scope for El Manial remains seven temperature Sensors:

- Cold Room 01: 2;
- Anti-chamber 01: 1;
- Dry Warehouse 01: 4.

The approved modular allocation for detailed design is:

| Area | Interface module | Channels used | Spare |
| --- | --- | ---: | ---: |
| Cold Room 01 | 1 × SIM-T2 | 2 | 0 |
| Anti-chamber 01 | 1 × SIM-T2 | 1 | 1 |
| Dry Warehouse 01 | 1 × SIM-T4 | 4 | 0 |
| **Total** | **2 × SIM-T2 + 1 × SIM-T4** | **7** | **1** |

Site-level equipment baseline:

- 1 × BIO-EMS SC;
- 2 × BIO-EMS SIM-T2;
- 1 × BIO-EMS SIM-T4;
- 1 × BIO-EMS COM-CELL;
- 1 × BIO-EMS PDU-24;
- 7 × PT100 3-wire temperature probe assemblies;
- one protected 24 V field-power system;
- field cabling, glands, terminations, enclosure/panel hardware and Ethernet accessories sized
  after the route survey.

El Manial uses one Site Controller in the first Pilot design because seven channels are spread
across three local SIM modules and do not justify a second controller solely for channel capacity.
The architecture permits a second controller later if reliability/risk assessment or field
layout requires a separate failure domain.

## 10. October scaling direction

The same architecture scales to CPC / 6th of October without changing the fundamental product
blocks.

The current engineering direction is multiple Site Controllers where useful for fault-domain
separation, with one independent COM-CELL resource for the Site and local SIM-T2/SIM-T4 modules
placed according to actual cable routes and environmental constraints.

October final controller/SIM allocation remains a later design exercise after El Manial hardware
and field-bus behavior are validated.

## 11. Design work packages and order

Detailed hardware design shall proceed in this order:

1. **HW-PWR-01 — 24 V power budget and PDU-24**
   - load assumptions;
   - branch architecture;
   - PSU;
   - protection;
   - DC-UPS/autonomy decision.

2. **HW-SIM-01 — SIM-T2/T4 electrical design**
   - PT100 input;
   - MAX31865/reference network;
   - MCU;
   - RS485;
   - power/protection;
   - common PCB/DNP plan.

3. **HW-SC-01 — Site Controller**
   - ESP32-S3 implementation;
   - Ethernet;
   - dual RS485;
   - local storage;
   - watchdog/RTC;
   - power/protection;
   - connectors and service interface.

4. **HW-CELL-01 — COM-CELL**
   - LTE modem selection;
   - modem power rail;
   - SIM/antenna;
   - MCU;
   - Ethernet/RS485 path;
   - emergency/failover contract.

5. **HW-MECH-01 — Enclosures, connectors, cable and environmental protection**
   - IP/environment;
   - glands;
   - terminal blocks;
   - DIN/wall mounting;
   - labeling;
   - shielding/earthing.

6. **HW-MNL-BOM-01 — El Manial detailed procurement BOM**
   - exact manufacturer part numbers;
   - quantities;
   - approved alternates;
   - spares;
   - local/import sourcing;
   - unit and total cost.

7. **HW-BENCH-01 — Prototype and qualification**
   - power;
   - RTD accuracy/calibration;
   - RS485 noise/length;
   - Ethernet;
   - cellular/SMS;
   - power-cycle/reconnect;
   - failure isolation;
   - endurance.

Procurement freeze occurs only after the applicable electrical/BOM review. Early development
modules may be purchased separately for prototyping and are not automatically the released
production BOM.

## 12. Immediate restart point

Start with **HW-PWR-01**.

The first calculation shall define the El Manial power budget for:

- 1 × SC;
- 2 × SIM-T2;
- 1 × SIM-T4;
- 1 × COM-CELL;
- spare capacity;
- required DC-UPS autonomy.

That calculation drives the final PSU, branch protection, cable gauge and battery/UPS purchase.

## 13. Evidence boundary

This document records an approved architecture and an El Manial design baseline.

It does **not** claim:

- a released PCB;
- a frozen manufacturer BOM;
- completed EMC/electrical safety validation;
- confirmed field cable lengths;
- purchased/calibrated probes;
- physical installation;
- BIO EGYPT commissioning or acceptance.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
