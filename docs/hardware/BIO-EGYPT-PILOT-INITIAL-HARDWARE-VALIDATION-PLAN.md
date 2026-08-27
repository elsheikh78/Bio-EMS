# BIO-EMS — BIO EGYPT Pilot Initial Hardware Validation Plan

**Status:** APPROVED PLAN / PROCUREMENT GATE NOT YET PASSED  
**Date:** 2026-08-27  
**Scope:** Standard V1 / BIO EGYPT temperature pilot  
**Sourcing rule:** Egypt market first. Import only when no acceptable local alternative exists.  
**Architecture rule:** V1 uses COTS/modules; no custom main PCB.

## 1. Objective

Convert the hardware discussion into a controlled, executable validation program before buying the full BIO EGYPT pilot quantity.

No component becomes `PILOT APPROVED` because of datasheet/specification alone. It must satisfy:

1. local Egyptian availability at procurement time;
2. electrical/interface compatibility;
3. required bench tests;
4. cable/field-simulation tests where applicable;
5. integration with BIO-EMS telemetry/alarm/SMS behavior;
6. documented PASS result.

## 2. Immediate Procurement — Initial Test Kit Only

Do NOT buy 20 pilot sensors yet.

Buy the minimum test kit below from Egyptian suppliers.

| Item | Qty | Current local reference | Current state |
|---|---:|---|---|
| ESP32-S3 N16R8 development board | 1 | Makers Electronics, EGP 525, shown In Stock on 2026-08-27 | TEST CANDIDATE |
| DS18B20 waterproof probe | 3 | Electra Store, EGP 65 each, shown In Stock on 2026-08-27 | TEST CANDIDATE |
| SIM800L + external antenna | 1 | Makers Electronics, EGP 300, shown In Stock on 2026-08-27 | PILOT CELLULAR CANDIDATE |
| HW-519 TTL↔RS485 module | 2 | Electra Store, EGP 75 each, shown In Stock on 2026-08-27 | BENCH ONLY — NOT INDUSTRIAL APPROVED |
| Adjustable DC/DC suitable for SIM800L bench supply | 1 | Local market; must be verified in stock before purchase and set/verified before SIM connection | TEST CANDIDATE |
| Breadboard / terminal blocks / jumper wire / 4.7k resistors / capacitors | 1 set | Local electronics market | TEST CONSUMABLES |
| Sensor extension cable | enough for 5m, 10m, 20m tests | Local electrical/electronics supplier | TEST CONSUMABLE |
| Regulated bench/DC source(s) and multimeter | existing lab equipment if available | — | TEST EQUIPMENT |

**Known minimum priced subtotal excluding DC/DC, cable and consumables:** EGP 1,170 based on the referenced local prices on 2026-08-27.

Local stock and prices must be rechecked immediately before ordering.

## 3. Deliberately Not Purchased Yet

Until the validation gate passes, do not buy:

- the complete 20-sensor BIO EGYPT quantity;
- final DIN control panels/enclosures;
- imported Waveshare controllers;
- imported AMDSG08 modules;
- final industrial RS485 acquisition hardware;
- Advanced-version I/O modules;
- 4G cellular upgrade hardware.

These remain later-stage candidates, not current procurement instructions.

## 4. Bench Wiring — Stage 1

Initial functional prototype:

**ESP32-S3 → 3-wire DS18B20 (VDD/GND/DATA) → Wi-Fi → MQTT/BIO-EMS**

Cellular path:

**Dedicated regulated supply → SIM800L → UART/AT commands → SMS**

Rules:

- DS18B20 uses powered 3-wire mode; parasitic-power mode is not used for the pilot validation.
- SIM800L supply voltage must be measured before connection.
- SIM800L must not be powered from a weak ESP32 3.3V rail.
- SMS and sensor tests are first performed separately, then together.
- HW-519 may be used only to prove RS485/Modbus software/interface behavior. It is not evidence of final industrial isolation/protection compliance.

## 5. Validation Test Matrix

Every test must record date, hardware revision/part, wiring, firmware version, result, observations and evidence.

### HV-01 — Controller bring-up

- Flash ESP32-S3 firmware.
- Verify stable boot and serial diagnostics.
- Run repeated power cycles.

**PASS:** no unexplained boot/reset failure.

### HV-02 — Single DS18B20

- Connect one 3-wire sensor.
- Read unique ROM/address.
- Acquire readings at the intended pilot interval.

**PASS:** stable identification and readings; no unexplained CRC/read errors during test period.

### HV-03 — Three DS18B20 sensors

- Connect three sensors simultaneously.
- Verify unique identities remain mapped correctly.
- Exercise different temperatures so channels cannot be confused.

**PASS:** no channel swapping, duplicate identity or unexplained missing readings.

### HV-04 — MQTT / BIO-EMS ingestion

- Publish real sensor readings using the intended device/sensor identity scheme.
- Verify telemetry appears in BIO-EMS and is stored correctly.

**PASS:** readings are correctly associated with their configured sensor and timestamps.

### HV-05 — Alarm path

- Force temperature through warning/alarm thresholds.
- Verify alarm state transitions and recovery.

**PASS:** expected BIO-EMS alarm behavior occurs without duplicate/incorrect sensor association.

### HV-06 — Internet failure and SMS failover

- Establish normal Internet/MQTT operation.
- Deliberately remove Internet connectivity.
- Trigger a qualifying alarm/failover condition.
- Verify SIM800L network registration and SMS delivery.
- Restore Internet and verify recovery.

**PASS:** SMS is delivered under the approved failover condition and normal communications recover without manual reboot.

### HV-07 — SIM800L power stability

- Test network registration and repeated SMS transmission.
- Observe supply voltage during transmission bursts and watch for modem/controller resets.

**PASS:** repeated SMS transmissions complete without brownout/reset attributable to power supply.

### HV-08 — Sensor disconnect/reconnect

- Disconnect one active DS18B20.
- Verify missing/offline behavior.
- Reconnect it.

**PASS:** failure is detected and the same sensor identity recovers without corrupting other sensors.

### HV-09 — Controller power-cycle recovery

- Remove and restore power repeatedly.

**PASS:** controller reconnects to network/MQTT, rediscovers sensors and resumes telemetry without manual intervention.

### HV-10 — 5 m cable test

- Extend representative sensor wiring to 5 m.
- Repeat multi-sensor acquisition.

**PASS:** no material increase in read/CRC failures.

### HV-11 — 10 m cable test

Repeat at 10 m.

**PASS:** stable operation under intended reading interval.

### HV-12 — 20 m cable test

Repeat at 20 m using a wiring topology representative of the pilot.

**PASS:** stable operation. If it fails, do not mask the failure; record it and move the pilot architecture toward local acquisition/RS485.

### HV-13 — Topology test

Test the realistic topology: trunk/stubs or home-run arrangement expected at the site.

**PASS:** topology is stable at the maximum validated cable length and sensor count.

### HV-14 — Continuous soak test

Run the complete prototype continuously for at least 24 hours initially, then extend to 72 hours before pilot hardware freeze.

Record:

- sensor read errors;
- MQTT disconnects/reconnects;
- ESP32 resets;
- modem resets;
- missing samples;
- alarm anomalies.

**PASS:** no unresolved critical fault; error/reconnect behavior is understood and acceptable.

### HV-15 — RS485 proof-of-concept

Use HW-519 only to verify the planned Modbus/RS485 firmware path and basic communications with an available test peer/module.

**PASS:** stable protocol communication.

**Important:** HV-15 does NOT approve HW-519 for field installation. Final field RS485 must use an industrial/protected/isolated COTS solution.

## 6. Decision Gate After Tests

After HV-01 through HV-15, issue one of these decisions:

### GATE A — DIRECT 1-WIRE PILOT APPROVED

Allowed only if the required sensor count/topology/cable length passes with adequate stability.

Then select the final industrial controller/interface and protection hardware available in Egypt and repeat the critical tests on that final hardware.

### GATE B — LOCAL ACQUISITION + RS485 REQUIRED

Use this if long 1-Wire runs or topology are not sufficiently reliable.

Select an Egypt-available COTS acquisition/interface solution that keeps 1-Wire local and carries longer distances over protected/isolated RS485/Modbus.

### GATE C — HARDWARE REDESIGN REQUIRED

Use if neither architecture passes the reliability requirements.

No full pilot procurement occurs until one gate is approved.

## 7. Pilot Procurement Gate

The full BIO EGYPT hardware purchase may begin only when all of the following are true:

- Initial validation report completed.
- Temperature architecture selected by Gate A or Gate B.
- Internet-failure/SMS failover test passed.
- 72-hour soak test passed or all blocking failures corrected and retested.
- Final field components confirmed available in Egypt.
- Final BOM lists supplier, current price, stock status and approved alternative.
- Final enclosure/DIN layout is complete.
- Manial and 6th October site quantities are reconciled against the approved sensor schedule.

## 8. BIO EGYPT Pilot Quantities Held for Later Procurement

Current Phase-1 planning baseline is 20 temperature sensors total across two sites. These quantities are NOT a purchase authorization until the validation gate passes.

The final per-site quantity and spare policy must be taken from the controlled BIO EGYPT pilot sensor schedule at procurement time.

## 9. Standard vs Advanced Boundary

The bench kit validates common firmware, telemetry, sensor identity, SMS failover and communications concepts. It does not freeze the final commercial Standard or Advanced hardware.

Both commercial grades remain based on modular COTS hardware and the universal BIO-EMS software/driver architecture. Advanced adds industrial capacity, isolation, Ethernet/communications and I/O capabilities as separately approved.

## 10. Evidence Package

Create a folder/report for the validation run containing:

- purchase receipts / supplier references;
- photos of the test wiring;
- wiring diagram;
- firmware commit/version;
- sensor ROM IDs;
- test log for HV-01…HV-15;
- screenshots/log extracts for MQTT/alarm/SMS tests;
- cable lengths/topology;
- 24h and 72h soak summaries;
- PASS/FAIL table;
- final Gate A/B/C decision;
- corrective actions and retest evidence.

## 11. Non-Negotiable Reminder

**Egypt market first. Test first. Full pilot purchase second.**

No imported or untested component is to silently become the pilot baseline merely because it has better specifications on paper.
