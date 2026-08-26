# BIO-EMS Pilot Hardware Discussion — 2026-08-26

## Status

**DISCUSSION CHECKPOINT — NOT A DESIGN FREEZE OR PROCUREMENT AUTHORIZATION**

This document records the hardware discussion checkpoint reached on 2026-08-26 so the discussion can be resumed later without losing decisions or open questions. Where this note conflicts with an approved ADR, Sprint baseline, or released hardware document, the approved repository document remains authoritative.

## 1. Pilot architecture decisions

- Pilot Sites: **El Manial** and **CPC / 6th of October**.
- Planning baseline: **one Site Controller per Site**.
- October Controller planned in the **Ante-Chamber**, outside the Cold Rooms.
- Pilot Controller should be a **standalone embedded controller; no PC is required at the Site**.
- No custom PCB is desired at this stage.
- The first laboratory prototype will use a **solderless breadboard** for the low-voltage electronics and short prototype interconnections.
- The breadboard is a laboratory development tool only; it is not the released field mounting method for the October or El Manial Site Controller.
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
- The current Pilot scope is intentionally **temperature only at all 13 October points**.

## 3. Temperature Sensor direction for the Pilot

### DS18B20

The current preferred low-cost Pilot temperature direction is **DS18B20**, subject to prototype/FAT and field-cable validation.

- externally powered **three-wire** operation (`VDD`, `DATA`, `GND`);
- no parasite power as the standard Pilot field arrangement;
- prefer genuine/traceable devices rather than unknown clones;
- map Sensor ROM/serial identity to the physical Channel and BIO-EMS Sensor record;
- installed Sensors must participate in the BIO-EMS calibration/verification process;
- Pt100/Class A and industrial RS485 temperature transmitters remain possible higher-accuracy/industrial Sensor options later.

The approved S16-04 hardware review proposes dedicated 1-Wire masters and one powered DS18B20 per Home Run channel. The Pilot simplification below is experimental and does not silently replace that approved product baseline.

## 4. October channel/cabling direction

The approved S16-04 concept specifies **one Sensor per dedicated Home Run channel**, with a proposed 16-channel Controller. October requires 13 channels and therefore fits nominally within a 16-channel Controller with 3 spare channels.

For the current Pilot prototype, each Sensor remains physically dedicated to one Home Run and one logical channel. The experimental implementation under study is one ESP32 GPIO per DS18B20 DATA line, rather than a multidrop 1-Wire bus. This must pass prototype/FAT testing before field use.

Cable routes and lengths are **not yet field-verified**. Planning estimates must not be used as procurement or installation measurements.

Required before design freeze: exact Controller position, measured route length to S01-S13, containment/penetrations, EMI sources, Thermal Mapping logger heights, rack/storage heights, cable specification, and worst-case 1-Wire validation.

## 5. Existing GREISINGER EASYLOG system at October

Existing **GREISINGER EASYLOG 40K** devices may reduce Pilot cost, but they remain a **parallel legacy-integration investigation only**. BIO-EMS commercial hardware must be designed as if EASYLOG does not exist.

Two tracks remain open:

1. **Pilot legacy track:** investigate re-use/integration of existing EASYLOG equipment.
2. **BIO-EMS product track:** continue designing a complete independent temperature monitoring solution.

## 6. Multi-Sensor Controller principle

The Pilot starts with temperature only, but the Controller must be extensible.

Target interfaces include:

- 1-Wire temperature interface for the Pilot;
- **RS485/Modbus RTU** for future industrial Sensor types;
- local network path for MQTT to BIO-EMS;
- local SMS failover;
- local buffering/replay during communication outages.

Future optional paid Sensor/features may include Relative Humidity, Differential Pressure, CO2, Door Status, Power Status, and other approved measurements.

## 7. No-custom-PCB and breadboard prototype decision

The first laboratory build will use a **solderless breadboard** as the low-voltage prototyping platform. This replaces the previously discussed perforated plastic hole panel for the first prototype.

Breadboard scope:

- ESP32 development board;
- low-voltage pull-ups and channel test circuitry;
- RS485 development module;
- low-voltage storage/interface modules;
- short low-voltage jumper interconnections;
- staged DS18B20 channel testing.

Breadboard limitations:

- **no 230 VAC wiring on the breadboard**;
- the mains input and PSU primary remain enclosed/guarded and electrically segregated;
- the breadboard is not used as the final field termination point for long Sensor cables;
- long field-cable tests should transition through secure terminal/connector points and strain relief rather than loose Dupont jumpers;
- GSM power-current paths should use appropriately rated wiring/connections and must not depend on weak breadboard contacts if current demand makes them unsuitable;
- successful breadboard FAT does not authorize breadboard installation at the customer Site.

The reason for selecting breadboard is **speed of modification, ease of measurement and troubleshooting, and zero custom PCB requirement during early electrical validation**.

## 8. Local Egyptian availability rule

A major procurement requirement is **local availability inside Egypt**. Priority is realistic re-purchase, technical suitability, calibration/traceability, reliability/serviceability, documented interface, then acceptable price.

## 9. GSM/SMS direction

Cellular is intended primarily for **warning/alarm SMS failover**, not high-bandwidth data. SIM800L-class hardware remains a low-cost candidate subject to network compatibility, dedicated power design, antenna/signal survey, reliability testing, and final security/failover requirements. No modem model is procurement-approved yet.

## 10. Standard vs Advanced clarification

**Standard and Advanced describe the Controller/platform offering, not Sensor accuracy tiers and not which physical variables the customer is allowed to monitor.** Sensor types are separately selectable paid features.

## 11. Cost direction

The Pilot remains cost-conscious. RH has been removed from the initial Pilot scope; temperature-only monitoring starts the Pilot, while RH and other measurements remain optional commercial Sensor/features. DS18B20 is the low-cost Pilot candidate, with industrial/high-accuracy alternatives retained for customers that require them.

## 12. October field survey still required

1. Identify the existing EASYLOG termination/central equipment.
2. Record the exact Controller position in the Ante-Chamber.
3. Measure the actual route from Controller to S01-S13.
4. Record Thermal Mapping logger heights where available.
5. Record racks/storage heights and major airflow/EMI sources.
6. Confirm power, earthing, UPS, Ethernet/Wi-Fi and cellular conditions.

## 13. Repository consistency note

The approved S16-04 hardware review records a proposed **16-channel Site Controller**, two banks of dedicated 1-Wire masters, one powered DS18B20 probe per Home Run, 24 VDC nominal panel architecture, Ethernet-first connectivity, optional cellular/SMS failover, local replay buffering, and one Controller per Pilot Site as the planning baseline.

The direct-GPIO/breadboard architecture below is intentionally documented as **Pilot Controller v0.1 laboratory prototype direction**, requiring FAT evidence before it can supersede any approved product hardware baseline.

## 14. Pilot Controller v0.1 — breadboard laboratory prototype

### Prototype architecture

- ESP32 38-pin development board as the prototype MCU platform;
- study one dedicated ESP32 GPIO / 1-Wire DATA line per DS18B20 Sensor channel;
- no multidrop DATA bus in this prototype;
- October target: CH01-CH13, with CH14-CH16 as design reserve where validated GPIO/peripheral allocation permits;
- physical Channel + DS18B20 ROM + BIO-EMS Sensor ID retained as three identity layers;
- no custom PCB;
- no DS2482-800 required for this prototype path;
- future product hardware may return to dedicated 1-Wire masters if cable/EMI/FAT evidence requires it.

### Functional wiring concept

```text
230 VAC (outside breadboard)
      |
   MCB/Fuse
      |
24 VDC protected PSU
      |
      +--> DC/DC --> logic supply --> BREADBOARD
      |                              |
      |                              +--> ESP32
      |                              |     |--> CH01 DATA --> S01 DS18B20
      |                              |     |--> CH02 DATA --> S02 DS18B20
      |                              |     |--> ...
      |                              |     |--> CH13 DATA --> S13 DS18B20
      |                              |     |--> RS485 module --> future Modbus Sensors
      |                              |     +--> local storage/interface
      |                              |
      |                              +--> low-voltage pull-up/test circuitry
      |
      +--> dedicated DC/DC --> cellular/SMS modem
```

Each DS18B20 Home Run uses `VDD + DATA + GND`. Parasite power is excluded. Pull-up values, protection devices, GPIO assignments and exact power components are not released yet and must be determined through testing/design review.

### Breadboard test progression

The breadboard should evolve in controlled stages rather than wiring 13 channels immediately:

1. ESP32 + one DS18B20 at short cable length;
2. repeat with 5 m, 10 m, 20 m and the measured worst-case Site route as applicable;
3. four independent channels concurrently;
4. expanded/full-load channel test only after safe GPIO/peripheral allocation is validated;
5. fault injection: disconnect, open DATA, replaced/wrong ROM, CRC/communication faults, and safe miswire tests where appropriate;
6. power-cycle/brownout recovery;
7. network outage, buffering and replay;
8. GSM transmit test while acquisition continues without MCU reset.

### Breadboard-to-field gate

The breadboard is a **development fixture only**. Before a Pilot Controller is installed at El Manial or October, the electrical design must be transferred to a mechanically secure, enclosed, serviceable assembly with proper terminals, protection, strain relief, labeling, mains/SELV segregation and field wiring practices. This field assembly can still remain **no-custom-PCB** if desired; the final mounting method will be selected after prototype evidence.

## 15. Next design task

Prepare a **safe ESP32 pin assignment** covering Sensor channels, RS485, cellular UART, storage, networking and service functions while avoiding boot/flash/reserved-pin conflicts, then issue a pin-by-pin Wiring v0.1 for the breadboard prototype.
