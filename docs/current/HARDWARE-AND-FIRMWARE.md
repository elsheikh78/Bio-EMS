# Hardware, Firmware and Standalone Tester

Reviewed candidate `d151b1f`, 28 October 2026. The [project state](../../PROJECT_STATE.md) records merge status. Main `0.1.0-pilot.9`, Nano `0.1.0-bench.2`, Tester `0.6.2`; these independent versions do not identify a particular binary without commit/image hashes.

## Responsibility and topology

Tester performs new hardware qualification offline. System Owner retains logical installation, discovery, flash/bind/provisioning and the read-only historical archive. Tester does not require platform login, cloud, MQTT or customer database. New hardware tests cannot be written through the retired platform API. Existing reports are preserved; there is no automatic cross-database import.

The Main operating source uses one shared 9600 8N1 RS485 bus. Nano addresses 1–4 each serve four independent probes, mapped to up to sixteen channels. The integrated automated Tester run selects one address/four probes at a time. The 18-step manual qualification record can link many runs, but cannot itself create simultaneous sixteen-channel acquisition evidence.

## Identify modules before wiring

LM2596 HW-411 is a DC-DC step-down power converter. HW-519 is the automatic-direction TTL-to-RS485 interface. Neither identity alone approves its installed voltage, current, isolation or cable behavior. Verify actual supply specifications and interface logic levels for each physical board; do not infer ESP32 3.3 V compatibility from a generic seller's title.

Power OFF for wiring or probe disconnection/replacement. Use stable soldered headers and verified probe pin functions. No mains wiring on a breadboard. Avoid parallel USB/external power arrangements until the board/supply topology is reviewed.

| Isolated/operating path | Source-backed connection/setting |
| --- | --- |
| ESP32 isolated QC probe | VDD 3V3, GND, DQ GPIO4 with 4.7k pull-up to 3V3; disconnect SD/peripherals because operational SD MOSI shares GPIO4 |
| Nano isolated QC probes | VDD 5V, GND, independent DQ D2/D3/D4/D5; one 4.7k pull-up to 5V per input |
| Nano HW-519 serial | D1/TX to RXD, D0/RX from TXD, common reference; no D6 direction control |
| Main operating UART | Default TX GPIO17 to module RXD, RX GPIO18 from module TXD; verify 3.3 V-safe interface before connection |
| RS485 side | Controlled A+/B− bus and reference scheme; verify actual board labels, topology and termination against wiring design |
| USB programming Nano | Disconnect interfering HW-519 D0/D1 connections or its power as instructed before programming **and** QC USB reads |

HW-519 controls direction automatically; do not add DE/RE GPIO operations or assume four Main hardware serial ports. Detailed wiring remains in [Main/SIM reference](../hardware/MAIN-SIM-WIRING-REFERENCE-2026-10-20.md), [HW-519 contract](HW-519-RS485-BENCH-CONTRACT-2026-10-06.md) and [Tester README](../../tools/hardware-tester/README.md). Do not use a software audit as electrical design approval.

## Flash from Tester

Extract the complete Windows package and keep the EXE, images, runtime tools and manifests together. Select the intended COM and board. Connect only the intended board, isolate interfering peripherals and review the overwrite confirmation.

- Tab 5: **Flash QC firmware**. Choose ESP32-S3, Nano classic 57600 or Nano new bootloader 115200. Nano choice must match its installed bootloader. Wrong profile failure is not permission to override device signature/readback checks.
- QC runtime stream is `bioems-qc/1` at 115200 regardless of Nano upload baud. Tool verification and a matching runtime stream are required for flash success. This does not mean probes passed.
- Tab 6: **Operating firmware**. Restore bundled Main pilot.9 or Nano bench.2 for integrated bus tests. Uploading QC overwrites operating firmware; using the wrong sketch cannot test the operating path.
- Tab 7: **Qualification guide**. Choose the staged checklist scope, record each required step in order and link actual acquisition runs.

Manifest hashes detect damage and identify the selected package, not malicious repackaging or a unique Nano identity. Nano has no unique serial attestation. No full-chip erase, eFuse programming, signature override or readback disable is part of this procedure. See [operating upload guide](../../tools/hardware-tester/OPERATING_FIRMWARE_GUIDE.md).

## Acceptance and power limits

Run configuration freezes temperature range, duration/sample count, error/span/freshness and optional reference tolerance. These are controlled procedure inputs; defaults are not universally approved acceptance limits. Power evidence needs measured value, ordered approved low/high bounds and instrument ID. Obtain limits for each actual rail/component/load from the approved design/specification; this audit does not invent a blanket ±5% limit. Record no-load/load/transient/far-end behavior, especially modem transmission and backup changeover.

Qualification has 18 ordered steps in `tools/hardware-tester/qualification.py` (revision `HQT-2 / pilot.9 / bench.2`). Required cable metric: `success_rate_percent >= 99.99`. Endurance/full-population metrics `unexplained_reboots` and `unrecovered_faults` must both be nonnegative integers equal to zero. Other required manual evidence, durations, population and linked runs remain necessary. Missing mandatory checks produce incomplete evidence; manual PASS is not independent instrument proof.

The plan requires 5/10/intended maximum up to 20 m sensor-cable runs, short/long RS485, network recovery, explicit SMS, 24-hour selected-population endurance, four bus addresses, 48-hour sixteen-probe population evidence, calibration, at least 30-minute SD offline/replay, RTC retention and at least 30-minute full-load central backup. Record evidence independently for every fitted required function. Do not equate one-SIM USB success with complete assembly acceptance.

## Storage, time and GSM

Operating firmware implements SD queue/replay with original timestamps and corruption visibility, DS3231 UTC commissioning/retention commands, and explicit `gsmdiag`/`gsmtest`. Confirm actual network delivery, SD pending/history and reboot retention with hardware. Host scan counters do not prove device uptime; integrated scans do not expose probe ROM or conversion age. Autonomous controller GSM alarm fallback is absent. Explicit authorized test SMS receipt does not establish automatic alarm failover.

Tester retains runs, earlier fault/retest attempts, hash-chain/seal evidence and JSON/CSV/PDF exports. Preserve the SQLite data plus controlled exports and reviewer signatures. Demo mode cannot be accepted as hardware evidence. No connected hardware was exercised by the code audit.

The separate A/B USB-maintenance build is a designated-board conversion, not an ordinary Tester update. It is described in the [security execution guide](../security/SECURITY-OPERATIONS-AR.md); physical recovery and production key activation remain unaccepted.
