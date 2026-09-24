# BIO EGYPT El Manial — Hardware Design & Procurement Baseline

**Date:** 24 September 2026  
**Status:** DESIGN BASELINE / PROCUREMENT NOT YET FROZEN  
**Site:** El Manial  
**Phase:** Temperature monitoring only

## 1. Controlled monitoring scope

El Manial currently contains seven temperature monitoring points:

- Cold Room 01: 2 temperature Sensors;
- Anti-chamber 01: 1 temperature Sensor;
- Dry Warehouse 01: 4 temperature Sensors.

The final physical positions, cable routes and measured lengths remain field-survey evidence.

## 2. Approved hardware topology

```text
                               BIO-EMS Platform PC
                                      |
                                   Ethernet
                                      |
                               BIO-EMS SC-01
                                      |
                         RS485-A + 24 V field system
                    +-----------------+------------------+
                    |                 |                  |
                 SIM-T2-A          SIM-T2-B           SIM-T4-A
                 Cold Room        Anti-chamber       Dry Warehouse
                  CH1 CH2           CH1               CH1 CH2 CH3 CH4
                   |   |             |                 |   |   |   |
                  PT100s            PT100              PT100 x4

                      Independent site communications
                                BIO-EMS COM-CELL
                                      |
                                  LTE / SIM / SMS

                      Protected site power distribution
                                BIO-EMS PDU-24
```

## 3. Device quantities for El Manial

| Item | Quantity | Role |
| --- | ---: | --- |
| BIO-EMS SC | 1 | Site Controller |
| BIO-EMS SIM-T2 | 2 | Cold Room + Anti-chamber RTD interfaces |
| BIO-EMS SIM-T4 | 1 | Dry Warehouse RTD interface |
| BIO-EMS COM-CELL | 1 | Independent cellular/SMS gateway |
| BIO-EMS PDU-24 | 1 | 24 V power/protected distribution |
| PT100 3-wire probe assembly | 7 | Temperature measurement |

Total available SIM channels: **8**  
Used channels: **7**  
Spare channels: **1**

## 4. Preliminary procurement classes

The following quantities are approved for engineering/BOM development. Exact manufacturer part
numbers are intentionally deferred until the relevant design work package is frozen.

### A. Site Controller assembly — 1 production unit + prototype/spares as approved

Required design classes:

- ESP32-S3 module/controller;
- industrial Ethernet PHY/interface;
- 2 × RS485 transceiver channels;
- isolation/protection components as selected;
- 24 V input DC/DC stage;
- 5 V / 3.3 V regulation;
- RTC/time support;
- watchdog/supervisor;
- non-volatile/local buffer storage;
- USB service interface;
- terminal blocks/connectors;
- enclosure/DIN/wall mounting hardware;
- status LEDs and service controls;
- future secure-element footprint/components where appropriate.

### B. SIM-T2 — 2 field units

Per unit:

- common SIM four-channel PCB;
- 2 × populated MAX31865-class RTD front end;
- 2 × precision RTD reference networks;
- low-cost MCU;
- RS485 transceiver;
- 24 V protection and DC/DC;
- channel terminal blocks;
- bus/power terminal blocks;
- watchdog/status parts;
- enclosure and cable glands.

Channels 3 and 4 remain DNP on the common PCB.

### C. SIM-T4 — 1 field unit

Per unit:

- same common SIM PCB;
- 4 × populated MAX31865-class RTD front end;
- 4 × precision RTD reference networks;
- low-cost MCU;
- RS485 transceiver;
- 24 V protection and DC/DC;
- four RTD terminal channels;
- bus/power terminal blocks;
- watchdog/status parts;
- enclosure and glands.

### D. Temperature probes — 7 field probes plus engineering spare policy

Baseline:

- PT100;
- 3-wire;
- probe/cable/enclosure construction suitable for the specific Cold Room / Anti-chamber /
  Dry Warehouse environment;
- traceable serial identification;
- calibration certificate/status recorded before commissioning.

Recommended procurement policy after exact probe specification is frozen:

- 7 installed;
- minimum 1 calibrated spare for the Pilot Site.

The spare quantity is an engineering recommendation and should be confirmed against budget and
calibration logistics before purchase.

### E. COM-CELL — 1 field unit

Required design classes:

- LTE Cat-1-class modem;
- SIM holder;
- external antenna and cable;
- modem supervisory MCU;
- dedicated high-current modem DC/DC;
- bulk low-ESR energy storage near the modem;
- modem power switch/hard reset;
- 24 V input protection;
- Ethernet and/or RS485 local interface;
- enclosure, glands and status indication.

Final modem model must be checked against Egyptian carrier bands, SMS capability, local
availability and lifecycle status before BOM freeze.

### F. PDU-24 — 1 field unit

Required design/procurement classes:

- industrial 24 VDC PSU;
- protected AC input arrangement;
- main DC distribution;
- independent protected outputs for:
  - SC;
  - SIM field bus;
  - COM-CELL;
  - spare/expansion;
- terminals;
- DIN rail/enclosure;
- earthing/chassis hardware;
- surge/transient protection;
- branch fuses/PTC/electronic protection as selected;
- DC-UPS/battery stage after autonomy target is approved.

Current sizing starting point: **24 V / 5 A**, subject to HW-PWR-01 calculation.

### G. Field infrastructure

Quantities cannot be frozen before route survey:

- shielded twisted-pair RS485/power cable;
- Ethernet cable/patching;
- PT100 3-wire probe tails/extensions as approved;
- cable tray/conduit;
- junction/field boxes if required;
- cable glands;
- ferrules;
- bootlace terminals;
- terminal labels;
- device labels;
- fuses/spares;
- earth bonding;
- wall/DIN mounting accessories.

## 5. Procurement gates

The El Manial purchase list is frozen in three stages.

### Gate 1 — Architecture quantities

**APPROVED**

- 1 SC;
- 2 SIM-T2;
- 1 SIM-T4;
- 1 COM-CELL;
- 1 PDU-24;
- 7 PT100 probes;
- one 24 V site power system.

### Gate 2 — Exact electronic BOM

**OPEN**

Requires completion of:

- HW-PWR-01;
- HW-SIM-01;
- HW-SC-01;
- HW-CELL-01.

Outputs:

- exact MPNs;
- approved alternates;
- quantities per PCB;
- prototype quantities;
- production quantities;
- spare quantities.

### Gate 3 — Installation-material BOM

**OPEN**

Requires:

- measured cable routes;
- panel/controller positions;
- confirmed 230 VAC source;
- earthing;
- Ethernet point;
- cellular signal/antenna position;
- DC-UPS autonomy target;
- enclosure/IP requirements.

## 6. Design/procurement principle

Do not purchase a full Pilot quantity of a newly designed board before the first engineering
prototype passes bench validation.

Recommended sequence:

1. buy components/modules for one bench prototype set;
2. validate PDU/power;
3. validate one SIM-T4 fully populated;
4. validate T2 DNP variant;
5. validate SC field bus + Ethernet;
6. validate COM-CELL;
7. run integrated 7-channel El Manial bench simulation;
8. freeze exact BOM;
9. purchase field quantity + approved spares.

## 7. Immediate next calculation

The next engineering record is **HW-PWR-01 — El Manial 24 V Power Budget and PDU-24 design**.

It must calculate:

- nominal current;
- worst-case current;
- startup/current peaks;
- cellular transmit burst margin;
- branch protection;
- cable voltage drop;
- PSU derating;
- expansion reserve;
- DC-UPS battery autonomy.

Only after that calculation should the 24 V PSU, UPS and battery part numbers be purchased.
