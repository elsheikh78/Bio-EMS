# BIO-EMS Pilot Hardware Discussion — 2026-08-26

## Status

**DISCUSSION CHECKPOINT — NOT A DESIGN FREEZE OR PROCUREMENT AUTHORIZATION**

This document records the hardware discussion checkpoint reached on 2026-08-26 so the discussion can be resumed later without losing decisions or open questions. Where this note conflicts with an approved ADR, Sprint baseline, or released hardware document, the approved repository document remains authoritative.

## 1. Pilot architecture decisions

- Pilot Sites: **El Manial** and **CPC / 6th of October**.
- Planning baseline: **one Site Controller per Site**.
- October Controller planned in the **Ante-Chamber**, outside the Cold Rooms.
- Pilot Controller should be a **standalone embedded controller; no PC is required at the Site**.
- For the Pilot discussion, the preferred assembly approach is **off-the-shelf modules in a serviceable enclosure/DIN-rail panel; no custom PCB is desired at this stage**.
- The Controller product tier (**Standard / Advanced**) is separate from the Sensor feature set.
- Additional measurement types such as RH, differential pressure, CO2, door status, power status, etc. are treated as **optional paid Sensor/features**, not as the definition of Standard vs Advanced Controller.
- The Controller architecture must remain capable of supporting future Sensor types, particularly through **RS485/Modbus**, even though the initial Pilot is temperature-only.

## 2. October Site mapping inputs

The supplied October warehouse drawing is based on an **actual Thermal Mapping study**. Sensor positions must therefore preserve the mapped locations rather than being moved merely to simplify cabling.

Known Site heights from the field discussion:

- Cold Rooms: approximately **2.8 m** room height.
- Dry Storage: approximately **3.0 m** room height.
- Ante-Chamber: approximately **3.0 m** room height.

The permanent Sensor mounting height should reproduce the Thermal Mapping logger height where that information is available. Room ceiling height must not automatically be treated as Sensor mounting height.

### October mapped points

- Total mapped monitoring points: **13**.
- Cold Rooms: **6 temperature points** across three Cold Rooms (two mapped points per room).
- Ante-Chamber: **1 mapped point**.
- Dry Storage: **6 mapped points**.

Although Ante-Chamber and Dry Storage may require Temperature + RH in the commercial configuration, the current Pilot scope is intentionally simplified to **temperature only at all 13 October points**.

## 3. Temperature Sensor direction for the Pilot

### DS18B20

The current preferred low-cost Pilot temperature direction is **DS18B20**, subject to prototype/FAT and field-cable validation.

Discussion decisions:

- use externally powered **three-wire** operation (`VDD`, `DATA`, `GND`);
- do **not** use parasite power as the standard Pilot field arrangement;
- prefer genuine/traceable DS18B20 devices rather than unknown marketplace clones;
- Sensor identity should use the device's unique ROM/serial identity and map it to the BIO-EMS Sensor/channel record;
- each installed Sensor must ultimately participate in the BIO-EMS calibration/verification process rather than relying only on bare-component accuracy claims;
- Pt100/Class A and industrial RS485 temperature transmitters remain possible higher-accuracy/industrial Sensor options later; they are Sensor options and do not define Controller Standard vs Advanced.

The existing approved S16-04 hardware review already proposes dedicated 1-Wire masters and one powered DS18B20 per Home Run channel. This discussion does not override that engineering baseline.

## 4. October channel/cabling direction

Earlier discussion considered grouping the 13 DS18B20 probes across several 1-Wire buses. However, the repository's approved S16-04 concept currently specifies **one Sensor per dedicated Home Run channel**, with a proposed 16-channel Controller. Therefore the Home Run architecture remains the authoritative design direction unless deliberately changed through hardware review.

October requires 13 channels and therefore fits nominally within a 16-channel Controller with 3 spare channels.

Cable routes and lengths are **not yet field-verified**. Any approximate cable-length figures discussed from the scanned drawing are planning estimates only and must not be used as procurement or installation measurements.

Required before design freeze:

- Controller's exact mounting point in the Ante-Chamber;
- measured route length from Controller to each of the 13 mapped points;
- cable tray/containment routes and penetrations;
- proximity to mains, compressors, evaporators, motors, VFDs, and other EMI sources;
- actual Thermal Mapping logger mounting height at each point where documented;
- rack/product storage heights;
- cable specification and worst-case 1-Wire prototype validation.

## 5. Existing GREISINGER EASYLOG system at October

Photographs show existing **GREISINGER EASYLOG 40K** devices in the Cold Rooms. These may be useful to reduce Pilot cost, but they are treated as a **parallel legacy-integration investigation only**.

Current understanding from the discussion:

- EASYLOG uses the GREISINGER **EASYBus** ecosystem rather than standard Modbus RS485;
- an EASYBus interface/converter may be required to integrate it with BIO-EMS;
- the existing installation should be surveyed to identify where the EASYLOG cables terminate and whether an existing GREISINGER EASYBus/EBW/central interface is already installed;
- no existing wiring should be modified solely on assumptions from the photographs.

### Product decision

BIO-EMS commercial hardware must be designed **as if the existing EASYLOG system does not exist**. If EASYLOG integration proves practical, it can be used as a Pilot shortcut/legacy adapter, but the commercial product must not depend on this discontinued/legacy ecosystem.

Therefore two tracks remain open in parallel:

1. **Pilot legacy track:** investigate re-use/integration of existing EASYLOG equipment.
2. **BIO-EMS product track:** continue designing a complete independent temperature monitoring solution.

## 6. Multi-Sensor Controller principle

The Pilot starts with temperature only, but the Controller must be extensible.

Target interface direction:

- 1-Wire temperature interface for the selected Pilot temperature architecture;
- **RS485/Modbus RTU** provision for future industrial Sensor types;
- local network path for MQTT to BIO-EMS;
- provision for local SMS failover;
- local buffering/replay during communication outages as already defined by the repository integration/hardware requirements.

Future optional paid Sensor/features may include, depending on the customer/industry vertical:

- Relative Humidity;
- Differential Pressure;
- CO2;
- Door Status;
- Power Status;
- other environmental/process measurements supported by an approved Sensor driver/profile.

The Controller tier and Sensor feature catalog must remain independent: a Standard Controller customer may purchase RH, while an Advanced Controller installation may not require it.

## 7. No-custom-PCB Pilot assembly preference

For the current Pilot discussion, the user preference is to avoid a custom PCB and assemble the Controller from locally available modules where practical.

Candidate functional blocks include:

- ESP32-class controller module;
- protected 24 VDC panel supply architecture;
- suitable 1-Wire master/interface modules consistent with the approved dedicated-channel architecture;
- RS485 interface for future Modbus Sensors;
- local nonvolatile storage;
- cellular/SMS module;
- Ethernet/Wi-Fi networking as finally approved;
- fusing/protection, terminal blocks, DIN rail, enclosure, glands and labeling.

This modular assembly preference is a Pilot implementation constraint for further review; exact parts are **not yet approved**.

## 8. Local Egyptian availability rule

A major procurement requirement from this discussion is **local availability inside Egypt**.

Selection priority:

1. realistically purchasable/re-purchasable inside Egypt;
2. technically suitable and sufficiently accurate;
3. calibration/verification support and traceability;
4. reliability/serviceability;
5. compatible interface and documentation;
6. acceptable price.

A product merely listed on an Egyptian-facing international marketplace is not automatically considered locally available. Pilot BOM items should preferably have an Egyptian supplier and a realistic replacement path.

## 9. GSM/SMS direction

The cellular function is intended primarily for **warning/alarm SMS failover**, not high-bandwidth cellular data. Therefore an expensive SIM7600-class modem is not currently justified solely for SMS.

SIM800L-class hardware has been discussed as a low-cost Pilot candidate, subject to:

- Egyptian network/SIM compatibility at deployment time;
- adequate dedicated power design for transmit-current peaks;
- antenna/signal survey;
- reliability testing;
- final security and failover requirements.

No modem model is procurement-approved yet.

## 10. Standard vs Advanced clarification

**Standard and Advanced describe the Controller/platform offering, not Sensor accuracy tiers and not which physical variables the customer is allowed to monitor.**

Sensor types are separately selectable features. The final Standard/Advanced differentiation remains to be completed, but may include differences in capacity, protection/isolation, communications, redundancy, storage, diagnostics, serviceability, and other Controller capabilities.

## 11. Cost direction

The Pilot must remain cost-conscious. A previous ready-made industrial Temperature+RH option at roughly EGP 3,180 per point would make seven T/RH points exceed EGP 22k before Controller/panel/cabling costs. That was considered too expensive for the Pilot.

This contributed to the decision to:

- remove RH from the initial Pilot scope;
- begin with temperature only;
- keep RH and other measurements as optional commercial Sensor/features;
- evaluate DS18B20 as the low-cost Pilot temperature candidate;
- retain industrial/high-accuracy Sensor options for customers that need them.

Prices and stock discussed during research are transient and must be rechecked before procurement.

## 12. Next actions when discussion resumes

### October field survey

1. Photograph and identify the termination/central equipment of the existing EASYLOG system.
2. Record the exact proposed Controller position in the Ante-Chamber.
3. Measure the actual cable route from Controller to each mapped point S01-S13.
4. Record the Thermal Mapping logger height for each point if available.
5. Record racks/storage heights and major airflow/EMI sources.
6. Confirm power, earthing, UPS, Ethernet/Wi-Fi and cellular conditions at the Controller location.

### Hardware/product work in parallel

1. Continue the independent BIO-EMS design as though EASYLOG is unavailable.
2. Verify genuine DS18B20 sourcing inside Egypt and purchase only a small prototype quantity before Pilot quantity.
3. Select locally available modular 1-Wire master/interface hardware consistent with the dedicated Home Run concept.
4. Select RS485/Modbus expansion interface.
5. Select economical but suitable 24 VDC PSU, DC/DC conversion, protection and enclosure components available in Egypt.
6. Select/test an SMS modem only after confirming network and power requirements.
7. Build a **prototype Controller**, then perform bench/FAT cable, fault, power-loss, replay and communications testing before full Pilot procurement.
8. Produce a controlled Pilot BOM only after the relevant design/prototype gates are satisfied.

## 13. Important repository consistency note

The approved S16-04 hardware review currently records a proposed **16-channel Site Controller**, two banks of dedicated 1-Wire masters, one powered DS18B20 probe per Home Run, 24 VDC nominal panel architecture, Ethernet-first connectivity, optional cellular/SMS failover, local replay buffering, and one Controller per Pilot Site as the planning baseline.

This checkpoint deliberately preserves those approved concepts while recording the newer commercial/product decisions from the 2026-08-26 discussion: temperature-only Pilot, optional paid Sensor features, local-Egypt availability priority, parallel EASYLOG investigation, and preference for a no-custom-PCB modular Pilot assembly.
