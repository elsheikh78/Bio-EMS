# BIO-EMS — BIO EGYPT Pilot Hardware Test Protocol

**Document ID:** BIO-EMS-HW-TEST-PROTOCOL-001  
**Status:** APPROVED EXECUTION PROTOCOL  
**Date:** 2026-08-27  
**Applies to:** BIO EGYPT Standard V1 temperature pilot hardware validation  
**Parent plan:** `BIO-EGYPT-PILOT-INITIAL-HARDWARE-VALIDATION-PLAN.md`

> PERMANENT EXECUTION RULE: Do not authorize full pilot hardware procurement until this protocol has been executed, evidence has been retained, and a Gate A/B/C decision has been recorded.

## 1. Purpose

This is the standalone, executable hardware validation checklist for the BIO EGYPT pilot. It is intentionally separate from architecture discussions so that the tests cannot be lost when hardware design evolves.

## 2. Mandatory Test Record

For every test record: Test ID, date/time, operator, hardware part/revision, wiring/topology, cable length, firmware commit/version, sensor IDs, configuration, expected result, actual result, PASS/FAIL, observations, corrective action, retest reference, and evidence filenames/links.

A failed test may not be converted to PASS without a documented corrective action and retest.

## 3. Test Sequence

### HV-01 — Controller Bring-up
**Action:** Flash ESP32-S3 firmware; verify serial diagnostics; perform repeated power cycles.  
**PASS:** No unexplained boot/reset failure.

### HV-02 — Single DS18B20
**Action:** Connect one sensor in powered 3-wire mode; read its unique ROM ID; acquire readings at intended pilot interval.  
**PASS:** Stable identity/readings with no unexplained CRC/read errors.

### HV-03 — Three DS18B20 Sensors
**Action:** Connect three simultaneously; verify unique IDs; expose them to distinguishable temperatures.  
**PASS:** No channel swapping, duplicate identity, or unexplained missing readings.

### HV-04 — MQTT / BIO-EMS Ingestion
**Action:** Publish real readings using intended device/sensor identity scheme and verify storage/display in BIO-EMS.  
**PASS:** Correct sensor association and timestamps.

### HV-05 — Alarm Path
**Action:** Force readings across warning/alarm thresholds and back to normal.  
**PASS:** Correct state transitions/recovery with no duplicate or wrong-sensor alarms.

### HV-06 — Internet Failure + SMS Failover
**Action:** Establish normal MQTT; deliberately remove Internet; create a qualifying alarm/failover event; verify SIM800L registration/SMS; restore Internet.  
**PASS:** SMS is delivered under approved failover conditions and normal communication recovers without manual reboot.

### HV-07 — SIM800L Power Stability
**Action:** Perform repeated registration and SMS transmissions while observing supply behavior and resets.  
**PASS:** Repeated SMS completes without modem/controller brownout or reset attributable to power.

### HV-08 — Sensor Disconnect/Reconnect
**Action:** Disconnect one active sensor; verify offline/missing behavior; reconnect it.  
**PASS:** Failure detected; same identity recovers; other sensors remain correct.

### HV-09 — Controller Power-Cycle Recovery
**Action:** Remove/restore power repeatedly.  
**PASS:** Automatic network/MQTT reconnection, sensor rediscovery, and telemetry resumption without manual intervention.

### HV-10 — 5 m Cable
**Action:** Repeat representative multi-sensor acquisition at 5 m.  
**PASS:** No material increase in read/CRC failures.

### HV-11 — 10 m Cable
**Action:** Repeat at 10 m.  
**PASS:** Stable at intended reading interval.

### HV-12 — 20 m Cable
**Action:** Repeat at 20 m using representative pilot wiring.  
**PASS:** Stable operation. Failure must remain recorded and drives evaluation of local acquisition + RS485.

### HV-13 — Realistic Topology
**Action:** Test expected trunk/stub or home-run topology at maximum validated length and representative sensor count.  
**PASS:** Stable topology with acceptable error rate and no sensor identity corruption.

### HV-14 — Continuous Soak
**Action:** Run complete prototype for 24 h, correct blocking faults if any, then complete a 72 h validation run before hardware freeze. Track read errors, MQTT reconnects, ESP32/modem resets, missing samples and alarm anomalies.  
**PASS:** No unresolved critical fault; all reconnect/error behavior understood and acceptable.

### HV-15 — RS485 Proof-of-Concept
**Action:** Use HW-519 only for bench verification of Modbus/RS485 firmware with an available peer/module.  
**PASS:** Stable protocol communication.  
**Restriction:** HW-519 PASS does NOT approve HW-519 for field installation; final field RS485 must be industrial/protected/isolated COTS hardware.

## 4. Required Gate Decision

After HV-01…HV-15 record exactly one:

- **GATE A — DIRECT 1-WIRE PILOT APPROVED:** required sensor count/topology/cable length is stable; critical tests must then be repeated on final Egypt-available field hardware.
- **GATE B — LOCAL ACQUISITION + RS485 REQUIRED:** long 1-Wire/topology is not sufficiently reliable; select Egypt-available COTS acquisition hardware keeping 1-Wire local and longer transport on protected/isolated RS485/Modbus.
- **GATE C — HARDWARE REDESIGN REQUIRED:** neither approach satisfies reliability requirements.

## 5. Procurement Release Criteria

Full BIO EGYPT procurement remains BLOCKED until:

- HV test record is complete;
- HV-06 SMS failover = PASS;
- HV-14 72 h soak = PASS after any required corrective retests;
- Gate A or Gate B is approved;
- final field parts and approved alternatives are confirmed available in Egypt;
- final BOM, supplier, current price and stock status are recorded;
- enclosure/DIN layout is complete;
- site quantities are reconciled against the controlled pilot sensor schedule.

## 6. Evidence Folder Structure

Recommended permanent structure:

`docs/hardware/validation/BIO-EGYPT-PILOT/<YYYY-MM-DD-run>/`

Store: purchase evidence, wiring photos/diagram, firmware commit, sensor ROM IDs, test record, MQTT/alarm/SMS evidence, cable/topology data, soak logs, PASS/FAIL summary, Gate decision, corrective actions and retest evidence.

## 7. Permanent Reminder

**EGYPT MARKET FIRST → TEST FIRST → GATE DECISION → FINAL BOM → FULL PILOT PURCHASE.**

If future hardware discussions conflict with this sequence, this validation/procurement gate must be explicitly revised rather than silently bypassed.
