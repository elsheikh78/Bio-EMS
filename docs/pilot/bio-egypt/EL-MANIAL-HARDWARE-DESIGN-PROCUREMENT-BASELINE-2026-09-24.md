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
                    +-----------------------+----------------------+
                    |                                              |
                 SIM-T4-A                                      SIM-T4-B
          Cold Room + Anti-chamber                           Dry Warehouse
            CH1 CH2 CH3 (CH4 spare)                         CH1 CH2 CH3 CH4
             |   |   |                                       |   |   |   |
           PT100 PT100 PT100                                PT100 x4

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
| BIO-EMS SIM-T4 | 2 | Cold Room + Anti-chamber group, and Dry Warehouse group |
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

### B. SIM-T4 — 2 field units

Pilot construction is **no custom PCB**. Each field unit is assembled from qualified ready-made
modules inside a serviceable enclosure; breadboard and Dupont wiring are not permitted in the field.

Per SIM-T4:

- 4 × MAX31865 RTD interface modules;
- 4 × precision PT100 reference networks as provided/verified by the selected module design;
- 1 × low-cost MCU module;
- 1 × RS485 module;
- 1 × 24 V-to-local-rail DC/DC module;
- input/bus protection as selected in HW-SIM-01;
- four RTD screw-terminal channels;
- bus/power screw terminals;
- status/service indication;
- enclosure, mounting plate/DIN adapter and cable glands;
- ferruled, labelled internal wiring.

Field allocation:

- SIM-T4-A: Cold Room sensors 1–2 + Anti-chamber sensor on CH1–CH3, CH4 spare;
- SIM-T4-B: Dry Warehouse sensors on CH1–CH4.

The Cold Room + Anti-chamber grouping is approved as the cost-optimized baseline but remains
subject to field-route verification before installation.

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
- standard upstream customer/site UPS supply where backup power is required;
- no mandatory internal PDU battery bank or DC-UPS charger.

Current PDU sizing starting point remains **24 V / 5 A**. UPS capacity and autonomy are Site/customer infrastructure requirements and are verified against the actual Platform PC + PDU + required network load.

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
- 2 SIM-T4;
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
- enclosure/IP requirements.

The earlier four-hour internal PDU battery target is superseded. The Site/customer now selects the UPS autonomy according to operational requirements. Where standby generation exists, the UPS primarily bridges utility loss and generator/ATS transfer; the actual transfer time and backed-up loads must be verified during Site survey/commissioning. Platform PC and PDU may share the same appropriately sized upstream UPS.

## 6. Design/procurement principle

Do not purchase a full Pilot quantity of a newly designed board before the first engineering
prototype passes bench validation.

Recommended sequence:

1. buy components/modules for one bench prototype set;
2. validate PDU/power;
3. validate one no-custom-PCB SIM-T4 module;
4. duplicate the validated SIM-T4 module and verify address/RS485 coexistence;
5. validate SC field bus + Ethernet;
6. validate COM-CELL;
7. run integrated 7-channel El Manial bench simulation with both SIM-T4 units;
8. freeze exact BOM;
9. purchase field quantity + approved spares.

## 7. Cost-control gate

Before the El Manial BOM is frozen, every hardware block shall be reviewed for total installed
cost. The comparison must include:

- electronics BOM;
- PCB assembly;
- enclosure;
- terminals/connectors/glands;
- 24 V power/protection share;
- field cable;
- installation labor;
- calibration;
- spare units;
- expected service/replacement effort.

Cost reduction shall prioritize architectural savings first:

- two SIM-T4 modules instead of three separate SIM enclosures at El Manial;
- no custom PCB for El Manial/October Pilot hardware;
- shared Site COM-CELL instead of modem duplication;
- appropriately sized MCU in SIM modules;
- centralized 24 V power;
- standardized connectors/enclosures;
- approved alternate components.

Exact target EGP prices are intentionally not frozen until real supplier quotations are collected
for the first complete prototype BOM. Competitive cost is a release gate, not a later procurement
optimization.

## 8. Immediate next calculation

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
- upstream UPS capacity/autonomy and generator/ATS transfer behavior.

Only after that calculation should the PDU 24 V PSU/protection part numbers be purchased. The upstream UPS is selected separately from Site/customer requirements.
