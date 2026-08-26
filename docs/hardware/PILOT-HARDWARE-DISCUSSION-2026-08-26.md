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

The existing approved S16-04 hardware review proposes dedicated 1-Wire masters and one powered DS18B20 per Home Run channel. The Pilot prototype simplification in Section 14 is an experimental implementation direction only and does not silently replace the approved S16-04 product baseline.

## 4. October channel/cabling direction

The repository's approved S16-04 concept specifies **one Sensor per dedicated Home Run channel**, with a proposed 16-channel Controller. October requires 13 channels and therefore fits nominally within a 16-channel Controller with 3 spare channels.

For the current Pilot prototype, each Sensor remains physically dedicated to one Home Run and one logical channel. The proposed experimental implementation is one ESP32 GPIO per DS18B20 DATA line, rather than a multidrop 1-Wire bus. This must pass prototype/FAT testing before field use.

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

BIO-EMS commercial hardware must be designed **as if the existing EASYLOG system does not exist**. If EASYLOG integration proves practical, it can be used as a Pilot shortcut/legacy adapter, but the commercial product must not depend on this legacy ecosystem.

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

Future optional paid Sensor/features may include Relative Humidity, Differential Pressure, CO2, Door Status, Power Status, and other approved environmental/process measurements.

The Controller tier and Sensor feature catalog remain independent: a Standard Controller customer may purchase RH, while an Advanced Controller installation may not require it.

## 7. No-custom-PCB Pilot assembly preference

For the current Pilot discussion, the preference is to avoid a custom PCB and assemble the Controller from locally available modules where practical.

Candidate functional blocks include:

- ESP32-class development/controller module;
- protected 24 VDC panel supply architecture;
- dedicated 1-Wire field channels for Pilot temperature probes;
- RS485 interface for future Modbus Sensors;
- local nonvolatile storage;
- cellular/SMS module;
- Ethernet/Wi-Fi networking as finally approved;
- fusing/protection, terminal blocks, DIN rail, enclosure, glands and labeling.

A **perforated plastic laboratory mounting/prototyping panel** may be used as a mechanical carrier for the low-voltage prototype modules if it is mechanically rigid, flame/temperature suitable, insulated, securely fixed inside an enclosure, and does not replace proper terminals, fusing, strain relief, mains/SELV segregation or field protection. It is acceptable for the bench/prototype stage; it is **not automatically accepted as the released Pilot or commercial mounting method** without review.

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

SIM800L-class hardware has been discussed as a low-cost Pilot candidate, subject to Egyptian network/SIM compatibility at deployment time, adequate dedicated power design for transmit-current peaks, antenna/signal survey, reliability testing, and final security/failover requirements.

No modem model is procurement-approved yet.

## 10. Standard vs Advanced clarification

**Standard and Advanced describe the Controller/platform offering, not Sensor accuracy tiers and not which physical variables the customer is allowed to monitor.**

Sensor types are separately selectable features. The final Standard/Advanced differentiation remains to be completed, but may include differences in capacity, protection/isolation, communications, redundancy, storage, diagnostics, serviceability, and other Controller capabilities.

## 11. Cost direction

The Pilot must remain cost-conscious. A previous ready-made industrial Temperature+RH option at roughly EGP 3,180 per point would make seven T/RH points exceed EGP 22k before Controller/panel/cabling costs. That was considered too expensive for the Pilot.

This contributed to the decision to remove RH from the initial Pilot scope, begin with temperature only, keep RH and other measurements as optional commercial Sensor/features, evaluate DS18B20 as the low-cost Pilot temperature candidate, and retain industrial/high-accuracy Sensor options for customers that need them.

Prices and stock discussed during research are transient and must be rechecked before procurement.

## 12. October field survey still required

1. Photograph and identify the termination/central equipment of the existing EASYLOG system.
2. Record the exact proposed Controller position in the Ante-Chamber.
3. Measure the actual cable route from Controller to each mapped point S01-S13.
4. Record the Thermal Mapping logger height for each point if available.
5. Record racks/storage heights and major airflow/EMI sources.
6. Confirm power, earthing, UPS, Ethernet/Wi-Fi and cellular conditions at the Controller location.

## 13. Important repository consistency note

The approved S16-04 hardware review currently records a proposed **16-channel Site Controller**, two banks of dedicated 1-Wire masters, one powered DS18B20 probe per Home Run, 24 VDC nominal panel architecture, Ethernet-first connectivity, optional cellular/SMS failover, local replay buffering, and one Controller per Pilot Site as the planning baseline.

The direct-GPIO architecture below is intentionally documented as **Pilot Controller v0.1 prototype direction**, requiring FAT evidence before it can supersede any approved product hardware baseline.

## 14. Pilot Controller v0.1 - prototype direction (2026-08-26)

### Decision

For the lowest-complexity prototype, study and test a **direct dedicated GPIO Home Run architecture**:

- ESP32 38-pin development board as the prototype MCU platform;
- one dedicated ESP32 GPIO / 1-Wire DATA line per DS18B20 Sensor channel;
- no multidrop DATA bus in this prototype;
- October uses CH01-CH13 and reserves CH14-CH16 where GPIO capacity and peripheral allocation permit;
- each channel retains the three identities: physical Channel, DS18B20 ROM, and BIO-EMS Sensor ID;
- no custom PCB;
- DS2482-800 is not required for this prototype path;
- future product hardware may return to dedicated 1-Wire masters if cable/EMI/FAT evidence requires it.

### Functional wiring concept

```text
Protected 230 VAC
      |
   MCB/Fuse
      |
24 VDC DIN/Panel PSU
      |
      +--> protected 24 V field/expansion provision
      |
      +--> DC/DC --> logic rail --> ESP32
      |                         |--> CH01 DATA --> S01 DS18B20
      |                         |--> CH02 DATA --> S02 DS18B20
      |                         |--> ...
      |                         |--> CH13 DATA --> S13 DS18B20
      |                         |--> RS485 module --> future Modbus Sensors
      |                         |--> local storage
      |
      +--> dedicated DC/DC --> cellular/SMS modem
```

Each DS18B20 Home Run uses `VDD + DATA + GND`. Parasite power is excluded. Each DATA channel requires an appropriate pull-up and field protection to be selected by test; values and exact components are not released yet.

### Power segregation

The cellular modem should not be powered casually from the ESP32 regulator. The prototype should provide a separate, adequately rated conversion path for the cellular modem so transmit-current peaks do not reset or destabilize the MCU.

### RS485 expansion

At least one RS485/Modbus interface remains in the Controller prototype even though the Pilot begins with temperature only. This preserves the intended path for optional paid RH, differential-pressure, CO2 and other industrial Sensor features.

### Prototype/FAT sequence

Do **not** procure the full Site quantity before validation. Test in stages:

1. one DS18B20 channel at short cable length;
2. the same channel at representative 5 m, 10 m, 20 m and up to the measured worst-case Site route as applicable;
3. four independent channels concurrently;
4. expanded/full-load channel test after GPIO/peripheral pin allocation is validated;
5. fault injection: Sensor disconnect, open DATA, short/miswire where safely testable, wrong ROM/replaced Sensor, CRC/communication errors;
6. power-cycle/brownout recovery;
7. network outage, local buffering and replay behavior;
8. cellular transmit test while all acquisition functions continue without reset.

The next electrical design task is a **safe ESP32 pin assignment** covering Sensor channels, RS485, cellular UART, storage, networking and service functions while avoiding boot/flash/reserved-pin conflicts.

## 15. Prototype mechanical assembly

For the first laboratory build, a perforated plastic hole panel can replace a loose tabletop/breadboard arrangement as the **mechanical mounting base**. Modules may be fixed using insulated standoffs, screws/cable ties where appropriate, with short organized low-voltage wiring.

Conditions:

- the 230 VAC section and PSU primary must remain guarded/segregated and preferably use enclosed/DIN components;
- no exposed mains conductors on the perforated panel;
- use proper terminal blocks for field Sensor cables rather than twisting/jumper-wire connections;
- provide strain relief and cable labeling;
- fuse/protect power branches;
- keep cellular antenna and RF considerations in mind;
- the panel should ultimately sit inside a suitable enclosure for extended testing;
- a successful laboratory mounting arrangement is not itself a production mechanical approval.

This approach is preferred over a solderless breadboard for a multi-day/multi-channel prototype because it can provide better mechanical retention and repeatability while preserving the no-custom-PCB objective.
