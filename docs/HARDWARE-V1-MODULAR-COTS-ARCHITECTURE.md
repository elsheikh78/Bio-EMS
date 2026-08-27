# BIO-EMS Hardware V1 — Modular COTS Architecture

**Status:** APPROVED  
**Decision date:** 2026-08-27  
**Scope:** BIO-EMS Standard and Advanced V1

## Decision

BIO-EMS V1 shall NOT use a custom main PCB as the primary product architecture.

Both Standard and Advanced shall use a modular, serviceable architecture built from commercially available industrial/COTS modules, DIN-rail components, terminal blocks, protected DC distribution, controller modules, communications modules, and approved I/O interface modules.

A custom PCB may be reconsidered only in a later product generation after commercial volume, cost, EMC, manufacturing, and maintainability justify the NRE and redesign effort.

## Product Principle

The software and driver architecture remains universal. Hardware differentiation between Standard and Advanced shall come from capacity, isolation, available interface modules, communications, robustness, and expansion capability rather than from a different software model.

## Standard Direction

Standard V1 shall be capable of multi-sensor monitoring and must not be restricted to Temperature only.

Baseline direction:

- 24 VDC industrial power architecture;
- modular controller based on ESP32-S3-class capability or an approved equivalent industrial controller;
- mandatory Internet-primary communications;
- mandatory Cellular/SMS emergency failover for Internet outage;
- 1-Wire support for DS18B20 pilot sensors;
- isolated RS485/Modbus support;
- digital/pulse capability as required;
- protected 24 V field/sensor power budget of approximately 1 A maximum;
- future expansion through approved external modules;
- DIN-rail / panel wiring and replaceable modules.

## Advanced Direction

Advanced V1 shall use the same core software/driver model with greater industrial capability.

Baseline direction:

- 24 VDC industrial power architecture;
- modular controller architecture;
- mandatory Internet-primary communications;
- mandatory Cellular/SMS emergency failover;
- multiple isolated RS485/Modbus capability as required;
- Ethernet preferred/standard;
- analog 4–20 mA and 0–10 V through approved industrial I/O modules;
- RTD/PT100/PT1000 through approved modules;
- Thermocouple support through approved modules;
- digital and pulse I/O modules;
- protected field/expansion design capacity approximately 3 A combined, subject to final load engineering;
- isolated communications and field domains where appropriate;
- scalable expansion through approved DIN-rail/COTS modules.

## Mandatory SMS Failover

Cellular/SMS is NOT optional for either Standard or Advanced. It is an emergency notification path used when the primary Internet path is unavailable or a configured failover condition is satisfied.

Cellular hardware shall have its own suitable protected power supply/domain to prevent radio transmit-current bursts from destabilizing the main controller or logic supply.

## Power Architecture

The approved system-level direction is:

**24 VDC input → industrial input protection/distribution → logic supply + dedicated cellular supply + protected 24 V sensor/field supply.**

Advanced additionally separates expansion and isolated communication domains where required.

Protection requirements remain mandatory even though protection may be implemented by certified/industrial COTS modules rather than discrete PCB components:

- over-current protection;
- short-circuit protection;
- reverse-polarity protection where applicable;
- transient/surge protection appropriate to the installation category;
- EMI/EMC-conscious distribution;
- branch protection so a sensor/field fault does not reboot or power down the controller.

## COTS Module Selection Policy

The project shall maintain an Approved Hardware Catalog rather than coupling BIO-EMS to a single vendor where avoidable.

For each functional block, the catalog should record:

- role/category;
- manufacturer;
- model/part number;
- electrical/interface specifications;
- protocol;
- channel count;
- isolation rating;
- environmental rating;
- supply requirements;
- driver/profile required by BIO-EMS;
- Standard/Advanced compatibility;
- Approved / Alternate / Candidate / Deprecated status;
- known sourcing region/vendor;
- firmware/software dependencies.

## Target COTS Categories

The initial module selection matrix shall cover at minimum:

1. 24 V DIN-rail PSU;
2. DC protection/distribution;
3. main controller;
4. isolated RS485/Modbus interface;
5. Ethernet interface/controller where required;
6. mandatory GSM/SMS modem;
7. 1-Wire interface/support for DS18B20;
8. digital input/pulse modules;
9. 4–20 mA input modules;
10. 0–10 V input modules;
11. RTD/PT100/PT1000 modules;
12. thermocouple modules;
13. expansion/inter-module communications where required;
14. terminal blocks, enclosure, and DIN-rail accessories.

## UPF Alignment

This architecture is intentionally aligned with UPF-01.

BIO-EMS software shall identify sensor models, drivers/profiles, telemetry types, gateway capabilities, and installed I/O modules independently of whether a function is implemented by a custom board or a COTS module.

The Product Owner Console and future Hardware Compatibility Engine should be able to determine that a selected sensor requires a particular interface capability and list compatible approved hardware modules.

## Pilot Protection

The BIO EGYPT temperature pilot remains supported. DS18B20 shall become the first implemented sensor profile within the universal architecture; the modular V1 decision must not destabilize existing telemetry, alarm, calibration, reporting, notification, or monitored-area behavior.

## Superseded Design Direction

Earlier component-level discussions concerning custom-PCB power front-end parts, discrete TVS/eFuse/buck selection, and custom PCB interface circuitry are retained as engineering knowledge but are NOT the V1 implementation baseline.

For V1, those requirements are translated into system/module acceptance criteria and satisfied using suitable industrial/COTS hardware.

## Next Required Activity

Create and approve a **Standard vs Advanced Module Selection Matrix** with specific current market modules and at least one viable alternative for critical blocks before purchasing hardware.
