# Project documentation checkpoint — 26 October 2026

This dated record documents the repository and today's agreed staged hardware workflow. `PROJECT_STATE.md` remains the sole current-state authority. Source reviewed: `main@cb56a1233073025dffc731f4ec268626780d9474`. Integrated tester candidate: PR #309, head `66e0fa3aed121ccc329cfb7e80aa1d065b9d8703`, open at this review. Recheck its merge status before selecting a package.

## Source and acceptance matrix

| Workstream | Recorded source state | Acceptance / next gate |
| --- | --- | --- |
| Platform | Product `0.20.0`; pilot stabilization | Multi-machine Windows, field commissioning and UAT remain open |
| Main operating firmware | `0.1.0-pilot.7`, merged through #304/#305 | Physical wiring, acquisition, fault and endurance evidence pending |
| Nano operating firmware | `0.1.0-bench.2` | Physical four-channel and RS485 acceptance pending |
| Standalone Hardware Tester | `0.3.0`, QC flashing merged in #308 | Real USB flash/readback/runtime, measurements and operator-PC printing pending |
| Integrated Hardware Tester | `0.4.0` proposed in #309; not on reviewed main | CI runs 40319297391 (tester) and 40319296886 (CI) succeeded; physical acceptance pending |
| Customer native monitor | #306 merged, `mobile/`, app `0.1.0` | Deploy matching Worker mobile API; signed distribution and device acceptance are separate |
| Company administration app | #307 merged, `company-mobile/`, app `0.1.0` | Android operation reported successful on 22 October; individual feature and signed iOS acceptance pending |
| SD / RTC / GSM / battery | SD replay and RTC/explicit 2G bench commands exist; central battery design recorded | Physical replay, cold-boot retention, SMS receipt and 30-minute four-SIM load test pending; autonomous GSM alarm fallback not implemented |
| Company customer deletion / logs | #299 source merged; manual date-range log deletion selected | Updated cloud deployment and live destructive-action acceptance unverified by this review |

A successful workflow is software/build evidence; it does not establish actual hardware readings, commercial certification or site acceptance. No new Setup, firmware binary, cloud deployment or mobile store release is created by this documentation update.

## Staged hardware workflow agreed today

Use breadboards and secure, already fitted headers/terminal bases. SIM means Sensor Interface Module, not the cellular SIM card. The target is one Main with 1–4 SIM-D4 modules, four independent temperature channels each (maximum sixteen); the selected integrated candidate covers one Nano and four probes only.

1. **ESP32-S3 + one DS18B20, isolated.** Disconnect power before wiring. Use USB supply initially, sensor VDD 3V3, GND and DQ GPIO4 with 4.7 kΩ pull-up to 3V3. Disconnect SD/peripherals because GPIO4 is operational SD MOSI. Verify sensor wire functions from supplier evidence, not color alone. Use Tester 0.3.0 tab 5 to flash the matching isolated QC firmware and verify its runtime identity, then acquire/analyze a separate sensor run.
2. **Nano + four DS18B20, isolated.** Use Nano USB power, VDD 5V, common GND and independent D2/D3/D4/D5 data wires, each with its own 4.7 kΩ pull-up to 5V. Disconnect HW-519 from D0/D1 or remove its power during Nano USB programming AND direct reading. Select the actual classic/new ATmega328P bootloader. Flash verification alone does not pass the sensor test.
3. **Main + RS485 + Nano + four sensors.** First restore the governed Main pilot.7 and Nano bench.2 operating firmware; isolated QC firmware cannot perform this path. Tab 5 flashes QC images only and does not automatically restore operating firmware. Follow the exact terminal schedule in [Rev B wiring](../hardware/MAIN-SIM-WIRING-REFERENCE-2026-10-20.md). The PR #309 candidate reads Main USB and repeatedly polls `simscan`, recording the four inputs, temperatures, mapping and transport faults without platform login/commissioning. Reviewed main 0.3.0 only captures integrated diagnostics/manual evidence; it does not provide this continuous integrated acquisition.
4. **Remaining assembly and field tests.** Record continuity, measured rails, each probe's response/recovery and RS485 evidence. Separately qualify network, SD replay, RTC, explicit GSM receipt, backup power and endurance; do not treat the selected four-probe scope as full-system acceptance. Expand to 2–4 modules only with a dedicated populated-module test plan and evidence.

USB power is the initial isolated test supply, not approval to supply an assembled modem/four-SIM system from USB. Follow the controlled supply topology, confirm common ground and USB/external-power compatibility before connecting Main to the PC. Never apply 5V data directly to ESP32. Power off before changing wiring. The Rev B reference remains an engineering draft, not a released mains assembly drawing.

## QC records and interpretation

Record assembly serial, operator, procedure/revision, exact source SHA, firmware/package hashes, topology, channel map, approved limits and reference instrument. Capture failures, corrective actions and a new linked retest; do not overwrite a failed result. Finalize the run, analyze and export PDF/CSV/JSON; review/sign the printable English report. Demonstration data, missing checks and interrupted runs cannot establish hardware PASS.

Isolated QC can report probe ROM. The proposed integrated `simscan` path does not expose sensor ROM, Nano unique identity, conversion age or device uptime. Host counters are not those device values. Integrated identity/mapping/transport failures must block acceptance. Retain raw evidence with the report.

## Documentation reconciliation boundary

Current entry points, status, execution plan, scope, risks, changelog, hardware/test references, firmware, mobile and deployment guides are reconciled to this checkpoint. Dated architecture decisions, procurement lists, earlier test results and archived closure documents retain their recorded dates and scope. They must not be silently relabeled as newly executed tests. Any conflicting older action list is read under the newer current-state authority.

External Word manuals and previously delivered ZIP/EXE/APK files are not modified by a Markdown repository update. Their contents and package provenance require a separate revision before describing them as current. No full procurement, hardware release or BIO EGYPT commissioning acceptance is granted here.
