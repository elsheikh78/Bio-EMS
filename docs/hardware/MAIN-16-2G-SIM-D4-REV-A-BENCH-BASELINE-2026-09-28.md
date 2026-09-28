# MAIN-16-2G and SIM-D4 Rev.A bench baseline

**Date:** 28 September 2026
**Status:** proposed breadboard qualification; not a field or production release

## Scope and decision boundary

The latest prototype test manual proposes one ESP32-S3 main controller, four independent SIM-D4 units, and up to four powered three-wire DS18B20 probes per SIM. Each SIM has a local MCU and 24 V-to-5 V conversion and communicates with the main unit over RS485. The main unit uses Ethernet for normal telemetry and a 2G SIM800L for SMS alarm fallback. This is a **new bench candidate**, not evidence that the PT100 pilot baseline dated 24 September has been withdrawn or that the deployed firmware supports this topology.

The September 24 modular architecture, SIM-T4 procurement note and El Manial baseline still describe PT100. A controlled architecture and procurement decision must choose the field sensor technology after comparative accuracy, cable, fault, local availability and cost tests. Until then, do not combine their PT100 BOM with this DS18B20 prototype BOM or buy full site quantities from either document.

## Prototype sequence

1. Buy and assemble one MAIN-16-2G and one SIM-D4 with four probes on a breadboard. Keep mains voltage off the breadboard; use enclosed/ready-made DC supplies and measure rails before connecting controllers.
2. Qualify one probe at short length, then repeat at 5 m, 10 m and 20 m on each independent channel. Log ROM identity, CRC/read errors, recovery and measured temperature against a traceable reference.
3. Qualify four simultaneous channels, sensor disconnect/short/replacement behavior and address mapping after power cycles.
4. Qualify RS485 at short length and intended cable length with 24 V distribution, then Ethernet/MQTT telemetry and independent 2G SMS fallback. Measure the modem rail during transmit bursts.
5. Run integrated 24 h endurance. Only after a recorded pass, add three SIMs and twelve probes; test all four ports, then run 48 h at 16 channels. Record firmware hashes and a fault/retest ledger.

The Word manual `BIO-EMS_Prototype_Test_Manual_RevA_2G_v2.docx` contains the provisional component list, wiring and step-by-step bench instructions. Its prices and 24 V/3.2 A supply are estimates subject to actual local quotations and current measurements. HW-519 and breadboard wiring are for qualification only.

## Integration gap

The existing `firmware/site-controller-esp32s3` documentation describes the current site-controller firmware. A MAIN-16-2G/SIM-D4 Modbus register profile, SIM MCU firmware, four-port arbitration, MQTT payload mapping and cellular fallback integration must be implemented and tested before treating the Word procedure as an end-to-end platform test. Record a versioned register map, address plan and exact flashed builds with each test run. A proposed command or expected alarm is not proof of platform support.

## Pilot quantity discrepancy to resolve

The repository sensor map and El Manial procurement baseline list **seven** positions: two cold-room, one anti-chamber and four dry-warehouse probes. Recent planning describes **six** at El Manial and thirteen at CPC. The proposed prototype capacity of sixteen is a device maximum, not an approved site quantity. Obtain the approved El Manial area/position map before purchase or platform commissioning; then update the controlled sensor map, procurement quantities and channel allocation together.

## Release gate

Document the comparison with the PT100 candidate, calibrated error and uncertainty over relevant ranges, 20 m cable evidence, SMS coverage at each site, power margins, repeatable recovery, 24 h/48 h soak, serviceable no-custom-PCB field assembly, and Egypt-local supplier evidence. A designated owner must approve the sensor choice and site counts. Only then revise the field BOM and firmware contract.
