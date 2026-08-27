# UPF-01 — Universal Platform Foundation

**Status:** APPROVED / NOT STARTED / BLOCKED BY PRE-UPF CLOSURE GATE  
**Decision date:** 2026-08-27  
**Owner:** BIO-EMS Product Owner  
**Priority:** Strategic platform architecture

## 1. Purpose

BIO-EMS shall evolve from a monitoring product tied to a limited set of sensor types into a configurable **Universal Environmental & Industrial Monitoring Platform**.

The target platform must be capable of supporting multiple industry verticals, customers, sites, monitored areas, physical sensor models, telemetry types, communication protocols, and hardware interface modules without requiring redesign of the core monitoring platform for each new deployment.

This decision is intentionally recorded before implementation so that it cannot be lost or accidentally bypassed by later feature work.

## 2. Core Domain Direction

The target conceptual hierarchy is:

**Customer → Site → Monitored Area → Device/Gateway → Sensor → Telemetry**

A physical Sensor and a Telemetry Type are separate concepts. One sensor may expose one or multiple telemetries.

Examples include:

- SHT-class sensor → Temperature + Relative Humidity
- multi-parameter transmitter → Pressure + Temperature
- digital input → Door Status or Power Status

The platform shall therefore avoid hard-coding Temperature as the fundamental monitoring domain.

## 3. Universal Sensor Architecture

UPF shall introduce a Sensor/Telemetry abstraction layer so that Dashboard, Alarm Engine, Reporting, Notifications, Audit, and other platform services operate on normalized telemetry rather than manufacturer-specific sensor implementations.

Normalized telemetry shall carry, as applicable:

- telemetry type;
- engineering unit;
- sensor identity;
- timestamp;
- value/state;
- quality/status metadata.

## 4. Driver Framework

BIO-EMS shall provide a controlled Sensor Driver Framework and Driver Registry.

Each driver/profile may describe:

- driver identifier and version;
- manufacturer/model or generic protocol family;
- supported telemetry types;
- electrical/interface requirements;
- communication protocol;
- measurement ranges/resolution/accuracy where applicable;
- configurable parameters;
- calibration capabilities;
- compatible BIO-EMS hardware profiles;
- minimum firmware requirements;
- lifecycle state such as Experimental, Approved/Certified, or Deprecated.

Drivers must not be arbitrary executable uploads from customer users. Future driver distribution/installation shall use an approved BIO-EMS-controlled catalog with integrity, compatibility, versioning, and rollback controls as appropriate.

## 5. Generic Drivers First

BIO-EMS shall NOT attempt to implement a dedicated driver for every sensor model in the market.

The preferred first-class generic interfaces include:

- Modbus RTU / RS485;
- Modbus TCP;
- 4–20 mA;
- 0–10 V;
- RTD / PT100 / PT1000;
- Thermocouple families;
- Digital Input / Dry Contact;
- Pulse/Frequency;
- 1-Wire;
- other generic industrial interfaces when approved.

Dedicated manufacturer/model drivers shall be added when a device requires protocol-specific behavior not adequately represented by a generic driver.

## 6. Standard and Advanced Product Principle

Both **BIO-EMS Standard** and **BIO-EMS Advanced** shall use the same universal software architecture, telemetry model, configuration model, and driver framework.

Standard must NOT be architecturally restricted to Temperature-only monitoring.

Product differentiation shall primarily be based on hardware capability, capacity, isolation, expansion, communications, redundancy, and industrial robustness.

### Standard direction

Expected to support a practical subset of interfaces such as 1-Wire, RS485/Modbus, digital inputs, and controlled expansion. Analog and specialist interfaces may be provided through optional modules.

### Advanced direction

Expected to provide broader industrial capability such as isolated/multiple RS485 buses, isolated analog inputs, RTD/Thermocouple modules, expanded digital/pulse I/O, Ethernet and industrial communications, optional cellular/LoRa capabilities, and greater expansion/redundancy.

Exact electrical specifications remain subject to hardware engineering and BOM approval.

## 7. Modular Hardware Direction

BIO-EMS hardware should use a modular capability architecture rather than attempting to place a dedicated connector/interface for every possible sensor on one PCB.

Conceptual modules may include:

- BIO-IO-RS485;
- BIO-IO-ANALOG for 4–20 mA / 0–10 V;
- BIO-IO-RTD;
- BIO-IO-THERMOCOUPLE;
- BIO-IO-DIGITAL;
- BIO-IO-1WIRE;
- future approved modules.

Each gateway/device shall expose a machine-readable Hardware Capability Profile so software can determine whether a selected sensor is directly supported, requires an expansion module, or is incompatible.

## 8. Product Owner Configuration Console

A privileged configuration console shall be created for the platform owner boundary only. Customer ADMIN/USER roles must not gain platform-owner provisioning authority.

The existing security role name may remain `SYSTEM_OWNER`; the UI/business terminology may present this capability as the **Product Owner Console**.

The console shall eventually support controlled provisioning/configuration of:

- Customer/company identity;
- industry vertical;
- license/product edition;
- number and names of Sites;
- number and names of Monitored Areas;
- Devices/Gateways;
- Sensors;
- Telemetry Types;
- Sensor model/profile selection;
- required driver selection/status;
- hardware compatibility;
- sensor-specific configuration;
- alarm thresholds and deadband/delay where appropriate;
- sampling/publishing intervals;
- calibration metadata;
- other approved commissioning parameters.

## 9. Dynamic Sensor Configuration

Configuration fields shall be schema-driven where practical.

Examples:

**Modbus:** slave address, baud rate, parity, stop bits, register, data type, byte/word order, scale.  
**1-Wire:** device/ROM address and supported resolution parameters.  
**4–20 mA:** engineering mapping such as 4 mA = minimum and 20 mA = maximum.  

The UI shall render applicable configuration properties based on the selected driver/profile rather than hard-coding one universal sensor form.

## 10. Telemetry Registry and Sector Templates

The platform shall support an extensible Telemetry Type Registry. Initial/typical types may include Temperature, Relative Humidity, Differential Pressure, Pressure, CO2, O2, LEL, CH4, Particle Count, Air Velocity, Flow, Tank Level, Vibration, Door Status, Power Status, Equipment Status, and Custom Telemetry.

Industry Vertical templates may preconfigure common combinations for Pharmaceutical/Life Sciences, Food, Oil & Gas, Data Centers, Warehousing, Manufacturing, and future sectors.

Templates are defaults/convenience only and must not become architectural restrictions.

## 11. Hardware Compatibility Engine

UPF shall ultimately provide compatibility evaluation between:

**Selected Sensor/Profile + Driver Requirements + Gateway Hardware Capability Profile + Installed Expansion Modules + Firmware/Driver Versions.**

The Product Owner should receive explicit states such as Compatible, Expansion Required, Firmware/Driver Update Required, or Not Compatible before commissioning.

## 12. Mandatory Implementation Timing

**UPF-01 MUST NOT START immediately.**

Implementation is blocked by a formal **Pre-UPF Closure Gate**.

The purpose of the gate is to prevent old software debt, incomplete commercial-foundation work, unresolved pilot defects, or unknown/untracked work from being carried into the new architecture.

Before UPF implementation starts:

1. Current BF/commercial-foundation work required by the approved roadmap must be completed or explicitly closed/deferred.
2. Existing known software backlog and defects must be completed or explicitly dispositioned.
3. BIO EGYPT software baseline must be stable; known software defects affecting the pilot must not remain unresolved.
4. Remaining field/commissioning items may continue only when explicitly classified as field/hardware/commissioning work and are not hidden software blockers.
5. GitHub/main, documentation, migrations, backend, frontend, tests, and known work items must receive a final Pre-UPF audit.
6. Every pre-UPF item must have an explicit state: CLOSED, MERGED + VERIFIED, or deliberately DEFERRED with rationale.
7. There must be **ZERO unresolved BLOCKERS and ZERO UNKNOWN/UNTRACKED work** at the UPF entry gate.
8. A clean baseline release/tag must be created immediately before UPF implementation begins, providing a known rollback/reference point.

Target transition:

**Existing BIO-EMS → Pre-UPF Closure Gate → Clean Baseline Release → UPF-01 Implementation**

## 13. Pilot Protection / Backward Compatibility

UPF must not discard or destabilize the BIO EGYPT pilot implementation.

Existing DS18B20 temperature monitoring should become the first concrete sensor/driver/profile implementation within the generalized architecture. Migration shall preserve current operational behavior while introducing the universal abstractions incrementally.

No UPF migration is accepted if it silently breaks existing telemetry ingestion, alarms, dashboard behavior, monitored areas, calibration history, device health, notifications, reporting, or pilot data compatibility.

## 14. Initial UPF Workstream Candidates

Implementation is expected to be split into controlled work packages rather than one large change. Candidate foundations include:

- Telemetry Type Registry;
- Sensor Model/Profile Catalog;
- Driver Registry;
- Driver Capability Model;
- Hardware Capability Profiles;
- Sensor ↔ Telemetry mapping;
- Dynamic Sensor Configuration Schema;
- Product Owner Configuration Console;
- Customer/Site/Area provisioning;
- Hardware Compatibility Engine;
- Industry/Sector Templates;
- migration/backward-compatibility work for existing DS18B20 pilot deployments.

Exact sequencing shall be approved only after the Pre-UPF audit.

## 15. Non-Negotiable Architectural Rules

1. Core monitoring services must not become coupled to a particular sensor manufacturer/model.
2. Sensor and Telemetry are separate domain concepts.
3. Standard and Advanced share the universal software foundation.
4. Hardware limitations are represented as capabilities, not hidden software assumptions.
5. New sensors should normally be integrated through profiles/drivers/configuration rather than modifications to core monitoring logic.
6. Product-owner provisioning authority must remain isolated from customer roles.
7. Generic industrial protocol/interface support is preferred before proliferating model-specific drivers.
8. Existing validated deployments must have a controlled migration path.
9. UPF implementation cannot begin until the Pre-UPF Closure Gate passes.

## 16. Entry-Gate Reminder

When future BIO-EMS development reaches the end of the currently approved BF/backlog work, the team MUST review this document before opening the first UPF implementation branch.

The first question is not “Which UPF feature do we code first?”

The first question is:

> **Has the PRE-UPF CLOSURE GATE passed with zero blockers and zero unknown/untracked work, and has the clean baseline release been created?**

If the answer is no, UPF implementation remains **BLOCKED**.
