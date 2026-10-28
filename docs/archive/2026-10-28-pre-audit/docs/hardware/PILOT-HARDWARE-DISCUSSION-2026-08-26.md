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
- The breadboard is a laboratory development tool only; it is not the released field mounting method.
- Controller tier (**Standard / Advanced**) is separate from optional Sensor features.
- Future Sensor types should be supported particularly through **RS485/Modbus**, although the initial Pilot is temperature-only.

## 2. October Site mapping inputs

The supplied October warehouse drawing is based on an **actual Thermal Mapping study**. Sensor positions must preserve the mapped locations.

Known Site heights:
- Cold Rooms: approximately **2.8 m**.
- Dry Storage: approximately **3.0 m**.
- Ante-Chamber: approximately **3.0 m**.

Permanent Sensor mounting height should reproduce the Thermal Mapping logger height where documented.

### October mapped points
- Total: **13**.
- Cold Rooms: **6 temperature points** across three rooms.
- Ante-Chamber: **1 point**.
- Dry Storage: **6 points**.
- Current Pilot: **temperature only at all 13 points**.

## 3. Temperature Sensor direction

The current preferred low-cost Pilot direction is **DS18B20**, subject to prototype/FAT and field-cable validation.

- powered three-wire operation: `VDD`, `DATA`, `GND`;
- no parasite power;
- prefer genuine/traceable devices;
- map ROM identity to physical Channel and BIO-EMS Sensor record;
- calibration/verification remains required;
- Pt100/Class A and industrial RS485 transmitters remain future options.

The approved S16-04 product baseline proposes dedicated 1-Wire masters. Prototype simplifications below are experimental and do not silently replace that baseline.

## 4. October channel/cabling direction

The S16-04 concept specifies one Sensor per dedicated Home Run, with a proposed 16-channel Controller. October requires 13 channels.

Cable routes and lengths are not yet field-verified. Before design freeze measure S01-S13 routes, containment, EMI sources, logger heights, rack heights, cable specification and worst-case link performance.

## 5. Existing GREISINGER EASYLOG

Existing EASYLOG 40K equipment remains a parallel legacy-integration investigation only. BIO-EMS commercial hardware must be designed independently of it.

## 6. Multi-Sensor Controller principle

Target interfaces include 1-Wire temperature, **RS485/Modbus RTU**, MQTT network connectivity, SMS failover and local buffering/replay. RH, differential pressure, CO2, door status, power status and other variables remain optional paid Sensor/features.

## 7. Breadboard prototype decision

The first laboratory build uses a **solderless breadboard** for low-voltage prototyping. No 230 VAC is placed on the breadboard. Long field-cable tests transition through secure terminal/connector points. GSM power must use appropriately rated connections. Successful breadboard FAT does not authorize breadboard installation at the customer Site.

## 8. Local Egyptian availability rule

Procurement priority: realistic local re-purchase, technical suitability, calibration/traceability, reliability/serviceability, documented interface, then acceptable price.

## 9. GSM/SMS direction

Cellular is primarily for warning/alarm SMS failover. SIM800L-class hardware remains a low-cost candidate subject to network compatibility, dedicated power design, signal survey and reliability testing. No modem model is procurement-approved yet.

## 10. Standard vs Advanced

**Standard and Advanced describe the Controller/platform offering, not Sensor accuracy tiers or allowed measurement variables.** Sensor types are separately selectable features.

## 11. Cost direction

Pilot starts temperature-only. RH and other measurements remain optional commercial features. DS18B20 is the low-cost Pilot candidate, with industrial alternatives retained where required.

## 12. October field survey still required

1. Identify EASYLOG central/termination equipment.
2. Record exact Controller position.
3. Measure routes S01-S13.
4. Record Thermal Mapping logger heights.
5. Record racks/storage heights and airflow/EMI sources.
6. Confirm power, earthing, UPS, network and cellular conditions.

## 13. Repository consistency note

Approved S16-04 remains the product hardware baseline. Breadboard/direct-GPIO work is a laboratory prototype investigation requiring FAT evidence.

## 14. Pilot Controller v0.1 — breadboard laboratory prototype

Initial staged prototype:
1. ESP32 38-pin development board.
2. One DS18B20 channel, then four channels.
3. Powered three-wire Sensors.
4. No multidrop during early channel tests.
5. No custom PCB.
6. RS485 and GSM tested as separate peripheral stages.

Functional concept:

```text
230 VAC (outside breadboard)
  -> protected 24 VDC PSU
      -> DC/DC logic -> Breadboard -> ESP32 -> DS18B20 test channels
                                    -> RS485 stage
                                    -> storage/network stage
      -> dedicated DC/DC -> GSM/SMS stage
```

Breadboard FAT progression: one Sensor at short length; 5/10/20 m and measured worst case; four concurrent channels; fault injection; power-cycle/brownout; network buffering/replay; GSM transmission without MCU reset.

## 15. ESP32 pin-budget audit — 2026-08-26

The requested next step was a safe pin assignment. The audit identified an important constraint before issuing a misleading 16-channel drawing.

For the classic ESP32-WROOM-32/38-pin development-board family:

- GPIO6-GPIO11 are tied to the module's SPI flash and must not be allocated as ordinary field channels.
- GPIO34, GPIO35, GPIO36 and GPIO39 are input-only; a DS18B20 1-Wire DATA channel is bidirectional and therefore these pins are not suitable as direct dedicated 1-Wire channels.
- GPIO0, GPIO2, GPIO5, GPIO12 and GPIO15 are boot/strapping-sensitive and should not be casually loaded by field pull-ups/protection/cables without a deliberate boot-state analysis.
- UART, RS485 direction control, storage and service/debug functions consume additional usable GPIOs.

### Safe first-stage channel set

For the breadboard **channel-validation prototype**, start with four conservative output-capable pins:

| Channel | ESP32 GPIO | Purpose |
|---|---:|---|
| CH01 | GPIO16 | DS18B20 DATA |
| CH02 | GPIO17 | DS18B20 DATA |
| CH03 | GPIO18 | DS18B20 DATA |
| CH04 | GPIO19 | DS18B20 DATA |

Each channel uses its own pull-up/test protection network and its own Sensor Home Run. Sensor VDD and GND are distributed separately.

### Important result

A full **13-16 direct-GPIO Sensor implementation plus RS485 + GSM + removable storage + service functions on one classic 38-pin ESP32** leaves an unattractive pin budget and pushes the design toward strapping/debug conflicts. Therefore the earlier assumption that 16 dedicated direct-GPIO channels could simply be assigned on this board is **not design-approved**.

Direct GPIO remains valid for the **1-channel and 4-channel breadboard FAT**. Do not purchase or wire a 13/16-channel direct-GPIO version yet. After the 4-channel FAT, choose the full-channel architecture deliberately: dedicated 1-Wire master/multiplexer hardware, an I/O/secondary-MCU architecture, or return to the approved S16-04 dedicated-master concept. Local Egyptian module availability remains mandatory.

### Provisional peripheral test pins

Peripheral tests should initially be performed **sequentially**, not all at once with 13 Sensor GPIOs:

- RS485 UART test: GPIO32/GPIO33 for UART data, with DE/RE allocation selected during the RS485 test fixture review.
- GSM UART test: use a separately reviewed UART mapping; do not freeze GPIO1/GPIO3 while USB programming/debug behavior is still required.
- Storage: begin with ESP32 internal flash/NVS/SPIFFS/LittleFS-style buffering for functional replay experiments if adequate for the test; removable microSD pin allocation is deferred until the full architecture is chosen.

These are prototype assignments only, not field wiring release.

## 16. Breadboard Wiring v0.1 — first four channels

```text
ESP32 3V3 ----------------------+----+----+----+
                                |    |    |    |
                              RPU1 RPU2 RPU3 RPU4
                                |    |    |    |
GPIO16 -------------------------+    |    |    +--> CH01 DATA
GPIO17 ------------------------------+    |    +--> CH02 DATA
GPIO18 -----------------------------------+    +--> CH03 DATA
GPIO19 ----------------------------------------+--> CH04 DATA

3V3/VDD ---------------------------------------> Sensor VDD distribution
GND -------------------------------------------> Sensor GND distribution

CH01 terminal: VDD / DATA(GPIO16) / GND -> S01
CH02 terminal: VDD / DATA(GPIO17) / GND -> S02
CH03 terminal: VDD / DATA(GPIO18) / GND -> S03
CH04 terminal: VDD / DATA(GPIO19) / GND -> S04
```

`RPU` values and TVS/ESD protection are **TBD by cable-length/edge-quality testing**; 4.7 kOhm may be used as an initial short-bench reference but is not yet a released field value.

## 17. CH01 prototype checkpoint — latest update

The next physical build is now frozen **for laboratory testing only** as a single-channel CH01 breadboard prototype before expanding to CH02-CH04.

### CH01 provisional BOM

| Item | Initial specification | Qty |
|---|---|---:|
| ESP32 development board | Classic 38-pin ESP32 Dev Board | 1 |
| Solderless breadboard | Full-size | 1 |
| DS18B20 | Genuine/traceable; waterproof probe preferred for representative cable tests | 1 |
| Pull-up resistor | **4.7 kOhm / 1/4 W** initial bench value | 1 |
| 3-pin terminal/connector | `VDD / DATA / GND` transition to Sensor cable | 1 |
| Jumper wires | Short low-voltage breadboard jumpers | as required |
| 3-core Sensor cable | Representative `VDD / DATA / GND` field cable | test lengths |
| ESP32 bench power | USB / suitable 5 V source | 1 |

The 24 V panel supply, GSM, RS485 and removable storage are intentionally **not required for the first CH01 electrical test**. They are introduced later in controlled stages.

### CH01 wiring

Use **GPIO16** as CH01 DATA.

```text
ESP32 3V3 -------------------------------> DS18B20 VDD
     |
     +------ 4.7 kOhm pull-up ------+
                                     |
ESP32 GPIO16 ------------------------+----> DS18B20 DATA

ESP32 GND --------------------------------> DS18B20 GND
```

The 4.7 kOhm resistor is connected between **3.3 V and the DATA node**. For the first test, the DS18B20 is powered from 3.3 V to keep the DATA pull-up within ESP32 logic levels.

### Breadboard physical layout rule

- Place the ESP32 on the breadboard with accessible rows on both sides.
- Use one breadboard rail for **3.3 V** and another for **GND**.
- Run GPIO16 to a clearly identified **CH01 DATA node**.
- Connect the 4.7 kOhm resistor from the 3.3 V rail to that DATA node.
- Connect the DATA node to a secure 3-pin terminal/connector before the Sensor field cable.
- The three outgoing Sensor conductors are `VDD / DATA / GND`.
- Do not use a loose Dupont jumper as the transition to a long field cable.
- Maintain a common GND between ESP32 and Sensor.
- No 230 VAC is permitted on the breadboard.

### CH01 test sequence

1. Start with the Sensor's original short cable.
2. Record Sensor ROM ID, temperature, CRC/read failures, disconnects and reconnect behavior.
3. Run the initial channel continuously for approximately **24 hours** to establish a stability baseline.
4. If stable, repeat progressively with representative cable lengths: **5 m -> 10 m -> 20 m -> measured worst-case Site route**.
5. Do not move to the next cable length until the current stage is acceptably stable.
6. First run the basic electrical/cable test without adding optional TVS/ESD capacitance to the DATA line.
7. After the basic link is characterized, add the proposed field protection network and repeat the same cable tests. This separates cable/signal-integrity effects from protection-device loading.
8. If the link becomes unreliable at Site-relevant lengths, do not tune pull-up values indefinitely without evidence; escalate to a dedicated 1-Wire line-driver/master architecture study.

### Pass evidence to retain

For each tested cable length retain at least:

- Sensor ROM ID;
- test duration;
- minimum/maximum/representative temperature readings;
- read count;
- CRC/read error count;
- disconnect/reconnect count;
- power-cycle recovery result;
- cable type and actual length;
- supply voltage measured at Controller and, for long tests, at the Sensor end where practical.

### Expansion after CH01 passes

Only after CH01 is stable at representative cable lengths, reproduce the same experimental channel circuit on:

- CH02 = GPIO17;
- CH03 = GPIO18;
- CH04 = GPIO19.

Then perform a four-channel concurrent FAT. The full 13/16-channel architecture remains **unfrozen** pending those results and the locally available 1-Wire interface study.

## 18. Visual reference checkpoint

A clear tutorial-style visual was produced for the CH01 breadboard concept showing the ESP32, 3.3 V/GND rails, 4.7 kOhm pull-up, GPIO16 DATA node, three-pin `VDD/DATA/GND` terminal, DS18B20 cable, and the staged test sequence.

The visual is a **concept/tutorial reference only**. It must not be treated as a released field wiring drawing, and any pin labels, component orientation or illustrative probe wire colours must be checked against the actual purchased modules/probe datasheet before energizing the prototype.

## 19. Resume point

When hardware discussion resumes, start here:

1. Select/purchase the small **CH01 prototype BOM only**; do not buy the full 13-Sensor Controller quantity yet.
2. Confirm the exact ESP32 development-board model and exact DS18B20 probe/part received.
3. Verify the probe's actual wire-colour pinout before connection.
4. Assemble CH01 on the solderless breadboard using GPIO16 and the initial 4.7 kOhm pull-up.
5. Run the short-cable baseline and record FAT evidence.
6. Continue 5/10/20 m and worst-case-route testing.
7. After CH01 passes, expand to CH02-CH04 and then decide the final 13/16-channel architecture.
