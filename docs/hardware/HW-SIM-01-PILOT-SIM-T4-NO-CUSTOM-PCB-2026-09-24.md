# HW-SIM-01 — BIO-EMS SIM-T4 Pilot Design (No Custom PCB)

**Date:** 24 September 2026  
**Status:** APPROVED PILOT DESIGN DIRECTION / LOCAL-EGYPT SOURCING GATE OPEN / BENCH QUALIFICATION REQUIRED  
**Sites:** El Manial and CPC / 6th of October  
**Architecture:** 24 VDC + RS485 / Modbus RTU  
**Construction:** No BIO-EMS custom PCB for Pilot

## 1. Design objective

Implement the Pilot SIM-T4 at the lowest practical installed cost without compromising the
temperature-measurement qualification process.

The first design concept used:

- one MCU module;
- four separate MAX31865 modules;
- one RS485 module;
- one 24 V DC/DC module;
- protection/terminal wiring.

For the two Pilot Sites, this is no longer the preferred first implementation because it repeats
power conversion, SPI wiring, module interconnects and assembly labor inside every SIM enclosure.

The preferred Pilot approach is to qualify a **single integrated 4-channel PT100-to-RS485 Modbus
RTU acquisition module** and use it directly as the core of BIO-EMS SIM-T4.

## 2. Preferred Pilot architecture

```text
PT100 #1 ─┐
PT100 #2 ─┼──> 4-Channel PT100 Acquisition Module ── RS485 A/B ──> BIO-EMS SC
PT100 #3 ─┤                 │
PT100 #4 ─┘                 └── 24 VDC
```

BIO-EMS SIM-T4 therefore becomes a controlled field assembly containing:

- one qualified 4-channel PT100 acquisition module;
- 24 VDC input;
- RS485 A/B;
- four 3-wire PT100 terminal groups;
- serviceable enclosure / DIN mounting;
- labelled field terminals;
- optional end-of-line termination jumper/switch if the selected module does not provide one.

No additional MCU is required inside SIM-T4 if the selected module already implements Modbus RTU.

No separate MAX31865 breakout boards are required in the preferred Pilot implementation.

## 3. Why this is preferred for Pilot

Compared with a hand-assembled four-MAX31865 SIM, one integrated acquisition module removes:

- one MCU board;
- four SPI interconnects / chip-select wiring;
- one separate RS485 board;
- one separate 24 V-to-logic DC/DC board where the acquisition module accepts 24 V directly;
- much of the internal point-to-point wiring;
- multiple development-board connectors;
- extra enclosure volume;
- extra assembly/testing labor;
- a separate SIM firmware image.

It also reduces the number of electrical interfaces that can fail in the field.

The Site Controller remains responsible for:

- polling the SIM over Modbus RTU;
- mapping Modbus channel -> BIO-EMS logical Sensor;
- stale/no-response detection;
- telemetry packaging;
- buffering/reconnect;
- platform binding and health.

## 4. Low-cost candidate class

The primary low-cost candidate class is a 4-channel PT100 / RS485 module with characteristics such
as the PTA8C04 family:

- 12/24 VDC supply;
- four PT100 inputs;
- 2-wire / 3-wire PT100 support;
- Modbus RTU;
- configurable slave address;
- configurable serial parameters;
- ability to read temperature and/or RTD resistance;
- DIN-rail-compatible enclosure/board format.

Current supplier documentation for the PTA8C04 class states approximately:

- supply: 12/24 VDC;
- current: 14–18 mA;
- default serial: 9600 8N1;
- slave addressing up to 247;
- PT100 2/3-wire;
- stated temperature accuracy: 1%.

The low purchase cost makes this class attractive for Pilot qualification, but the stated 1%
accuracy is **not automatically accepted as adequate** for BIO-EMS pharmaceutical monitoring.

## 5. Higher-confidence candidate classes

If the low-cost module fails bench accuracy/stability qualification, the next procurement tier is a
more explicitly industrial/isolated 4-channel PT100 Modbus module.

Candidate characteristics include:

- 24 V-compatible supply;
- 4 × PT100;
- 2/3-wire or 2/3/4-wire;
- isolated RS485;
- 0.1 °C resolution;
- documented accuracy around ±0.3 °C to ±1 °C depending product;
- DIN-rail mounting;
- surge/reverse-polarity protection.

Examples observed during the engineering survey include:

- AMPTI04-class isolated 4-channel PT100 RS485 modules;
- MR2-AR4G-class 4-channel PT100 Modbus RTU modules;
- EBYTE ME31-XDXX0400-class 4-channel PT100 acquisition modules.

These parts are more expensive and may include functions BIO-EMS does not need, so they are
fallback/qualification candidates rather than automatic first choice.

## 6. Measurement qualification gate

BIO-EMS shall not approve an acquisition module based only on a marketplace specification.

Before any field deployment, each candidate module type shall be bench tested with the actual Pilot
PT100 probe type.

Minimum bench plan:

1. verify all four channels with known stable inputs;
2. compare against a traceable reference thermometer / simulator at points bracketing the cold-room
   operating region;
3. test at least around 0 °C, 5 °C and 10 °C for the Cold Room use case;
4. record channel-to-channel error;
5. record repeatability;
6. record short-term drift;
7. verify 3-wire lead compensation;
8. verify open-circuit / disconnected-sensor behavior;
9. verify RS485 communications under repeated polling;
10. power-cycle and confirm address/configuration persistence;
11. test two modules on one RS485 bus with unique addresses;
12. run an endurance test before Site deployment.

A provisional engineering acceptance target for the Pilot acquisition chain is to demonstrate
temperature error within **±0.5 °C after approved calibration/offset treatment over the relevant
storage range**, with repeatable behavior and no unexplained channel jumps.

This is an engineering qualification target, not a regulatory claim. BIO EGYPT Quality approval and
calibration uncertainty remain separate controlled requirements.

## 7. Calibration handling

The preferred software approach is:

- preserve the raw module value;
- apply a controlled per-Sensor calibration offset in BIO-EMS where approved;
- record calibration date/certificate/offset history;
- never hide gross hardware error with a large software offset.

If a channel requires an abnormal correction or is unstable, the module/channel fails qualification.

## 8. RS485 profile

Pilot starting profile:

- Modbus RTU;
- 9600 or 19200 baud after bench verification;
- 8 data bits;
- no parity initially unless the selected module requires otherwise;
- 1 stop bit;
- unique slave address per SIM-T4.

El Manial starting address plan:

- SIM-T4-A: address 1;
- SIM-T4-B: address 2.

The Site Controller shall not hard-code a vendor-specific register map globally. The firmware should
use a versioned SIM driver/profile so another qualified acquisition module can be substituted later.

## 9. El Manial channel map

### SIM-T4-A

- CH1 -> Cold Room Sensor 1;
- CH2 -> Cold Room Sensor 2;
- CH3 -> Anti-chamber Sensor;
- CH4 -> spare.

### SIM-T4-B

- CH1 -> Dry Store Sensor 1;
- CH2 -> Dry Store Sensor 2;
- CH3 -> Dry Store Sensor 3;
- CH4 -> Dry Store Sensor 4.

This allocation remains subject to field-route verification so that PT100 analog runs are not made
unnecessarily long merely to save one enclosure.

## 10. Pilot mechanical implementation

Field build must use:

- enclosed module;
- screw terminals;
- ferrules;
- labelled conductors;
- cable glands / strain relief;
- DIN rail or rigid mounting plate;
- no breadboard;
- no Dupont/jumper-wire field connections;
- no exposed loose development modules.

Where the selected acquisition module already includes a DIN enclosure and field terminals, BIO-EMS
should not add a second large enclosure unless required for environmental protection.

## 11. Cost target

The integrated-module approach is specifically intended to reduce total installed cost.

Target per SIM-T4 Pilot assembly:

- acquisition core: lowest qualified cost tier;
- enclosure/terminal adaptation only where needed;
- no separate MCU;
- no separate RS485 board;
- no separate four-MAX31865 breakout set.

Initial engineering target for the complete SIM-T4 field assembly is:

**approximately EGP 700–1,200 per unit before calibration-service cost**, subject to actual landed
supplier price.

A module that is cheap but fails the accuracy/repeatability gate is rejected regardless of price.

## 12. Fallback design

If no affordable integrated 4-channel module passes qualification, BIO-EMS falls back to:

```text
24 VDC
  |
DC/DC
  |
MCU module
  +-- MAX31865 #1 -> PT100
  +-- MAX31865 #2 -> PT100
  +-- MAX31865 #3 -> PT100
  +-- MAX31865 #4 -> PT100
  |
RS485 module
```

This fallback remains no-custom-PCB for the Pilot, but it is expected to cost more and require more
assembly/validation.

## 13. Production direction

After El Manial and October field evidence is complete, BIO-EMS may replace the third-party
acquisition core with a custom production PCB if doing so materially improves:

- cost;
- accuracy;
- supply-chain control;
- security/device identity;
- size;
- serviceability;
- calibration consistency.

The Pilot does not wait for that production optimization.

## 14. Mandatory local-market sourcing rule

For El Manial and CPC / 6th of October Pilot hardware, **BIO-EMS shall not import hardware
components directly**.

Every Pilot BOM item must be purchasable from the Egyptian local market at the time of procurement.
An imported-origin component is acceptable only when it is already held/supplied locally by an
Egyptian seller/distributor and BIO-EMS can buy it as a normal local purchase.

The following are **not acceptable procurement sources** for the Pilot BOM:

- Ubuy cross-border listings;
- Fruugo cross-border listings;
- Desertcart international procurement;
- AliExpress / Alibaba direct import;
- direct overseas manufacturer checkout;
- any item whose checkout explicitly makes BIO-EMS the importer of record.

This requirement applies to SC, SIM, COM-CELL, PDU electronics, probes, enclosures, connectors and
field accessories.

## 15. Effect on the previously selected PTA8C04

The PTA8C04 24 V candidate selected in PR #264 is **superseded as a purchase candidate** because the
verified sources found for it require cross-border/import procurement.

Its technical information may remain useful as a reference architecture, but BIO-EMS shall not
purchase it for the current Pilot unless an Egyptian local seller later confirms physical/local
stock and local sale.

Therefore the first SIM-T4 acquisition-core candidate is now:

**OPEN — LOCAL EGYPT STOCK REQUIRED**

No full Pilot quantity shall be purchased until the local-market candidate is identified and bench
qualified.

## 16. Local-market survey snapshot — 24 September 2026

Current web-verified Egyptian local-market examples include:

| Function | Locally listed example | Observed local price / status | Pilot use |
| --- | --- | --- | --- |
| Site/bench MCU | ESP32-S3-N16R8 development board — Makers Electronics | ~EGP 550, listed In Stock | acceptable for SC/bench work |
| RS485 interface | HW-519 TTL-RS485 — Makers Electronics | ~EGP 80, listed In Stock | candidate |
| 24 V -> 5 V DC/DC | HW-788ABCD fixed-output buck — Makers Electronics | ~EGP 120, listed In Stock | candidate |
| 24 V -> 5 V DC/DC | RAM DC301 7.5–28 V -> 5 V | ~EGP 50, locally listed | candidate after load/noise test |
| PT100 3-wire probe | RAM PT100 M6-3Q-U | ~EGP 300, 3-wire, Class-A claim | candidate probe |
| General ADC | ADS1115 16-bit module — Makers Electronics | ~EGP 275, listed In Stock | **not yet approved as PT100 front end** |

The survey also found RTD-capable precision ADC products such as ADS1220 and AD7793 at Egyptian
electronics shops, but their current online listings showed sold-out/unavailable status. They are
therefore not treated as purchasable Pilot BOM items until stock is reconfirmed.

The survey did **not** identify a web-verifiable, in-stock Egyptian retail listing for a low-cost
four-channel PT100 -> RS485/Modbus module equivalent to PTA8C04. This is not proof that none exists
in the offline industrial market; local automation distributors may still have suitable stock.

## 17. Local-only SIM-T4 decision path

Engineering shall now evaluate two local-only paths in this order:

### Path A — locally stocked integrated 4-RTD Modbus module

Preferred if an Egyptian supplier can provide, from local stock:

- four PT100 inputs;
- 3-wire support;
- 24 V-compatible supply;
- RS485 / Modbus RTU;
- documented accuracy compatible with the qualification target;
- replaceable/local repeat supply;
- acceptable total cost.

The supplier and local-stock evidence must be recorded before approval.

### Path B — locally stocked modular acquisition build

If Path A cannot be sourced locally at acceptable cost, build SIM-T4 from modules/components that
are all available from Egyptian stock.

The exact RTD acquisition front end remains an engineering selection item. BIO-EMS shall **not**
assume MAX31865 is available locally; it may only be used if local Egyptian stock is confirmed.

A locally stocked general-purpose ADC such as ADS1115 is not automatically an RTD front end. Any
alternative circuit must prove:

- excitation/reference stability;
- 3-wire lead compensation or a controlled equivalent;
- channel accuracy;
- temperature drift;
- sensor open/short detection strategy;
- repeatable calibration.

No loose-resistor experimental bridge is approved for field installation without a documented,
repeatable assembly and bench evidence.

## 18. Procurement gate

The immediate action is **local supplier discovery, not overseas ordering**.

Before buying the SIM acquisition core:

1. search/phone Egyptian automation/electronics suppliers for a locally stocked 4-channel
   PT100/RS485 Modbus module;
2. record exact model, seller, Egyptian stock status and EGP price;
3. compare that option with a local-module SIM build;
4. buy one prototype only;
5. execute the existing accuracy/repeatability/RS485 qualification;
6. only then freeze the two El Manial SIM-T4 units.

The local-market rule is a hard procurement constraint and has priority over the earlier PTA8C04
candidate selection.
