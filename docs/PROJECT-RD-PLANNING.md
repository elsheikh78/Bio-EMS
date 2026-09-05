# BIO-EMS Project R&D Planning

## Purpose

This document records research and development directions that are approved for investigation and future product planning but are **not automatically committed implementation scope**. Items move from R&D into the implementation plan only after technical, safety, regulatory, commercial, and hardware feasibility review.

---

## R&D-OG-01 — Oil & Gas Industry Vertical

**Status:** Approved for R&D planning  
**Date added:** 2026-09-05  
**Target position:** Candidate second major BIO-EMS industry vertical after Pharmaceutical & Life Sciences.

### 1. Industry scope

Investigate a configurable BIO-EMS Oil & Gas vertical covering:

1. Upstream production
2. Gathering and pipeline transportation
3. Refineries
4. Tank farms / petroleum storage terminals
5. Loading and unloading terminals
6. Fuel distribution and service stations
7. Rotating-equipment condition monitoring
8. Environmental and gas safety monitoring

BIO-EMS should be positioned primarily as an **independent monitoring, alarming, environmental, equipment-condition, analytics and reporting layer**, not as a replacement for plant DCS, SIS or SCADA systems.

### 2. Core parameter library

The R&D parameter catalogue should evaluate support for:

#### Process parameters
- Temperature
- Pressure
- Differential Pressure (ΔP)
- Flow Rate
- Totalized Flow / Volume
- Tank / Vessel Level

#### Gas, safety and environmental parameters
- LEL (%)
- Methane (CH4)
- Hydrogen Sulfide (H2S)
- Oxygen (O2)
- Carbon Monoxide (CO)
- VOC
- Ambient Temperature
- Relative Humidity
- Fire / Smoke Status
- Leak Status
- Noise Level where applicable

#### Equipment condition parameters
- Vibration / Vibration RMS
- Bearing Temperature
- Motor Temperature
- RPM / Speed
- Current
- Voltage
- Power / Energy
- Running / Stopped / Fault Status
- Running Hours
- Start / Stop Count

#### Operational / discrete parameters
- Pump Status
- Valve Status
- Door / Gate Status
- Power Status
- Generator Status
- Emergency Stop Status
- Grounding / Earthing Status for loading operations

### 3. Monitoring-area concepts by application

#### Upstream production
Candidate measurements include wellhead pressure and temperature, flow, separator pressure/temperature/level, gas detection, pump/compressor condition and equipment status.

#### Pipelines
Candidate measurements include line pressure, temperature, flow, differential pressure, valve status, pump status, vibration, gas detection and power status.

R&D should investigate derived anomaly indicators using multiple measurements rather than isolated thresholds, including pressure/flow imbalance and potential leak indicators.

#### Refineries
Focus R&D on independent environmental, safety and equipment-condition monitoring. Candidate applications include filter differential pressure, rotating equipment health, gas detection and utility monitoring.

#### Tank farms
High-priority commercial R&D area. Candidate tank asset model:
- Product level
- Product temperature
- Vapor-space temperature
- Pressure / vacuum
- High and high-high level states
- Leak indication
- LEL / VOC around tanks
- Pump and valve status

#### Loading / unloading terminals
Candidate measurements include flow, totalized volume, pressure, temperature, LEL, VOC, grounding status, pump/valve status and emergency-stop state.

#### Fuel stations / distribution
Candidate measurements include underground tank level, fuel temperature, leak detection, sump level, vapor/LEL detection, pump status, power/generator status and ambient conditions.

### 4. Equipment Condition Monitoring R&D

Investigate an asset-centric model where a pump, motor or compressor becomes a monitored asset containing multiple parameters such as:

- Vibration
- Bearing temperature
- Motor temperature
- Current
- Voltage
- RPM
- Running hours
- Start/stop count

Future analytics may derive an **Equipment Health** state from correlated parameters rather than individual alarms. Predictive-maintenance capabilities are a future R&D objective and must not be represented as implemented until validated.

### 5. Integration architecture to investigate

Oil & Gas support should not require every field sensor to connect directly to an ESP32. R&D should cover industrial integration paths including:

- Modbus RTU
- Modbus TCP
- RS-485
- 4–20 mA through appropriate industrial I/O modules
- Digital / dry-contact inputs
- PLC integration
- SCADA / gateway integration where technically and contractually appropriate
- Industrial protocol gateways for future expansion

This allows BIO-EMS to consume measurements from existing plant instrumentation as well as dedicated BIO-EMS field hardware.

### 6. Hazardous-area constraint

Oil & Gas field deployments may involve classified hazardous locations. Standard ESP32 boards, ordinary sensors, power supplies and enclosures must **not** be assumed suitable for hazardous areas.

R&D must explicitly evaluate:

- Hazardous-area classification
- ATEX / IECEx requirements where applicable
- Intrinsically safe instrumentation and barriers
- Isolation requirements
- Certified enclosures and field devices
- Installation practices and local regulatory requirements

BIO-EMS software can remain the monitoring/analytics layer while certified industrial instrumentation is used in classified field areas.

### 7. Product-boundary principle

The Oil & Gas vertical must preserve a clear boundary:

**BIO-EMS:** monitoring, telemetry ingestion, alarm management, visualization, history, reporting, audit, equipment condition, environmental monitoring and future analytics.

**Not initially targeted as replacements:** DCS, SIS, ESD, PLC control logic, custody-transfer metering or other safety/control systems requiring dedicated certified architectures.

### 8. Recommended R&D priority

Initial investigation priority:

1. Tank Farms / Petroleum Storage
2. Equipment Condition Monitoring
3. Environmental & Gas Monitoring
4. Pipeline Monitoring
5. Loading / Unloading Terminals
6. Fuel Distribution / Service Stations
7. Upstream Production
8. Refinery process-adjacent monitoring

The purpose of this ordering is to identify applications where BIO-EMS can provide commercial value without initially competing with core DCS/SIS/SCADA functions.

### 9. Future R&D deliverables

Before this vertical enters implementation scope, prepare:

- Oil & Gas parameter taxonomy
- Asset and monitoring-area data model
- Sensor/transmitter technology matrix
- Industrial I/O and gateway architecture
- Hazardous-area compliance study
- Candidate Standard vs Advanced hardware architecture
- Egyptian-market component and supplier study
- Pilot use-case definition
- Alarm profile templates
- UI/dashboard concept
- Reporting requirements
- Equipment-health analytics feasibility study
- Commercial feasibility and target-customer analysis

---

## Governance

An entry in this document means the concept is preserved as an approved **R&D direction**. It does not mean the feature is implemented, released, safety-certified, or committed to a specific software release. Promotion to implementation requires an explicit decision and corresponding update to the implementation/project-state documentation.
